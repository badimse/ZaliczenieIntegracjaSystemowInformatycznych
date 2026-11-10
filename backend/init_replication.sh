#!/bin/bash

# Inicjalizacja replikacji MySQL Master-Slave
set -e

MASTER_HOST="${MASTER_HOST:-mysql-master}"
SLAVE_HOST="${SLAVE_HOST:-mysql-slave}"
MYSQL_ROOT_PASSWORD="${DB_ROOT_PASSWORD}"
REPL_PASSWORD="${REPL_PASSWORD:-repl_password}"
DB_NAME="narejonie"

echo "=== Inicjalizacja replikacji MySQL ==="

# Czekamy na uruchomienie mastera
echo "Czekam na uruchomienie mastera..."
until docker exec mysql-master mysqladmin ping -h localhost -u root -p"$MYSQL_ROOT_PASSWORD" --silent; do
    sleep 2
done
echo "Master gotowy!"

# Konfiguracja użytkownika replikacji na masterze
echo "Konfigurowanie użytkownika replikacji na masterze..."
docker exec mysql-master mysql -u root -p"$MYSQL_ROOT_PASSWORD" << EOF
-- Utwórz użytkownika do replikacji
CREATE USER IF NOT EXISTS 'repl_user'@'%' IDENTIFIED BY '$REPL_PASSWORD';
GRANT REPLICATION SLAVE ON *.* TO 'repl_user'@'%';

-- Wymuś flush privileges
FLUSH PRIVILEGES;
EOF

echo ""
echo "=== Synchronizacja danych i konfiguracja slave'a ==="

# Skopiowanie danych z mastera na slave'a
echo "Synchronizacja bazy danych $DB_NAME z mastera na slave'a..."
docker exec mysql-master mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" --single-transaction --quick --lock-tables=false "$DB_NAME" | \
    docker exec -i mysql-slave mysql -u root -p"$MYSQL_ROOT_PASSWORD"

# Pobranie aktualnego pliku logu i pozycji z Mastera
LOG_FILE=$(docker exec mysql-master mysql -u root -p"$MYSQL_ROOT_PASSWORD" -Nse "SHOW MASTER STATUS" | awk '{print $1}')
LOG_POS=$(docker exec mysql-master mysql -u root -p"$MYSQL_ROOT_PASSWORD" -Nse "SHOW MASTER STATUS" | awk '{print $2}')

echo "Pozycja mastera: File=$LOG_FILE, Position=$LOG_POS"

# Konfiguracja replikacji na slave'u
echo "Konfigurowanie replikacji na slave'u..."
docker exec mysql-slave mysql -u root -p"$MYSQL_ROOT_PASSWORD" << EOF
STOP SLAVE;
RESET SLAVE ALL;

CHANGE MASTER TO
    MASTER_HOST='$MASTER_HOST',
    MASTER_USER='repl_user',
    MASTER_PASSWORD='$REPL_PASSWORD',
    MASTER_LOG_FILE='$LOG_FILE',
    MASTER_LOG_POS=$LOG_POS;

START SLAVE;
EOF

echo ""
echo "=== Weryfikacja replikacji ==="
sleep 2
docker exec mysql-slave mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SHOW SLAVE STATUS\G" | grep -E "Slave_IO_Running|Slave_SQL_Running|Last_Error|Replica_Io_Running|Replica_Sql_Running"

echo ""
echo "=== Replikacja skonfigurowana pomyślnie! ==="
echo "Master: localhost:3306"
echo "Slave:  localhost:3307"
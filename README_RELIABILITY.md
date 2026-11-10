# 🛡️ Dokumentacja Odporności na Awarie Bazy Danych - NaRejonie

## 📋 Spis treści

1. [Wprowadzenie](#wprowadzenie)
2. [Architektura Systemu](#architektura-systemu)
3. [Instalacja i Konfiguracja](#instalacja-i-konfiguracja)
4. [Monitorowanie i Health Check](#monitorowanie-i-health-check)
5. [Backupy](#backupy)
6. [Failover i Awaria](#failover-i-awaria)
7. [Testy Odporności](#testy-odporności)
8. [Rozwiązywanie Problemów](#rozwiązywanie-problemów)

---

## 🎯 Wprowadzenie

Ten dokument opisuje implementację odporności na awarie bazy danych dla projektu e-commerce NaRejonie. System został zaprojektowany tak, aby zapewnić:

- **Wysoką dostępność** dzięki replikacji MySQL Master-Slave
- **Automatyczne backupy** z retencją 7 dni
- **Szybki failover** w przypadku awarii
- **Monitoring w czasie rzeczywistym**

### Kluczowe Metryki

| Metryka | Cel |
|---------|-----|
| Czas odzyskiwania po awarii | < 5 minut |
| Opóźnienie replikacji | < 60 sekund |
| Automatyczne wykrywanie awarii | < 30 sekund |
| Backupy codzienne | Codziennie o 2:00 UTC |

---

## 🏗️ Architektura Systemu

### Topologia Bazy Danych

```
┌─────────────────┐         ┌─────────────────┐
│   MySQL Master  │◄───────►│    MySQL Slave  │
│   (Port 3306)   │  Repl.  │   (Port 3307)   │
│                 │         │                 │
│  - Zapisy       │         │  - Odczyty      │
│  - Primary DB   │         │  - Read-only    │
└─────────────────┘         └─────────────────┘
        │                         │
        │                         │
        ▼                         ▼
┌─────────────────────────────────────────────┐
│           Django Application                │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │    ResilienceRouter                 │   │
│  │  - route_db_for_write() → master    │   │
│  │  - route_db_for_read() → slave      │   │
│  │  - Auto-failover na master          │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

### Komponenty Systemu

1. **MySQL Master** (`mysql-master:3306`)
   - Obsługuje wszystkie operacje zapisu (INSERT, UPDATE, DELETE)
   - Generuje binlogi dla replikacji
   - Server ID: 1

2. **MySQL Slave** (`mysql-slave:3307`)
   - Obsługuje operacje odczytu (SELECT)
   - Receives updates z mastera przez replikację
   - Server ID: 2
   - Tryb read-only

3. **Django ResilienceRouter**
   - Automatycznie kieruje zapytania do odpowiedniej instancji
   - Wykrywa awarie slave'a i failoveruje do mastera
   - Obsługuje automatyczne przełączanie

4. **Health Check API** (`/api/health/`)
   - Monitoruje status wszystkich komponentów
   - Zwraca informacje o replikacji i backupach

5. **System Backupów**
   - Automatyczne codzienne backupy o 2:00 UTC
   - Kompresja gzip
   - Retencja 7 dni

---

## 🔧 Instalacja i Konfiguracja

### Wymagania Systemowe

- Docker i Docker Compose
- MySQL 8.0+
- Django 6.0+
- Python 3.12+

### Krok 1: Uruchomienie Kontenerów MySQL

```bash
# Przejdź do katalogu projektu
cd /home/cortexai/CortexAI/moj_projekt

# Uruchom kontenery Docker
docker-compose -f docker-compose.mysql.yml up -d

# Sprawdź status kontenerów
docker-compose -f docker-compose.mysql.yml ps
```

### Krok 2: Inicjalizacja Replikacji

```bash
# Przejdź do katalogu backend
cd /home/cortexai/CortexAI/moj_projekt/backend

# Uruchom skrypt inicjalizacji
./init_replication.sh
```

Skrypt automatycznie:
- Czeká na uruchomienie mastera
- Tworzy użytkownika replikacji
- Konfiguruje slave'a do podłączenia się do mastera
- Synchronizuje dane z mastera na slave'a
- Weryfikuje status replikacji

### Krok 3: Konfiguracja Django

Plik `backend/narejonie_backend/settings.py` został automatycznie zmodyfikowany:

```python
DATABASES = {
    'default': {  # Master - dla operacji zapisu
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST', '127.0.0.1'),
        'PORT': os.environ.get('DB_PORT', '3306'),
    },
    'slave': {  # Slave - dla operacji odczytu
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('SLAVE_DB_HOST', '127.0.0.1'),
        'PORT': os.environ.get('SLAVE_DB_PORT', '3307'),
    }
}

DATABASE_ROUTERS = ['api.routers.ResilienceRouter']
```

### Krok 4: Konfiguracja Cron Job (Backup)

```bash
# Skopiuj plik cron do systemu
sudo cp /home/cortexai/CortexAI/moj_projekt/backend/cron_backup /etc/cron.d/narejonie-backup

# Ustaw uprawnienia
sudo chmod 644 /etc/cron.d/narejonie-backup

# Zrestartuj usługę cron
sudo systemctl restart cron

# Sprawdź czy cron działa
sudo crontab -l
```

Backup będzie uruchamiany codziennie o 2:00 UTC.

---

## 📊 Monitorowanie i Health Check

### Endpoint Health Check

**URL:** `GET /api/health/`

**Przykładowa odpowiedź:**

```json
{
    "status": "healthy",
    "database": {
        "master": {
            "connected": true,
            "error": null
        },
        "slave": {
            "connected": true,
            "error": null
        }
    },
    "replication": {
        "status": "active",
        "lag_seconds": 5,
        "error": null
    },
    "backup": {
        "last_backup": "2026-10-30T02:00:00",
        "next_scheduled": "02:00 UTC"
    },
    "timestamp": "2026-10-30T11:00:00Z"
}
```

### Statusy Systemu

| Status | Opis |
|--------|------|
| `healthy` | Master i slave połączone, replikacja aktywna |
| `degraded` | Master działa, ale brak replikacji lub slave niedostępny |
| `unhealthy` | Master niedostępny - krytyczna awaria |

### Dashboard Monitoringowy

**URL:** `GET /admin/monitoring/` (wymaga uprawnień administratora)

Dashboard wyświetla:
- Status połączenia z bazą danych (master i slave)
- Status replikacji MySQL
- Opóźnienie replikacji w sekundach
- Informacje o ostatnim backupie
- Automatyczne odświeżanie co 30 sekund

**Funkcje dashboardu:**
- Przycisk "Odśwież status" do ręcznego odświeżenia
- Kolorowe wskaźniki stanu (zielony/żółty/czerwony)
- Wykrywanie awarii w czasie rzeczywistym

---

## 💾 Backupy

### Struktura Backupów

Backupy są przechowywane w: `/home/cortexai/CortexAI/moj_projekt/backend/backups/`

**Format nazwy pliku:** `backup_YYYYMMDD_HHMMSS.sql.gz`

**Przykład:** `backup_20261030_020000.sql.gz`

### Skrypt Backupu

Plik: `backend/backups/daily_backup.sh`

**Funkcje:**
- Tworzenie pełnego backupu bazy danych
- Kompresja gzip
- Weryfikacja poprawności backupu
- Usuwanie backupów starszych niż 7 dni
- Logowanie operacji do `/var/log/narejonie-backup.log`

### Ręczne Uruchomienie Backupu

```bash
# Przejdź do katalogu backend
cd /home/cortexai/CortexAI/moj_projekt/backend

# Uruchom skrypt backupu
./backups/daily_backup.sh
```

### Lista Dostępnych Backupów

```bash
ls -lh /home/cortexai/CortexAI/moj_projekt/backend/backups/
```

---

## 🔄 Failover i Awaria

### Automatyczny Failover

System obsługuje automatyczny failover w przypadku awarii slave'a:

1. **Wykrycie awarii:** Router próbuje połączyć się z slave'em
2. **Failover:** W przypadku błędu połączenia, router kieruje wszystkie zapytania do mastera
3. **Powrót do normalnej pracy:** Gdy slave ponownie stanie się dostępny, router automatycznie przywraca routing do slave'a dla operacji odczytu

### Scenariusze Awarii

#### Scenariusz 1: Awaria Slave'a

**Objawy:**
- Endpoint `/api/health/` zwraca status `degraded`
- Dashboard pokazuje slave jako "Niedostępny"

**Działanie systemu:**
- Wszystkie operacje (zapis i odczyt) są kierowane do mastera
- System nadal działa, ale bez rozdzielenia obciążenia

**Naprawa:**
```bash
# Sprawdź status slave'a
docker exec mysql-slave mysqladmin ping -u root -pProjekt2026!

# Uruchom ponownie kontener slave
docker restart mysql-slave

# Sprawdź czy replikacja działa
docker exec mysql-slave mysql -u root -pProjekt2026! -e "SHOW SLAVE STATUS\\G"
```

#### Scenariusz 2: Awaria Mastera

**Objawy:**
- Endpoint `/api/health/` zwraca status `unhealthy`
- Wszystkie operacje Django zwracają błędy połączenia

**Działanie systemu:**
- System staje się niedostępny
- Wymaga interwencji manualnej

**Naprawa:**
```bash
# Sprawdź status mastera
docker exec mysql-master mysqladmin ping -u root -pProjekt2026!

# Uruchom ponownie kontener master
docker restart mysql-master

# Jeśli master nie uruchamia się, przywróć z backupu
cd /home/cortexai/CortexAI/moj_projekt/backend
gunzip -c backups/backup_20261030_020000.sql.gz | mysql -u root -pProjekt2026! narejonie
```

---

## 🧪 Testy Odporności

### Uruchomienie Testów

```bash
# Przejdź do katalogu backend
cd /home/cortexai/CortexAI/moj_projekt/backend

# Uruchom wszystkie testy odporności
python manage.py test api.tests.test_resilience --verbosity=2

# Uruchom tylko konkretne grupy testów
python manage.py test api.tests.test_resilience.DatabaseConnectionTests
python manage.py test api.tests.test_resilience.HealthCheckAPITests
python manage.py test api.tests.test_resilience.BackupTests
```

### Grupy Testów

1. **DatabaseConnectionTests**
   - `test_database_connection_master` - Połączenie z masterem
   - `test_database_connection_slave` - Połączenie z slave'em

2. **ResilienceRouterTests**
   - `test_route_db_for_write_returns_default` - Routing zapisów do mastera
   - `test_force_master_method` - Metoda wymuszająca mastera
   - `test_force_slave_method` - Metoda wymuszająca slave'a

3. **HealthCheckAPITests**
   - `test_health_endpoint_exists` - Istnienie endpointu health
   - `test_health_endpoint_response_structure` - Struktura odpowiedzi
   - `test_health_endpoint_database_field` - Pole database w odpowiedzi
   - `test_health_endpoint_replication_field` - Pole replication w odpowiedzi

4. **BackupTests**
   - `test_backup_directory_exists` - Istnienie katalogu backupów
   - `test_backup_script_exists` - Istnienie skryptu backupu
   - `test_backup_creation` - Tworzenie backupu

5. **ReplicationStatusTests**
   - `test_replication_status_check` - Sprawdzenie statusu replikacji
   - `test_replication_lag_under_60s` - Opóźnienie < 60 sekund

6. **FailoverSimulationTests**
   - `test_failover_to_master_on_slave_failure` - Failover do mastera
   - `test_database_failover_time` - Czas failoveru < 30 sekund

7. **IntegrationTests**
   - `test_full_health_check_flow` - Pełny przepływ health check
   - `test_backup_restoration_time` - Czas przywracania < 5 minut

---

## 🔍 Rozwiązywanie Problemów

### Problem: Slave nie może połączyć się z masterem

**Objawy:**
```
Slave_IO_Running: No
Last_Error: Could not connect to master
```

**Rozwiązanie:**
```bash
# Sprawdź czy master działa
docker ps | grep mysql-master

# Sprawdź logi slave'a
docker logs mysql-slave

# Sprawdź konfigurację sieci
docker network inspect mysql-network

# Sprawdź czy firewall nie blokuje portu 3306
sudo ufw status
```

### Problem: Replikacja jest opóźniona

**Objawy:**
```
Seconds_Behind_Master: 300
```

**Rozwiązanie:**
```bash
# Sprawdź obciążenie mastera
docker exec mysql-master mysql -u root -pProjekt2026! \
    -e "SHOW PROCESSLIST;"

# Sprawdź czy slave przetwarza events
docker exec mysql-slave mysql -u root -pProjekt2026! \
    -e "SHOW SLAVE STATUS\\G"

# Jeśli problem jest poważny, zrestartuj replikację
docker exec mysql-slave mysql -u root -pProjekt2026! \
    -e "STOP SLAVE; START SLAVE;"
```

### Problem: Backup nie został utworzony

**Objawy:**
- Brak nowych plików w `/home/cortexai/CortexAI/moj_projekt/backend/backups/`
- Błędy w logu `/var/log/narejonie-backup.log`

**Rozwiązanie:**
```bash
# Sprawdź logi backupu
cat /var/log/narejonie-backup.log | tail -50

# Sprawdź wolne miejsce na dysku
df -h /home/cortexai/CortexAI/moj_projekt/backend/backups/

# Uruchom ręczny test skryptu
cd /home/cortexai/CortexAI/moj_projekt/backend
./backups/daily_backup.sh
```

### Problem: Health Check zwraca błędy

**Objawy:**
- Endpoint `/api/health/` zwraca status `unhealthy`
- Błędy połączenia z bazą danych

**Rozwiązanie:**
```bash
# Sprawdź czy Django działa
curl http://localhost:8000/api/health/

# Sprawdź logi Django
tail -f /home/cortexai/CortexAI/moj_projekt/backend/logs/django.log

# Sprawdź połączenie z bazą danych
python manage.py dbshell
```

---

## 📞 Kontakt i Wsparcie

W przypadku problemów z systemem odporności na awarie, skontaktuj się z zespołem technicznym lub sprawdź:

1. Logi systemu: `/var/log/narejonie-backup.log`
2. Logi Docker: `docker logs mysql-master`, `docker logs mysql-slave`
3. Dokumentację Django: https://docs.djangoproject.com/
4. Dokumentację MySQL Replication: https://dev.mysql.com/doc/refman/8.0/en/replication.html

---

## 📝 Changelog

### Wersja 1.0 (2026-10-30)
- Implementacja replikacji MySQL Master-Slave
- Dodanie Health Check API
- Automatyczne backupy z cron job
- Dashboard monitoringowy
- Testy odporności na awarie

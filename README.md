# 🛍️ NaRejonie – Rozproszona Platforma E-Commerce z Odpornością na Awarie (High Availability)

[![Django](https://img.shields.io/badge/Django-5.0.4-092E20?logo=django)](https://www.djangoproject.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0_Master--Slave-4479A1?logo=mysql)](https://www.mysql.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker)](https://www.docker.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe)](https://stripe.com/)
[![JWT](https://img.shields.io/badge/Auth-SimpleJWT-black)](https://jwt.io/)

---

## 📋 Spis Treści

1. [O Projekcie](#-o-projekcie)
2. [Architektura Systemu (SOA & High Availability)](#-architektura-systemu-soa--high-availability)
3. [Mechanizmy Niezawodności i Odporności](#-mechanizmy-niezawodności-i-odporności)
4. [Kluczowe Funkcjonalności Biznesowe](#-kluczowe-funkcjonalności-biznesowe)
5. [Instalacja i Uruchomienie Krok po Kroku](#-instalacja-i-uruchomienie-krok-po-kroku)
6. [Specyfikacja Punktów Końcowych API](#-specyfikacja-punktów-końcowych-api)
7. [Testy Integracyjne i Weryfikacja Niezawodności](#-testy-integracyjne-i-weryfikacja-niezawodności)
8. [Dowody Działania Systemu](#-dowody-działania-systemu)
9. [Struktura Repozytorium](#-struktura-repozytorium)

---

## 🎯 O Projekcie

**NaRejonie** to pełnofunkcyjna platforma e-commerce dedykowana odzieży streetwear, zaprojektowana z naciskiem na **wysoką dostępność (High Availability)**, **odporność na awarie (Fault Tolerance)** oraz **separację odpowiedzialności w architekturze SOA (Service-Oriented Architecture)**. 

System realizuje pełny obieg transakcyjny – od rejestracji i dynamicznego zarządzania koszykiem, przez realizację płatności kartą w Stripe, aż po zarządzanie zamówieniami, zwrotami i moderacją w dedykowanym panelu administracyjnym.

### 📊 Metryki i Wskaźniki Niezawodności

| Metryka | Cel / Osiągnięta Wartość | Mechanizm Weryfikacji |
| :--- | :--- | :--- |
| **Automatyczny Failover** | < 30 sekund | Autorski `ResilienceRouter` z dynamicznym przełączaniem odczytów |
| **Opóźnienie replikacji (Lag)** | < 60 sekund (śr. 0 s) | GTID-based MySQL Replication monitorowane przez `/api/health/` |
| **Czas odzyskiwania (RTO)** | < 5 minut | Zautomatyzowane skrypty odzyskiwania bazy ze skompresowanych zrzutów |
| **Zasada separacji zapytań** | 100% spójności zapisu | Wszystkie operacje zapisu kierowane bezwzględnie do klastra Master |
| **Harmonogram Backupów** | Codziennie o 02:00 UTC | Skrypt `daily_backup.sh` (retencja 7 dni, kompresja gzip, manifesty JSON) |

---

## 🏗️ Architektura Systemu (SOA & High Availability)

Aplikacja została podzielona na niezależne warstwy połączone standaryzowanymi protokołami komunikacyjnymi:

┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   KLIENT / PRZEGLĄDARKA                                │
│                          (HTML5 / CSS3 / Vanilla JavaScript ES6+)                      │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
│ REST API (JSON / JWT Bearer)
▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        WARSTWA USŁUG BACKENDU (Django REST Framework)                  │
│  - Autentykacja & RBAC (SimpleJWT)               - Obsługa Transakcji & Koszyka        │
│  - Integracja Płatności Stripe Webhooks          - Health Check & Dashboard API        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                       CONTENT-BASED DATABASE ROUTER (ResilienceRouter)                 │
│         [Zapisy: INSERT / UPDATE / DELETE]        [Odczyty: SELECT + Failover]         │
└───────────────────┬───────────────────────────────────────────────┬────────────────────┘
│ Port 3306                                     │ Port 3307
▼                                               ▼
┌─────────────────────┐      Replikacja GTID     ┌────────────────────┐
│    MySQL MASTER     │─────────────────────────►│    MySQL SLAVE     │
│  (Kontener Docker)  │   (Replikacja w locie)   │ (Kontener Docker)  │
│   Główny Zapis      │                          │ Odczyty (Read-Only)│
└─────────────────────┘                          └────────────────────┘
│                                               ▲
│                                               │
└────────── Failover w razie awarii Slave ──────┘
### Podział Odpowiedzialności Komponentów
1. **Warstwa Prezentacji (Frontend):** Czysty, modularny JavaScript (`app.js`, `api.js`, `auth.js`) odseparowany od silnika szablonów Django. Stan aplikacji oraz autoryzacja opierają się na tokenach JWT przechowywanych w przeglądarce.
2. **Warstwa Logiki Biznesowej (Backend API):** Django 5.0.4 oraz Django REST Framework. Zapewnia walidację danych, zarządzanie stanami zamówień, obsługę webhooków zewnętrznych (Stripe) oraz kontrolę dostępu RBAC (`IsAuthenticated`, `IsAdminUser`).
3. **Klaster Przechowywania Danych (MySQL Master-Slave):**
   * **Master (`mysql-master:3306`):** Węzeł główny obsługujący transakcje modyfikujące stan danych (użytkownicy, koszyki, zamówienia, płatności).
   * **Slave (`mysql-slave:3307`):** Węzeł potomny (Read-Only), odciążający węzeł główny przy operacjach odczytu (katalog produktów, opinie, historia).

---

## 🛡️ Mechanizmy Niezawodności i Odporności

### 1. Wzorzec Content-Based Router (`ResilienceRouter`)
System implementuje autorski mechanizm routingu bazy danych w `backend/api/routers.py`:
* `route_db_for_write(model, **hints)` – gwarantuje, że każda modyfikacja stanu trafi na bazę `default` (Master).
* `route_db_for_read(model, **hints)` – kieruje zapytania typu SELECT do bazy `slave`. W przypadku wykrycia niedostępności węzła Slave, router w ułamku sekundy automatycznie degraduje konfigurację i kieruje ruch odczytu do węzła Master.

### 2. Monitoring Replikacji i Health Check
* Endpoint `/api/health/` weryfikuje łączność z Masterem, Slavem, opóźnienie replikacji oraz datę ostatniej pomyślnej kopii zapasowej.
* Dedykowany pulpit operatorski `/api/monitoring/db/` prezentuje aktualny stan klastra w czasie rzeczywistym.

### 3. Zautomatyzowany System Kopii Zapasowych
Skrypt `backend/backups/daily_backup.sh` zapewnia:
* Zrzuty bazy wykonywane bezpośrednio z poziomu kontenera Mastera.
* Kompresję strumieniową `gzip` oszczędzającą przestrzeń dyskową.
* Walidację integralności wygenerowanego archiwum.
* Tworzenie manifestu w formacie JSON z metadanymi zrzutu (rozmiar, suma kontrolna, czas wykonania).
* Automatyczną politykę retencji usuwającą kopie starsze niż 7 dni.

---

## ⚡ Klucze Funkcjonalności Biznesowe

### Ścieżka Klienta
* **Autentykacja:** Rejestracja, logowanie JWT (Token Pair: Access + Refresh), obsługa procedury resetu hasła drogą mailową.
* **Katalog:** Przeglądanie asortymentu z dynamicznym mapowaniem rozmiarów (XS–XXL) i stanów magazynowych pobieranych z bazy.
* **Koszyk i Checkout:** Dodawanie pozycji, walidacja dostępności, integracja z formularzem Stripe Checkout API.
* **Obsługa Posprzedażowa:** Podgląd historii zamówień, możliwość anulowania zamówienia przed zmianą statusu oraz dodawanie opinii i ocen.

### Dedykowany Panel Administratora (`/moj-admin/`)
Zabezpieczony uprawnieniami RBAC moduł operatorski umożliwiający zarządzanie:
1. **Produktami i Stanami:** Dodawanie asortymentu, wariantów rozmiarowych i korekta stanów ilościowych.
2. **Zamówieniami:** Pełne sterowanie cyklem zamówienia (*Nowe* -> *W realizacji* -> *Wysłane* -> *Zrealizowane*).
3. **Zwrotami:** Weryfikacja i akceptacja wniosków o anulację/zwrot transakcji.
4. **Użytkownikami:** Podgląd bazy klientów, weryfikacja uprawnień, blokowanie/aktywacja kont.
5. **Opiniami:** Moderacja recenzji dodawanych pod produktami.

---

## ⚙️ Instalacja i Uruchomienie Krok po Kroku

### 1. Wymagania Środowiskowe
* Docker Engine ≥ 20.10 & Docker Compose ≥ 2.0
* Python 3.12 (zalecane środowisko wirtualne `venv`)

### 2. Uruchomienie Klastra MySQL
W głównym katalogu projektu uruchom kontenery bazy danych:
```bash
docker-compose -f docker-compose.mysql.yml up -d
Weryfikacja stanu kontenerów:Bashdocker ps | grep mysql
# Oczekiwany status: Up (healthy) dla obu węzłów: mysql-master i mysql-slave
3. Konfiguracja i Uruchomienie BackenduPrzejdź do katalogu backendu i aktywuj środowisko:Bashcd backend
source ../venv/bin/activate
pip install -r requirements.txt
Upewnij się, że plik .env zawiera niezbędne zmienne (baza danych, klucze Stripe, konfiguracja SMTP):Bashpython manage.py showmigrations api
python manage.py runserver 0.0.0.0:8000
Aplikacja jest dostępna pod adresem: http://localhost:8000🔌 Specyfikacja Punktów Końcowych APIMetodaEndpointRola / PrzeznaczenieWymagane UprawnieniaPOST/api/auth/register/Rejestracja nowego konta użytkownikaPublicznyPOST/api/auth/login/Uwierzytelnienie i zwrot pary tokenów JWTPublicznyGET/api/auth/profile/Pobranie danych profilowych zalogowanego użytkownikaIsAuthenticatedPOST/api/auth/password-reset-request/Inicjalizacja procedury resetu hasłaPublicznyGET/api/produkty/Pobranie asortymentu ze stanami magazynowymiPubliczny (Slave)GET/POST/api/koszyk/pobierz/Pobranie lub aktualizacja zawartości koszykaIsAuthenticatedGET/POST/api/zamowienia/Lista zamówień użytkownika / Utworzenie zamówieniaIsAuthenticatedGET/POST/api/opinie/Pobranie opinii o produktach / Wystawienie nowejPubliczny / AuthGET/POST/api/zwroty/Zgłoszenie i wgląd w procedowane zwrotyIsAuthenticatedGET/api/admin/*Zarządzanie sklepem (użytkownicy, opinie, stany)IsAdminUserGET/api/health/JSON ze statusem klastra DB, replikacji i backupówPubliczny / MonitorGET/api/monitoring/db/Graficzny pulpit monitoringu odporności bazyPubliczny / Monitor🧪 Testy Integracyjne i Weryfikacja NiezawodnościProjekt wyposażono w 12 testów integracyjnych weryfikujących architekturę i niezawodność:Bash# Uruchomienie dedykowanego zestawu testów odporności
python manage.py test api.tests
Kategorie testów:DatabaseConnectionTests: Sprawdzenie fizycznej łączności z portami 3306 (Master) oraz 3307 (Slave).ResilienceRouterTests: Weryfikacja kierowania operacji zapisu i odczytu na odpowiednie bazy.HealthCheckAPITests: Walidacja odpowiedzi endpointu /api/health/.BackupTests: Sprawdzenie poprawności tworzenia archiwów .sql.gz i ich manifestów JSON.ReplicationStatusTests: Walidacja wątków replikacyjnych (Slave_IO_Running, Slave_SQL_Running).FailoverSimulationTests: Programowy test odcięcia bazy Slave i automatycznego przekierowania ruchu do Mastera.📸 Dowody Działania Systemu1. Weryfikacja Health Check APIBashcurl -s http://localhost:8000/api/health/ | python3 -m json.tool
Odpowiedź potwierdza aktywny status Mastera (connected: true) oraz Slave'a (connected: true), a także znacznik czasu ostatniej kopii zapasowej.2. Status Replikacji w KontenerzeBashdocker exec mysql-slave mysql -u root -pProjekt2026! -e "SHOW SLAVE STATUS\G"
Oczekiwane parametry potoków I/O oraz SQL: Slave_IO_Running: Yes, Slave_SQL_Running: Yes, opóźnienie Seconds_Behind_Master: 0.3. Sukces Kopii ZapasowejLogi generowane w pliku backend/backups/narejonie-backup.log:Plaintext[2026-10-30 14:31:28] Backup utworzony: backup_20261030_143128.sql
[2026-10-30 14:31:28] Kompresja zakończona: backup_20261030_143128.sql.gz
[2026-10-30 14:31:28] Weryfikacja backupu: OK
[2026-10-30 14:31:28] Backup zakończony pomyślnie!
📁 Struktura RepozytoriumPlaintextmoj_projekt/
├── backend/                             # Logika serwerowa Django
│   ├── api/                             # Aplikacja główna API
│   │   ├── models.py                    # 12 relacyjnych modeli danych
│   │   ├── routers.py                   # ResilienceRouter (Content-Based Router)
│   │   ├── serializers.py               # Serializery Django REST Framework
│   │   ├── urls.py                      # Ścieżki punktów końcowych API
│   │   └── views.py                     # Widoki biznesowe, obsługa Stripe & JWT
│   ├── backups/                         # Skrypty i archiwa kopii zapasowych
│   │   ├── daily_backup.sh              # Skrypt automatycznego backupu
│   │   └── narejonie-backup.log         # Dziennik zdarzeń procesu archiwizacji
│   ├── mysql/                           # Pliki konfiguracyjne klastra bazodanowego
│   │   ├── master/my.cnf                # Konfiguracja binloga i GTID dla Mastera
│   │   └── slave/my.cnf                 # Konfiguracja replikacji dla Slave'a
│   ├── narejonie_backend/               # Ustawienia rdzenia Django
│   │   └── settings.py                  # Konfiguracja bazodanowa, JWT i Stripe
│   ├── manage.py                        # Narzędzie CLI Django
│   └── requirements.txt                 # Zależności środowiska Python
├── frontend/                            # Warstwa klienta SPA
│   ├── css/                             # Arkusze stylów platformy
│   ├── js/                              # Modularny kod Vanilla JS (app.js, api.js, auth.js)
│   └── index.html                       # Punkt wejścia aplikacji frontendowej
├── docker-compose.mysql.yml             # Orkiestracja kontenerów bazy Master-Slave
├── README.md                            # Główna dokumentacja techniczna projektu
└── README_RELIABILITY.md                # Szczegółowy opis mechanizmów odporności
🛠️ Podsumowanie Zrealizowanych TechnologiiBackend: Python 3.12, Django 5.0.4, Django REST Framework, SimpleJWTFrontend: HTML5, CSS3, Vanilla JavaScript (ES6+)Pamięć Masowa & Baza Danych: MySQL 8.0 (Master-Slave z replikacją GTID)Infrastruktura & Bezpieczeństwo: Docker, Docker Compose, Stripe API (SCA Ready), Bash
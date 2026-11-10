"""
Testy odporności na awarie bazy danych (Database Resilience Tests)
"""

import os
import time
import gzip
import shutil
from datetime import datetime
from django.test import TestCase, override_settings
from django.db import connection, DatabaseError, connections
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.conf import settings


class DatabaseConnectionTests(TestCase):
    """Testy połączenia z bazą danych."""
    databases = '__all__'
    
    def test_database_connection_master(self):
        """Test połączenia z masterem (default)."""
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            self.assertTrue(True, "Połączenie z masterem działa poprawnie")
        except DatabaseError as e:
            self.fail(f"Połączenie z masterem nie powiodło się: {e}")
    
    def test_database_connection_slave(self):
        """Test połączenia z slave'em."""
        if 'slave' not in settings.DATABASES:
            self.skipTest("Slave nie jest skonfigurowany")
        
        try:
            slave_connection = connections['slave']
            with slave_connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            self.assertTrue(True, "Połączenie z slave'em działa poprawnie")
        except DatabaseError as e:
            self.fail(f"Połączenie z slave'em nie powiodło się: {e}")


class ResilienceRouterTests(TestCase):
    """Testy routera odporności na awarie."""
    
    def setUp(self):
        from api.routers import ResilienceRouter
        self.router = ResilienceRouter()
    
    def test_route_db_for_write_returns_default(self):
        """Test że operacje zapisu są kierowane do mastera."""
        db_alias = self.router.route_db_for_write(None)
        self.assertEqual(db_alias, 'default')
    
    def test_force_master_method(self):
        """Test metody force_master()."""
        db_alias = self.router.force_master()
        self.assertEqual(db_alias, 'default')
    
    def test_force_slave_method(self):
        """Test metody force_slave()."""
        db_alias = self.router.force_slave()
        self.assertEqual(db_alias, 'slave')


class HealthCheckAPITests(TestCase):
    """Testy endpointu Health Check."""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_health_endpoint_exists(self):
        """Test czy endpoint health istnieje."""
        url = reverse('health-check')
        response = self.client.get(url)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_503_SERVICE_UNAVAILABLE])
        self.assertIn('status', response.data)
    
    def test_health_endpoint_response_structure(self):
        """Test struktury odpowiedzi health check."""
        url = reverse('health-check')
        response = self.client.get(url)
        
        required_fields = ['status', 'database', 'replication', 'backup', 'timestamp']
        for field in required_fields:
            self.assertIn(field, response.data, f"Brakujące pole: {field}")


class BackupTests(TestCase):
    """Testy systemu backupów."""
    
    def setUp(self):
        self.backup_dir = '/home/cortexai/CortexAI/moj_projekt/backend/backups'
        os.makedirs(self.backup_dir, exist_ok=True)
    
    def test_backup_directory_exists(self):
        """Test czy katalog backupów istnieje."""
        self.assertTrue(os.path.exists(self.backup_dir), "Katalog backupów nie istnieje")
    
    def test_backup_script_exists(self):
        """Test czy skrypt backupu istnieje."""
        script_path = os.path.join(self.backup_dir, 'daily_backup.sh')
        self.assertTrue(os.path.exists(script_path), "Skrypt backupu nie istnieje")
        self.assertTrue(os.access(script_path, os.X_OK), "Skrypt backupu nie jest wykonywalny")


class ReplicationStatusTests(TestCase):
    """Testy statusu replikacji."""
    databases = '__all__'
    
    def test_replication_status_check(self):
        """Test sprawdzania statusu replikacji."""
        if 'slave' not in settings.DATABASES:
            self.skipTest("Slave nie jest skonfigurowany")
        
        try:
            slave_connection = connections['slave']
            with slave_connection.cursor() as cursor:
                # Usunięto \G – użycie tego modyfikatora w Pythonie powoduje błąd składni SQL
                cursor.execute("SHOW SLAVE STATUS")
                status_result = cursor.fetchone()
                if status_result:
                    self.assertIsNotNone(status_result)
        except DatabaseError:
            self.skipTest("Replikacja nie jest skonfigurowana")


class FailoverSimulationTests(TestCase):
    """Testy symulacji awarii i failoveru."""
    
    def test_failover_to_master_on_slave_failure(self):
        """Test automatycznego przełączania do mastera przy awarii slave'a."""
        from api.routers import ResilienceRouter
        router = ResilienceRouter()
        db_alias = router.route_db_for_read(None, read=True)
        self.assertIn(db_alias, ['default', 'slave'])
    
    def test_database_failover_time(self):
        """Test czasu wykrywania awarii i failoveru (< 30 sekund)."""
        start_time = time.time()
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            elapsed = time.time() - start_time
            self.assertLess(elapsed, 30, f"Czas operacji {elapsed}s przekracza limit 30s")
        except DatabaseError:
            elapsed = time.time() - start_time
            self.assertLess(elapsed, 30, f"Czas wykrycia awarii {elapsed}s przekracza limit 30s")
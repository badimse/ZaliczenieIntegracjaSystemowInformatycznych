from django.conf import settings
from django.db import connections, DatabaseError
import logging
import datetime

logger = logging.getLogger(__name__)


class ResilienceRouter:
    # Flagi do symulacji awarii z poziomu panelu
    simulate_master_down = False
    simulate_slave_down = False
    
    # Historia zapytań do podglądu na żywo
    query_log = []

    @classmethod
    def log_query(cls, db_name, query_type):
        entry = {
            'time': datetime.datetime.now().strftime('%H:%M:%S.%f')[:-3],
            'database': db_name,
            'type': query_type
        }
        cls.query_log.insert(0, entry)
        if len(cls.query_log) > 20: # trzymaj 20 ostatnich zapytań
            cls.query_log.pop()

    def route_db_for_write(self, model, **hints):
        self.log_query('MASTER (Zapis)', 'WRITE')
        if self.simulate_master_down:
            raise Exception("AWARIA MASTER: Zapis zablokowany!")
        return 'default'
    
    def route_db_for_read(self, model, using='default', **hints):
        if using == 'default':
            return 'default'
        
        if 'slave' not in settings.DATABASES or self.simulate_slave_down:
            print("🔴 [FAILOVER] Baza SLAVE jest niedostępna! Przekierowuję odczyt na MASTER.")
            self.log_query('MASTER (Fallback - Slave niedostępny)', 'READ')
            return 'default'
        
        if hints.get('read') is False:
            return 'default'
        
        try:
            slave_connection = connections['slave']
            with slave_connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            
            # DODAJ TĘ LINIJKĘ:
            print("🟢 [ROUTING] Odczyt obsłużony przez bazę SLAVE (Replika).")
            
            self.log_query('SLAVE (Replika)', 'READ')
            return 'slave'
        except Exception as e:
            print(f"🔴 [FAILOVER] Błąd połączenia ze Slave ({e})! Przełączam na MASTER.")
            self.log_query('MASTER (Fallback - Błąd Slave)', 'READ')
            return 'default'
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        return db == 'default'
    
    @staticmethod
    def force_master():
        return 'default'
    
    @staticmethod
    def force_slave():
        return 'slave'
    
    @staticmethod
    def get_database_status():
        status = {
            'master': {'available': False, 'error': None},
            'slave': {'available': False, 'error': None}
        }
        try:
            master_conn = connections['default']
            with master_conn.cursor() as cursor:
                cursor.execute("SELECT 1")
            status['master']['available'] = True
        except DatabaseError as e:
            status['master']['error'] = str(e)
            
        if 'slave' in settings.DATABASES:
            try:
                slave_conn = connections['slave']
                with slave_conn.cursor() as cursor:
                    cursor.execute("SELECT 1")
                status['slave']['available'] = True
            except DatabaseError as e:
                status['slave']['error'] = str(e)
        return status
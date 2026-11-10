from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MonitoringView,
    CustomTokenObtainPairView, RegisterView, ProfileView,
    ProduktViewSet, KoszykViewSet, ZamowienieViewSet,
    ZamowienieAdminViewSet, OpiniaViewSet, ZwrotViewSet, ZwrotAdminViewSet,
    UserAdminViewSet, OpiniaAdminViewSet, PasswordResetRequestView, PasswordResetConfirmView, PasswordChangeView, stripe_webhook, HealthCheckView,
    database_monitoring_view,
    ToggleSimulateView,
    GetQueryLogsView
)

router = DefaultRouter()
router.register(r'produkty', ProduktViewSet, basename='produkt')
router.register(r'koszyk', KoszykViewSet, basename='koszyk')
router.register(r'zamowienia', ZamowienieViewSet, basename='zamowienie')
router.register(r'opinie', OpiniaViewSet, basename='opinia')
router.register(r'zwroty', ZwrotViewSet, basename='zwrot')

# Routery dla administratora
admin_router = DefaultRouter()
admin_router.register(r'zamowienia', ZamowienieAdminViewSet, basename='admin-zamowienia')
admin_router.register(r'zwroty', ZwrotAdminViewSet, basename='admin-zwroty')
admin_router.register(r'uzytkownicy', UserAdminViewSet, basename='admin-uzytkownicy')
admin_router.register(r'opinie', OpiniaAdminViewSet, basename='admin-opinie')

urlpatterns = [
    # Autentykacja (JWT)
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/profile/', ProfileView.as_view(), name='profile'),
    path('auth/password-change/', PasswordChangeView.as_view(), name='password_change'),
    path('auth/password-reset-request/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('auth/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Health Check API & Webhook
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('webhook/stripe/', stripe_webhook, name='stripe-webhook'),
    
    # Główne endpointy API
    path('', include(router.urls)),

    # Monitoring bazy danych
    path('monitoring/db/', database_monitoring_view, name='database-monitoring'),
    path('monitoring/toggle/', ToggleSimulateView.as_view(), name='toggle-simulate'),
    path('monitoring/logs/', GetQueryLogsView.as_view(), name='query-logs'),
    
    # Endpointy administratorskie (API)
    path('admin/', include(admin_router.urls)),
    path('admin/monitoring/', MonitoringView.as_view(), name='monitoring'),
]


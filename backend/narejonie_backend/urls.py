import os
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve
from api.views import custom_admin_view

urlpatterns = [
    path('django-admin/', admin.site.urls),
    path('moj-admin/', custom_admin_view, name='custom-admin'),
    path('api/', include('api.urls')),
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('index.html', TemplateView.as_view(template_name='index.html'), name='home_html'),

    # Ścieżki dla forgot-password i reset-password (zarówno z .html jak i bez!)
    path('forgot-password/', TemplateView.as_view(template_name='forgot-password.html'), name='forgot_password'),
    path('forgot-password.html', TemplateView.as_view(template_name='forgot-password.html'), name='forgot_password_html'),
    path('reset-password/', TemplateView.as_view(template_name='reset-password.html'), name='reset_password'),
    path('reset-password.html', TemplateView.as_view(template_name='reset-password.html'), name='reset_password_html'),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += [
        path('css/<path:path>', serve, {'document_root': os.path.join(settings.BASE_DIR, '../frontend/css')}),
        path('js/<path:path>', serve, {'document_root': os.path.join(settings.BASE_DIR, '../frontend/js')}),
        path('img/<path:path>', serve, {'document_root': os.path.join(settings.BASE_DIR, '../frontend/img')}),
    ]
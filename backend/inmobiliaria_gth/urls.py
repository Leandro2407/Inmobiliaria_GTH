from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

# Configuración de Swagger/OpenAPI
schema_view = get_schema_view(
    openapi.Info(
        title="GTH Inmobiliaria API",
        default_version='v1',
        description="API REST para el sistema de gestión inmobiliaria GTH",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contacto@gthinmobiliaria.com"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API Endpoints
    path('api/auth/', include('usuarios.urls')),
    path('api/clientes/', include('clientes.urls')),
    path('api/propiedades/', include('propiedades.urls')),
    path('api/pagos/', include('pagos.urls')),
    path('api/seguimientos/', include('seguimientos.urls')),
    
    # ✅ TAREAS - URL corregida
    path('api/tareas/', include('tareas.urls')),
    
    path('api/visitas/', include('visitas.urls')),
    path('api/contratos/', include('contratos.urls')), 
    
    # API Documentation
    path('api/docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('api/redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    
]

# Servir archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Personalizar títulos del admin
admin.site.site_header = "GTH Negocios Inmobiliarios - Administración"
admin.site.site_title = "GTH Admin"
admin.site.index_title = "Panel de Administración"
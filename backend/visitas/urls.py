from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VisitaViewSet, SolicitudVisitaViewSet

app_name = 'visitas'

router = DefaultRouter()
router.register(r'visitas', VisitaViewSet, basename='visita')
router.register(r'solicitudes', SolicitudVisitaViewSet, basename='solicitud-visita')

urlpatterns = [
    path('', include(router.urls)),
]
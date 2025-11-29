from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PropiedadViewSet, ImagenPropiedadViewSet, VideoPropiedadViewSet

app_name = 'propiedades'

router = DefaultRouter()
router.register(r'', PropiedadViewSet, basename='propiedad')
router.register(r'imagenes', ImagenPropiedadViewSet, basename='imagen')
router.register(r'videos', VideoPropiedadViewSet, basename='video')

urlpatterns = [
    path('', include(router.urls)),
]

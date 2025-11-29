from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VisitaViewSet

app_name = 'visitas'

router = DefaultRouter()
router.register(r'', VisitaViewSet, basename='visita')

urlpatterns = [
    path('', include(router.urls)),
]
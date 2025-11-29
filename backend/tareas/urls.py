from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Configurar el router para las tareas
router = DefaultRouter()
router.register(r'tareas', views.TareaViewSet)

urlpatterns = [
    # API para tareas (CRUD completo)
    path('', include(router.urls)),
]
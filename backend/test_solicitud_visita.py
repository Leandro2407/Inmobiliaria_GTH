#!/usr/bin/env python
"""
Script para probar la creación de solicitud de visita
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inmobiliaria_gth.settings')
django.setup()

from rest_framework.test import APIRequestFactory, force_authenticate, APIClient
from visitas.views import SolicitudVisitaViewSet
from django.contrib.auth import get_user_model
from propiedades.models import Propiedad
from clientes.models import Cliente

Usuario = get_user_model()

print("=" * 80)
print("PRUEBA DE CREACIÓN DE SOLICITUD DE VISITA")
print("=" * 80)

# Obtener un usuario cliente
user = Usuario.objects.filter(rol='cliente').first()
if not user:
    print("❌ No hay usuarios con rol 'cliente'")
    exit(1)

print(f"\nUsuario: {user.email} ({user.get_full_name()})")
print(f"Rol: {user.rol}")

# Obtener una propiedad
propiedad = Propiedad.objects.first()
if not propiedad:
    print("❌ No hay propiedades en la base de datos")
    exit(1)

print(f"Propiedad: {propiedad.titulo} (ID: {propiedad.id})")

# Usar API de Django REST para hacer la solicitud
from rest_framework.test import APIClient

client = APIClient()
client.force_authenticate(user=user)

print(f"\n{'=' * 80}")
print("ENVIANDO SOLICITUD:")
print(f"  Propiedad: {propiedad.id}")
print(f"  Usuario: {user.email}")
print(f"  Rol: {user.rol}")
print(f"  Mensaje: 'Me gustaría agendar una visita a esta propiedad'")
print(f"{'=' * 80}\n")

payload = {
    'propiedad': propiedad.id,
    'mensaje': 'Me gustaría agendar una visita a esta propiedad'
}

try:
    response = client.post('/api/visitas/solicitudes/', payload, format='json')
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 201:
        print(f"✅ SOLICITUD CREADA EXITOSAMENTE")
        print(f"Datos: {json.dumps(response.data, indent=2, ensure_ascii=False)}")
    else:
        print(f"❌ ERROR AL CREAR SOLICITUD")
        print(f"Response: {json.dumps(response.data, indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"❌ ERROR AL ENVIAR SOLICITUD:")
    print(f"Type: {type(e).__name__}")
    print(f"Message: {str(e)}")
    import traceback
    traceback.print_exc()

print(f"\n{'=' * 80}")

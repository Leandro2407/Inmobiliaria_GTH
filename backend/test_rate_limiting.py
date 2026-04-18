#!/usr/bin/env python
"""
Script para probar la creación de solicitud y el rate limiting
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inmobiliaria_gth.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from propiedades.models import Propiedad

Usuario = get_user_model()

print("=" * 80)
print("PRUEBA DE RATE LIMITING EN SOLICITUDES")
print("=" * 80)

# Obtener usuario cliente
user_cliente = Usuario.objects.filter(rol='cliente').first()
if not user_cliente:
    print("❌ No hay usuarios cliente")
    exit(1)

# Obtener dos propiedades diferentes
propiedades = Propiedad.objects.all()[:2]
if len(propiedades) < 2:
    print("❌ No hay suficientes propiedades para la prueba")
    exit(1)

client = APIClient()
client.force_authenticate(user=user_cliente)

print(f"\nUsuario: {user_cliente.email}")
print(f"Rol: {user_cliente.rol}")

# Primer intento - debe funcionar
print(f"\n1️⃣  PRIMERA SOLICITUD (debe funcionar):")
print(f"   Propiedad: {propiedades[0].titulo} (ID: {propiedades[0].id})")

payload1 = {
    'propiedad': propiedades[0].id,
    'mensaje': 'Primera solicitud'
}

try:
    response = client.post('/api/visitas/solicitudes/', payload1, format='json')
    print(f"   Status: {response.status_code}")
    
    if response.status_code in [200, 201]:
        print(f"   ✅ SOLICITUD CREADA")
    else:
        print(f"   ❌ Error: {json.dumps(response.data, indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"   ❌ Exception: {str(e)}")

# Segundo intento inmediato - debe estar bloqueado
print(f"\n2️⃣  SEGUNDA SOLICITUD INMEDIATA (debe estar bloqueada):")
print(f"   Propiedad: {propiedades[1].titulo} (ID: {propiedades[1].id})")

payload2 = {
    'propiedad': propiedades[1].id,
    'mensaje': 'Segunda solicitud inmediata'
}

try:
    response = client.post('/api/visitas/solicitudes/', payload2, format='json')
    print(f"   Status: {response.status_code}")
    
    if response.status_code in [200, 201]:
        print(f"   ❌ PROBLEMA: Segunda solicitud fue aceptada (no debería)")
        print(f"   Response: {json.dumps(response.data, indent=2, ensure_ascii=False)}")
    else:
        print(f"   ✅ SOLICITUD BLOQUEADA CORRECTAMENTE")
        print(f"   Response: {json.dumps(response.data, indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"   ❌ Exception: {str(e)}")

print("\n" + "=" * 80)

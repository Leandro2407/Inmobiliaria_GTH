#!/usr/bin/env python
"""
Script para probar el endpoint GET de solicitudes
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inmobiliaria_gth.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

Usuario = get_user_model()

print("=" * 80)
print("PRUEBA DE GET SOLICITUDES")
print("=" * 80)

# Obtener un usuario cliente
user_cliente = Usuario.objects.filter(rol='cliente').first()
user_admin = Usuario.objects.filter(rol='administrador').first()

if not user_cliente:
    print("❌ No hay usuarios con rol 'cliente'")
    exit(1)

if not user_admin:
    print("❌ No hay usuarios con rol 'administrador'")
    exit(1)

client = APIClient()

# Test 1: Usuario cliente obteniendo sus solicitudes
print("\n1️⃣  TEST COMO CLIENTE:")
print(f"   Usuario: {user_cliente.email} (Rol: {user_cliente.rol})")
client.force_authenticate(user=user_cliente)

try:
    response = client.get('/api/visitas/solicitudes/')
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.data
        print(f"   ✅ SOLICITUDES CARGADAS")
        print(f"   Type de response.data: {type(data)}")
        print(f"   Keys: {data.keys() if isinstance(data, dict) else 'N/A'}")
        print(f"   Contenido: {json.dumps(data, indent=2, ensure_ascii=False)[:500]}")
    else:
        print(f"   ❌ Error {response.status_code}")
        print(f"   Response: {json.dumps(response.data, indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"   ❌ Exception: {str(e)}")

# Test 2: Usuario admin obteniendo solicitudes
print("\n2️⃣  TEST COMO ADMINISTRADOR:")
print(f"   Usuario: {user_admin.email} (Rol: {user_admin.rol})")
client.force_authenticate(user=user_admin)

try:
    response = client.get('/api/visitas/solicitudes/')
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.data
        print(f"   ✅ SOLICITUDES CARGADAS")
        print(f"   Type de response.data: {type(data)}")
        print(f"   Keys: {data.keys() if isinstance(data, dict) else 'N/A'}")
        print(f"   Contenido: {json.dumps(data, indent=2, ensure_ascii=False)[:500]}")
    else:
        print(f"   ❌ Error {response.status_code}")
        print(f"   Response: {json.dumps(response.data, indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"   ❌ Exception: {str(e)}")

print("\n" + "=" * 80)

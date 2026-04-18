#!/usr/bin/env python
"""
Script para probar los endpoints pendientes y mis_solicitudes
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
print("PRUEBA DE ENDPOINTS DE SOLICITUDES")
print("=" * 80)

# Obtener usuarios
user_cliente = Usuario.objects.filter(rol='cliente').first()
user_admin = Usuario.objects.filter(rol='administrador').first()

if not user_cliente or not user_admin:
    print("❌ No hay usuarios suficientes para las pruebas")
    exit(1)

client = APIClient()

# Test 1: Endpoint pendientes (solo admin)
print("\n1️⃣  TEST /solicitudes/pendientes/ (ADMIN):")
print(f"   Usuario: {user_admin.email} (Rol: {user_admin.rol})")
client.force_authenticate(user=user_admin)

try:
    response = client.get('/api/visitas/solicitudes/pendientes/')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.data
        print(f"   ✅ RESPUESTA CORRECTA")
        print(f"   Tipo: {type(data).__name__}")
        print(f"   Cantidad: {len(data) if isinstance(data, list) else 'N/A'}")
        if isinstance(data, list) and len(data) > 0:
            print(f"   Primer item: {json.dumps(data[0], indent=2, ensure_ascii=False)[:300]}")
    else:
        print(f"   ❌ Error: {json.dumps(response.data, indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"   ❌ Exception: {str(e)}")

# Test 2: Endpoint mis_solicitudes (cliente)
print("\n2️⃣  TEST /solicitudes/mis_solicitudes/ (CLIENTE):")
print(f"   Usuario: {user_cliente.email} (Rol: {user_cliente.rol})")
client.force_authenticate(user=user_cliente)

try:
    response = client.get('/api/visitas/solicitudes/mis_solicitudes/')
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.data
        print(f"   ✅ RESPUESTA CORRECTA")
        print(f"   Tipo: {type(data).__name__}")
        print(f"   Cantidad: {len(data) if isinstance(data, list) else 'N/A'}")
        if isinstance(data, list) and len(data) > 0:
            print(f"   Primer item: {json.dumps(data[0], indent=2, ensure_ascii=False)[:300]}")
    else:
        print(f"   ❌ Error: {json.dumps(response.data, indent=2, ensure_ascii=False)}")
except Exception as e:
    print(f"   ❌ Exception: {str(e)}")

print("\n" + "=" * 80)

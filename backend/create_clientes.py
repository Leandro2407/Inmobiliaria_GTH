#!/usr/bin/env python
"""
Script para crear registros Cliente para usuarios con rol 'cliente'
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inmobiliaria_gth.settings')
django.setup()

from django.contrib.auth import get_user_model
from clientes.models import Cliente

Usuario = get_user_model()

print("=" * 80)
print("CREAR CLIENTES PARA USUARIOS CON ROL 'CLIENTE'")
print("=" * 80)

# Obtener todos los usuarios con rol 'cliente'
usuarios_cliente = Usuario.objects.filter(rol='cliente')
print(f"\nTotal de usuarios con rol 'cliente': {usuarios_cliente.count()}\n")

clientes_creados = 0
clientes_existentes = 0

for user in usuarios_cliente:
    # Verificar si ya existe un Cliente con ese email
    cliente_existente = Cliente.objects.filter(email=user.email).first()
    
    if cliente_existente:
        print(f"⚠️ CLIENTE YA EXISTE: {user.email}")
        clientes_existentes += 1
        continue
    
    # Crear un nuevo Cliente
    try:
        cliente = Cliente.objects.create(
            nombre=user.first_name or "Cliente",
            apellido=user.last_name or user.username,
            dni=user.dni or f"DNI_{user.id}",  # Usar DNI del usuario o un placeholder
            email=user.email,
            telefono=user.telefono or "1234567890",  # Usar teléfono del usuario o placeholder
            domicilio=f"{user.calle} {user.numeracion}" if user.calle else "No especificado",
            ciudad=user.ciudad or "Salta",
            categoria='ambas',  # Categoría por defecto
            estado='activo',
            creado_por_id=None  # Sin usuario creador específico
        )
        print(f"✅ CLIENTE CREADO: {user.email}")
        print(f"   Nombre: {cliente.nombre_completo}")
        print(f"   Categoría: {cliente.get_categoria_display()}")
        clientes_creados += 1
    except Exception as e:
        print(f"❌ ERROR AL CREAR CLIENTE para {user.email}: {str(e)}")

print("\n" + "=" * 80)
print(f"RESUMEN:")
print(f"  ✅ Clientes creados: {clientes_creados}")
print(f"  ⚠️  Clientes que ya existían: {clientes_existentes}")
print(f"  📊 Total procesados: {clientes_creados + clientes_existentes}")
print("=" * 80)
print("\nAhora los clientes deberían poder agendar visitas sin problemas.")
print("=" * 80)

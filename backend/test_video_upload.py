#!/usr/bin/env python
"""
Script para testear la subida de videos sin necesidad de interfaz
"""
import os
import sys
import django
from django.test import Client
from django.core.files.uploadedfile import SimpleUploadedFile
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'inmobiliaria_gth.settings')
django.setup()

from propiedades.models import Propiedad, VideoPropiedad
from usuarios.models import Usuario

def test_video_upload():
    """Test de subida de video"""
    
    print("=" * 80)
    print("TEST DE SUBIDA DE VIDEO")
    print("=" * 80)
    
    # Obtener una propiedad existente
    propiedades = Propiedad.objects.all()
    if not propiedades.exists():
        print("ERROR: No hay propiedades en la base de datos")
        return
    
    propiedad = propiedades.first()
    print(f"\n✓ Propiedad seleccionada: {propiedad.id} - {propiedad.titulo}")
    
    # Obtener un usuario autenticado
    usuarios = Usuario.objects.filter(is_staff=True)
    if not usuarios.exists():
        print("ERROR: No hay usuarios staff para autenticación")
        return
    
    usuario = usuarios.first()
    print(f"✓ Usuario seleccionado: {usuario.email}")
    
    # Crear cliente HTTP
    client = Client()
    client.force_login(usuario)
    print("✓ Cliente autenticado")
    
    # Test 1: Subir un archivo de video
    print("\n" + "-" * 80)
    print("TEST 1: Subiendo archivo de video")
    print("-" * 80)
    
    # Crear un archivo de video ficticio
    video_content = b"fake video content for testing"
    video_file = SimpleUploadedFile(
        "test_video.mp4",
        video_content,
        content_type="video/mp4"
    )
    
    response = client.post(
        f'/api/propiedades/{propiedad.id}/subir_video/',
        {'video': video_file, 'titulo': 'Video de Prueba'},
        format='multipart'
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {dict(response.items())}")
    print(f"Response Content: {response.content.decode('utf-8')}")
    
    if response.status_code == 201:
        print("✓ Video subido exitosamente")
        data = response.json()
        print(f"Response Data: {json.dumps(data, indent=2)}")
    else:
        print("✗ Error al subir video")
        try:
            error_data = response.json()
            print(f"Error Data: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Error Content (raw): {response.content}")
    
    # Test 2: Subir URL de YouTube
    print("\n" + "-" * 80)
    print("TEST 2: Subiendo URL de YouTube")
    print("-" * 80)
    
    response = client.post(
        f'/api/propiedades/{propiedad.id}/subir_video/',
        {'url_youtube': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'titulo': 'YouTube Video'},
        format='multipart'
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Content: {response.content.decode('utf-8')}")
    
    if response.status_code == 201:
        print("✓ URL de YouTube subida exitosamente")
        data = response.json()
        print(f"Response Data: {json.dumps(data, indent=2)}")
    else:
        print("✗ Error al subir URL de YouTube")
        try:
            error_data = response.json()
            print(f"Error Data: {json.dumps(error_data, indent=2)}")
        except:
            print(f"Error Content (raw): {response.content}")
    
    # Listar videos de la propiedad
    print("\n" + "-" * 80)
    print("VIDEOS GUARDADOS EN LA PROPIEDAD")
    print("-" * 80)
    
    videos = VideoPropiedad.objects.filter(propiedad=propiedad)
    for i, video in enumerate(videos, 1):
        print(f"{i}. {video.titulo}")
        print(f"   - Video: {video.video if video.video else 'Ninguno'}")
        print(f"   - YouTube: {video.url_youtube if video.url_youtube else 'Ninguno'}")
        print(f"   - Fecha: {video.fecha_subida}")

if __name__ == '__main__':
    test_video_upload()

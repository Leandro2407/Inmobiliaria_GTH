from rest_framework import serializers
from .models import Contrato
from clientes.serializers import ClienteSerializer
from propiedades.serializers import PropiedadSerializer

class ContratoSerializer(serializers.ModelSerializer):
    cliente_info = ClienteSerializer(source='cliente', read_only=True)
    propiedad_info = PropiedadSerializer(source='propiedad', read_only=True)
    
    class Meta:
        model = Contrato
        fields = [
            'id', 'cliente', 'propiedad', 'tipo', 'fecha_inicio', 
            'fecha_fin', 'monto', 'comision', 'estado', 'descripcion',
            'created_at', 'updated_at', 'cliente_info', 'propiedad_info'
        ]
from rest_framework import serializers
from .models import Cliente
from usuarios.models import Usuario

class ClienteSerializer(serializers.ModelSerializer):
    """Serializer completo para Cliente"""
    
    nombre_completo = serializers.CharField(read_only=True)
    esta_activo = serializers.BooleanField(read_only=True)
    agente_nombre = serializers.CharField(source='agente_asignado.get_full_name', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    
    class Meta:
        model = Cliente
        fields = [
            'id', 'nombre', 'apellido', 'nombre_completo', 'dni', 'email', 
            'telefono', 'domicilio', 'ciudad', 'codigo_postal',
            'categoria', 'estado', 'esta_activo',
            'agente_asignado', 'agente_nombre',
            'notas', 'presupuesto_min', 'presupuesto_max',
            'fecha_registro', 'ultima_actualizacion',
            'creado_por', 'creado_por_nombre'
        ]
        read_only_fields = ['fecha_registro', 'ultima_actualizacion']
    
    def validate_dni(self, value):
        """Validar que el DNI sea único"""
        if self.instance:
            # Editando
            if Cliente.objects.exclude(id=self.instance.id).filter(dni=value).exists():
                raise serializers.ValidationError("Ya existe un cliente con este DNI.")
        else:
            # Creando
            if Cliente.objects.filter(dni=value).exists():
                raise serializers.ValidationError("Ya existe un cliente con este DNI.")
        return value
    
    def validate_email(self, value):
        """Validar que el email sea único"""
        if self.instance:
            if Cliente.objects.exclude(id=self.instance.id).filter(email=value).exists():
                raise serializers.ValidationError("Ya existe un cliente con este email.")
        else:
            if Cliente.objects.filter(email=value).exists():
                raise serializers.ValidationError("Ya existe un cliente con este email.")
        return value


class ClienteListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""
    
    nombre_completo = serializers.CharField(read_only=True)
    agente_nombre = serializers.CharField(source='agente_asignado.get_full_name', read_only=True)
    
    class Meta:
        model = Cliente
        fields = [
            'id', 'nombre_completo', 'dni', 'email', 'telefono',
            'categoria', 'estado', 'agente_nombre', 'fecha_registro'
        ]


class ClienteCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear y actualizar clientes"""
    
    class Meta:
        model = Cliente
        fields = [
            'nombre', 'apellido', 'dni', 'email', 'telefono',
            'domicilio', 'ciudad', 'codigo_postal',
            'categoria', 'estado', 'agente_asignado',
            'notas', 'presupuesto_min', 'presupuesto_max'
        ]

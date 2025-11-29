from rest_framework import serializers
from .models import Visita
from clientes.serializers import ClienteListSerializer
from django.utils import timezone
from datetime import datetime, timedelta

class VisitaSerializer(serializers.ModelSerializer):
    """Serializer completo para Visita con todos los campos y validaciones"""
    
    # Campos computados para enriquecer la respuesta
    cliente_info = ClienteListSerializer(source='cliente', read_only=True)
    cliente_nombre = serializers.CharField(source='cliente.nombre_completo', read_only=True)
    cliente_dni = serializers.CharField(source='cliente.dni', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    fecha_hora_completa = serializers.CharField(read_only=True)
    fecha_hora_finalizacion_completa = serializers.CharField(read_only=True)
    
    # Propiedades del modelo (solo lectura)
    esta_pendiente = serializers.BooleanField(read_only=True)
    esta_en_curso = serializers.BooleanField(read_only=True)
    esta_finalizada = serializers.BooleanField(read_only=True)
    esta_cancelada = serializers.BooleanField(read_only=True)
    puede_ser_cancelada = serializers.BooleanField(read_only=True)
    puede_ser_finalizada = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Visita
        fields = [
            # Identificación y relaciones
            'id', 'cliente', 'cliente_info', 'cliente_nombre', 'cliente_dni',
            
            # Fecha y hora
            'fecha', 'hora', 'fecha_hora_completa',
            
            # Información de la visita
            'resultado', 'descripcion', 'estado',
            
            # Información de creación
            'creado_por', 'creado_por_nombre',
            
            # Campos de auditoría
            'fecha_creacion', 'fecha_actualizacion', 'fecha_finalizacion', 'fecha_cancelacion',
            'hora_finalizacion', 'fecha_hora_finalizacion_completa',
            
            # Propiedades computadas
            'esta_pendiente', 'esta_en_curso', 'esta_finalizada', 'esta_cancelada',
            'puede_ser_cancelada', 'puede_ser_finalizada'
        ]
        read_only_fields = [
            'fecha_creacion', 'fecha_actualizacion', 
            'fecha_finalizacion', 'fecha_cancelacion', 'hora_finalizacion'
        ]
    
    def validate_fecha(self, value):
        """
        Validar que la fecha no sea en el pasado
        Considera diferencias de zona horaria permitiendo fecha de ayer
        """
        # Obtener fecha de ayer para dar margen de 1 día por diferencias de timezone
        ahora = timezone.now()
        ayer = (ahora - timedelta(days=1)).date()
        hoy = ahora.date()
        
        # Si estamos editando una visita existente
        instance = self.instance
        if instance:
            # Si la fecha no cambió, no validar
            if instance.fecha == value:
                return value
            
            # Si es una visita finalizada o cancelada, NO permitir cambio de fecha
            if instance.estado in ['finalizada', 'cancelada']:
                raise serializers.ValidationError(
                    f"No se puede cambiar la fecha de una visita {instance.estado}."
                )
        
        # ✅ CORREGIDO: Permitir fecha de AYER (por diferencia de timezone)
        # Solo rechazar fechas de hace 2 o más días
        if value < ayer:
            raise serializers.ValidationError(
                "No se puede programar una visita en el pasado."
            )
        
        return value
    
    def validate(self, data):
        """Validaciones cruzadas entre campos"""
        instance = self.instance
        
        # Si estamos actualizando solo resultado/descripción de una visita finalizada
        if instance and instance.estado == 'finalizada':
            campos_finalizados = ['resultado', 'descripcion']
            campos_enviados = list(data.keys())
            
            # Si solo se están actualizando campos permitidos para visitas finalizadas
            if all(key in campos_finalizados for key in campos_enviados):
                return data
        
        # Validaciones de cambio de estado
        if instance:
            nuevo_estado = data.get('estado', instance.estado)
            
            # Validar cancelación
            if nuevo_estado == 'cancelada' and not instance.puede_ser_cancelada:
                raise serializers.ValidationError({
                    'estado': 'No se puede cancelar una visita ya finalizada.'
                })
            
            # Validar finalización
            if nuevo_estado == 'finalizada' and not instance.puede_ser_finalizada:
                raise serializers.ValidationError({
                    'estado': 'Solo se puede finalizar una visita que está en curso.'
                })
        
        return data


class VisitaCreateSerializer(serializers.ModelSerializer):
    """Serializer especializado para crear nuevas visitas"""
    
    class Meta:
        model = Visita
        fields = [
            'cliente', 'fecha', 'hora', 'resultado', 
            'descripcion', 'estado'
        ]
        read_only_fields = ['estado']  # El estado se asigna automáticamente
    
    def validate_fecha(self, value):
        """Validar fecha para creación de visitas"""
        # Obtener fecha de ayer para margen de timezone
        ahora = timezone.now()
        ayer = (ahora - timedelta(days=1)).date()
        
        # Solo rechazar fechas de hace 2 o más días
        if value < ayer:
            raise serializers.ValidationError(
                "No se puede programar una visita en el pasado."
            )
        
        return value


class VisitaListSerializer(serializers.ModelSerializer):
    """Serializer optimizado para listados de visitas"""
    
    # Campos computados para listas
    cliente_nombre = serializers.CharField(source='cliente.nombre_completo', read_only=True)
    cliente_dni = serializers.CharField(source='cliente.dni', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    
    # Propiedades para acciones
    puede_ser_cancelada = serializers.BooleanField(read_only=True)
    puede_ser_finalizada = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Visita
        fields = [
            'id', 'cliente_nombre', 'cliente_dni', 'fecha', 'hora',
            'resultado', 'estado', 'fecha_creacion', 'creado_por_nombre',
            'puede_ser_cancelada', 'puede_ser_finalizada'
        ]
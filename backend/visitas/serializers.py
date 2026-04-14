from rest_framework import serializers
from .models import Visita
from clientes.serializers import ClienteListSerializer
from usuarios.serializers import AgenteSerializer
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
    
    # Información del empleado asignado
    empleado_info = AgenteSerializer(source='empleado', read_only=True)
    
    # Propiedades del modelo (solo lectura)
    esta_pendiente = serializers.BooleanField(read_only=True)
    esta_en_curso = serializers.BooleanField(read_only=True)
    esta_finalizada = serializers.BooleanField(read_only=True)
    esta_cancelada = serializers.BooleanField(read_only=True)
    puede_ser_cancelada = serializers.BooleanField(read_only=True)
    puede_ser_finalizada = serializers.BooleanField(read_only=True)
    puede_ser_editada = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Visita
        fields = [
            'id', 'cliente', 'cliente_info', 'cliente_nombre', 'cliente_dni',
            'empleado', 'empleado_info',
            'fecha', 'hora', 'fecha_hora_completa',
            'resultado', 'descripcion', 'estado',
            'creado_por', 'creado_por_nombre',
            'fecha_creacion', 'fecha_actualizacion', 'fecha_finalizacion', 'fecha_cancelacion',
            'hora_finalizacion', 'fecha_hora_finalizacion_completa',
            'esta_pendiente', 'esta_en_curso', 'esta_finalizada', 'esta_cancelada',
            'puede_ser_cancelada', 'puede_ser_finalizada', 'puede_ser_editada'
        ]
        read_only_fields = [
            'fecha_creacion', 'fecha_actualizacion', 
            'fecha_finalizacion', 'fecha_cancelacion', 'hora_finalizacion'
        ]
    
    def validate_fecha(self, value):
        """Validar que la fecha no sea en el pasado"""
        ahora = timezone.now()
        ayer = (ahora - timedelta(days=1)).date()
        
        instance = self.instance
        if instance:
            if instance.fecha == value:
                return value
            
            if instance.estado in ['finalizada', 'cancelada']:
                raise serializers.ValidationError(
                    f"No se puede cambiar la fecha de una visita {instance.estado}."
                )
        
        if value < ayer:
            raise serializers.ValidationError(
                "No se puede programar una visita en el pasado."
            )
        
        return value
    
    def validate_empleado(self, value):
        """
        Validar que el empleado esté disponible en la fecha y hora seleccionadas
        """
        # Si no hay empleado seleccionado
        if not value:
            if self.instance and self.instance.estado == 'pendiente':
                raise serializers.ValidationError("Debe seleccionar un empleado para la visita.")
            return value
        
        # Si es una visita finalizada, no validar disponibilidad
        if self.instance and self.instance.estado == 'finalizada':
            return value
        
        # Obtener fecha y hora
        fecha = self.initial_data.get('fecha')
        hora = self.initial_data.get('hora')
        
        # Si no se enviaron fecha/hora nuevas, usar las existentes
        if not fecha and self.instance:
            fecha = self.instance.fecha
        if not hora and self.instance:
            hora = self.instance.hora
        
        if not fecha or not hora:
            return value
        
        # Convertir fecha a objeto date
        if isinstance(fecha, str):
            try:
                fecha = datetime.strptime(fecha, '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError("Formato de fecha inválido.")
        
        # Convertir hora a objeto time
        if isinstance(hora, str):
            try:
                hora = datetime.strptime(hora, '%H:%M').time()
            except ValueError:
                raise serializers.ValidationError("Formato de hora inválido.")
        
        # Excluir la visita actual para no bloquearse a sí misma
        exclude_id = self.instance.id if self.instance else None
        
        # Verificar disponibilidad del empleado
        disponible, visita_conflicto, conflictos = Visita.empleado_esta_disponible(
            value.id, fecha, hora, exclude_visita_id=exclude_id
        )
        
        if not disponible:
            # Si el conflicto es con la misma visita, permitir
            if exclude_id and visita_conflicto and visita_conflicto.id == exclude_id:
                return value
            
            # Formatear mensaje de error
            if conflictos:
                mensajes = []
                for conf in conflictos:
                    mensajes.append(f"{conf['horario_conflicto']} (diferencia de {conf['diferencia_minutos']} min)")
                raise serializers.ValidationError(
                    f"El empleado no está disponible en este horario. "
                    f"Conflictos con visita(s) programada(s) a las: {' | '.join(mensajes)}"
                )
            else:
                raise serializers.ValidationError(
                    f"El empleado no está disponible en este horario."
                )
        
        return value
    
    def validate(self, data):
        """Validaciones cruzadas entre campos"""
        instance = self.instance
        
        if instance and instance.estado == 'finalizada':
            campos_finalizados = ['resultado', 'descripcion']
            campos_enviados = list(data.keys())
            
            if all(key in campos_finalizados for key in campos_enviados):
                return data
        
        if instance:
            nuevo_estado = data.get('estado', instance.estado)
            
            if nuevo_estado == 'cancelada' and not instance.puede_ser_cancelada:
                raise serializers.ValidationError({
                    'estado': 'No se puede cancelar una visita ya finalizada.'
                })
            
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
            'cliente', 'fecha', 'hora', 'empleado', 'resultado', 
            'descripcion', 'estado'
        ]
        read_only_fields = ['estado']
    
    def validate_fecha(self, value):
        """Validar fecha para creación de visitas"""
        ahora = timezone.now()
        ayer = (ahora - timedelta(days=1)).date()
        
        if value < ayer:
            raise serializers.ValidationError(
                "No se puede programar una visita en el pasado."
            )
        
        return value
    
    def validate_empleado(self, value):
        """
        Validar que el empleado esté disponible en la fecha y hora seleccionadas
        """
        if not value:
            raise serializers.ValidationError("Debe seleccionar un empleado para la visita.")
        
        # Obtener fecha y hora
        fecha = self.initial_data.get('fecha')
        hora = self.initial_data.get('hora')
        
        if not fecha or not hora:
            return value
        
        # Convertir fecha a objeto date
        if isinstance(fecha, str):
            try:
                fecha = datetime.strptime(fecha, '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError("Formato de fecha inválido.")
        
        # Convertir hora a objeto time
        if isinstance(hora, str):
            try:
                hora = datetime.strptime(hora, '%H:%M').time()
            except ValueError:
                raise serializers.ValidationError("Formato de hora inválido.")
        
        # Verificar disponibilidad del empleado
        disponible, visita_conflicto, conflictos = Visita.empleado_esta_disponible(value.id, fecha, hora)
        
        if not disponible:
            if conflictos:
                mensajes = []
                for conf in conflictos:
                    mensajes.append(f"{conf['horario_conflicto']} (diferencia de {conf['diferencia_minutos']} min)")
                raise serializers.ValidationError(
                    f"El empleado no está disponible en este horario. "
                    f"Conflictos con visita(s) programada(s) a las: {' | '.join(mensajes)}"
                )
            else:
                raise serializers.ValidationError(
                    f"El empleado no está disponible en este horario."
                )
        
        return value


class VisitaListSerializer(serializers.ModelSerializer):
    """Serializer optimizado para listados de visitas"""
    
    cliente_nombre = serializers.CharField(source='cliente.nombre_completo', read_only=True)
    cliente_dni = serializers.CharField(source='cliente.dni', read_only=True)
    creado_por_nombre = serializers.CharField(source='creado_por.get_full_name', read_only=True)
    empleado_nombre = serializers.CharField(source='empleado.get_full_name', read_only=True)
    puede_ser_cancelada = serializers.BooleanField(read_only=True)
    puede_ser_finalizada = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Visita
        fields = [
            'id', 'cliente_nombre', 'cliente_dni', 'fecha', 'hora',
            'resultado', 'estado', 'fecha_creacion', 'creado_por_nombre',
            'empleado', 'empleado_nombre',
            'puede_ser_cancelada', 'puede_ser_finalizada'
        ]
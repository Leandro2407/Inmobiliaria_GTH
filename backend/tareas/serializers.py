import datetime

from rest_framework import serializers

from visitas.models import Visita
from .models import Tarea
from django.contrib.auth import get_user_model

# Obtener el modelo de usuario personalizado
User = get_user_model()

class TareaSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Tarea con relaciones y campos computados"""
    
    # Campo para la relación muchos-a-muchos con empleados (escritura)
    empleados = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.all(),
        required=True,
        error_messages={
            'required': 'Debe asignar al menos un empleado a la tarea.',
            'null': 'Debe asignar al menos un empleado a la tarea.'
        }
    )
    
    # Campo computado para mostrar información detallada de empleados (solo lectura)
    empleados_detalle = serializers.SerializerMethodField()
    
    def get_empleados_detalle(self, obj):
        """
        Obtiene información detallada de los empleados asignados a la tarea
        """
        empleados_data = []
        for empleado in obj.empleados.all():
            empleados_data.append({
                'id': empleado.id,
                'username': empleado.username,
                'first_name': empleado.first_name,
                'last_name': empleado.last_name,
                'email': empleado.email,
                'nombre_completo': f"{empleado.first_name} {empleado.last_name}".strip()
            })
        return empleados_data

    def validate_empleado(self, value):
        """
        Validar que el empleado esté disponible en la fecha y hora seleccionadas
        """
        if not value:
            if self.instance and self.instance.estado == 'pendiente':
                raise serializers.ValidationError("Debe seleccionar un empleado para la visita.")
            return value
    
        # Obtener fecha y hora del contexto
        fecha = self.initial_data.get('fecha') or (self.instance.fecha if self.instance else None)
        hora = self.initial_data.get('hora') or (self.instance.hora if self.instance else None)
    
        if not fecha or not hora:
            return value
    
        # Convertir fecha a objeto date si es string
        if isinstance(fecha, str):
            try:
                fecha = datetime.datetime.strptime(fecha, '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError("Formato de fecha inválido.")
    
        # Convertir hora a objeto time si es string
        if isinstance(hora, str):
            try:
                hora = datetime.datetime.strptime(hora, '%H:%M').time()
            except ValueError:
                raise serializers.ValidationError("Formato de hora inválido.")
    
        # 🔧 IMPORTANTE: Excluir la visita actual para que no se bloquee a sí misma
        exclude_id = self.instance.id if self.instance else None
    
        disponible, visita_conflicto, conflictos = Visita.empleado_esta_disponible(
            value.id, fecha, hora, exclude_visita_id=exclude_id
        )
    
        if not disponible and conflictos:
            mensajes_conflicto = []
            for conf in conflictos:
                mensajes_conflicto.append(
                    f"• {conf['horario_conflicto']} (diferencia de {conf['diferencia_minutos']} min)"
                )
        
            raise serializers.ValidationError(
                f"El empleado no está disponible en este horario. "
                f"Conflictos con visita(s) programada(s) a las: {' | '.join(mensajes_conflicto)}"
            )
    
        return value

    def validate(self, data):
        """
        Validación a nivel de objeto para la tarea
        """
        # Validar que la hora de fin sea posterior a la hora de inicio
        hora_inicio = data.get('hora_inicio')
        hora_fin = data.get('hora_fin')
        
        if hora_fin and hora_inicio and hora_fin <= hora_inicio:
            raise serializers.ValidationError({
                'hora_fin': 'La hora de fin debe ser posterior a la hora de inicio.'
            })
        
        # Validar que no se pueda modificar una tarea finalizada
        if self.instance and self.instance.finalizada:
            raise serializers.ValidationError(
                "No se puede modificar una tarea que ya ha sido finalizada."
            )
        
        return data

    # 🔧 MÉTODO CLAVE: Forzar que la fecha se serialice como string simple
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if instance.fecha:
            representation['fecha'] = instance.fecha.strftime('%Y-%m-%d')
        return representation

    def to_internal_value(self, data):
        data_copy = data.copy() if hasattr(data, 'copy') else dict(data)
    
        fecha_str = data_copy.get('fecha')
        if fecha_str and isinstance(fecha_str, str):
            try:
                year, month, day = map(int, fecha_str.split('-'))
                data_copy['fecha'] = datetime.date(year, month, day)
            except (ValueError, AttributeError):
                pass
    
        return super().to_internal_value(data_copy)

    class Meta:
        model = Tarea
        fields = [
            'id',
            'nombre',
            'descripcion',
            'fecha',
            'hora_inicio',
            'hora_fin',
            'prioridad',
            'empleados',
            'empleados_detalle',
            'creado_en',
            'actualizado_en',
            'finalizada',
            'fecha_finalizacion',
        ]
        read_only_fields = [
            'id', 
            'creado_en', 
            'actualizado_en', 
            'fecha_finalizacion',
            'empleados_detalle'
        ]
        
    def create(self, validated_data):
        """
        Sobrescribir create para manejar la relación muchos-a-muchos
        """
        empleados_data = validated_data.pop('empleados')
        tarea = Tarea.objects.create(**validated_data)
        tarea.empleados.set(empleados_data)
        return tarea

    def update(self, instance, validated_data):
        """
        Sobrescribir update para manejar la relación muchos-a-muchos
        """
        empleados_data = validated_data.pop('empleados', None)
        
        # Actualizar campos regulares
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Actualizar relación muchos-a-muchos si se proporciona
        if empleados_data is not None:
            instance.empleados.set(empleados_data)
        
        return instance
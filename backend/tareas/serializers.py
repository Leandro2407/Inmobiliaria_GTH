from rest_framework import serializers
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

    def validate_empleados(self, value):
        """
        Validación personalizada para el campo empleados
        """
        if not value:
            raise serializers.ValidationError("Debe asignar al menos un empleado a la tarea.")
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
            # Campos de control de finalización
            'finalizada',
            'fecha_finalizacion',
        ]
        read_only_fields = [
            'id', 
            'creado_en', 
            'actualizado_en', 
            'fecha_finalizacion',  # Se establece automáticamente al finalizar
            'empleados_detalle'    # Campo computado de solo lectura
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
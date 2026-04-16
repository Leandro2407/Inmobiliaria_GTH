from rest_framework import serializers
from .models import Contrato
from clientes.serializers import ClienteSerializer
from propiedades.serializers import PropiedadSerializer

class BaseContratoSerializer(serializers.ModelSerializer):
    cliente_info = ClienteSerializer(source='cliente', read_only=True)
    propiedad_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Contrato
        fields = [
            'id', 'cliente', 'propiedad', 'tipo', 'monto', 
            'porcentaje_comision', 'comision', 'estado', 'descripcion',
            'created_at', 'updated_at', 'cliente_info', 'propiedad_info'
        ]
    
    def get_propiedad_info(self, obj):
        if obj.propiedad:
            return PropiedadSerializer(obj.propiedad).data
        return None
    
    def validate(self, data):
        propiedad = data.get('propiedad')
        
        if not self.instance and propiedad and propiedad.estado != 'disponible':
            raise serializers.ValidationError(
                {'propiedad': 'Esta propiedad no está disponible para nuevos contratos.'}
            )
        
        if data.get('monto', 0) <= 0:
            raise serializers.ValidationError({'monto': 'El monto debe ser mayor a 0.'})
        
        return data


class ContratoAlquilerSerializer(BaseContratoSerializer):
    fecha_inicio = serializers.DateField(required=True)
    fecha_fin = serializers.DateField(required=False, allow_null=True)
    
    class Meta(BaseContratoSerializer.Meta):
        fields = BaseContratoSerializer.Meta.fields + ['fecha_inicio', 'fecha_fin']
    
    def validate(self, data):
        data = super().validate(data)
        
        fecha_inicio = data.get('fecha_inicio')
        fecha_fin = data.get('fecha_fin')
        
        if not fecha_inicio:
            raise serializers.ValidationError(
                {'fecha_inicio': 'La fecha de inicio es obligatoria para contratos de alquiler.'}
            )
        
        if fecha_fin and fecha_fin <= fecha_inicio:
            raise serializers.ValidationError(
                {'fecha_fin': 'La fecha de fin debe ser posterior a la fecha de inicio.'}
            )
        
        propiedad = data.get('propiedad')
        monto = data.get('monto')
        
        if propiedad and propiedad.precio_alquiler and monto != propiedad.precio_alquiler:
            raise serializers.ValidationError(
                {'monto': f'El monto debe coincidir con el precio de alquiler de la propiedad ({propiedad.precio_alquiler}).'}
            )
        
        return data


class ContratoVentaSerializer(BaseContratoSerializer):
    class Meta(BaseContratoSerializer.Meta):
        fields = BaseContratoSerializer.Meta.fields
    
    def validate(self, data):
        data = super().validate(data)
        
        propiedad = data.get('propiedad')
        monto = data.get('monto')
        
        if propiedad and propiedad.precio_venta and monto != propiedad.precio_venta:
            raise serializers.ValidationError(
                {'monto': f'El monto debe coincidir con el precio de venta de la propiedad ({propiedad.precio_venta}).'}
            )
        
        return data


class ContratoSerializer(serializers.ModelSerializer):
    cliente_info = ClienteSerializer(source='cliente', read_only=True)
    propiedad_info = serializers.SerializerMethodField()
    
    class Meta:
        model = Contrato
        fields = [
            'id', 'cliente', 'propiedad', 'tipo', 'fecha_inicio', 
            'fecha_fin', 'monto', 'porcentaje_comision', 'comision', 
            'estado', 'descripcion', 'created_at', 'updated_at', 
            'cliente_info', 'propiedad_info'
        ]
    
    def get_propiedad_info(self, obj):
        if obj.propiedad:
            return PropiedadSerializer(obj.propiedad).data
        return None
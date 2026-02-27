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

    def validate_propiedad(self, value):
        """
        Validar que la propiedad esté disponible al crear un contrato.
        No aplicar validación al actualizar un contrato existente.
        """
        # Si estamos actualizando (self.instance existe), permitir cualquier estado
        if self.instance:
            return value

        # Si estamos creando (self.instance es None), validar que esté disponible
        if value.estado != 'disponible':
            raise serializers.ValidationError(
                f"La propiedad no está disponible. Estado actual: {value.get_estado_display()}. "
                "Solo se pueden crear contratos para propiedades con estado 'disponible'."
            )

        return value

    def validate_estado(self, value):
        """
        Validar transiciones de estado válidas.
        """
        # Si estamos creando, permitir el estado pasado
        if not self.instance:
            return value

        # Si estamos actualizando, validar transiciones
        estado_actual = self.instance.estado

        # Estados válidos según el estado actual
        transiciones_validas = {
            'activo': ['finalizado', 'cancelado'],
            'pendiente': ['activo', 'cancelado'],
            'finalizado': [],  # No se puede cambiar de finalizado
            'cancelado': [],   # No se puede cambiar de cancelado
        }

        estados_permitidos = transiciones_validas.get(estado_actual, [])

        if value not in estados_permitidos:
            raise serializers.ValidationError(
                f"No se puede cambiar de estado '{estado_actual}' a '{value}'. "
                f"Estados permitidos desde '{estado_actual}': {estados_permitidos}"
            )

        return value
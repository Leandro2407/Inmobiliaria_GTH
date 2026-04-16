from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Contrato
from .serializers import (
    ContratoSerializer, 
    ContratoAlquilerSerializer, 
    ContratoVentaSerializer,
    BaseContratoSerializer
)
from propiedades.models import Propiedad


class ContratoViewSet(viewsets.ModelViewSet):
    queryset = Contrato.objects.all().select_related('cliente', 'propiedad')
    
    def get_serializer_class(self):
        if self.action in ['list', 'retrieve']:
            return ContratoSerializer
        
        if self.action in ['create', 'update', 'partial_update']:
            propiedad_id = self.request.data.get('propiedad')
            
            if self.action != 'create' and self.kwargs.get('pk'):
                try:
                    contrato = self.get_object()
                    if contrato.propiedad:
                        if contrato.propiedad.operacion == 'alquiler':
                            return ContratoAlquilerSerializer
                        else:
                            return ContratoVentaSerializer
                except Exception:
                    pass
            
            if propiedad_id:
                try:
                    propiedad = Propiedad.objects.get(pk=propiedad_id)
                    if propiedad.operacion == 'alquiler':
                        return ContratoAlquilerSerializer
                    else:
                        return ContratoVentaSerializer
                except Propiedad.DoesNotExist:
                    pass
        
        return BaseContratoSerializer
    
    def get_queryset(self):
        queryset = Contrato.objects.all().select_related('cliente', 'propiedad')
        cliente_id = self.request.query_params.get('cliente_id')
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)
        return queryset
    
    def create(self, request, *args, **kwargs):
        print("📥 Recibiendo POST para crear contrato:", request.data)
        
        serializer_class = self.get_serializer_class()
        serializer = serializer_class(data=request.data)
        
        if serializer.is_valid():
            propiedad = serializer.validated_data.get('propiedad')
            
            if propiedad.estado != 'disponible':
                return Response(
                    {'propiedad': ['Esta propiedad ya no está disponible para nuevos contratos.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            contrato = serializer.save()
            
            if contrato.tipo == 'alquiler':
                propiedad.estado = 'alquilada'
            elif contrato.tipo == 'venta':
                propiedad.estado = 'vendida'
            propiedad.save()
            
            print("✅ Contrato creado exitosamente")
            response_serializer = ContratoSerializer(contrato)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            
        print("❌ Error de validación:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        estado_anterior = instance.estado
        
        serializer_class = self.get_serializer_class()
        serializer = serializer_class(instance, data=request.data, partial=partial)
        
        if serializer.is_valid():
            contrato = serializer.save()
            
            if estado_anterior not in ['cancelado', 'finalizado'] and contrato.estado in ['cancelado', 'finalizado']:
                propiedad = contrato.propiedad
                propiedad.estado = 'disponible'
                propiedad.save()
            
            response_serializer = ContratoSerializer(contrato)
            return Response(response_serializer.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def cliente(self, request, cliente_id=None):
        if cliente_id:
            contratos = Contrato.objects.filter(cliente_id=cliente_id)
            serializer = ContratoSerializer(contratos, many=True)
            return Response(serializer.data)
        return Response({"error": "Falta cliente_id"}, status=status.HTTP_400_BAD_REQUEST)
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Contrato
from .serializers import ContratoSerializer

class ContratoViewSet(viewsets.ModelViewSet):
    queryset = Contrato.objects.all().select_related('cliente', 'propiedad')
    serializer_class = ContratoSerializer
    
    def get_queryset(self):
        queryset = Contrato.objects.all().select_related('cliente', 'propiedad')
        cliente_id = self.request.query_params.get('cliente_id')
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)
        return queryset
    
    def create(self, request, *args, **kwargs):
        print("📥 Recibiendo POST para crear contrato:", request.data)
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            propiedad = serializer.validated_data['propiedad']
            
            # ✅ 1. Validar que la propiedad esté disponible
            if propiedad.estado != 'disponible':
                return Response(
                    {'propiedad': ['Esta propiedad ya no está disponible para nuevos contratos.']},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # ✅ 2. Guardar el contrato
            contrato = serializer.save()
            
            # ✅ 3. Cambiar automáticamente el estado de la propiedad
            if contrato.tipo == 'alquiler':
                propiedad.estado = 'alquilada'
            elif contrato.tipo == 'venta':
                propiedad.estado = 'vendida'
            propiedad.save()
            
            print("✅ Contrato creado exitosamente y propiedad actualizada")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        print("❌ Error de validación:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Guardar el estado anterior para saber si se está cancelando
        estado_anterior = instance.estado
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            contrato = serializer.save()
            
            # ✅ EXTRA: Si el contrato se CANCELA o FINALIZA, la propiedad vuelve a estar disponible
            if estado_anterior not in ['cancelado', 'finalizado'] and contrato.estado in ['cancelado', 'finalizado']:
                propiedad = contrato.propiedad
                propiedad.estado = 'disponible'
                propiedad.save()
                
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def cliente(self, request, cliente_id=None):
        if cliente_id:
            contratos = Contrato.objects.filter(cliente_id=cliente_id)
            serializer = self.get_serializer(contratos, many=True)
            return Response(serializer.data)
        return Response({"error": "Falta cliente_id"}, status=status.HTTP_400_BAD_REQUEST)
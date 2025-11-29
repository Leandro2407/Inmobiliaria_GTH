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
            serializer.save()
            print("✅ Contrato creado exitosamente")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        print("❌ Error de validación:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def cliente(self, request, cliente_id=None):
        if cliente_id:
            contratos = Contrato.objects.filter(cliente_id=cliente_id)
            serializer = self.get_serializer(contratos, many=True)
            return Response(serializer.data)
        return Response([])
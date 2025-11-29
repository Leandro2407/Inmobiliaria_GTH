from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import models
from .models import Cliente
from .serializers import ClienteSerializer, ClienteListSerializer, ClienteCreateUpdateSerializer
from usuarios.permissions import IsAgenteOrAdmin

class ClienteViewSet(viewsets.ModelViewSet):
    """ViewSet para CRUD de clientes"""
    
    queryset = Cliente.objects.all()
    permission_classes = [IsAuthenticated, IsAgenteOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categoria', 'estado', 'ciudad', 'agente_asignado']
    search_fields = ['nombre', 'apellido', 'dni', 'email', 'telefono']
    ordering_fields = ['fecha_registro', 'nombre', 'apellido']
    ordering = ['-fecha_registro']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ClienteListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ClienteCreateUpdateSerializer
        return ClienteSerializer
    
    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de clientes"""
        total = Cliente.objects.count()
        activos = Cliente.objects.filter(estado='activo').count()
        prospectos = Cliente.objects.filter(estado='prospecto').count()
        por_categoria = Cliente.objects.values('categoria').annotate(
            total=models.Count('id')
        )
        
        return Response({
            'total': total,
            'activos': activos,
            'prospectos': prospectos,
            'por_categoria': list(por_categoria)
        })
    
    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        """Cambiar estado de un cliente"""
        cliente = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado not in dict(Cliente.ESTADO_CHOICES):
            return Response(
                {'error': 'Estado inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cliente.estado = nuevo_estado
        cliente.save()
        
        return Response({
            'message': 'Estado actualizado correctamente',
            'estado': nuevo_estado
        })

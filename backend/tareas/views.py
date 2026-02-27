from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Tarea
from .serializers import TareaSerializer

class TareaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar todas las operaciones CRUD de tareas
    Incluye endpoint personalizado para finalizar tareas
    """
    
    # Configuración base del ViewSet
    queryset = Tarea.objects.all()
    serializer_class = TareaSerializer
    
    # ✅ CAMBIO 1: Exigir que el usuario esté autenticado para ver la ruta
    permission_classes = [permissions.IsAuthenticated]
    
    # Desactivar paginación para obtener todas las tareas
    pagination_class = None
    
    def get_queryset(self):
        """
        ✅ CAMBIO 2: Filtrar tareas según el usuario autenticado.
        Los administradores ven todo, los agentes solo sus propias tareas.
        """
        user = self.request.user
        queryset = Tarea.objects.all().order_by('-fecha', '-hora_inicio')
        
        # Si el usuario es administrador o parte del staff, le mostramos TODAS las tareas
        if user.is_staff or getattr(user, 'rol', '') == 'administrador':
            return queryset
            
        # Si es un agente normal, filtramos para mostrar SOLO las tareas donde él está asignado
        return queryset.filter(empleados=user)

    def perform_create(self, serializer):
        """
        Hook personalizado para la creación de tareas
        """
        serializer.save()

    def perform_update(self, serializer):
        """
        Hook personalizado para la actualización de tareas
        Incluye validación para prevenir modificación de tareas finalizadas
        """
        instance = self.get_object()
        
        # Validar que no se esté intentando modificar una tarea finalizada
        if instance.finalizada:
            raise serializers.ValidationError(
                "No se puede modificar una tarea que ya ha sido finalizada."
            )
        
        serializer.save()

    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """
        Endpoint personalizado para finalizar una tarea
        Marca la tarea como completada y establece la fecha de finalización
        """
        try:
            # ✅ Usamos get_queryset() en lugar de Tarea.objects para que respete
            # la regla de que un agente solo pueda finalizar SUS propias tareas
            tarea = self.get_queryset().get(id=pk)
            
            # Validar que la tarea no esté ya finalizada
            if tarea.finalizada:
                return Response(
                    {'error': 'La tarea ya está finalizada'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Actualizar campos de finalización
            tarea.finalizada = True
            tarea.fecha_finalizacion = timezone.now()
            tarea.save()
            
            # Serializar y retornar la tarea actualizada
            serializer = TareaSerializer(tarea)
            return Response(
                {
                    'message': 'Tarea finalizada exitosamente',
                    'tarea': serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except Tarea.DoesNotExist:
            return Response(
                {'error': 'Tarea no encontrada o no tienes permiso para verla'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Error interno del servidor: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        """
        Sobrescribir eliminación para prevenir borrado de tareas finalizadas
        """
        instance = self.get_object()
        
        if instance.finalizada:
            return Response(
                {'error': 'No se puede eliminar una tarea finalizada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)
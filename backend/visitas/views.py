from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q
from datetime import datetime
from .models import Visita, SolicitudVisita
from .serializers import (
    VisitaSerializer, VisitaCreateSerializer, VisitaListSerializer,
    SolicitudVisitaSerializer, SolicitudVisitaCreateSerializer, SolicitudVisitaListSerializer
)
from clientes.models import Cliente
from usuarios.permissions import IsAgenteOrAdmin

class VisitaViewSet(viewsets.ModelViewSet):
    """ViewSet completo para operaciones CRUD de visitas con gestión automática de estados"""
    
    queryset = Visita.objects.all()
    permission_classes = [IsAuthenticated, IsAgenteOrAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['cliente', 'estado', 'resultado', 'fecha', 'empleado']
    search_fields = ['cliente__nombre', 'cliente__apellido', 'cliente__dni', 'descripcion', 'empleado__first_name', 'empleado__last_name']
    ordering_fields = ['fecha', 'hora', 'fecha_creacion']
    ordering = ['-fecha', '-hora']
    
    def get_queryset(self):
        """Forzar actualización de estados automática en cada consulta"""
        queryset = super().get_queryset()
        self._actualizar_estados_automaticos()
        return queryset
    
    def _actualizar_estados_automaticos(self):
        """
        Actualizar automáticamente estados de visitas pendientes que hayan llegado a su hora
        """
        try:
            ahora = timezone.now()
            visitas_pendientes = Visita.objects.filter(estado='pendiente')
            
            actualizadas = 0
            for visita in visitas_pendientes:
                try:
                    fecha_hora_naive = datetime.combine(visita.fecha, visita.hora)
                    fecha_hora_visita = timezone.make_aware(fecha_hora_naive, timezone.get_current_timezone())
                    
                    if ahora >= fecha_hora_visita:
                        visita.estado = 'en_curso'
                        visita.save(update_fields=['estado', 'fecha_actualizacion'])
                        actualizadas += 1
                        
                except Exception as e:
                    continue
            
        except Exception as e:
            pass
    
    def list(self, request, *args, **kwargs):
        """Sobrescribir list para garantizar estados actualizados"""
        self._actualizar_estados_automaticos()
        return super().list(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        """Sobrescribir retrieve para garantizar estados actualizados"""
        self._actualizar_estados_automaticos()
        return super().retrieve(request, *args, **kwargs)
    
    def get_serializer_class(self):
        """Seleccionar serializer según la acción"""
        if self.action == 'list':
            return VisitaListSerializer
        elif self.action == 'create':
            return VisitaCreateSerializer
        return VisitaSerializer
    
    def perform_create(self, serializer):
        """Asignar automáticamente el usuario creador y validar tiempo de espera"""
        from django.utils import timezone
        from datetime import datetime, timedelta
        
        cliente_id = serializer.validated_data.get('cliente').id
        fecha_visita = serializer.validated_data.get('fecha')
        hora_visita = serializer.validated_data.get('hora')
        
        # Verificar si el cliente puede agendar
        puede_agendar, minutos_restantes, ultima_visita = Visita.cliente_puede_agendar(cliente_id)
        
        if not puede_agendar and ultima_visita:
            # Calcular la fecha/hora de la nueva visita
            fecha_hora_nueva_visita = timezone.make_aware(
                datetime.combine(fecha_visita, hora_visita),
                timezone.get_current_timezone()
            )
            
            # Calcular cuándo termina el bloqueo
            tiempo_bloqueo = timedelta(hours=Visita.TIEMPO_MINIMO_ENTRE_VISITAS)
            fin_bloqueo = ultima_visita.fecha_creacion + tiempo_bloqueo
            
            # Si la nueva visita está programada DESPUÉS del fin del bloqueo, permitir
            if fecha_hora_nueva_visita >= fin_bloqueo:
                serializer.save(creado_por=self.request.user)
                return
            
            from rest_framework.exceptions import ValidationError
            minutos_hasta_fin_bloqueo = int((fin_bloqueo - timezone.now()).total_seconds() / 60)
            
            raise ValidationError({
                'cliente': f'No puedes agendar una visita dentro de las próximas {minutos_hasta_fin_bloqueo} minutos. Agenda para después de {fin_bloqueo.strftime("%d/%m/%Y %H:%M")} o espera {minutos_hasta_fin_bloqueo} minutos.',
                'minutos_restantes': minutos_hasta_fin_bloqueo,
                'tiempo_bloqueo_horas': Visita.TIEMPO_MINIMO_ENTRE_VISITAS,
                'fin_bloqueo': fin_bloqueo.isoformat(),
                'fecha_hora_nueva_visita': fecha_hora_nueva_visita.isoformat()
            })
        
        serializer.save(creado_por=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Sobrescribir create para actualizar estados después de crear"""
        response = super().create(request, *args, **kwargs)
        self._actualizar_estados_automaticos()
        return response
    
    def update(self, request, *args, **kwargs):
        """
        Actualizar visita con validación de tiempo de edición
        Permite actualización parcial (solo los campos que se envían)
        """
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        
        # Solo validar tiempo de edición para visitas pendientes
        # Y solo si se están modificando campos que afectan el horario
        if instance.estado == 'pendiente':
            # Verificar si se están modificando fecha u hora
            data = request.data
            modifica_horario = 'fecha' in data or 'hora' in data
            
            if modifica_horario and not instance.puede_ser_editada:
                return Response(
                    {'error': 'No se puede modificar la fecha/hora de una visita cuando faltan menos de 2 horas para su inicio.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        except Exception as e:
            raise
    
    def partial_update(self, request, *args, **kwargs):
        """Alias para actualización parcial"""
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    @action(detail=True, methods=['post'])
    def cambiar_estado(self, request, pk=None):
        """Endpoint para cambiar estado de una visita manualmente"""
        visita = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado not in dict(Visita.ESTADO_CHOICES):
            return Response(
                {'error': 'Estado inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if nuevo_estado == 'cancelada' and not visita.puede_ser_cancelada:
            return Response(
                {'error': 'No se puede cancelar una visita ya finalizada'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if nuevo_estado == 'finalizada' and not visita.puede_ser_finalizada:
            return Response(
                {'error': 'Solo se puede finalizar una visita que está en curso'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        visita.estado = nuevo_estado
        visita.save()
        
        self._actualizar_estados_automaticos()
        
        visita.refresh_from_db()
        serializer = self.get_serializer(visita)
        
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def proximas_visitas(self, request):
        """Obtener visitas próximas (hoy y futuras) para dashboard"""
        self._actualizar_estados_automaticos()
        
        hoy = timezone.now().date()
        visitas = Visita.objects.filter(
            Q(fecha__gt=hoy) | 
            Q(fecha=hoy, estado__in=['pendiente', 'en_curso'])
        ).order_by('fecha', 'hora')[:10]
        
        serializer = self.get_serializer(visitas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def por_cliente(self, request):
        """Obtener visitas por cliente específico"""
        self._actualizar_estados_automaticos()
        
        cliente_id = request.query_params.get('cliente_id')
        if not cliente_id:
            return Response(
                {'error': 'Se requiere el parámetro cliente_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        visitas = Visita.objects.filter(cliente_id=cliente_id).order_by('-fecha', '-hora')
        
        serializer = self.get_serializer(visitas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def clientes_bloqueados(self, request):
        """
        Obtener información de clientes que están bloqueados por el tiempo de espera
        """
        clientes_bloqueados_info = Visita.obtener_clientes_bloqueados_info()
        
        return Response({
            'clientes_bloqueados': clientes_bloqueados_info,
            'tiempo_bloqueo_horas': Visita.TIEMPO_MINIMO_ENTRE_VISITAS,
            'total_bloqueados': len(clientes_bloqueados_info)
        })
    
    @action(detail=False, methods=['post'])
    def verificar_cliente(self, request):
        """
        Verificar si un cliente específico puede agendar una nueva visita
        """
        from django.utils import timezone
        
        cliente_id = request.data.get('cliente_id')
        
        if not cliente_id:
            return Response(
                {'error': 'Se requiere el parámetro cliente_id'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        puede_agendar, minutos_restantes, ultima_visita = Visita.cliente_puede_agendar(cliente_id)
        fin_bloqueo = Visita.obtener_fin_bloqueo_cliente(cliente_id)
        
        response_data = {
            'puede_agendar': puede_agendar,
            'minutos_restantes': minutos_restantes,
            'tiempo_bloqueo_horas': Visita.TIEMPO_MINIMO_ENTRE_VISITAS,
            'tiene_bloqueo_activo': fin_bloqueo is not None,
            'fin_bloqueo': fin_bloqueo.isoformat() if fin_bloqueo else None
        }
        
        if ultima_visita:
            response_data['ultima_visita'] = {
                'id': ultima_visita.id,
                'fecha': str(ultima_visita.fecha),
                'hora': str(ultima_visita.hora),
                'fecha_creacion': ultima_visita.fecha_creacion.isoformat()
            }
        
        return Response(response_data)
    
    @action(detail=False, methods=['post'])
    def actualizar_estados_automaticos(self, request):
        """Endpoint manual para forzar actualización de estados"""
        self._actualizar_estados_automaticos()
        return Response({
            'message': 'Estados actualizados automáticamente'
        })


class SolicitudVisitaViewSet(viewsets.ModelViewSet):
    """ViewSet para operaciones CRUD de solicitudes de visita"""

    queryset = SolicitudVisita.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['cliente', 'propiedad', 'estado', 'procesado_por']
    search_fields = ['cliente__nombre', 'cliente__apellido', 'cliente__dni', 'propiedad__titulo', 'mensaje']
    ordering_fields = ['fecha_creacion', 'fecha_procesamiento']
    ordering = ['-fecha_creacion']

    def _get_cliente_asociado(self, user):
        """Obtener el cliente asociado al usuario cliente"""
        cliente = Cliente.objects.filter(email=user.email).first()
        if not cliente:
            raise ValidationError({'cliente': 'No se encontró un cliente asociado a este usuario.'})
        return cliente

    def get_queryset(self):
        """Filtrar queryset según el rol del usuario"""
        queryset = super().get_queryset()
        user = self.request.user

        # Si es cliente, solo ver sus propias solicitudes
        if user.rol == 'cliente':
            queryset = queryset.filter(cliente__email=user.email)
        # Si es agente o admin, ver todas las solicitudes

        return queryset

    def get_serializer_class(self):
        """Seleccionar serializer según la acción"""
        if self.action == 'list':
            return SolicitudVisitaListSerializer
        elif self.action == 'create':
            return SolicitudVisitaCreateSerializer
        return SolicitudVisitaSerializer

    def perform_create(self, serializer):
        """Asignar automáticamente el cliente basado en el usuario autenticado"""
        user = self.request.user

        # Si el usuario es cliente, asignar automáticamente su cliente
        if user.rol == 'cliente':
            cliente = self._get_cliente_asociado(user)
            
            # Validar que el cliente no tenga solicitudes recientes (rate limiting)
            # Buscar la última solicitud del cliente
            from django.utils import timezone
            from datetime import timedelta
            
            ahora = timezone.now()
            tiempo_bloqueo = timedelta(hours=2)  # 2 horas como en Visita
            
            ultima_solicitud = SolicitudVisita.objects.filter(
                cliente_id=cliente.id
            ).order_by('-fecha_creacion').first()
            
            if ultima_solicitud:
                tiempo_transcurrido = ahora - ultima_solicitud.fecha_creacion
                
                if tiempo_transcurrido < tiempo_bloqueo:
                    tiempo_restante = tiempo_bloqueo - tiempo_transcurrido
                    minutos_restantes = int(tiempo_restante.total_seconds() / 60)
                    
                    from rest_framework.exceptions import ValidationError as DRFValidationError
                    raise DRFValidationError({
                        'error': f'No puede solicitar una nueva visita. Debe esperar {minutos_restantes} minutos desde su última solicitud.'
                    })
            
            serializer.save(cliente=cliente)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def aprobar(self, request, pk=None):
        """Aprobar una solicitud de visita y crear la visita correspondiente"""
        solicitud = self.get_object()
        user = self.request.user

        # Solo agentes y administradores pueden aprobar
        if user.rol not in ['agente', 'administrador']:
            return Response(
                {'error': 'No tienes permisos para aprobar solicitudes'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not solicitud.puede_ser_aprobada:
            return Response(
                {'error': 'Esta solicitud no puede ser aprobada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Obtener fecha y hora del request
        fecha = request.data.get('fecha')
        hora = request.data.get('hora')

        if not fecha or not hora:
            return Response(
                {'error': 'Se requieren fecha y hora para aprobar la solicitud'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Convertir strings a objetos de fecha/hora
            fecha_obj = datetime.strptime(fecha, '%Y-%m-%d').date()
            hora_obj = datetime.strptime(hora, '%H:%M').time()

            # Aprobar la solicitud
            visita = solicitud.aprobar(user, fecha_obj, hora_obj)

            serializer = SolicitudVisitaSerializer(solicitud)
            return Response({
                'solicitud': serializer.data,
                'visita_creada': VisitaSerializer(visita).data
            })

        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'Error al aprobar la solicitud'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def rechazar(self, request, pk=None):
        """Rechazar una solicitud de visita"""
        solicitud = self.get_object()
        user = self.request.user

        # Solo agentes y administradores pueden rechazar
        if user.rol not in ['agente', 'administrador']:
            return Response(
                {'error': 'No tienes permisos para rechazar solicitudes'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not solicitud.puede_ser_rechazada:
            return Response(
                {'error': 'Esta solicitud no puede ser rechazada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        motivo = request.data.get('motivo', '')

        try:
            solicitud.rechazar(user, motivo)
            serializer = self.get_serializer(solicitud)
            return Response(serializer.data)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """Cancelar una solicitud de visita (por el cliente)"""
        solicitud = self.get_object()
        user = self.request.user

        # Solo el cliente que creó la solicitud puede cancelarla
        if user.rol == 'cliente' and solicitud.cliente.email != user.email:
            return Response(
                {'error': 'No puedes cancelar esta solicitud'},
                status=status.HTTP_403_FORBIDDEN
            )

        if not solicitud.puede_ser_cancelada:
            return Response(
                {'error': 'Esta solicitud no puede ser cancelada'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            solicitud.cancelar(request.data.get('motivo', ''))
            serializer = self.get_serializer(solicitud)
            return Response(serializer.data)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'])
    def pendientes(self, request):
        """Obtener solicitudes pendientes para agentes/administradores"""
        user = self.request.user

        if user.rol not in ['agente', 'administrador']:
            return Response(
                {'error': 'No tienes permisos para ver solicitudes pendientes'},
                status=status.HTTP_403_FORBIDDEN
            )

        solicitudes = SolicitudVisita.objects.filter(estado='pendiente').order_by('fecha_creacion')
        serializer = self.get_serializer(solicitudes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def mis_solicitudes(self, request):
        """Obtener solicitudes del cliente autenticado"""
        user = self.request.user

        if user.rol != 'cliente':
            return Response(
                {'error': 'Este endpoint es solo para clientes'},
                status=status.HTTP_403_FORBIDDEN
            )

        solicitudes = SolicitudVisita.objects.filter(cliente__email=user.email).order_by('-fecha_creacion')
        serializer = self.get_serializer(solicitudes, many=True)
        return Response(serializer.data)
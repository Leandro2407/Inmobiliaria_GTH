from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from django.db.models import Q
from .models import Propiedad, ImagenPropiedad, VideoPropiedad
from .serializers import (
    PropiedadSerializer, PropiedadListSerializer,
    PropiedadCreateUpdateSerializer, PropiedadDestacadaSerializer,
    ImagenPropiedadSerializer, VideoPropiedadSerializer
)
from usuarios.permissions import IsAgenteOrAdmin

class PropiedadViewSet(viewsets.ModelViewSet):
    """ViewSet para CRUD de propiedades"""
    
    # prefetch images to avoid N+1 queries al serializar
    queryset = Propiedad.objects.all().prefetch_related('imagenes')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['tipo', 'operacion', 'estado', 'zona', 'barrio', 'destacada']
    search_fields = ['titulo', 'descripcion', 'direccion', 'barrio']
    ordering_fields = ['fecha_publicacion', 'precio_venta', 'precio_alquiler', 'vistas']
    ordering = ['-fecha_publicacion']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'destacadas', 'publicas']:
            return [AllowAny()]
        return [IsAuthenticated(), IsAgenteOrAdmin()]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PropiedadListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PropiedadCreateUpdateSerializer
        elif self.action == 'destacadas':
            return PropiedadDestacadaSerializer
        return PropiedadSerializer
    
    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    def create(self, request, *args, **kwargs):
        """Override para loggear errores de validación y facilitar debugging"""
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            import logging
            logger = logging.getLogger(__name__)
            logger.warning("PropiedadCreate - datos inválidos: %s -- payload: %s", serializer.errors, request.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return super().create(request, *args, **kwargs)
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Incrementar contador de vistas
        instance.vistas += 1
        instance.save(update_fields=['vistas'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def destacadas(self, request):
        """Obtener propiedades destacadas para la página principal"""
        propiedades = self.queryset.filter(destacada=True, estado='disponible')[:6]
        serializer = PropiedadDestacadaSerializer(
            propiedades, 
            many=True, 
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def publicas(self, request):
        """Obtener propiedades disponibles para el público"""
        propiedades = self.queryset.filter(estado='disponible')
        
        # Aplicar filtros
        tipo = request.query_params.get('tipo')
        operacion = request.query_params.get('operacion')
        zona = request.query_params.get('zona')
        barrio = request.query_params.get('barrio')
        search = request.query_params.get('search')
        
        if tipo:
            propiedades = propiedades.filter(tipo=tipo)
        if operacion:
            propiedades = propiedades.filter(operacion=operacion)
        if zona:
            propiedades = propiedades.filter(zona=zona)
        if barrio:
            propiedades = propiedades.filter(barrio=barrio)
        if search:
            propiedades = propiedades.filter(
                Q(titulo__icontains=search) |
                Q(descripcion__icontains=search) |
                Q(direccion__icontains=search) |
                Q(barrio__icontains=search)
            )
        
        page = self.paginate_queryset(propiedades)
        if page is not None:
            serializer = PropiedadListSerializer(
                page, 
                many=True, 
                context={'request': request}
            )
            return self.get_paginated_response(serializer.data)
        
        serializer = PropiedadListSerializer(
            propiedades, 
            many=True, 
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de propiedades"""
        total = Propiedad.objects.count()
        disponibles = Propiedad.objects.filter(estado='disponible').count()
        vendidas = Propiedad.objects.filter(estado='vendida').count()
        alquiladas = Propiedad.objects.filter(estado='alquilada').count()
        
        por_tipo = Propiedad.objects.values('tipo').annotate(
            total=models.Count('id')
        )
        
        return Response({
            'total': total,
            'disponibles': disponibles,
            'vendidas': vendidas,
            'alquiladas': alquiladas,
            'por_tipo': list(por_tipo)
        })
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def subir_imagen(self, request, pk=None):
        """Subir imagen a una propiedad"""
        propiedad = self.get_object()
        
        imagen = request.FILES.get('imagen')
        if not imagen:
            return Response(
                {'error': 'No se proporcionó ninguna imagen'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # ✅ FIX: Los datos enviados por FormData en JS son strings de texto. 
        # Transformamos "true"/"false" a booleanos reales de Python
        es_principal_str = request.data.get('es_principal', 'false')
        if isinstance(es_principal_str, str):
            es_principal = es_principal_str.lower() in ('true', '1', 't', 'y', 'yes')
        else:
            es_principal = bool(es_principal_str)
            
        # ✅ FIX: Transformamos el orden a entero real por si viene como string
        orden_str = request.data.get('orden', 0)
        try:
            orden = int(orden_str)
        except (ValueError, TypeError):
            orden = 0
            
        imagen_obj = ImagenPropiedad.objects.create(
            propiedad=propiedad,
            imagen=imagen,
            titulo=request.data.get('titulo', ''),
            orden=orden,
            es_principal=es_principal
        )
        
        serializer = ImagenPropiedadSerializer(imagen_obj, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def subir_video(self, request, pk=None):
        """Subir video a una propiedad"""
        propiedad = self.get_object()
        
        video = request.FILES.get('video')
        url_youtube = request.data.get('url_youtube')
        
        if not video and not url_youtube:
            return Response(
                {'error': 'Debe proporcionar un video o una URL de YouTube'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        video_obj = VideoPropiedad.objects.create(
            propiedad=propiedad,
            video=video if video else None,
            url_youtube=url_youtube if url_youtube else '',
            titulo=request.data.get('titulo', ''),
            miniatura=request.FILES.get('miniatura')
        )
        
        serializer = VideoPropiedadSerializer(video_obj, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ImagenPropiedadViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de imágenes"""
    
    queryset = ImagenPropiedad.objects.all()
    serializer_class = ImagenPropiedadSerializer
    permission_classes = [IsAuthenticated, IsAgenteOrAdmin]
    parser_classes = [MultiPartParser, FormParser]


class VideoPropiedadViewSet(viewsets.ModelViewSet):
    """ViewSet para gestión de videos"""
    
    queryset = VideoPropiedad.objects.all()
    serializer_class = VideoPropiedadSerializer
    permission_classes = [IsAuthenticated, IsAgenteOrAdmin]
    parser_classes = [MultiPartParser, FormParser]

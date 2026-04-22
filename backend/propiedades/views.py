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
    
    # prefetch images and videos to avoid N+1 queries al serializar
    queryset = Propiedad.objects.all().prefetch_related('imagenes', 'videos')
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
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser], permission_classes=[IsAuthenticated])
    def subir_video(self, request, pk=None):
        """Subir video a una propiedad"""
        import logging
        logger = logging.getLogger(__name__)
        
        logger.info(f"=== INICIO SUBIR VIDEO ===")
        logger.info(f"PK: {pk}")
        logger.info(f"REQUEST METHOD: {request.method}")
        logger.info(f"REQUEST FILES: {list(request.FILES.keys())}")
        logger.info(f"REQUEST DATA: {dict(request.data)}")
        
        try:
            propiedad = self.get_object()
            logger.info(f"Propiedad obtenida: {propiedad.id} - {propiedad.titulo}")
        except Exception as e:
            logger.error(f"Error al obtener propiedad con id {pk}: {str(e)}")
            return Response(
                {'error': f'Propiedad no encontrada: {str(e)}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        video = request.FILES.get('video')
        url_youtube = request.data.get('url_youtube', '').strip()
        titulo = request.data.get('titulo', '').strip()
        miniatura = request.FILES.get('miniatura')
        
        logger.info(f"VIDEO RECIBIDO: {video is not None}")
        if video:
            logger.info(f"  - Nombre: {video.name}")
            logger.info(f"  - Tamaño: {video.size} bytes ({video.size / 1024 / 1024:.2f} MB)")
            logger.info(f"  - Content-Type: {video.content_type}")
        logger.info(f"URL YOUTUBE: {url_youtube}")
        logger.info(f"TITULO: {titulo}")
        
        # Validar que al menos uno esté presente
        if not video and not url_youtube:
            logger.warning("No se proporcionó video ni URL de YouTube")
            return Response(
                {'error': 'Debe proporcionar un video o una URL de YouTube'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validar tamaño del video si se proporciona
        if video:
            max_size = 500 * 1024 * 1024  # 500 MB
            if video.size > max_size:
                logger.warning(f"Video demasiado grande: {video.size / 1024 / 1024:.2f} MB")
                return Response(
                    {'error': f'El video es demasiado grande. Máximo 500 MB. Tamaño actual: {video.size / 1024 / 1024:.2f} MB'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        try:
            # Generar un título por defecto si no se proporciona
            if not titulo:
                if video:
                    titulo = video.name.rsplit('.', 1)[0]  # Usar nombre del archivo sin extensión
                else:
                    titulo = 'Video de YouTube'

            # ✅ FIX: Truncar el nombre del archivo si es demasiado largo.
            # Algunos videos (ej. descargados de apps) tienen nombres extremadamente largos
            # que superan el max_length del FileField y Django lanza un error de storage.
            # Se conserva la extensión y se trunca el nombre base a 50 caracteres.
            if video:
                import os
                nombre_base, extension = os.path.splitext(video.name)
                extension = extension[:10]  # Extensión máxima razonable
                if len(nombre_base) > 50:
                    nombre_base = nombre_base[:50]
                video.name = nombre_base + extension
            
            logger.info(f"Creando VideoPropiedad para propiedad {propiedad.id}")
            logger.info(f"  - Datos a guardar: video={video is not None}, url_youtube={url_youtube}, titulo={titulo}")
            
            # Crear el video directamente sin serializer para evitar validación duplicada
            video_obj = VideoPropiedad.objects.create(
                propiedad=propiedad,
                video=video if video else None,
                url_youtube=url_youtube if url_youtube else '',
                titulo=titulo,
                miniatura=miniatura if miniatura else None
            )
            logger.info(f"Video creado exitosamente con id={video_obj.id}")
            
            # Serializar para obtener URLs absolutas
            serializer = VideoPropiedadSerializer(video_obj, context={'request': request})
            logger.info(f"=== FIN SUBIR VIDEO (EXITOSO) ===")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error al crear video: {str(e)}", exc_info=True)
            logger.error(f"=== FIN SUBIR VIDEO (ERROR) ===")
            return Response(
                {'error': f'Error al subir video: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


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

from rest_framework import serializers
from .models import Propiedad, ImagenPropiedad, VideoPropiedad

class ImagenPropiedadSerializer(serializers.ModelSerializer):
    """Serializer para imágenes de propiedades"""
    imagen = serializers.SerializerMethodField()
    
    class Meta:
        model = ImagenPropiedad
        fields = ['id', 'imagen', 'titulo', 'orden', 'es_principal', 'fecha_subida']
        read_only_fields = ['fecha_subida']

    def get_imagen(self, obj):
        """Retorna la URL absoluta de la imagen"""
        if obj.imagen:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imagen.url)
            return obj.imagen.url
        return None

class VideoPropiedadSerializer(serializers.ModelSerializer):
    """Serializer para videos de propiedades"""
    
    class Meta:
        model = VideoPropiedad
        fields = ['id', 'video', 'url_youtube', 'titulo', 'miniatura', 'fecha_subida']
        read_only_fields = ['fecha_subida']


class PropiedadSerializer(serializers.ModelSerializer):
    """Serializer completo para Propiedad"""
    
    # Pasamos el contexto a los serializers anidados para que generen URLs absolutas
    imagenes = serializers.SerializerMethodField()
    videos = VideoPropiedadSerializer(many=True, read_only=True)
    agente_nombre = serializers.CharField(source='agente_cargo.get_full_name', read_only=True)
    propietario_nombre = serializers.CharField(source='propietario.nombre_completo', read_only=True)
    precio_display = serializers.CharField(read_only=True)
    esta_disponible = serializers.BooleanField(read_only=True)
    caracteristicas_list = serializers.SerializerMethodField()
    
    class Meta:
        model = Propiedad
        fields = [
            'id', 'titulo', 'descripcion', 'tipo', 'operacion', 'estado',
            'precio_venta', 'precio_alquiler', 'moneda', 'precio_display',
            'superficie_total', 'superficie_cubierta', 'dormitorios', 'banos',
            'cocheras', 'antiguedad', 'direccion', 'barrio', 'ciudad',
            'provincia', 'codigo_postal', 'zona', 'latitud', 'longitud',
            'caracteristicas', 'caracteristicas_list', 'agente_cargo', 'agente_nombre',
            'propietario', 'propietario_nombre', 'destacada', 'vistas',
            'fecha_publicacion', 'fecha_actualizacion', 'esta_disponible',
            'imagenes', 'videos'
        ]
        read_only_fields = ['fecha_publicacion', 'fecha_actualizacion', 'vistas']
    
    def get_imagenes(self, obj):
        serializer = ImagenPropiedadSerializer(obj.imagenes.all(), many=True, context=self.context)
        return serializer.data

    def get_caracteristicas_list(self, obj):
        """Convierte las características de string a lista"""
        if obj.caracteristicas:
            return [c.strip() for c in obj.caracteristicas.split('\n') if c.strip()]
        return []


class PropiedadListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listados"""
    
    imagen_principal = serializers.SerializerMethodField()
    agente_nombre = serializers.CharField(source='agente_cargo.get_full_name', read_only=True)
    precio_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = Propiedad
        fields = [
            'id', 'titulo', 'tipo', 'operacion', 'estado', 'precio_display',
            'dormitorios', 'banos', 'superficie_total', 'barrio', 'zona',
            'destacada', 'imagen_principal', 'agente_nombre', 'fecha_publicacion'
        ]
    
    def get_imagen_principal(self, obj):
        imagen = obj.imagenes.filter(es_principal=True).first()
        if not imagen:
            imagen = obj.imagenes.first()
        if imagen:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(imagen.imagen.url)
            return imagen.imagen.url
        return None


class PropiedadCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer para crear y actualizar propiedades"""
    
    caracteristicas_list = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Propiedad
        fields = [
            'titulo', 'descripcion', 'tipo', 'operacion', 'estado',
            'precio_venta', 'precio_alquiler', 'moneda',
            'superficie_total', 'superficie_cubierta', 'dormitorios', 'banos',
            'cocheras', 'antiguedad', 'direccion', 'barrio', 'ciudad',
            'provincia', 'codigo_postal', 'zona', 'latitud', 'longitud',
            'caracteristicas', 'caracteristicas_list', 'agente_cargo',
            'propietario', 'destacada'
        ]
    
    def create(self, validated_data):
        caracteristicas_list = validated_data.pop('caracteristicas_list', [])
        if caracteristicas_list:
            validated_data['caracteristicas'] = '\n'.join(caracteristicas_list)
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        caracteristicas_list = validated_data.pop('caracteristicas_list', None)
        if caracteristicas_list is not None:
            validated_data['caracteristicas'] = '\n'.join(caracteristicas_list)
        return super().update(instance, validated_data)


class PropiedadDestacadaSerializer(serializers.ModelSerializer):
    """Serializer para propiedades destacadas en el frontend"""
    
    imagen_principal = serializers.SerializerMethodField()
    imagenes = serializers.SerializerMethodField()
    
    class Meta:
        model = Propiedad
        fields = [
            'id', 'titulo', 'tipo', 'operacion', 'precio_venta', 'precio_alquiler',
            'moneda', 'dormitorios', 'banos', 'superficie_total', 'barrio',
            'descripcion', 'imagen_principal', 'imagenes'
        ]
    
    def get_imagenes(self, obj):
        # Limitamos a 3 imágenes para el frontend y pasamos contexto
        imgs = obj.imagenes.all()[:3]
        serializer = ImagenPropiedadSerializer(imgs, many=True, context=self.context)
        return serializer.data

    def get_imagen_principal(self, obj):
        imagen = obj.imagenes.filter(es_principal=True).first()
        if not imagen:
            imagen = obj.imagenes.first()
        if imagen:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(imagen.imagen.url)
            return imagen.imagen.url
        return None
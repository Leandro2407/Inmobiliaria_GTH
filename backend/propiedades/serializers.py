from rest_framework import serializers
from .models import Propiedad, ImagenPropiedad, VideoPropiedad
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

class ImagenPropiedadSerializer(serializers.ModelSerializer):
    imagen = serializers.SerializerMethodField()
    
    class Meta:
        model = ImagenPropiedad
        fields = ['id', 'imagen', 'titulo', 'orden', 'es_principal', 'fecha_subida']
        read_only_fields = ['fecha_subida']

    def get_imagen(self, obj):
        if obj.imagen:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imagen.url)
            return obj.imagen.url
        return None

class VideoPropiedadSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoPropiedad
        fields = ['id', 'video', 'url_youtube', 'titulo', 'miniatura', 'fecha_subida']
        read_only_fields = ['fecha_subida']


class PropiedadSerializer(serializers.ModelSerializer):
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
        if obj.caracteristicas:
            return [c.strip() for c in obj.caracteristicas.split('\n') if c.strip()]
        return []


class PropiedadListSerializer(serializers.ModelSerializer):
    imagen_principal = serializers.SerializerMethodField()
    agente_nombre = serializers.CharField(source='agente_cargo.get_full_name', read_only=True)
    precio_display = serializers.CharField(read_only=True)
    
    class Meta:
        model = Propiedad
        fields = [
            'id', 'titulo', 'tipo', 'operacion', 'estado', 'precio_display',
            'precio_venta', 'precio_alquiler', 'moneda',
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
    caracteristicas_list = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Propiedad
        fields = [
            'id', 'titulo', 'descripcion', 'tipo', 'operacion', 'estado',
            'precio_venta', 'precio_alquiler', 'moneda',
            'superficie_total', 'superficie_cubierta', 'dormitorios', 'banos',
            'cocheras', 'antiguedad', 'direccion', 'barrio', 'ciudad',
            'provincia', 'codigo_postal', 'zona', 'latitud', 'longitud',
            'caracteristicas', 'caracteristicas_list', 'agente_cargo',
            'propietario', 'destacada'
        ]
        read_only_fields = ['id']
    
    def create(self, validated_data):
        caracteristicas_list = validated_data.pop('caracteristicas_list', [])
        if caracteristicas_list:
            validated_data['caracteristicas'] = '\n'.join(caracteristicas_list)
        return super().create(validated_data)

    def validate(self, attrs):
        for key in ['precio_venta', 'precio_alquiler', 'latitud', 'longitud', 'superficie_total', 'superficie_cubierta']:
            if key in attrs and attrs.get(key) == '':
                attrs[key] = None

        for key in ['dormitorios', 'banos', 'cocheras', 'antiguedad']:
            if key in attrs and attrs.get(key) == '':
                attrs[key] = None

        if 'agente_cargo' in attrs and attrs.get('agente_cargo') == '':
            attrs['agente_cargo'] = None

        agente = attrs.get('agente_cargo')
        if agente is not None:
            try:
                usuario = agente if hasattr(agente, 'rol') else self.Meta.model._meta.get_field('agente_cargo').related_model.objects.get(pk=agente)
                if usuario.rol not in ['agente', 'administrador']:
                    raise serializers.ValidationError({'agente_cargo': 'El usuario asignado no es un agente ni administrador.'})
            except Exception:
                raise serializers.ValidationError({'agente_cargo': 'Agente no válido.'})

        for coord in ['latitud', 'longitud']:
            if coord in attrs and attrs.get(coord) is not None:
                val = attrs[coord]
                try:
                    dec = Decimal(str(val))
                except (InvalidOperation, ValueError):
                    raise serializers.ValidationError({coord: 'Valor de coordenada no válido.'})

                if coord == 'latitud':
                    if dec < Decimal('-90') or dec > Decimal('90'):
                        raise serializers.ValidationError({coord: 'La latitud debe estar entre -90 y 90.'})
                else:
                    if dec < Decimal('-180') or dec > Decimal('180'):
                        raise serializers.ValidationError({coord: 'La longitud debe estar entre -180 y 180.'})

                try:
                    dec = dec.quantize(Decimal('0.00000001'), rounding=ROUND_HALF_UP)
                except InvalidOperation:
                    raise serializers.ValidationError({coord: 'La coordenada tiene demasiada precisión.'})

                attrs[coord] = dec

        return attrs

    def validate_agente_cargo(self, value):
        if value in ['', None]:
            return None

        Usuario = self.Meta.model._meta.get_field('agente_cargo').related_model

        if hasattr(value, 'rol'):
            if value.rol not in ['agente', 'administrador']:
                raise serializers.ValidationError('El usuario asignado no es un agente ni administrador.')
            return value

        try:
            pk = int(value)
        except Exception:
            raise serializers.ValidationError('Agente no válido.')

        try:
            usuario = Usuario.objects.get(pk=pk)
        except Usuario.DoesNotExist:
            raise serializers.ValidationError('Agente no válido.')

        if usuario.rol not in ['agente', 'administrador']:
            raise serializers.ValidationError('El usuario asignado no es un agente ni administrador.')

        return usuario
    
    def update(self, instance, validated_data):
        caracteristicas_list = validated_data.pop('caracteristicas_list', None)
        if caracteristicas_list is not None:
            validated_data['caracteristicas'] = '\n'.join(caracteristicas_list)
        return super().update(instance, validated_data)


class PropiedadDestacadaSerializer(serializers.ModelSerializer):
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
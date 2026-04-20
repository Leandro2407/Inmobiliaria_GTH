# El modelo de Propiedad ya está bien estructurado
# No necesita cambios porque el campo 'direccion' puede almacenar
# la dirección completa que se construye en el frontend

# Solo asegúrate de que el campo caracteristicas acepta texto largo
# y que el modelo de Usuario existe para la relación agente_cargo

from django.db import models
from django.core.validators import MinValueValidator
from usuarios.models import Usuario
from clientes.models import Cliente

class Propiedad(models.Model):
    """Modelo para gestionar propiedades"""
    
    TIPO_CHOICES = [
        ('casa', 'Casa'),
        ('departamento', 'Departamento'),
        ('terreno', 'Terreno'),
        ('local', 'Local Comercial'),
        ('oficina', 'Oficina'),
    ]
    
    OPERACION_CHOICES = [
        ('venta', 'Venta'),
        ('alquiler', 'Alquiler'),
    ]
    
    ESTADO_CHOICES = [
        ('disponible', 'Disponible'),
        ('reservada', 'Reservada'),
        ('vendida', 'Vendida'),
        ('alquilada', 'Alquilada'),
        ('inactiva', 'Inactiva'),
    ]
    
    ZONA_CHOICES = [
        ('norte', 'Norte'),
        ('sur', 'Sur'),
        ('este', 'Este'),
        ('oeste', 'Oeste'),
        ('micro-centro', 'Micro Centro'),
        ('macro-centro', 'Macro Centro'),
    ]
    
    # Información básica
    titulo = models.CharField('Título de la Publicación', max_length=200)
    descripcion = models.TextField('Descripción')
    tipo = models.CharField('Tipo de Propiedad', max_length=20, choices=TIPO_CHOICES)
    operacion = models.CharField('Tipo de Operación', max_length=20, choices=OPERACION_CHOICES)
    estado = models.CharField('Estado', max_length=20, choices=ESTADO_CHOICES, default='disponible')
    
    # Precios
    precio_venta = models.DecimalField('Precio de Venta', max_digits=12, decimal_places=2, null=True, blank=True)
    precio_alquiler = models.DecimalField('Precio de Alquiler', max_digits=10, decimal_places=2, null=True, blank=True)
    moneda = models.CharField('Moneda', max_length=10, default='USD', choices=[('USD', 'Dólares'), ('ARS', 'Pesos')])
    
    # Características
    superficie_total = models.DecimalField('Superficie Total (m²)', max_digits=10, decimal_places=2)
    superficie_cubierta = models.DecimalField('Superficie Cubierta (m²)', max_digits=10, decimal_places=2, null=True, blank=True)
    dormitorios = models.PositiveIntegerField('Dormitorios', default=0)
    banos = models.PositiveIntegerField('Baños', default=0)
    cocheras = models.PositiveIntegerField('Cocheras', default=0)
    antiguedad = models.PositiveIntegerField('Antigüedad (años)', null=True, blank=True)
    
    # Ubicación
    direccion = models.CharField('Dirección', max_length=255)
    barrio = models.CharField('Barrio', max_length=100)
    ciudad = models.CharField('Ciudad', max_length=100, default='Salta')
    provincia = models.CharField('Provincia', max_length=100, default='Salta')
    codigo_postal = models.CharField('Código Postal', max_length=10, blank=True)
    zona = models.CharField('Zona', max_length=20, choices=ZONA_CHOICES)
    
    # Geolocalización
    latitud = models.DecimalField('Latitud', max_digits=10, decimal_places=8, null=True, blank=True)
    longitud = models.DecimalField('Longitud', max_digits=11, decimal_places=8, null=True, blank=True)
    
    # Características adicionales
    caracteristicas = models.TextField('Características Principales', blank=True, help_text='Una por línea')
    
    # Relaciones
    agente_cargo = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        related_name='propiedades_cargo',
        limit_choices_to={'rol__in': ['agente', 'administrador']}
    )
    propietario = models.ForeignKey(
        Cliente,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='propiedades'
    )
    
    # Destacado
    destacada = models.BooleanField('Propiedad Destacada', default=False)
    
    # Metadata
    fecha_publicacion = models.DateTimeField('Fecha de Publicación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)
    creado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        related_name='propiedades_creadas'
    )
    vistas = models.PositiveIntegerField('Vistas', default=0)
    
    class Meta:
        verbose_name = 'Propiedad'
        verbose_name_plural = 'Propiedades'
        ordering = ['-fecha_publicacion']
        indexes = [
            models.Index(fields=['tipo', 'operacion']),
            models.Index(fields=['estado']),
            models.Index(fields=['zona', 'barrio']),
            models.Index(fields=['destacada']),
        ]
    
    def __str__(self):
        return f"{self.tipo.title()} en {self.barrio} - {self.titulo}"
    
    @property
    def precio_display(self):
        if self.operacion == 'venta' and self.precio_venta:
            return f"{self.moneda} {int(self.precio_venta):,}".replace(',', '.')
        elif self.operacion == 'alquiler' and self.precio_alquiler:
            return f"{self.moneda} {int(self.precio_alquiler):,}/mes".replace(',', '.')
        return "Consultar"
    
    @property
    def esta_disponible(self):
        return self.estado == 'disponible'


class ImagenPropiedad(models.Model):
    """Modelo para imágenes de propiedades"""
    
    propiedad = models.ForeignKey(Propiedad, on_delete=models.CASCADE, related_name='imagenes')
    imagen = models.ImageField('Imagen', upload_to='propiedades/imagenes/%Y/%m/')
    titulo = models.CharField('Título', max_length=200, blank=True)
    orden = models.PositiveIntegerField('Orden', default=0)
    es_principal = models.BooleanField('Imagen Principal', default=False)
    fecha_subida = models.DateTimeField('Fecha de Subida', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Imagen de Propiedad'
        verbose_name_plural = 'Imágenes de Propiedades'
        ordering = ['orden', '-es_principal']
    
    def __str__(self):
        return f"Imagen de {self.propiedad.titulo}"
    
    def save(self, *args, **kwargs):
        if self.es_principal:
            # Solo una imagen puede ser principal
            ImagenPropiedad.objects.filter(propiedad=self.propiedad, es_principal=True).update(es_principal=False)
        super().save(*args, **kwargs)


class VideoPropiedad(models.Model):
    """Modelo para videos de propiedades"""
    
    propiedad = models.ForeignKey(Propiedad, on_delete=models.CASCADE, related_name='videos')
    video = models.FileField('Video', upload_to='propiedades/videos/%Y/%m/', blank=True, null=True)
    url_youtube = models.CharField('URL de YouTube', max_length=500, blank=True)
    titulo = models.CharField('Título', max_length=200, blank=True)
    miniatura = models.ImageField('Miniatura', upload_to='propiedades/miniaturas/%Y/%m/', blank=True)
    fecha_subida = models.DateTimeField('Fecha de Subida', auto_now_add=True)
    
    class Meta:
        verbose_name = 'Video de Propiedad'
        verbose_name_plural = 'Videos de Propiedades'
        ordering = ['-fecha_subida']
    
    def __str__(self):
        return f"Video de {self.propiedad.titulo}"
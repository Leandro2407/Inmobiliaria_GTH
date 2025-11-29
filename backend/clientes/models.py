from django.db import models
from django.core.validators import RegexValidator
from usuarios.models import Usuario

class Cliente(models.Model):
    """Modelo para gestionar clientes"""
    
    CATEGORIA_CHOICES = [
        ('alquiler', 'Alquiler'),
        ('compra', 'Compra'),
        ('venta', 'Venta'),
        ('ambos', 'Alquiler y Compra'),
    ]
    
    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
        ('prospecto', 'Prospecto'),
        ('convertido', 'Convertido'),
    ]
    
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Formato: '+999999999'. Hasta 15 dígitos."
    )
    
    # Información personal
    nombre = models.CharField('Nombre', max_length=100)
    apellido = models.CharField('Apellido', max_length=100)
    dni = models.CharField('DNI', max_length=20, unique=True)
    email = models.EmailField('Correo Electrónico', unique=True)
    telefono = models.CharField('Teléfono', validators=[phone_regex], max_length=17)
    
    # Dirección
    domicilio = models.CharField('Domicilio', max_length=255)
    ciudad = models.CharField('Ciudad', max_length=100, default='Salta')
    codigo_postal = models.CharField('Código Postal', max_length=10, blank=True)
    
    # Categoría y estado
    categoria = models.CharField('Categoría', max_length=20, choices=CATEGORIA_CHOICES)
    estado = models.CharField('Estado', max_length=20, choices=ESTADO_CHOICES, default='prospecto')
    
    # Relaciones
    agente_asignado = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='clientes_asignados',
        limit_choices_to={'rol__in': ['agente', 'administrador']}
    )
    
    # Notas y observaciones
    notas = models.TextField('Notas', blank=True)
    presupuesto_min = models.DecimalField('Presupuesto Mínimo', max_digits=12, decimal_places=2, null=True, blank=True)
    presupuesto_max = models.DecimalField('Presupuesto Máximo', max_digits=12, decimal_places=2, null=True, blank=True)
    
    # Metadata
    fecha_registro = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    ultima_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)
    creado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        related_name='clientes_creados'
    )
    
    class Meta:
        verbose_name = 'Cliente'
        verbose_name_plural = 'Clientes'
        ordering = ['-fecha_registro']
        indexes = [
            models.Index(fields=['dni']),
            models.Index(fields=['email']),
            models.Index(fields=['estado']),
            models.Index(fields=['categoria']),
        ]
    
    def __str__(self):
        return f"{self.nombre} {self.apellido} - {self.dni}"
    
    @property
    def nombre_completo(self):
        return f"{self.nombre} {self.apellido}"
    
    @property
    def esta_activo(self):
        return self.estado == 'activo'

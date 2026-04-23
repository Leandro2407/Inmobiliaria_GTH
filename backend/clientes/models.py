from django.db import models
from django.core.validators import RegexValidator
from usuarios.models import Usuario

class Cliente(models.Model):
    """Modelo para gestionar clientes"""
    
    # 🔄 Actualizado: Nuevos nombres para mostrar, manteniendo valores internos
    CATEGORIA_CHOICES = [
        ('alquiler', 'Inquilino'),           # Cambiado de 'Alquiler' a 'Inquilino'
        ('compra', 'Comprador'),              # Cambiado de 'Compra' a 'Comprador'
        ('venta', 'Venta'),                   # Se mantiene igual
        ('ambas', 'Ambos (Inquilino/Comprador)'),  # 🆕 Nueva categoría
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
    # --- PEGAR ESTO AL FINAL DE TU models.py ---

from django.db.models.signals import post_save
from django.dispatch import receiver
from usuarios.models import Usuario

@receiver(post_save, sender=Usuario)
def sincronizar_perfil_cliente(sender, instance, **kwargs):
    """
    Sincroniza los datos del Usuario (cuando el cliente edita su perfil)
    con el modelo Cliente (que se ve en el panel del agente).
    La vinculación se hace a través del email.
    """
    if instance.rol == 'cliente':
        try:
            # Buscar si el cliente ya existe en el panel por su email
            cliente = Cliente.objects.get(email=instance.email)
            
            cambios = False
            
            # Sincronizar teléfono eliminando el problema de los ceros
            if instance.telefono and cliente.telefono != instance.telefono:
                cliente.telefono = instance.telefono
                cambios = True
                
            # Sincronizamos nombre y apellido por si también los corrigió
            if instance.first_name and cliente.nombre != instance.first_name:
                cliente.nombre = instance.first_name
                cambios = True
                
            if instance.last_name and cliente.apellido != instance.last_name:
                cliente.apellido = instance.last_name
                cambios = True
                
            if cambios:
                cliente.save()
                
        except Cliente.DoesNotExist:
            # Si el cliente aún no está en el CRM, no hacemos nada
            pass
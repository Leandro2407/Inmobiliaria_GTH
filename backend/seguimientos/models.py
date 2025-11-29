from django.db import models
from usuarios.models import Usuario
from clientes.models import Cliente
from propiedades.models import Propiedad

class Seguimiento(models.Model):
    """Modelo para el seguimiento de interacciones con clientes"""
    
    # Opciones para tipos de seguimiento
    TIPO_CHOICES = [
        ('llamada', 'Llamada Telefónica'),
        ('email', 'Correo Electrónico'),
        ('whatsapp', 'WhatsApp'),
        ('reunion', 'Reunión'),
        ('visita', 'Visita a Propiedad'),
        ('otro', 'Otro'),
    ]
    
    # Opciones para estados del seguimiento
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('completado', 'Completado'),
        ('cancelado', 'Cancelado'),
    ]
    
    # Relaciones con otros modelos
    cliente = models.ForeignKey(
        Cliente, 
        on_delete=models.CASCADE, 
        related_name='seguimientos',
        verbose_name='Cliente'
    )
    propiedad = models.ForeignKey(
        Propiedad, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='seguimientos',
        verbose_name='Propiedad relacionada'
    )
    agente = models.ForeignKey(
        Usuario, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='seguimientos_realizados',
        verbose_name='Agente asignado'
    )
    
    # Información principal del seguimiento
    tipo = models.CharField(
        'Tipo de Seguimiento', 
        max_length=20, 
        choices=TIPO_CHOICES
    )
    estado = models.CharField(
        'Estado', 
        max_length=20, 
        choices=ESTADO_CHOICES, 
        default='pendiente'
    )
    fecha_programada = models.DateTimeField(
        'Fecha Programada', 
        null=True, 
        blank=True
    )
    fecha_realizada = models.DateTimeField(
        'Fecha Realizada', 
        null=True, 
        blank=True
    )
    
    # Detalles del contenido del seguimiento
    asunto = models.CharField(
        'Asunto', 
        max_length=200
    )
    descripcion = models.TextField(
        'Descripción/Notas'
    )
    resultado = models.TextField(
        'Resultado', 
        blank=True
    )
    
    # Información para seguimientos futuros
    requiere_seguimiento = models.BooleanField(
        'Requiere Seguimiento', 
        default=False
    )
    proxima_accion = models.TextField(
        'Próxima Acción', 
        blank=True
    )
    fecha_proximo_contacto = models.DateField(
        'Fecha Próximo Contacto', 
        null=True, 
        blank=True
    )
    
    # Campos de metadata automáticos
    fecha_creacion = models.DateTimeField(
        'Fecha de Creación', 
        auto_now_add=True
    )
    fecha_actualizacion = models.DateTimeField(
        'Última Actualización', 
        auto_now=True
    )
    
    class Meta:
        """Configuración adicional del modelo"""
        verbose_name = 'Seguimiento'
        verbose_name_plural = 'Seguimientos'
        ordering = ['-fecha_programada', '-fecha_creacion']
        indexes = [
            # Índice para búsquedas por cliente y estado
            models.Index(fields=['cliente', 'estado']),
            # Índice para filtrar por fecha programada
            models.Index(fields=['fecha_programada']),
            # Índice para búsquedas por agente y estado
            models.Index(fields=['agente', 'estado']),
        ]
    
    def __str__(self):
        """Representación en string del objeto"""
        return f"{self.tipo.title()} - {self.cliente.nombre_completo} - {self.fecha_programada or 'Sin fecha'}"
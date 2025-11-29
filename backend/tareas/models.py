from django.db import models
from django.conf import settings

class Tarea(models.Model):
    """Modelo para gestionar tareas del sistema"""
    
    # Opciones de prioridad para las tareas
    PRIORIDAD_CHOICES = [
        ('alta', 'Alta'),
        ('media', 'Media'),
        ('baja', 'Baja'),
    ]

    # Información básica de la tarea
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre de la tarea'
    )
    hora_inicio = models.TimeField(
        verbose_name='Hora de inicio'
    )
    hora_fin = models.TimeField(
        null=True, 
        blank=True,
        verbose_name='Hora de finalización estimada'
    )
    fecha = models.DateField(
        verbose_name='Fecha de la tarea'
    )

    # Relación muchos-a-muchos con usuarios (empleados)
    empleados = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="tareas",
        verbose_name='Empleados asignados'
    )

    # Configuración de prioridad
    prioridad = models.CharField(
        max_length=5,
        choices=PRIORIDAD_CHOICES,
        default='media',
        verbose_name='Prioridad'
    )

    # Descripción detallada de la tarea
    descripcion = models.TextField(
        blank=True, 
        null=True,
        verbose_name='Descripción detallada'
    )

    # Campos para control de finalización
    finalizada = models.BooleanField(
        default=False,
        verbose_name='¿Tarea finalizada?'
    )
    fecha_finalizacion = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name='Fecha y hora de finalización'
    )

    # Campos de metadata automáticos
    creado_en = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Fecha de creación'
    )
    actualizado_en = models.DateTimeField(
        auto_now=True,
        verbose_name='Última actualización'
    )

    class Meta:
        """Configuración adicional del modelo"""
        verbose_name = 'Tarea'
        verbose_name_plural = 'Tareas'
        ordering = ['fecha', 'hora_inicio']
        indexes = [
            models.Index(fields=['fecha', 'finalizada']),
            models.Index(fields=['prioridad', 'finalizada']),
        ]
    
    def __str__(self):
        """Representación legible de la tarea"""
        return f"{self.nombre} ({self.prioridad})"
    
    @property
    def esta_finalizada(self):
        """Propiedad que indica si la tarea está finalizada"""
        return self.finalizada
    
    @property
    def puede_ser_editada(self):
        """Propiedad que indica si la tarea puede ser editada"""
        return not self.finalizada
    
    @property
    def empleados_asignados(self):
        """Propiedad que devuelve los empleados asignados"""
        return self.empleados.all()
    
    @property
    def duracion_estimada(self):
        """Calcula la duración estimada de la tarea"""
        if self.hora_inicio and self.hora_fin:
            from datetime import datetime, timedelta
            inicio = datetime.combine(self.fecha, self.hora_inicio)
            fin = datetime.combine(self.fecha, self.hora_fin)
            return fin - inicio
        return None
    
    def finalizar(self):
        """Método para finalizar la tarea"""
        from django.utils import timezone
        self.finalizada = True
        self.fecha_finalizacion = timezone.now()
        self.save()
    
    def reabrir(self):
        """Método para reabrir una tarea finalizada"""
        self.finalizada = False
        self.fecha_finalizacion = None
        self.save()
from django.db import models
from clientes.models import Cliente
from propiedades.models import Propiedad

class Contrato(models.Model):
    TIPO_CONTRATO = [
        ('alquiler', 'Alquiler'),
        ('venta', 'Venta'),
        ('administracion', 'Administración'),
    ]
    
    ESTADO_CONTRATO = [
        ('activo', 'Activo'),
        ('pendiente', 'Pendiente'),
        ('finalizado', 'Finalizado'),
        ('cancelado', 'Cancelado'),
    ]
    
    cliente = models.ForeignKey(
        Cliente, 
        on_delete=models.CASCADE, 
        related_name='contratos_gestion'
    )
    propiedad = models.ForeignKey(
        Propiedad, 
        on_delete=models.CASCADE, 
        related_name='contratos_gestion'
    )
    tipo = models.CharField(max_length=20, choices=TIPO_CONTRATO)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField(null=True, blank=True)
    monto = models.DecimalField(max_digits=12, decimal_places=2)
    
    # 🆕 Nuevo campo para el porcentaje de comisión
    porcentaje_comision = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name='Porcentaje de Comisión',
        help_text='Porcentaje aplicado sobre el monto total'
    )
    
    comision = models.DecimalField(
        max_digits=12, 
        decimal_places=2, 
        null=True, 
        blank=True,
        verbose_name='Comisión Calculada',
        help_text='Monto calculado automáticamente (monto × porcentaje_comision ÷ 100)'
    )
    
    estado = models.CharField(max_length=20, choices=ESTADO_CONTRATO, default='activo')
    descripcion = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contratos_gestion'
        verbose_name = 'Contrato de Gestión'
        verbose_name_plural = 'Contratos de Gestión'
        indexes = [
            models.Index(fields=['cliente', 'estado']),
            models.Index(fields=['propiedad', 'estado']),
            models.Index(fields=['fecha_inicio']),
        ]

    def __str__(self):
        return f"Contrato {self.tipo} - {self.cliente.nombre_completo} - {self.propiedad.direccion}"

    def save(self, *args, **kwargs):
        """
        Sobrescribir save para calcular automáticamente la comisión
        si se proporciona un porcentaje
        """
        # Calcular comisión automáticamente si hay porcentaje
        if self.porcentaje_comision and self.monto:
            self.comision = (self.monto * self.porcentaje_comision) / 100
        elif not self.porcentaje_comision:
            # Si no hay porcentaje, permitir comisión manual o dejarla en null
            pass
            
        super().save(*args, **kwargs)

    @property
    def tiene_comision_completa(self):
        """Verifica si el contrato tiene toda la información de comisión"""
        return self.porcentaje_comision is not None and self.comision is not None

    @property
    def monto_con_comision(self):
        """Retorna el monto total incluyendo la comisión (si aplica)"""
        if self.comision:
            return self.monto + self.comision
        return self.monto

    @property
    def esta_activo(self):
        """Verifica si el contrato está activo"""
        return self.estado == 'activo'

    @property
    def esta_pendiente(self):
        """Verifica si el contrato está pendiente"""
        return self.estado == 'pendiente'

    @property
    def esta_finalizado(self):
        """Verifica si el contrato está finalizado"""
        return self.estado == 'finalizado'

    @property
    def esta_cancelado(self):
        """Verifica si el contrato está cancelado"""
        return self.estado == 'cancelado'

    @property
    def puede_ser_modificado(self):
        """Determina si el contrato puede ser modificado"""
        return self.estado in ['activo', 'pendiente']

    @property
    def duracion_en_dias(self):
        """Calcula la duración del contrato en días"""
        if self.fecha_inicio and self.fecha_fin:
            return (self.fecha_fin - self.fecha_inicio).days
        return None

    @property
    def esta_vencido(self):
        """Verifica si el contrato está vencido"""
        from django.utils import timezone
        if self.fecha_fin and self.estado == 'activo':
            return self.fecha_fin < timezone.now().date()
        return False
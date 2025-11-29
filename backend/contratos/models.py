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
    comision = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CONTRATO, default='activo')
    descripcion = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'contratos_gestion'
        verbose_name = 'Contrato de Gestión'
        verbose_name_plural = 'Contratos de Gestión'

    def __str__(self):
        return f"Contrato {self.tipo} - {self.cliente.nombre_completo} - {self.propiedad.direccion}"
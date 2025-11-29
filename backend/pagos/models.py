from django.db import models
from django.core.validators import MinValueValidator
from usuarios.models import Usuario
from clientes.models import Cliente
from propiedades.models import Propiedad

class Contrato(models.Model):
    """Modelo para contratos de alquiler/venta"""
    
    TIPO_CHOICES = [
        ('venta', 'Venta'),
        ('alquiler', 'Alquiler'),
    ]
    
    ESTADO_CHOICES = [
        ('borrador', 'Borrador'),
        ('activo', 'Activo'),
        ('finalizado', 'Finalizado'),
        ('cancelado', 'Cancelado'),
    ]
    
    # Relaciones
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='contratos')
    propiedad = models.ForeignKey(Propiedad, on_delete=models.PROTECT, related_name='contratos')
    agente = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='contratos_gestionados')
    
    # Información del contrato
    tipo = models.CharField('Tipo de Contrato', max_length=20, choices=TIPO_CHOICES)
    estado = models.CharField('Estado', max_length=20, choices=ESTADO_CHOICES, default='borrador')
    numero_contrato = models.CharField('Número de Contrato', max_length=50, unique=True)
    
    # Fechas
    fecha_inicio = models.DateField('Fecha de Inicio')
    fecha_fin = models.DateField('Fecha de Fin', null=True, blank=True)
    
    # Montos
    monto_total = models.DecimalField('Monto Total', max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    moneda = models.CharField('Moneda', max_length=10, default='USD', choices=[('USD', 'Dólares'), ('ARS', 'Pesos')])
    
    # Para alquileres
    monto_mensual = models.DecimalField('Monto Mensual', max_digits=10, decimal_places=2, null=True, blank=True)
    deposito_garantia = models.DecimalField('Depósito de Garantía', max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Documentos
    archivo_contrato = models.FileField('Archivo del Contrato', upload_to='contratos/%Y/%m/', blank=True)
    
    # Notas
    observaciones = models.TextField('Observaciones', blank=True)
    
    # Metadata
    fecha_creacion = models.DateTimeField('Fecha de Creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)
    creado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='contratos_creados')
    
    class Meta:
        verbose_name = 'Contrato'
        verbose_name_plural = 'Contratos'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['numero_contrato']),
            models.Index(fields=['cliente', 'estado']),
            models.Index(fields=['propiedad']),
        ]
    
    def __str__(self):
        return f"Contrato {self.numero_contrato} - {self.cliente.nombre_completo}"


class Pago(models.Model):
    """Modelo para pagos"""
    
    METODO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia Bancaria'),
        ('cheque', 'Cheque'),
        ('tarjeta', 'Tarjeta de Crédito/Débito'),
        ('mercadopago', 'Mercado Pago'),
        ('otro', 'Otro'),
    ]
    
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('vencido', 'Vencido'),
        ('parcial', 'Pago Parcial'),
        ('cancelado', 'Cancelado'),
    ]
    
    # Relaciones
    contrato = models.ForeignKey(Contrato, on_delete=models.CASCADE, related_name='pagos')
    cliente = models.ForeignKey(Cliente, on_delete=models.PROTECT, related_name='pagos')
    
    # Información del pago
    concepto = models.CharField('Concepto', max_length=200)
    numero_cuota = models.PositiveIntegerField('Número de Cuota', null=True, blank=True)
    
    # Montos
    monto_total = models.DecimalField('Monto Total', max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    monto_pagado = models.DecimalField('Monto Pagado', max_digits=10, decimal_places=2, default=0)
    moneda = models.CharField('Moneda', max_length=10, default='USD', choices=[('USD', 'Dólares'), ('ARS', 'Pesos')])
    
    # Fechas
    fecha_vencimiento = models.DateField('Fecha de Vencimiento')
    fecha_pago = models.DateField('Fecha de Pago', null=True, blank=True)
    
    # Método de pago
    metodo_pago = models.CharField('Método de Pago', max_length=20, choices=METODO_CHOICES, blank=True)
    estado = models.CharField('Estado', max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    
    # Comprobante
    numero_comprobante = models.CharField('Número de Comprobante', max_length=100, blank=True)
    archivo_comprobante = models.FileField('Comprobante de Pago', upload_to='comprobantes/%Y/%m/', blank=True)
    
    # Notas
    observaciones = models.TextField('Observaciones', blank=True)
    
    # Metadata
    fecha_registro = models.DateTimeField('Fecha de Registro', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última Actualización', auto_now=True)
    registrado_por = models.ForeignKey(Usuario, on_delete=models.SET_NULL, null=True, related_name='pagos_registrados')
    
    class Meta:
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['fecha_vencimiento', '-fecha_registro']
        indexes = [
            models.Index(fields=['contrato', 'estado']),
            models.Index(fields=['cliente', 'estado']),
            models.Index(fields=['fecha_vencimiento']),
            models.Index(fields=['estado']),
        ]
    
    def __str__(self):
        return f"Pago {self.concepto} - {self.cliente.nombre_completo} - {self.fecha_vencimiento}"
    
    @property
    def monto_pendiente(self):
        return self.monto_total - self.monto_pagado
    
    @property
    def esta_vencido(self):
        from django.utils import timezone
        return self.estado == 'pendiente' and self.fecha_vencimiento < timezone.now().date()

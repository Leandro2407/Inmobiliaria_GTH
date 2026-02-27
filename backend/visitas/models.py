from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import datetime, timedelta
from clientes.models import Cliente
from usuarios.models import Usuario

class Visita(models.Model):
    """Modelo para gestionar visitas programadas con clientes"""
    
    # Tiempo mínimo entre visitas (en horas)
    TIEMPO_MINIMO_ENTRE_VISITAS = 2
    
    # Opciones para resultados de visitas
    # 🔄 Modificado: Reemplazado 'pendiente_evaluacion' por 'no_se_presento'
    RESULTADO_CHOICES = [
        ('interesado', 'Cliente Interesado'),
        ('no_interesado', 'Cliente No Interesado'),
        ('agendada_visita', 'Se agendó nueva visita'),
        ('vendido', 'Se concretó venta/alquiler'),
        ('no_se_presento', 'No se presentó el cliente'),
    ]
    
    # Opciones para estados de visitas
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_curso', 'En Curso'),
        ('finalizada', 'Finalizada'),
        ('cancelada', 'Cancelada'),
    ]
    
    # Relación con el cliente
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name='visitas',
        verbose_name='Cliente'
    )
    
    # Fecha y hora de la visita
    fecha = models.DateField('Fecha de la visita')
    hora = models.TimeField('Hora de la visita')
    
    # Información del resultado
    resultado = models.CharField(
        'Resultado',
        max_length=20,
        choices=RESULTADO_CHOICES,
        blank=True,
        null=True,
        help_text='Resultado obtenido de la visita'
    )
    
    descripcion = models.TextField(
        'Descripción de la visita',
        blank=True,
        help_text='Detalles de lo tratado en la visita'
    )
    
    # Estado y calificación
    estado = models.CharField(
        'Estado',
        max_length=15,
        choices=ESTADO_CHOICES,
        default='pendiente'
    )
    
    # Información de creación y auditoría
    creado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        related_name='visitas_creadas',
        verbose_name='Creado por'
    )
    
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última actualización', auto_now=True)
    fecha_finalizacion = models.DateTimeField('Fecha de finalización', null=True, blank=True)
    fecha_cancelacion = models.DateTimeField('Fecha de cancelación', null=True, blank=True)
    hora_finalizacion = models.TimeField('Hora de finalización', null=True, blank=True)
    
    class Meta:
        """Configuración adicional del modelo"""
        verbose_name = 'Visita'
        verbose_name_plural = 'Visitas'
        ordering = ['-fecha', '-hora']
        indexes = [
            models.Index(fields=['cliente', 'fecha']),
            models.Index(fields=['estado']),
            models.Index(fields=['fecha', 'hora']),
            models.Index(fields=['fecha_creacion']),
        ]
    
    def __str__(self):
        """Representación legible de la visita"""
        return f"Visita de {self.cliente.nombre_completo} - {self.fecha} {self.hora}"
    
    def save(self, *args, **kwargs):
        """
        Sobrescribir save para lógica automática de estados
        """
        # Lógica automática para cambiar estado a "en_curso" cuando llega la hora
        if self.estado == 'pendiente':
            ahora = timezone.now()
            try:
                fecha_hora_naive = datetime.combine(self.fecha, self.hora)
                fecha_hora_visita = timezone.make_aware(fecha_hora_naive, timezone.get_current_timezone())
                
                if ahora >= fecha_hora_visita:
                    self.estado = 'en_curso'
            except Exception as e:
                pass
        
        # Registrar fechas automáticamente al cambiar estado
        if self.estado == 'finalizada' and not self.fecha_finalizacion:
            self.fecha_finalizacion = timezone.now()
            self.hora_finalizacion = timezone.now().time()
        elif self.estado == 'cancelada' and not self.fecha_cancelacion:
            self.fecha_cancelacion = timezone.now()
        
        super().save(*args, **kwargs)
    
    def actualizar_estado_automatico(self):
        """
        Método para forzar la actualización del estado basado en la hora actual
        """
        if self.estado == 'pendiente':
            ahora = timezone.now()
            try:
                fecha_hora_naive = datetime.combine(self.fecha, self.hora)
                
                if ahora.time() >= self.hora and ahora.date() >= self.fecha:
                    estado_anterior = self.estado
                    self.estado = 'en_curso'
                    self.save(update_fields=['estado', 'fecha_actualizacion'])
                    return True
            except Exception as e:
                pass
        return False
    
    @classmethod
    def cliente_puede_agendar(cls, cliente_id):
        """
        Verifica si un cliente puede agendar una nueva visita
        Returns: (puede_agendar: bool, tiempo_restante_minutos: int, ultima_visita: Visita)
        """
        ahora = timezone.now()
        tiempo_bloqueo = timedelta(hours=cls.TIEMPO_MINIMO_ENTRE_VISITAS)
        
        # Buscar la última visita creada para este cliente
        ultima_visita = cls.objects.filter(
            cliente_id=cliente_id
        ).order_by('-fecha_creacion').first()
        
        if not ultima_visita:
            # No hay visitas previas, puede agendar
            return True, 0, None
        
        # Calcular tiempo transcurrido desde la creación de la última visita
        tiempo_transcurrido = ahora - ultima_visita.fecha_creacion
        
        # Si han pasado más de 2 horas, puede agendar
        if tiempo_transcurrido >= tiempo_bloqueo:
            return True, 0, ultima_visita
        
        # Calcular tiempo restante en minutos
        tiempo_restante = tiempo_bloqueo - tiempo_transcurrido
        minutos_restantes = int(tiempo_restante.total_seconds() / 60)
        
        return False, minutos_restantes, ultima_visita
    
    @classmethod
    def obtener_fin_bloqueo_cliente(cls, cliente_id):
        """
        Obtiene la fecha/hora exacta en que termina el bloqueo para un cliente
        Returns: datetime o None
        """
        ahora = timezone.now()
        tiempo_bloqueo = timedelta(hours=cls.TIEMPO_MINIMO_ENTRE_VISITAS)
        
        ultima_visita = cls.objects.filter(
            cliente_id=cliente_id
        ).order_by('-fecha_creacion').first()
        
        if not ultima_visita:
            return None
        
        fin_bloqueo = ultima_visita.fecha_creacion + tiempo_bloqueo
        
        # Si ya pasó el tiempo de bloqueo, retornar None
        if ahora >= fin_bloqueo:
            return None
        
        return fin_bloqueo
    
    @classmethod
    def obtener_clientes_bloqueados_info(cls):
        """
        Obtiene información de todos los clientes que están bloqueados
        Returns: dict con cliente_id como key y info de bloqueo como value
        """
        ahora = timezone.now()
        tiempo_bloqueo = timedelta(hours=cls.TIEMPO_MINIMO_ENTRE_VISITAS)
        tiempo_limite = ahora - tiempo_bloqueo
        
        # Obtener visitas recientes (últimas 2 horas)
        visitas_recientes = cls.objects.filter(
            fecha_creacion__gte=tiempo_limite
        ).order_by('cliente_id', '-fecha_creacion')
        
        clientes_bloqueados = {}
        
        for visita in visitas_recientes:
            cliente_id = visita.cliente_id
            
            # Solo considerar la primera visita (más reciente) por cliente
            if cliente_id not in clientes_bloqueados:
                tiempo_transcurrido = ahora - visita.fecha_creacion
                
                if tiempo_transcurrido < tiempo_bloqueo:
                    tiempo_restante = tiempo_bloqueo - tiempo_transcurrido
                    minutos_restantes = int(tiempo_restante.total_seconds() / 60)
                    
                    clientes_bloqueados[cliente_id] = {
                        'bloqueado': True,
                        'minutos_restantes': minutos_restantes,
                        'ultima_visita_id': visita.id,
                        'fecha_creacion_ultima_visita': visita.fecha_creacion.isoformat(),
                        'puede_agendar_desde': (visita.fecha_creacion + tiempo_bloqueo).isoformat()
                    }
        
        return clientes_bloqueados
    
    @property
    def fecha_hora_completa(self):
        """Propiedad que combina fecha y hora en un string"""
        return f"{self.fecha} {self.hora}"
    
    @property
    def fecha_hora_finalizacion_completa(self):
        """Propiedad que combina fecha y hora de finalización"""
        if self.fecha_finalizacion and self.hora_finalizacion:
            return f"{self.fecha_finalizacion.strftime('%Y-%m-%d')} {self.hora_finalizacion}"
        return "No finalizada"
    
    @property
    def esta_pendiente(self):
        """Verifica si la visita está pendiente"""
        return self.estado == 'pendiente'
    
    @property
    def esta_en_curso(self):
        """Verifica si la visita está en curso"""
        return self.estado == 'en_curso'
    
    @property
    def esta_finalizada(self):
        """Verifica si la visita está finalizada"""
        return self.estado == 'finalizada'
    
    @property
    def esta_cancelada(self):
        """Verifica si la visita está cancelada"""
        return self.estado == 'cancelada'
    
    @property
    def puede_ser_cancelada(self):
        """Determina si la visita puede ser cancelada"""
        return self.estado == 'pendiente'
    
    @property
    def puede_ser_finalizada(self):
        """Determina si la visita puede ser finalizada"""
        return self.estado == 'en_curso'
    
    @property
    def tiene_resultado(self):
        """Verifica si la visita tiene resultado registrado"""
        return bool(self.resultado)
    
    @property
    def informacion_completa(self):
        """Verifica si la visita tiene toda la información requerida"""
        return all([
            self.resultado,
            self.descripcion.strip() if self.descripcion else False
        ])
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
from datetime import datetime, timedelta
from clientes.models import Cliente
from usuarios.models import Usuario
from propiedades.models import Propiedad

class Visita(models.Model):
    """Modelo para gestionar visitas programadas con clientes"""
    
    # Tiempo mínimo entre visitas (en horas)
    TIEMPO_MINIMO_ENTRE_VISITAS = 2
    
    # Margen de conflicto para empleados (en minutos)
    MARGEN_CONFLICTO_MINUTOS = 30
    
    # Opciones para resultados de visitas
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
    
    # Relación con el empleado (agente que atiende la visita)
    empleado = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='visitas_asignadas',
        verbose_name='Empleado asignado',
        limit_choices_to={'rol__in': ['agente', 'administrador']}
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
            models.Index(fields=['empleado', 'fecha', 'hora']),
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
    
    @classmethod
    def empleado_esta_disponible(cls, empleado_id, fecha, hora, exclude_visita_id=None):
        """
        Verifica si un empleado está disponible en una fecha y hora específica.
        Un empleado NO está disponible si tiene una visita programada que:
        - Sea el mismo día
        - El horario se superponga o esté dentro del margen de ±30 minutos
        
        Returns: (disponible: bool, visita_conflicto: Visita, conflictos: list)
        """
        from datetime import datetime, timedelta
        
        # Crear datetime con la fecha y hora de la nueva visita
        nueva_fecha_hora = datetime.combine(fecha, hora)
        
        # Calcular rango de conflicto (30 minutos antes y después)
        inicio_conflicto = nueva_fecha_hora - timedelta(minutes=cls.MARGEN_CONFLICTO_MINUTOS)
        fin_conflicto = nueva_fecha_hora + timedelta(minutes=cls.MARGEN_CONFLICTO_MINUTOS)
        
        # Buscar visitas del empleado en el mismo día
        queryset = cls.objects.filter(
            empleado_id=empleado_id,
            fecha=fecha,
            estado__in=['pendiente', 'en_curso']
        )
        
        # Excluir la visita actual si se está editando
        if exclude_visita_id:
            queryset = queryset.exclude(id=exclude_visita_id)
        
        conflictos = []
        for visita in queryset:
            visita_fecha_hora = datetime.combine(visita.fecha, visita.hora)
            
            # Calcular diferencia en minutos
            diff_minutos = abs((visita_fecha_hora - nueva_fecha_hora).total_seconds() / 60)
            
            if diff_minutos <= cls.MARGEN_CONFLICTO_MINUTOS:
                conflictos.append({
                    'visita': visita,
                    'diferencia_minutos': int(diff_minutos),
                    'horario_conflicto': visita.hora.strftime('%H:%M')
                })
        
        if conflictos:
            return False, conflictos[0]['visita'], conflictos
        
        return True, None, []
    
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
        return self.estado in ['pendiente', 'aprobada']
    
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
        return self.estado in ['pendiente', 'aprobada']
    
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
    
    @property
    def puede_ser_editada(self):
        """
        Determina si la visita puede ser editada.
        Solo se puede editar si:
        - La visita está pendiente
        - La hora actual es al menos 2 horas antes del inicio de la visita
        """
        if self.estado != 'pendiente':
            return False
        
        ahora = timezone.now()
        try:
            fecha_hora_naive = datetime.combine(self.fecha, self.hora)
            fecha_hora_visita = timezone.make_aware(fecha_hora_naive, timezone.get_current_timezone())
            
            # Calcular diferencia en horas
            diferencia = (fecha_hora_visita - ahora).total_seconds() / 3600
            
            # Solo permitir editar si faltan más de 2 horas
            return diferencia > 2
        except Exception as e:
            return False

class SolicitudVisita(models.Model):
    """Modelo para gestionar solicitudes de visita de clientes"""

    # Opciones para estados de solicitudes
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('aprobada', 'Aprobada'),
        ('rechazada', 'Rechazada'),
        ('cancelada', 'Cancelada'),
    ]

    # Relación con el cliente que solicita
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.CASCADE,
        related_name='solicitudes_visita',
        verbose_name='Cliente solicitante'
    )

    # Relación con la propiedad solicitada
    propiedad = models.ForeignKey(
        Propiedad,
        on_delete=models.CASCADE,
        related_name='solicitudes_visita',
        verbose_name='Propiedad solicitada'
    )

    # Empleado que procesa la solicitud (opcional, se asigna cuando se aprueba)
    procesado_por = models.ForeignKey(
        Usuario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='solicitudes_procesadas',
        verbose_name='Procesado por',
        limit_choices_to={'rol__in': ['agente', 'administrador']}
    )

    # Información de la solicitud
    mensaje = models.TextField(
        'Mensaje del cliente',
        blank=True,
        help_text='Mensaje opcional del cliente al solicitar la visita'
    )

    # Estado de la solicitud
    estado = models.CharField(
        'Estado',
        max_length=15,
        choices=ESTADO_CHOICES,
        default='pendiente'
    )

    # Información de creación y auditoría
    fecha_creacion = models.DateTimeField('Fecha de creación', auto_now_add=True)
    fecha_actualizacion = models.DateTimeField('Última actualización', auto_now=True)
    fecha_procesamiento = models.DateTimeField('Fecha de procesamiento', null=True, blank=True)

    # Relación con la visita creada (si se aprueba)
    visita_creada = models.OneToOneField(
        Visita,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='solicitud_origen',
        verbose_name='Visita creada'
    )

    class Meta:
        """Configuración adicional del modelo"""
        verbose_name = 'Solicitud de Visita'
        verbose_name_plural = 'Solicitudes de Visita'
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['cliente', 'estado']),
            models.Index(fields=['propiedad', 'estado']),
            models.Index(fields=['estado', 'fecha_creacion']),
            models.Index(fields=['procesado_por']),
        ]

    def __str__(self):
        """Representación legible de la solicitud"""
        return f"Solicitud de {self.cliente.nombre_completo} para {self.propiedad.titulo}"

    def aprobar(self, empleado, fecha, hora):
        """
        Aprueba la solicitud y crea una visita
        """
        from .models import Visita  # Importación local para evitar circular imports

        if self.estado != 'pendiente':
            raise ValueError("Solo se pueden aprobar solicitudes pendientes")

        # Crear la visita
        visita = Visita.objects.create(
            cliente=self.cliente,
            empleado=empleado,
            fecha=fecha,
            hora=hora,
            descripcion=f"Visita solicitada para la propiedad: {self.propiedad.titulo}",
            creado_por=empleado,
            estado='pendiente'
        )

        # Actualizar la solicitud
        self.estado = 'aprobada'
        self.procesado_por = empleado
        self.fecha_procesamiento = timezone.now()
        self.visita_creada = visita
        self.save()

        return visita

    def rechazar(self, empleado, motivo=None):
        """
        Rechaza la solicitud
        """
        if self.estado != 'pendiente':
            raise ValueError("Solo se pueden rechazar solicitudes pendientes")

        self.estado = 'rechazada'
        self.procesado_por = empleado
        self.fecha_procesamiento = timezone.now()
        if motivo:
            self.mensaje = f"{self.mensaje}\n\nMotivo del rechazo: {motivo}".strip()
        self.save()

    def cancelar(self, motivo=None):
        """
        Cancela la solicitud (por el cliente) y la visita asociada si ya fue aprobada.
        """
        if self.estado not in ['pendiente', 'aprobada']:
            raise ValueError("Solo se pueden cancelar solicitudes pendientes o aprobadas")

        self.estado = 'cancelada'
        self.fecha_procesamiento = timezone.now()

        if motivo:
            self.mensaje = f"{self.mensaje}\n\nMotivo de la cancelación: {motivo}".strip()

        self.save()

        if self.visita_creada:
            visita = self.visita_creada
            if visita.puede_ser_cancelada:
                visita.estado = 'cancelada'
                visita.save()
            else:
                # Si la visita no puede cancelarse por el estado actual, no hacemos nada adicional.
                pass

    @property
    def puede_ser_aprobada(self):
        """Determina si la solicitud puede ser aprobada"""
        return self.estado == 'pendiente'

    @property
    def puede_ser_rechazada(self):
        """Determina si la solicitud puede ser rechazada"""
        return self.estado == 'pendiente'

    @property
    def puede_ser_cancelada(self):
        """Determina si la solicitud puede ser cancelada por el cliente"""
        return self.estado in ['pendiente', 'aprobada']

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from contratos.models import Contrato
from propiedades.models import Propiedad


@receiver(post_save, sender=Contrato)
def actualizar_estado_propiedad(sender, instance, created, **kwargs):
    """
    Signal que se ejecuta cuando se crea o actualiza un Contrato.
    Actualiza el estado de la Propiedad según el tipo y estado del contrato.
    """
    propiedad = instance.propiedad

    # Mapeo de tipos de contrato a estado de propiedad
    mapeo_estado = {
        'venta': 'vendida',
        'alquiler': 'alquilada',
        'administracion': 'reservada',
    }

    # Si el contrato está cancelado, devolver propiedad a disponible
    if instance.estado == 'cancelado':
        # Solo devolver a disponible si no hay otros contratos activos/pendientes
        contratos_activos = Contrato.objects.filter(
            propiedad=propiedad
        ).exclude(
            estado='cancelado'
        ).exclude(
            estado='finalizado'
        ).exclude(pk=instance.pk)

        if not contratos_activos.exists():
            propiedad.estado = 'disponible'
            propiedad.save()
    else:
        # Si el contrato NO está cancelado, obtener el nuevo estado según el tipo
        nuevo_estado = mapeo_estado.get(instance.tipo)

        if nuevo_estado and propiedad.estado != nuevo_estado:
            propiedad.estado = nuevo_estado
            propiedad.save()


@receiver(post_delete, sender=Contrato)
def liberar_propiedad_al_eliminar(sender, instance, **kwargs):
    """
    Signal que se ejecuta cuando se elimina un Contrato.
    Si no hay otros contratos activos para la propiedad, marcala como disponible.
    """
    propiedad = instance.propiedad

    # Verificar si hay otros contratos activos o pendientes para esta propiedad
    contratos_restantes = Contrato.objects.filter(
        propiedad=propiedad
    ).exclude(
        estado='cancelado'
    ).exclude(
        estado='finalizado'
    )

    # Si no hay contratos restantes, devolver a disponible
    if not contratos_restantes.exists():
        propiedad.estado = 'disponible'
        propiedad.save()

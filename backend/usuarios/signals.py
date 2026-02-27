from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

# Import here to avoid circular dependencies; will only be executed when the signal is registered
from clientes.models import Cliente


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def crear_cliente_al_registrarse(sender, instance, created, **kwargs):
    """Asegura que cada usuario con rol "cliente" tenga un registro en la tabla Clientes.

    - Si se crea por primera vez un usuario y su rol es cliente, se genera
      automáticamente un objeto Cliente con los datos mínimos disponibles.
    - Si el usuario ya existe y se actualiza, por ahora no se modifican los
      campos del cliente (podría extenderse más adelante).

    Esto permite que al iniciar sesión (o al finalizar el registro) el
    usuario aparezca inmediatamente en la vista/listado de clientes.
    """
    # Sólo nos interesan los usuarios que son clientes
    if instance.rol != 'cliente':
        return

    # Generamos un DNI único temporal en caso de que el usuario no lo haya ingresado
    dni_temporal = instance.dni if instance.dni else f"PENDIENTE-{instance.id}"

    # Los campos del modelo Cliente son obligatorios, así que usamos valores
    # por defecto razonables cuando la información está vacía.
    datos = {
        'nombre': instance.first_name or instance.username or 'Cliente',
        'apellido': instance.last_name or '',
        'dni': dni_temporal,
        'email': instance.email,
        'telefono': instance.telefono or '000000000',
        'domicilio': 'No especificado',
        'ciudad': instance.ciudad or 'Salta',
        'categoria': 'ambas',  # categoría neutra hasta que se complete
        'estado': 'activo',
        'creado_por': instance if created else None,
    }

    if created:
        # Intentamos no duplicar si por alguna razón ya existiera
        Cliente.objects.get_or_create(email=instance.email, defaults=datos)
    else:
        # Si el usuario fue actualizado, no queremos sobreescribir
        # información que pueda haber entrado por el panel de clientes.
        # Sin embargo, si aún no existe el cliente, lo creamos.
        Cliente.objects.get_or_create(email=instance.email, defaults=datos)
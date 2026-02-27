from django.apps import AppConfig


class UsuariosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'usuarios'

    def ready(self):
        # importa los "receivers" de señales para que se registren
        # al arrancar la aplicación
        import usuarios.signals  # noqa: F401

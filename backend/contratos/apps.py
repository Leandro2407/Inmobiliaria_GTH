from django.apps import AppConfig

class ContratosConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'contratos'
    verbose_name = 'Contratos de Gestión'

    def ready(self):
        import contratos.signals
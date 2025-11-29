from django.contrib import admin
from .models import Visita

@admin.register(Visita)
class VisitaAdmin(admin.ModelAdmin):
    """Configuración del panel de administración para el modelo Visita"""
    
    # Configuración de la lista principal
    list_display = [
        'cliente', 
        'fecha', 
        'hora', 
        'estado', 
        'resultado', 
        'fecha_creacion'
    ]
    
    # Filtros laterales para navegación rápida
    list_filter = [
        'estado', 
        'resultado', 
        'fecha', 
        'cliente'
    ]
    
    # Campos para búsqueda en la barra de búsqueda
    search_fields = [
        'cliente__nombre', 
        'cliente__apellido', 
        'cliente__dni'
    ]
    
    # Campos que no pueden ser editados en el admin
    readonly_fields = [
        'fecha_creacion', 
        'fecha_actualizacion', 
        'fecha_finalizacion', 
        'fecha_cancelacion'
    ]
    
    # Navegación por fechas en la parte superior
    date_hierarchy = 'fecha'
    
    # Organización de campos en el formulario de edición
    fieldsets = (
        ('Información Principal', {
            'fields': (
                'cliente', 
                'fecha', 
                'hora', 
                'estado'
            )
        }),
        ('Resultados', {
            'fields': (
                'resultado', 
                'descripcion', 
                'calificacion'
            ),
            'classes': ('collapse',)  # Sección colapsable para ahorrar espacio
        }),
        ('Metadata', {
            'fields': (
                'creado_por', 
                'fecha_creacion', 
                'fecha_actualizacion',
                'fecha_finalizacion',
                'fecha_cancelacion'
            ),
            'classes': ('collapse',)  # Sección colapsable
        }),
    )
    
    # Ordenamiento por defecto en el admin
    ordering = ['-fecha', '-hora']
    
    # Número de elementos por página
    list_per_page = 20
    
    # Mostrar enlaces rápidos para campos relacionados
    list_select_related = ['cliente', 'creado_por']
    
    # Acciones personalizadas para el admin
    actions = ['marcar_como_finalizadas', 'marcar_como_canceladas']
    
    def marcar_como_finalizadas(self, request, queryset):
        """Acción personalizada para marcar visitas como finalizadas"""
        updated = queryset.update(estado='finalizada')
        self.message_user(
            request, 
            f'{updated} visitas marcadas como finalizadas correctamente.'
        )
    marcar_como_finalizadas.short_description = "Marcar visitas seleccionadas como finalizadas"
    
    def marcar_como_canceladas(self, request, queryset):
        """Acción personalizada para marcar visitas como canceladas"""
        updated = queryset.update(estado='cancelada')
        self.message_user(
            request, 
            f'{updated} visitas marcadas como canceladas correctamente.'
        )
    marcar_como_canceladas.short_description = "Marcar visitas seleccionadas como canceladas"
    
    def get_queryset(self, request):
        """Optimizar queryset para el admin"""
        return super().get_queryset(request).select_related('cliente', 'creado_por')
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Personalizar los campos ForeignKey en el admin"""
        if db_field.name == "creado_por":
            # Limitar las opciones para el campo creado_por
            kwargs["initial"] = request.user.id
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
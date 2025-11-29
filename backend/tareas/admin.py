from django.contrib import admin
from .models import Tarea

@admin.register(Tarea)
class TareaAdmin(admin.ModelAdmin):
    """Configuración del panel de administración para el modelo Tarea"""
    
    # Configuración de la lista principal
    list_display = [
        'nombre', 
        'fecha', 
        'hora_inicio', 
        'hora_fin',
        'prioridad',
        'finalizada',
        'empleados_count'
    ]
    
    # Filtros laterales para navegación rápida
    list_filter = [
        'prioridad', 
        'fecha',
        'finalizada',
        'empleados'
    ]
    
    # Campos para búsqueda en la barra de búsqueda
    search_fields = [
        'nombre',
        'descripcion',
        'empleados__username',
        'empleados__first_name',
        'empleados__last_name'
    ]
    
    # Campos que no pueden ser editados en el admin
    readonly_fields = [
        'creado_en', 
        'actualizado_en',
        'fecha_finalizacion',
        'empleados_count'
    ]
    
    # Navegación por fechas en la parte superior
    date_hierarchy = 'fecha'
    
    # Organización de campos en el formulario de edición
    fieldsets = (
        ('Información Principal', {
            'fields': (
                'nombre',
                'descripcion',
                'fecha',
                'hora_inicio', 
                'hora_fin',
                'prioridad'
            )
        }),
        ('Asignación y Estado', {
            'fields': (
                'empleados',
                'finalizada',
                'fecha_finalizacion'
            )
        }),
        ('Metadata', {
            'fields': (
                'creado_en', 
                'actualizado_en',
                'empleados_count'
            ),
            'classes': ('collapse',)  # Sección colapsable
        }),
    )
    
    # Filtro horizontal para la relación muchos-a-muchos
    filter_horizontal = ['empleados']
    
    # Ordenamiento por defecto en el admin
    ordering = ['-fecha', '-hora_inicio']
    
    # Número de elementos por página
    list_per_page = 25
    
    # Campos editables directamente desde la lista
    list_editable = ['prioridad', 'finalizada']
    
    # Mostrar enlaces rápidos para campos relacionados
    list_select_related = True
    
    # Acciones personalizadas para el admin
    actions = ['marcar_como_finalizadas', 'marcar_como_pendientes']
    
    def empleados_count(self, obj):
        """Muestra el número de empleados asignados a la tarea"""
        return obj.empleados.count()
    empleados_count.short_description = 'Empleados Asignados'
    
    def marcar_como_finalizadas(self, request, queryset):
        """Acción personalizada para marcar tareas como finalizadas"""
        from django.utils import timezone
        updated = queryset.update(finalizada=True, fecha_finalizacion=timezone.now())
        self.message_user(
            request, 
            f'{updated} tareas marcadas como finalizadas correctamente.'
        )
    marcar_como_finalizadas.short_description = "Marcar tareas seleccionadas como finalizadas"
    
    def marcar_como_pendientes(self, request, queryset):
        """Acción personalizada para marcar tareas como pendientes"""
        updated = queryset.update(finalizada=False, fecha_finalizacion=None)
        self.message_user(
            request, 
            f'{updated} tareas marcadas como pendientes correctamente.'
        )
    marcar_como_pendientes.short_description = "Marcar tareas seleccionadas como pendientes"
    
    def get_queryset(self, request):
        """Optimizar queryset para el admin con prefetch de empleados"""
        return super().get_queryset(request).prefetch_related('empleados')
    
    def formfield_for_manytomany(self, db_field, request, **kwargs):
        """Personalizar el widget para la relación muchos-a-muchos"""
        if db_field.name == "empleados":
            # Puedes agregar filtros personalizados aquí si es necesario
            kwargs["queryset"] = db_field.related_model.objects.filter(is_active=True)
        return super().formfield_for_manytomany(db_field, request, **kwargs)
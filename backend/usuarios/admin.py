from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import Usuario, VerificacionEmail


@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    """Configuración del admin para el modelo Usuario"""
    
    list_display = [
        'email', 'username', 'full_name_display', 'rol',
        'is_active', 'email_verified', 'date_joined'
    ]
    list_filter = ['rol', 'is_active', 'email_verified', 'is_staff', 'date_joined']
    search_fields = ['email', 'username', 'first_name', 'last_name', 'dni']
    ordering = ['-date_joined']
    
    fieldsets = (
        ('Credenciales', {
            'fields': ('email', 'username', 'password')
        }),
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'telefono', 'dni', 'direccion', 'foto_perfil')
        }),
        ('Permisos y Rol', {
            'fields': ('rol', 'is_active', 'is_staff', 'is_superuser', 'email_verified', 'groups', 'user_permissions')
        }),
        ('Fechas Importantes', {
            'fields': ('last_login', 'date_joined')
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'password1', 'password2', 'first_name', 'last_name', 'rol'),
        }),
    )
    
    readonly_fields = ['date_joined', 'last_login']
    
    def full_name_display(self, obj):
        """Mostrar nombre completo"""
        return obj.get_full_name() or '-'
    full_name_display.short_description = 'Nombre Completo'
    
    def get_queryset(self, request):
        """Optimizar consultas"""
        qs = super().get_queryset(request)
        return qs.select_related()
    
    actions = ['activate_users', 'deactivate_users', 'verify_emails']
    
    def activate_users(self, request, queryset):
        """Activar usuarios seleccionados"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} usuario(s) activado(s) exitosamente.')
    activate_users.short_description = 'Activar usuarios seleccionados'
    
    def deactivate_users(self, request, queryset):
        """Desactivar usuarios seleccionados"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} usuario(s) desactivado(s) exitosamente.')
    deactivate_users.short_description = 'Desactivar usuarios seleccionados'
    
    def verify_emails(self, request, queryset):
        """Verificar emails de usuarios seleccionados"""
        updated = queryset.update(email_verified=True)
        self.message_user(request, f'{updated} email(s) verificado(s) exitosamente.')
    verify_emails.short_description = 'Verificar emails seleccionados'


@admin.register(VerificacionEmail)
class VerificacionEmailAdmin(admin.ModelAdmin):  # ✅ CORRECTO: admin.ModelAdmin
    """Configuración del admin para VerificacionEmail"""
    
    list_display = ['usuario', 'token_display', 'created_at', 'expires_at', 'usado', 'status_display']
    list_filter = ['usado', 'created_at', 'expires_at']
    search_fields = ['usuario__email', 'token']
    readonly_fields = ['created_at', 'token', 'usuario']
    ordering = ['-created_at']
    
    def token_display(self, obj):
        """Mostrar token truncado"""
        return f"{obj.token[:20]}..." if obj.token else '-'
    token_display.short_description = 'Token'
    
    def status_display(self, obj):
        """Mostrar estado del token"""
        if obj.usado:
            return format_html('<span style="color: gray;">✓ Usado</span>')
        elif obj.is_expired:
            return format_html('<span style="color: red;">✗ Expirado</span>')
        else:
            return format_html('<span style="color: green;">✓ Válido</span>')
    status_display.short_description = 'Estado'
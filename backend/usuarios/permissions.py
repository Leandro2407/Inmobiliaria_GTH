from rest_framework import permissions


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Permiso personalizado para permitir que solo el propietario del objeto
    o un administrador puedan editarlo.
    """
    
    def has_object_permission(self, request, view, obj):
        # Los permisos de lectura están permitidos para cualquier request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Los administradores tienen acceso completo
        if request.user.is_staff or request.user.is_administrador:
            return True
        
        # El propietario puede editar su propio objeto
        return obj == request.user


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permiso que permite lectura a todos pero escritura solo a administradores.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return request.user and (request.user.is_staff or request.user.is_administrador)


class IsClienteOrStaff(permissions.BasePermission):
    """
    Permiso para clientes y staff.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsAgenteOrAdmin(permissions.BasePermission):
    """
    Permiso solo para agentes y administradores.
    """
    
    def has_permission(self, request, view):
        return request.user and (
            request.user.is_agente or 
            request.user.is_administrador or 
            request.user.is_staff
        )


class IsAdminOnly(permissions.BasePermission):
    """
    Permiso solo para administradores.
    """
    
    def has_permission(self, request, view):
        return request.user and (request.user.is_administrador or request.user.is_staff)


# Alias para compatibilidad
IsAgenteOrAdmin = IsAgenteOrAdmin

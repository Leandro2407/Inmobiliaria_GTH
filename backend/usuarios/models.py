from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator

class UsuarioManager(BaseUserManager):
    """Manager personalizado para el modelo Usuario"""
    
    def create_user(self, email, username, password=None, **extra_fields):
        """Crear y guardar un usuario regular"""
        if not email:
            raise ValueError('El usuario debe tener un email')
        if not username:
            raise ValueError('El usuario debe tener un nombre de usuario')
        
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, username, password=None, **extra_fields):
        """Crear y guardar un superusuario"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('rol', 'administrador')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser debe tener is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser debe tener is_superuser=True.')
        
        return self.create_user(email, username, password, **extra_fields)


class Usuario(AbstractBaseUser, PermissionsMixin):
    """Modelo de usuario personalizado que soporta email como username"""
    
    ROLES = [
        ('cliente', 'Cliente'),
        ('agente', 'Agente Inmobiliario'),
        ('administrador', 'Administrador'),
    ]
    
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="El número de teléfono debe estar en el formato: '+999999999'. Hasta 15 dígitos permitidos."
    )
    
    # Campos principales
    email = models.EmailField('Email', unique=True, max_length=255)
    username = models.CharField('Nombre de usuario', max_length=150, unique=True)
    
    # Información personal
    first_name = models.CharField('Nombre', max_length=150, blank=True)
    last_name = models.CharField('Apellido', max_length=150, blank=True)
    telefono = models.CharField('Teléfono', validators=[phone_regex], max_length=17, blank=True)
    dni = models.CharField('DNI', max_length=20, blank=True, null=True)
    fecha_nacimiento = models.DateField('Fecha de Nacimiento', blank=True, null=True)
    
    # --- Campos de Dirección y Perfil (MODIFICADOS) ---
    ciudad = models.CharField('Ciudad', max_length=100, default='Salta', blank=True)
    
    # Domicilio (para empleados)
    barrio = models.CharField('Barrio', max_length=100, blank=True, default='')
    calle = models.CharField('Calle', max_length=200, blank=True, default='')
    numeracion = models.CharField('Numeración', max_length=20, blank=True, default='')
    
    # Empleado
    puesto = models.CharField('Puesto', max_length=100, blank=True, default='')
    
    # Cliente
    ciudad_interes = models.CharField('Ciudad de Interés', max_length=100, blank=True, default='')
    intereses = models.CharField('Intereses', max_length=50, blank=True, default='') # ej: comprar, alquilar
    
    # DEPRECADO (usar barrio, calle, numeracion) - Se mantiene por "no cambiar nada mas"
    direccion = models.CharField('Dirección', max_length=255, blank=True) 
    
    # Foto de perfil
    foto_perfil = models.ImageField('Foto de perfil', upload_to='usuarios/perfiles/', blank=True, null=True)
    
    # Rol y permisos
    rol = models.CharField('Rol', max_length=20, choices=ROLES, default='cliente')
    
    # Estado de la cuenta
    is_active = models.BooleanField('Activo', default=True)
    is_staff = models.BooleanField('Staff', default=False)
    is_superuser = models.BooleanField('Superusuario', default=False)
    email_verified = models.BooleanField('Email verificado', default=False)
    
    # Fechas
    date_joined = models.DateTimeField('Fecha de registro', default=timezone.now)
    last_login = models.DateTimeField('Último login', blank=True, null=True)
    updated_at = models.DateTimeField('Actualizado', auto_now=True)
    
    objects = UsuarioManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['username']),
            models.Index(fields=['rol']),
        ]
    
    def __str__(self):
        return f"{self.email} ({self.get_rol_display()})"
    
    def get_full_name(self):
        """Retorna el nombre completo del usuario"""
        return f"{self.first_name} {self.last_name}".strip() or self.username
    
    def get_short_name(self):
        """Retorna el nombre corto del usuario"""
        return self.first_name or self.username
    
    @property
    def is_cliente(self):
        """Verifica si el usuario es cliente"""
        return self.rol == 'cliente'
    
    @property
    def is_agente(self):
        """Verifica si el usuario es agente"""
        return self.rol == 'agente'
    
    @property
    def is_administrador(self):
        """Verifica si el usuario es administrador"""
        return self.rol == 'administrador'
    
    @property
    def has_profile_complete(self):
        """Verifica si el perfil está completo"""
        # Actualizado para chequear los nuevos campos de empleado
        if self.is_cliente:
             return all([
                self.first_name,
                self.last_name,
                self.telefono,
            ])
        else:
             return all([
                self.first_name,
                self.last_name,
                self.telefono,
                self.dni,
                self.calle,
                self.ciudad
            ])


class VerificacionEmail(models.Model):
    """Modelo para tokens de verificación de email"""
    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name='verificaciones')
    token = models.CharField('Token', max_length=255, unique=True)
    created_at = models.DateTimeField('Creado', auto_now_add=True)
    expires_at = models.DateTimeField('Expira')
    usado = models.BooleanField('Usado', default=False)
    
    class Meta:
        verbose_name = 'Verificación de Email'
        verbose_name_plural = 'Verificaciones de Email'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Verificación de {self.usuario.email}"
    
    @property
    def is_expired(self):
        """Verifica si el token ha expirado"""
        return timezone.now() > self.expires_at
    
    @property
    def is_valid(self):
        """Verifica si el token es válido"""
        return not self.usado and not self.is_expired

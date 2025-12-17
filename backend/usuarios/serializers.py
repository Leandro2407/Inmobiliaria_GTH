from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

Usuario = get_user_model()


class UsuarioSerializer(serializers.ModelSerializer):
    """
    Serializer básico para Usuario.
    """
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'telefono', 'dni', 'fecha_nacimiento', 'ciudad', 'barrio', 
            'calle', 'numeracion', 'puesto', 'ciudad_interes', 'intereses',
            'foto_perfil', 'rol', 'is_active', 'email_verified', 
            'date_joined', 'full_name'
        ]
        read_only_fields = ['id', 'date_joined', 'email_verified', 'full_name', 'rol']


class AgenteSerializer(serializers.ModelSerializer):
    """
    Serializer optimizado para listar agentes en selectores y fichas públicas.
    Solo expone información pública.
    """
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = Usuario
        fields = ['id', 'full_name', 'email', 'telefono', 'foto_perfil', 'rol', 'puesto']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer para registro de nuevos usuarios"""
    
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=Usuario.objects.all())]
    )
    username = serializers.CharField(
        required=True,
        validators=[UniqueValidator(queryset=Usuario.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    
    class Meta:
        model = Usuario
        fields = [
            'email', 'username', 'password', 'password2',
            'first_name', 'last_name', 'telefono', 'rol'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True}
        }
    
    def validate(self, attrs):
        """Validar que las contraseñas coincidan"""
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Las contraseñas no coinciden."}
            )
        return attrs
    
    def validate_rol(self, value):
        """Solo permitir registro como cliente por defecto"""
        if value not in ['cliente', '']:
            raise serializers.ValidationError(
                "Los nuevos usuarios solo pueden registrarse como clientes."
            )
        return value or 'cliente'
    
    def create(self, validated_data):
        """Crear nuevo usuario"""
        validated_data.pop('password2')
        
        # Asegurar que el rol sea cliente por defecto
        if 'rol' not in validated_data or not validated_data['rol']:
            validated_data['rol'] = 'cliente'
        
        user = Usuario.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            telefono=validated_data.get('telefono', ''),
            rol=validated_data['rol']
        )
        
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer personalizado para JWT que incluye datos del usuario.
    """
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Agregar datos personalizados al token
        token['email'] = user.email
        token['username'] = user.username
        token['rol'] = user.rol
        token['full_name'] = user.get_full_name()
        
        return token
    
    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Agregar datos extra a la respuesta
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'username': self.user.username,
            'full_name': self.user.get_full_name(),
            'rol': self.user.rol,
            'is_active': self.user.is_active,
            'email_verified': self.user.email_verified,
            'foto_perfil': self.user.foto_perfil.url if self.user.foto_perfil else None,
            
            # --- Campos Agregados ---
            'first_name': self.user.first_name,
            'last_name': self.user.last_name,
            'telefono': self.user.telefono,
            'dni': self.user.dni,
            'fecha_nacimiento': self.user.fecha_nacimiento,
            'ciudad': self.user.ciudad,
            'barrio': self.user.barrio,
            'calle': self.user.calle,
            'numeracion': self.user.numeracion,
            'puesto': self.user.puesto,
            'ciudad_interes': self.user.ciudad_interes,
            'intereses': self.user.intereses,
        }
        
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer para cambio de contraseña"""
    
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    new_password2 = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError(
                {"new_password": "Las contraseñas no coinciden."}
            )
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("La contraseña actual es incorrecta.")
        return value


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para actualización de perfil.
    """
    
    class Meta:
        model = Usuario
        fields = [
            'first_name', 'last_name', 'email', 'telefono',
            'dni', 'fecha_nacimiento', 'ciudad', 'barrio', 
            'calle', 'numeracion', 'puesto', 'ciudad_interes', 
            'intereses', 'foto_perfil'
        ]
        extra_kwargs = {
            'email': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }
    
    def validate_foto_perfil(self, value):
        """Validar tamaño de imagen"""
        if value and value.size > 5 * 1024 * 1024:  # 5MB
            raise serializers.ValidationError(
                "La imagen no puede superar los 5MB."
            )
        return value
    
    def validate_email(self, value):
        """Validar que el email sea único"""
        user = self.context['request'].user
        if Usuario.objects.exclude(id=user.id).filter(email=value).exists():
            raise serializers.ValidationError("Este email ya está en uso por otro usuario.")
        return value


class EmpleadoProfileSerializer(serializers.ModelSerializer):
    """Serializer para perfil de empleados (agentes y administradores)"""
    
    fecha_nacimiento = serializers.DateField(required=False, allow_null=True)
    puesto = serializers.CharField(source='rol', read_only=True)
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'telefono', 'dni', 'fecha_nacimiento', 'ciudad', 'direccion',
            'foto_perfil', 'puesto', 'rol', 'date_joined'
        ]
        read_only_fields = ['id', 'email', 'username', 'date_joined', 'rol']


class ClienteProfileSerializer(serializers.ModelSerializer):
    """Serializer para perfil de clientes"""
    
    intereses = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Usuario
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'telefono', 'ciudad', 'foto_perfil', 'date_joined'
        ]
        read_only_fields = ['id', 'username', 'date_joined']


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer para solicitud de reseteo de contraseña"""
    
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        if not Usuario.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "No existe un usuario con este email."
            )
        return value


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer para confirmar reseteo de contraseña"""
    
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password]
    )
    new_password2 = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError(
                {"new_password": "Las contraseñas no coinciden."}
            )
        return attrs
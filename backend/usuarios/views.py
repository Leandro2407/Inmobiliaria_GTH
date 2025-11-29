from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import secrets

from .serializers import (
    UsuarioSerializer, RegisterSerializer, CustomTokenObtainPairSerializer,
    ChangePasswordSerializer, ProfileUpdateSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)
from .models import VerificacionEmail

Usuario = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Vista para registro de nuevos usuarios"""
    queryset = Usuario.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generar token de verificación de email
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(days=1)
        
        VerificacionEmail.objects.create(
            usuario=user,
            token=token,
            expires_at=expires_at
        )
        
        # TODO: Enviar email de verificación
        # send_verification_email(user.email, token)
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UsuarioSerializer(user).data,
            'message': 'Usuario registrado exitosamente. Por favor verifica tu email.',
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class CustomTokenObtainPairView(TokenObtainPairView):
    """Vista personalizada para obtener tokens JWT con datos del usuario"""
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """Vista para cerrar sesión (blacklist del refresh token)"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if not refresh_token:
                return Response(
                    {'error': 'Se requiere el refresh token'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            return Response(
                {'message': 'Sesión cerrada exitosamente'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': 'Token inválido o ya expirado'},
                status=status.HTTP_400_BAD_REQUEST
            )


class ProfileView(generics.RetrieveUpdateAPIView):
    """Vista para ver y actualizar perfil del usuario autenticado"""
    serializer_class = UsuarioSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', True)
        instance = self.get_object()
        
        serializer = ProfileUpdateSerializer(
            instance, 
            data=request.data, 
            partial=partial, 
            context={'request': request}
        )
        
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Retornar con el serializer completo
        return Response(UsuarioSerializer(instance).data)


class ChangePasswordView(APIView):
    """Vista para cambiar contraseña"""
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response(
                {'message': 'Contraseña actualizada exitosamente'},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """Vista para solicitar reseteo de contraseña"""
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        
        if serializer.is_valid():
            email = serializer.validated_data['email']
            user = Usuario.objects.get(email=email)
            
            # Generar token de reseteo
            token = secrets.token_urlsafe(32)
            expires_at = timezone.now() + timedelta(hours=2)
            
            VerificacionEmail.objects.create(
                usuario=user,
                token=token,
                expires_at=expires_at
            )
            
            # TODO: Enviar email con link de reseteo
            # send_password_reset_email(user.email, token)
            
            return Response(
                {'message': 'Se ha enviado un email con instrucciones para resetear tu contraseña'},
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    """Vista para confirmar reseteo de contraseña"""
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        
        if serializer.is_valid():
            token = serializer.validated_data['token']
            
            try:
                verificacion = VerificacionEmail.objects.get(token=token)
                
                if not verificacion.is_valid:
                    return Response(
                        {'error': 'El token ha expirado o ya fue usado'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                user = verificacion.usuario
                user.set_password(serializer.validated_data['new_password'])
                user.save()
                
                # Marcar token como usado
                verificacion.usado = True
                verificacion.save()
                
                return Response(
                    {'message': 'Contraseña restablecida exitosamente'},
                    status=status.HTTP_200_OK
                )
                
            except VerificacionEmail.DoesNotExist:
                return Response(
                    {'error': 'Token inválido'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
    """Vista para verificar email"""
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        token = request.data.get('token')
        
        if not token:
            return Response(
                {'error': 'Se requiere el token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            verificacion = VerificacionEmail.objects.get(token=token)
            
            if not verificacion.is_valid:
                return Response(
                    {'error': 'El token ha expirado o ya fue usado'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            user = verificacion.usuario
            user.email_verified = True
            user.save()
            
            verificacion.usado = True
            verificacion.save()
            
            return Response(
                {'message': 'Email verificado exitosamente'},
                status=status.HTTP_200_OK
            )
            
        except VerificacionEmail.DoesNotExist:
            return Response(
                {'error': 'Token inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )


class UserDetailView(generics.RetrieveAPIView):
    """Vista para obtener detalles de un usuario (solo para staff)"""
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        # Los clientes solo pueden ver su propio perfil
        if self.request.user.is_cliente:
            return Usuario.objects.filter(id=self.request.user.id)
        # Staff puede ver todos
        return Usuario.objects.all()


class UserListView(generics.ListAPIView):
    """Vista para listar usuarios (solo para staff)"""
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = (permissions.IsAuthenticated,)
    
    def get_queryset(self):
        # Solo staff puede ver lista de usuarios
        if not self.request.user.is_staff:
            return Usuario.objects.filter(id=self.request.user.id)
        
        queryset = Usuario.objects.all()
        
        # Filtros opcionales
        rol = self.request.query_params.get('rol', None)
        if rol:
            queryset = queryset.filter(rol=rol)
        
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        return queryset
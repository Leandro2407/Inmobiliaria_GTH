from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    CustomTokenObtainPairView,
    LogoutView,
    ProfileView,
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    VerifyEmailView,
    UserDetailView,
    UserListView,
)

app_name = 'usuarios'

urlpatterns = [
    # Autenticación
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Perfil
    path('profile/', ProfileView.as_view(), name='profile'),
    path('profile/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    
    # Gestión de contraseña
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Verificación de email
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    
    # Lista de usuarios (admin)
    path('users/', UserListView.as_view(), name='user_list'),
]

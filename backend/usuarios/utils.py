from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

def send_password_reset_email(user, token):
    """
    Envía email de recuperación de contraseña
    """
    subject = \'Recuperación de contraseña - Inmobiliaria GTH\'
    
    # Crear el link de reseteo
    reset_link = f"{settings.FRONTEND_URL}/reset-password/{token}"
    
    # Contexto para el template
    context = {
        \'user\': user,
        \'reset_link\': reset_link,
        \'site_name\': \'Inmobiliaria GTH\'
    }
    
    # Renderizar template HTML
    html_message = render_to_string(\'emails/password_reset.html\', context)
    plain_message = strip_tags(html_message)
    
    # Enviar email
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )

def send_verification_email(user, token):
    """
    Envía email de verificación de cuenta
    """
    subject = \'Verifica tu cuenta - Inmobiliaria GTH\'
    
    # Crear el link de verificación
    verification_link = f"{settings.FRONTEND_URL}/verify-email/{token}"
    
    # Contexto para el template
    context = {
        \'user\': user,
        \'verification_link\': verification_link,
        \'site_name\': \'Inmobiliaria GTH\'
    }
    
    # Renderizar template HTML
    html_message = render_to_string(\'emails/email_verification.html\', context)
    plain_message = strip_tags(html_message)
    
    # Enviar email
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.EMAIL_HOST_USER,
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )

from datetime import date, time, timedelta

from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from clientes.models import Cliente
from propiedades.models import Propiedad
from visitas.models import SolicitudVisita

Usuario = get_user_model()


class SolicitudVisitaCancellationTests(TestCase):
    def setUp(self):
        self.admin = Usuario.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpass123',
            first_name='Admin',
            last_name='Test'
        )

        self.cliente_user = Usuario.objects.create_user(
            email='cliente@example.com',
            username='cliente',
            password='cliente123',
            first_name='Cliente',
            last_name='Test',
            rol='cliente'
        )

        self.cliente, _ = Cliente.objects.get_or_create(
            email=self.cliente_user.email,
            defaults={
                'nombre': 'Cliente',
                'apellido': 'Test',
                'dni': '12345678',
                'telefono': '+5491111111111',
                'domicilio': 'Calle Falsa 123',
                'ciudad': 'Salta',
                'categoria': 'compra',
                'estado': 'activo',
                'creado_por': self.admin,
            }
        )

        self.propiedad = Propiedad.objects.create(
            titulo='Depa Prueba',
            descripcion='Propiedad de prueba para tests',
            tipo='departamento',
            operacion='venta',
            estado='disponible',
            precio_venta=100000.00,
            superficie_total=60.0,
            superficie_cubierta=55.0,
            dormitorios=2,
            banos=1,
            cocheras=0,
            direccion='Calle Falsa 123',
            barrio='Centro',
            ciudad='Salta',
            provincia='Salta',
            codigo_postal='4400',
            zona='norte',
            caracteristicas='Test',
            creado_por=self.admin
        )

        self.client_api = APIClient()

    def test_cancel_approved_solicitud_cancels_associated_visita(self):
        solicitud = SolicitudVisita.objects.create(
            cliente=self.cliente,
            propiedad=self.propiedad,
            mensaje='Solicitud de prueba',
        )

        fecha_visita = date.today() + timedelta(days=1)
        hora_visita = time(hour=10, minute=0)
        visita = solicitud.aprobar(self.admin, fecha_visita, hora_visita)

        self.assertEqual(solicitud.estado, 'aprobada')
        self.assertTrue(solicitud.puede_ser_cancelada)
        self.assertEqual(visita.estado, 'pendiente')

        solicitud.cancelar('Ya no puedo asistir')
        visita.refresh_from_db()
        solicitud.refresh_from_db()

        self.assertEqual(solicitud.estado, 'cancelada')
        self.assertEqual(visita.estado, 'cancelada')
        self.assertIn('Motivo de la cancelación', solicitud.mensaje)

    def test_cliente_can_cancel_solicitud_via_api(self):
        solicitud = SolicitudVisita.objects.create(
            cliente=self.cliente,
            propiedad=self.propiedad,
            mensaje='Solicitud API',
        )

        fecha_visita = date.today() + timedelta(days=2)
        hora_visita = time(hour=15, minute=30)
        solicitud.aprobar(self.admin, fecha_visita, hora_visita)

        self.client_api.force_authenticate(user=self.cliente_user)
        response = self.client_api.post(
            f'/api/visitas/solicitudes/{solicitud.id}/cancelar/',
            {'motivo': 'Cambio de planes'},
            format='json'
        )

        self.assertEqual(response.status_code, 200)
        solicitud.refresh_from_db()
        self.assertEqual(solicitud.estado, 'cancelada')
        self.assertIsNotNone(solicitud.visita_creada)
        self.assertEqual(solicitud.visita_creada.estado, 'cancelada')

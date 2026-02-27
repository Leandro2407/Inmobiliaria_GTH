from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

Usuario = get_user_model()


class EmpleadoCreateTests(TestCase):
	def setUp(self):
		self.admin = Usuario.objects.create_superuser(
			email='admin@example.com',
			username='admin',
			password='adminpass123'
		)
		self.client = APIClient()

	def test_admin_can_create_agente(self):
		self.client.force_authenticate(user=self.admin)
		payload = {
			'email': 'agente1@example.com',
			'username': 'agente1',
			'first_name': 'Agente',
			'last_name': 'Uno',
			'telefono': '+549387000000',
			'rol': 'agente',
			'password': 'strongpass123',
			'password2': 'strongpass123'
		}

		# La app 'usuarios' está incluida en 'api/auth/' en el proyecto
		response = self.client.post('/api/auth/empleados/', payload, format='json')
		self.assertEqual(response.status_code, 201)
		self.assertTrue(Usuario.objects.filter(email='agente1@example.com', rol='agente').exists())

	def test_non_admin_cannot_create_empleado(self):
		# Crear usuario normal
		user = Usuario.objects.create_user(email='user@example.com', username='user', password='userpass123')
		self.client.force_authenticate(user=user)
		payload = {
			'email': 'agente2@example.com',
			'username': 'agente2',
			'first_name': 'Agente',
			'last_name': 'Dos',
			'telefono': '+549387000001',
			'rol': 'agente',
			'password': 'strongpass123',
			'password2': 'strongpass123'
		}
		response = self.client.post('/api/auth/empleados/', payload, format='json')
		self.assertIn(response.status_code, (401, 403))
		self.assertFalse(Usuario.objects.filter(email='agente2@example.com').exists())

	def test_register_creates_cliente_record(self):
		"""Al registrarse como cliente debe aparecer un objeto Cliente."""
		# ningún usuario autenticado es necesario (AllowAny)
		payload = {
		    'email': 'cliente1@example.com',
		    'username': 'cliente1',
		    'first_name': 'Cliente',
		    'last_name': 'Uno',
		    'telefono': '+549387000002',
		    # rol no se envía para usar el default
		    'password': 'passFuerte123',
		    'password2': 'passFuerte123'
		}
		response = self.client.post('/api/auth/register/', payload, format='json')
		self.assertEqual(response.status_code, 201)
		self.assertTrue(Usuario.objects.filter(email='cliente1@example.com', rol='cliente').exists())
		# cliente asociado
		from clientes.models import Cliente
		self.assertTrue(Cliente.objects.filter(email='cliente1@example.com').exists())


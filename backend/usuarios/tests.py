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

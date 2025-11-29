import api from './api';

const contratoService = {
  // Obtener todos los contratos
  getAll: async () => {
    try {
      console.log('🔄 Solicitando contratos desde: /contratos/');
      const response = await api.get('/contratos/');
      console.log('✅ Respuesta de contratos:', response.data);
      
      // ✅ Asegurar que siempre devolvemos un array
      let contratosData = response.data;
      
      if (!Array.isArray(contratosData)) {
        if (contratosData && Array.isArray(contratosData.results)) {
          contratosData = contratosData.results;
        } else if (contratosData && typeof contratosData === 'object') {
          contratosData = [contratosData];
        } else {
          contratosData = [];
        }
      }
      
      return contratosData;
    } catch (error) {
      console.error('❌ Error en contratoService.getAll:', error);
      if (error.response?.status === 404) {
        console.error('❌ Endpoint no encontrado. Verifica que la API de contratos esté configurada en el backend.');
        throw new Error('Servicio de contratos no disponible. Verifica la configuración del backend.');
      }
      throw error;
    }
  },

  // Obtener un contrato por ID
  getById: async (id) => {
    try {
      const response = await api.get(`/contratos/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error en contratoService.getById:', error);
      throw error;
    }
  },

  // Crear un nuevo contrato
  create: async (contratoData) => {
    try {
      console.log('📤 Enviando datos al backend:', contratoData);
      const response = await api.post('/contratos/', contratoData);
      console.log('✅ Respuesta del backend:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error en contratoService.create:', error);
      console.error('Detalles del error:', error.response?.data);
      throw error;
    }
  },

  // Actualizar un contrato
  update: async (id, contratoData) => {
    try {
      const response = await api.put(`/contratos/${id}/`, contratoData);
      return response.data;
    } catch (error) {
      console.error('Error en contratoService.update:', error);
      throw error;
    }
  },

  // Eliminar un contrato
  delete: async (id) => {
    try {
      const response = await api.delete(`/contratos/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error en contratoService.delete:', error);
      throw error;
    }
  },

  // Obtener contratos por cliente
  getByCliente: async (clienteId) => {
    try {
      const response = await api.get(`/contratos/?cliente_id=${clienteId}`);
      return response.data;
    } catch (error) {
      console.error('Error en contratoService.getByCliente:', error);
      throw error;
    }
  },
};

export default contratoService;
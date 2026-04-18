import api from './api';

// Servicio para gestionar todas las operaciones relacionadas con visitas
const visitaService = {
  /**
   * Obtener todas las visitas con filtros opcionales
   */
  getAll: async (params = {}) => {
    try {
      console.log('📄 Llamando a API visitas con params:', params);
      const response = await api.get('/visitas/visitas/', { params });
      console.log('✅ Respuesta de visitas:', response);
      
      return response.data.results || response.data;
    } catch (error) {
      console.error('❌ Error en visitaService.getAll:', error);
      console.error('📡 Status:', error.response?.status);
      console.error('📦 Data:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Obtener una visita específica por ID
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/visitas/visitas/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Crear una nueva visita
   */
  create: async (visitaData) => {
    try {
      console.log('📤 CREATE - Datos enviados:', visitaData);
      const response = await api.post('/visitas/visitas/', visitaData);
      console.log('✅ CREATE - Respuesta completa:', response);
      console.log('✅ CREATE - response.data:', response.data);
      console.log('✅ CREATE - response.status:', response.status);
      
      return response.data;
    } catch (error) {
      console.error('❌ CREATE - Error:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Actualizar una visita existente (actualización parcial)
   */
  update: async (id, visitaData) => {
    try {
      console.log(`📤 UPDATE - Visita ${id} - Datos enviados:`, visitaData);
      
      const response = await api.patch(`/visitas/visitas/${id}/`, visitaData);
      
      console.log('✅ UPDATE - Respuesta:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ UPDATE - Error visita ${id}:`, error.response?.data);
      console.error('📋 Status:', error.response?.status);
      throw error.response?.data || error;
    }
  },

  /**
   * Actualización parcial (alias para update)
   */
  partialUpdate: async (id, visitaData) => {
    try {
      console.log(`📤 PARTIAL UPDATE - Visita ${id}:`, visitaData);
      const response = await api.patch(`/visitas/visitas/${id}/`, visitaData);
      return response.data;
    } catch (error) {
      console.error(`❌ PARTIAL UPDATE - Error:`, error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Eliminar una visita
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/visitas/visitas/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Cambiar el estado de una visita
   */
  cambiarEstado: async (id, estado) => {
    try {
      console.log(`📤 CAMBIAR ESTADO - Visita ${id} a '${estado}'`);
      const response = await api.post(`/visitas/visitas/${id}/cambiar_estado/`, { estado });
      console.log('✅ CAMBIAR ESTADO - Respuesta:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ CAMBIAR ESTADO - Error:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Obtener visitas de un cliente específico
   */
  getPorCliente: async (clienteId) => {
    try {
      const response = await api.get(`/visitas/visitas/por_cliente/?cliente_id=${clienteId}`);
      return response.data.results || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Obtener las próximas visitas programadas
   */
  getProximasVisitas: async () => {
    try {
      const response = await api.get('/visitas/visitas/proximas_visitas/');
      return response.data.results || response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * 🆕 Obtener información de clientes bloqueados por tiempo de espera
   */
  getClientesBloqueados: async () => {
    try {
      console.log('📤 Obteniendo clientes bloqueados...');
      const response = await api.get('/visitas/visitas/clientes_bloqueados/');
      console.log('✅ Clientes bloqueados:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al obtener clientes bloqueados:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * 🆕 Verificar si un cliente específico puede agendar una visita
   */
  verificarCliente: async (clienteId) => {
    try {
      console.log(`📤 Verificando cliente ${clienteId}...`);
      const response = await api.post('/visitas/visitas/verificar_cliente/', { cliente_id: clienteId });
      console.log('✅ Verificación de cliente:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al verificar cliente:', error.response?.data);
      throw error.response?.data || error;
    }
  }
};

export default visitaService;
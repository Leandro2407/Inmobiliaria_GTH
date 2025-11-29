import api from './api';

// Servicio para gestionar todas las operaciones relacionadas con clientes
const clienteService = {
  /**
   * Obtener lista de clientes con filtros opcionales
   * @param {Object} params - Parámetros de filtrado (opcional)
   * @returns {Promise} Promesa con los datos de clientes
   */
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/clientes/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Obtener un cliente específico por ID
   * @param {number|string} id - ID del cliente
   * @returns {Promise} Promesa con los datos del cliente
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/clientes/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Crear un nuevo cliente
   * @param {Object} clienteData - Datos del cliente a crear
   * @returns {Promise} Promesa con el cliente creado
   */
  create: async (clienteData) => {
    try {
      const response = await api.post('/clientes/', clienteData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Actualizar completamente un cliente existente
   * @param {number|string} id - ID del cliente
   * @param {Object} clienteData - Datos actualizados del cliente
   * @returns {Promise} Promesa con el cliente actualizado
   */
  update: async (id, clienteData) => {
    try {
      const response = await api.put(`/clientes/${id}/`, clienteData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Actualizar parcialmente un cliente existente
   * @param {number|string} id - ID del cliente
   * @param {Object} clienteData - Datos parciales a actualizar
   * @returns {Promise} Promesa con el cliente actualizado
   */
  partialUpdate: async (id, clienteData) => {
    try {
      const response = await api.patch(`/clientes/${id}/`, clienteData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Eliminar un cliente
   * @param {number|string} id - ID del cliente a eliminar
   * @returns {Promise} Promesa de confirmación
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/clientes/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Obtener estadísticas de clientes
   * @returns {Promise} Promesa con las estadísticas
   */
  getEstadisticas: async () => {
    try {
      const response = await api.get('/clientes/estadisticas/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Cambiar el estado de un cliente
   * @param {number|string} id - ID del cliente
   * @param {string} estado - Nuevo estado del cliente
   * @returns {Promise} Promesa con el cliente actualizado
   */
  cambiarEstado: async (id, estado) => {
    try {
      const response = await api.post(`/clientes/${id}/cambiar_estado/`, { estado });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default clienteService;
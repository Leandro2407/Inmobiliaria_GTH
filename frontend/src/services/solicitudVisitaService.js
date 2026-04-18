import api from './api';

// Servicio para gestionar todas las operaciones relacionadas con solicitudes de visita
const solicitudVisitaService = {
  /**
   * Obtener todas las solicitudes de visita con filtros opcionales
   */
  getAll: async (params = {}) => {
    try {
      console.log('📄 Llamando a API solicitudes con params:', params);
      const response = await api.get('/visitas/solicitudes/', { params });
      console.log('✅ Respuesta de solicitudes:', response);

      return response.data.results || response.data;
    } catch (error) {
      console.error('❌ Error en solicitudVisitaService.getAll:', error);
      console.error('📡 Status:', error.response?.status);
      console.error('📦 Data:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Obtener una solicitud específica por ID
   */
  getById: async (id) => {
    try {
      const response = await api.get(`/visitas/solicitudes/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Crear una nueva solicitud de visita
   */
  create: async (solicitudData) => {
    try {
      console.log('📤 CREATE SOLICITUD - Datos enviados:', solicitudData);
      const response = await api.post('/visitas/solicitudes/', solicitudData);
      console.log('✅ CREATE SOLICITUD - Respuesta:', response.data);

      return response.data;
    } catch (error) {
      console.error('❌ CREATE SOLICITUD - Error:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Actualizar una solicitud existente
   */
  update: async (id, solicitudData) => {
    try {
      console.log(`📤 UPDATE SOLICITUD - ID ${id} - Datos enviados:`, solicitudData);

      const response = await api.patch(`/visitas/solicitudes/${id}/`, solicitudData);

      console.log('✅ UPDATE SOLICITUD - Respuesta:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ UPDATE SOLICITUD - Error ID ${id}:`, error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Eliminar una solicitud
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/visitas/solicitudes/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Aprobar una solicitud de visita
   */
  aprobar: async (id, fecha, hora) => {
    try {
      console.log(`📤 APROBAR SOLICITUD - ID ${id} - Fecha: ${fecha}, Hora: ${hora}`);
      const response = await api.post(`/visitas/solicitudes/${id}/aprobar/`, { fecha, hora });
      console.log('✅ APROBAR SOLICITUD - Respuesta:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ APROBAR SOLICITUD - Error:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Rechazar una solicitud de visita
   */
  rechazar: async (id, motivo = '') => {
    try {
      console.log(`📤 RECHAZAR SOLICITUD - ID ${id} - Motivo: ${motivo}`);
      const response = await api.post(`/visitas/solicitudes/${id}/rechazar/`, { motivo });
      console.log('✅ RECHAZAR SOLICITUD - Respuesta:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ RECHAZAR SOLICITUD - Error:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Cancelar una solicitud de visita (por el cliente)
   */
  cancelar: async (id, motivo = '') => {
    try {
      console.log(`📤 CANCELAR SOLICITUD - ID ${id} - Motivo: ${motivo}`);
      const response = await api.post(`/visitas/solicitudes/${id}/cancelar/`, { motivo });
      console.log('✅ CANCELAR SOLICITUD - Respuesta:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ CANCELAR SOLICITUD - Error:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Obtener solicitudes pendientes (para agentes/administradores)
   */
  getPendientes: async () => {
    try {
      console.log('📄 Obteniendo solicitudes pendientes...');
      const response = await api.get('/visitas/solicitudes/pendientes/');
      console.log('✅ Solicitudes pendientes:', response.data);
      return response.data.results || response.data;
    } catch (error) {
      console.error('❌ Error al obtener solicitudes pendientes:', error.response?.data);
      throw error.response?.data || error;
    }
  },

  /**
   * Obtener las solicitudes del cliente autenticado
   */
  getMisSolicitudes: async () => {
    try {
      console.log('📄 Obteniendo mis solicitudes...');
      const response = await api.get('/visitas/solicitudes/mis_solicitudes/');
      console.log('✅ Mis solicitudes:', response.data);
      return response.data.results || response.data;
    } catch (error) {
      console.error('❌ Error al obtener mis solicitudes:', error.response?.data);
      throw error.response?.data || error;
    }
  }
};

export default solicitudVisitaService;
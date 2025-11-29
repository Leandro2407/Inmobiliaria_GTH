import axios from 'axios';

// ✅ URL base CORREGIDA
const API_URL = 'http://localhost:8000/api/tareas/tareas';

// Configuración base de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Servicio para gestionar todas las operaciones relacionadas con tareas
const tareaService = {
  /**
   * Obtener lista de todas las tareas
   * @returns {Promise} Promesa con la respuesta del servidor
   */
  async getTareas() {
    try {
      console.log('🔄 Solicitando tareas desde:', API_URL + '/');
      const response = await api.get('/', {
        params: {
          page_size: 1000 // Obtener todas las tareas sin paginación
        }
      });
      console.log('✅ Tareas obtenidas correctamente');
      return response;
    } catch (error) {
      console.error('❌ Error al obtener tareas:', error);
      throw error;
    }
  },

  /**
   * Obtener una tarea específica por ID
   * @param {number|string} id - ID de la tarea
   * @returns {Promise} Promesa con la respuesta del servidor
   */
  async getTarea(id) {
    try {
      const response = await api.get(`/${id}/`);
      return response;
    } catch (error) {
      console.error('Error al obtener tarea:', error);
      throw error;
    }
  },

  /**
   * Crear una nueva tarea
   * @param {Object} tareaData - Datos de la tarea a crear
   * @returns {Promise} Promesa con la respuesta del servidor
   */
  async createTarea(tareaData) {
    try {
      console.log('🔄 Creando tarea:', tareaData);
      const response = await api.post('/', tareaData);
      console.log('✅ Tarea creada correctamente');
      return response;
    } catch (error) {
      console.error('❌ Error al crear tarea:', error);
      throw error;
    }
  },

  /**
   * Actualizar una tarea existente
   * @param {number|string} id - ID de la tarea
   * @param {Object} tareaData - Datos actualizados de la tarea
   * @returns {Promise} Promesa con la respuesta del servidor
   */
  async updateTarea(id, tareaData) {
    try {
      console.log('🔄 Actualizando tarea:', id, tareaData);
      const response = await api.put(`/${id}/`, tareaData);
      console.log('✅ Tarea actualizada correctamente');
      return response;
    } catch (error) {
      console.error('❌ Error al actualizar tarea:', error);
      throw error;
    }
  },

  /**
   * Eliminar una tarea
   * @param {number|string} id - ID de la tarea a eliminar
   * @returns {Promise} Promesa con la respuesta del servidor
   */
  async deleteTarea(id) {
    try {
      console.log('🔄 Eliminando tarea:', id);
      const response = await api.delete(`/${id}/`);
      console.log('✅ Tarea eliminada correctamente');
      return response;
    } catch (error) {
      console.error('❌ Error al eliminar tarea:', error);
      throw error;
    }
  },

  /**
   * Finalizar una tarea (marcar como completada)
   * @param {number|string} id - ID de la tarea a finalizar
   * @returns {Promise} Promesa con la respuesta del servidor
   */
  async finalizarTarea(id) {
    try {
      console.log(`✅ Finalizando tarea ${id}...`);
      const response = await api.post(`/${id}/finalizar/`);
      console.log('✅ Tarea finalizada correctamente');
      return response;
    } catch (error) {
      console.error('❌ Error al finalizar tarea:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de las tareas
   * @returns {Object} Objeto con estadísticas de tareas
   */
  async getEstadisticas() {
    try {
      const response = await this.getTareas();
      const tareas = response.data;
      
      const finalizadas = tareas.filter(t => t.finalizada).length;
      const pendientes = tareas.filter(t => !t.finalizada).length;
      
      return {
        total: tareas.length,
        finalizadas: finalizadas,
        pendientes: pendientes,
        alta: tareas.filter(t => t.prioridad === 'alta').length,
        media: tareas.filter(t => t.prioridad === 'media').length,
        baja: tareas.filter(t => t.prioridad === 'baja').length,
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de tareas:', error);
      return { total: 0, finalizadas: 0, pendientes: 0, alta: 0, media: 0, baja: 0 };
    }
  }
};

export default tareaService;
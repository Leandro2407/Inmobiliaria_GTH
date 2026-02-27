import api from './api'; 

// La ruta base. Como api.js ya apunta a '/api', solo agregamos el resto
const BASE_PATH = '/tareas/tareas/'; 

const tareaService = {
  /**
   * Obtener lista de todas las tareas
   */
  async getTareas() {
    try {
      const response = await api.get(BASE_PATH, {
        params: {
          page_size: 1000 // Obtener todas las tareas sin paginación
        }
      });
      return response;
    } catch (error) {
      console.error('Error al obtener tareas:', error);
      throw error;
    }
  },

  /**
   * Obtener una tarea específica por ID
   */
  async getTarea(id) {
    try {
      const response = await api.get(`${BASE_PATH}${id}/`);
      return response;
    } catch (error) {
      console.error('Error al obtener tarea:', error);
      throw error;
    }
  },

  /**
   * Crear una nueva tarea
   */
  async createTarea(tareaData) {
    try {
      const response = await api.post(BASE_PATH, tareaData);
      return response;
    } catch (error) {
      console.error('Error al crear tarea:', error);
      throw error;
    }
  },

  /**
   * Actualizar una tarea existente
   */
  async updateTarea(id, tareaData) {
    try {
      const response = await api.put(`${BASE_PATH}${id}/`, tareaData);
      return response;
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      throw error;
    }
  },

  /**
   * Eliminar una tarea
   */
  async deleteTarea(id) {
    try {
      const response = await api.delete(`${BASE_PATH}${id}/`);
      return response;
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      throw error;
    }
  },

  /**
   * Finalizar una tarea (marcar como completada)
   */
  async finalizarTarea(id) {
    try {
      const response = await api.post(`${BASE_PATH}${id}/finalizar/`);
      return response;
    } catch (error) {
      console.error('Error al finalizar tarea:', error);
      throw error;
    }
  },

  /**
   * Obtener estadísticas de las tareas
   */
  async getEstadisticas() {
    try {
      const response = await this.getTareas();
      // Verificamos si la API devuelve un array directo o un objeto con "results"
      const tareas = Array.isArray(response.data) ? response.data : (response.data.results || []);
      
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
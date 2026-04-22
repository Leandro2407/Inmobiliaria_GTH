import api from './api';

const propiedadService = {
  getAll: async (params = {}) => {
    try {
      const response = await api.get('/propiedades/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getPublicas: async (params = {}) => {
    try {
      const response = await api.get('/propiedades/publicas/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getDestacadas: async () => {
    try {
      const response = await api.get('/propiedades/destacadas/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/propiedades/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  create: async (propiedadData) => {
    try {
      const response = await api.post('/propiedades/', propiedadData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  update: async (id, propiedadData) => {
    try {
      const response = await api.put(`/propiedades/${id}/`, propiedadData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  partialUpdate: async (id, propiedadData) => {
    try {
      const response = await api.patch(`/propiedades/${id}/`, propiedadData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  delete: async (id) => {
    try {
      const response = await api.delete(`/propiedades/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ✅ FIX CRÍTICO: NO especificar Content-Type en multipart/form-data.
  // Axios necesita generarlo automáticamente para incluir el 'boundary' correcto.
  // Si se pone 'Content-Type': 'multipart/form-data' manualmente, el boundary
  // no se genera y Django no puede parsear el archivo → imagen nunca se guarda.
  subirImagen: async (id, formData) => {
    try {
      const response = await api.post(
        `/propiedades/${id}/subir_imagen/`,
        formData,
        {
          headers: {
            // ✅ Dejar que axios/browser establezca el Content-Type automáticamente
            'Content-Type': undefined,
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  subirVideo: async (id, formData) => {
    try {
      const response = await api.post(
        `/propiedades/${id}/subir_video/`,
        formData,
        {
          headers: {
            'Content-Type': undefined, // ✅ mismo fix para videos
          },
        }
      );
      return response.data;
    } catch (error) {
      // ✅ FIX: lanzar error.response?.data || error, igual que el resto de métodos.
      // Antes se hacía `throw error` (objeto axios completo), lo que rompía la lógica
      // de detección de errores en el panel, que espera recibir el data directamente.
      console.error('subirVideo error completo:', {
        status: error?.response?.status,
        data: error?.response?.data,
        headers: error?.response?.headers,
        message: error?.message,
      });
      throw error.response?.data || error;
    }
  },

  eliminarImagen: async (imagenId) => {
    try {
      const response = await api.delete(`/propiedades/imagenes/${imagenId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  eliminarVideo: async (videoId) => {
    try {
      const response = await api.delete(`/propiedades/videos/${videoId}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getEstadisticas: async () => {
    try {
      const response = await api.get('/propiedades/estadisticas/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

export default propiedadService;

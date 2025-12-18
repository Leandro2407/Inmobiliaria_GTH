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
      // API returns either array or paginated { results: [...] }
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

  subirImagen: async (id, formData) => {
    try {
      // Let axios set the correct multipart boundary header
      const response = await api.post(`/propiedades/${id}/subir_imagen/`, formData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  subirVideo: async (id, formData) => {
    try {
      const response = await api.post(`/propiedades/${id}/subir_video/`, formData);
      return response.data;
    } catch (error) {
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

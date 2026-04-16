import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import EmpleadoSelector from './EmpleadoSelector';

// Componente para crear o editar tareas
const TareaForm = ({ tarea, onSubmit, onCancel, empleados }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    prioridad: 'media',
    empleados: []
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // 🔧 FUNCIÓN CORREGIDA: Obtener fecha actual en YYYY-MM-DD usando UTC
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getUTCFullYear();
    const month = String(today.getUTCMonth() + 1).padStart(2, '0');
    const day = String(today.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 🔧 Función para extraer fecha YYYY-MM-DD
  const extraerFechaYYYYMMDD = (fechaInput) => {
    if (!fechaInput) return '';
    
    if (typeof fechaInput === 'string' && fechaInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return fechaInput;
    }
    
    if (typeof fechaInput === 'string' && fechaInput.includes('T')) {
      return fechaInput.split('T')[0];
    }
    
    if (fechaInput instanceof Date && !isNaN(fechaInput)) {
      const year = fechaInput.getUTCFullYear();
      const month = String(fechaInput.getUTCMonth() + 1).padStart(2, '0');
      const day = String(fechaInput.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    try {
      const fechaObj = new Date(fechaInput);
      if (!isNaN(fechaObj)) {
        const year = fechaObj.getUTCFullYear();
        const month = String(fechaObj.getUTCMonth() + 1).padStart(2, '0');
        const day = String(fechaObj.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {}
    
    return '';
  };

  useEffect(() => {
    if (tarea) {
      setFormData({
        nombre: tarea.nombre || '',
        descripcion: tarea.descripcion || '',
        fecha: extraerFechaYYYYMMDD(tarea.fecha),
        hora_inicio: tarea.hora_inicio || '',
        hora_fin: tarea.hora_fin || '',
        prioridad: tarea.prioridad || 'media',
        empleados: tarea.empleados || []
      });
      setErrors({});
    } else {
      const today = getTodayDate();
      setFormData(prev => ({
        ...prev,
        fecha: today
      }));
    }
  }, [tarea]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleEmpleadosChange = (selectedEmpleados) => {
    setFormData(prev => ({
      ...prev,
      empleados: selectedEmpleados
    }));

    if (errors.empleados) {
      setErrors(prev => ({
        ...prev,
        empleados: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const today = getTodayDate();

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre de la tarea es requerido';
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    } else {
      if (formData.fecha < today) {
        newErrors.fecha = `La fecha no puede ser en el pasado. Hoy es ${today}`;
      }
    }

    if (!formData.hora_inicio) {
      newErrors.hora_inicio = 'La hora de inicio es requerida';
    }

    if (formData.hora_fin && formData.hora_inicio) {
      if (formData.hora_fin <= formData.hora_inicio) {
        newErrors.hora_fin = 'La hora de fin debe ser posterior a la hora de inicio';
      }
    }

    if (formData.empleados.length === 0) {
      newErrors.empleados = 'Debe asignar al menos un empleado';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const datosParaEnviar = {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim() || '',
        fecha: formData.fecha,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin || null,
        prioridad: formData.prioridad,
        empleados: formData.empleados
      };
      
      await onSubmit(datosParaEnviar);
    } catch (error) {
      console.error('Error al procesar la tarea:', error);
      setErrors({ submit: 'Error al procesar la tarea. Por favor, intente nuevamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {errors.submit && (
        <Alert variant="danger" className="mb-3">
          <strong>Error:</strong> {errors.submit}
        </Alert>
      )}

      <Form.Group className="mb-3">
        <Form.Label>Nombre de la tarea *</Form.Label>
        <Form.Control
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          isInvalid={!!errors.nombre}
          placeholder="Ingrese el nombre de la tarea"
          disabled={loading}
        />
        <Form.Control.Feedback type="invalid">
          {errors.nombre}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Descripción</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Descripción detallada de la tarea (opcional)"
          disabled={loading}
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Fecha *</Form.Label>
        <Form.Control
          type="date"
          name="fecha"
          value={formData.fecha}
          onChange={handleChange}
          isInvalid={!!errors.fecha}
          disabled={loading}
          min={getTodayDate()}
        />
        <Form.Control.Feedback type="invalid">
          {errors.fecha}
        </Form.Control.Feedback>
      </Form.Group>

      <div className="row mb-3">
        <div className="col-md-6">
          <Form.Group>
            <Form.Label>Hora de inicio *</Form.Label>
            <Form.Control
              type="time"
              name="hora_inicio"
              value={formData.hora_inicio}
              onChange={handleChange}
              isInvalid={!!errors.hora_inicio}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.hora_inicio}
            </Form.Control.Feedback>
          </Form.Group>
        </div>
        
        <div className="col-md-6">
          <Form.Group>
            <Form.Label>Hora de fin estimada</Form.Label>
            <Form.Control
              type="time"
              name="hora_fin"
              value={formData.hora_fin}
              onChange={handleChange}
              isInvalid={!!errors.hora_fin}
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">
              {errors.hora_fin}
            </Form.Control.Feedback>
          </Form.Group>
        </div>
      </div>

      <Form.Group className="mb-3">
        <Form.Label>Prioridad</Form.Label>
        <Form.Select
          name="prioridad"
          value={formData.prioridad}
          onChange={handleChange}
          disabled={loading}
        >
          <option value="baja">🔵 Baja</option>
          <option value="media">🟡 Media</option>
          <option value="alta">🔴 Alta</option>
        </Form.Select>
      </Form.Group>

      <div className="mb-4">
        <EmpleadoSelector
          empleados={empleados}
          selectedEmpleados={formData.empleados}
          onChange={handleEmpleadosChange}
          isInvalid={!!errors.empleados}
        />
      </div>

      <div className="d-flex gap-2 justify-content-end">
        <Button 
          variant="outline-secondary" 
          onClick={onCancel} 
          disabled={loading}
        >
          <i className="fas fa-times me-2"></i>Cancelar
        </Button>
        <Button 
          variant="dark"
          type="submit" 
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              {tarea ? 'Actualizando...' : 'Creando...'}
            </>
          ) : (
            <>
              <i className={`fas ${tarea ? 'fa-save' : 'fa-plus'} me-2`}></i>
              {tarea ? 'Actualizar Tarea' : 'Crear Tarea'}
            </>
          )}
        </Button>
      </div>
    </Form>
  );
};

export default TareaForm;
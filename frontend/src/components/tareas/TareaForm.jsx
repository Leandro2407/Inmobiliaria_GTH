import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import EmpleadoSelector from './EmpleadoSelector';

// Componente para crear o editar tareas
const TareaForm = ({ tarea, onSubmit, onCancel, empleados }) => {
  // Estado para los datos del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    fecha: '',
    hora_inicio: '',
    hora_fin: '',
    prioridad: 'media',
    empleados: []
  });
  
  // Estados para manejo de errores y carga
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Función para obtener la fecha actual en formato YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Efecto para inicializar el formulario con datos de tarea existente o valores por defecto
  useEffect(() => {
    if (tarea) {
      // Si hay una tarea existente, cargar sus datos
      let fechaFormateada = '';
      if (tarea.fecha) {
        if (typeof tarea.fecha === 'string' && tarea.fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
          fechaFormateada = tarea.fecha;
        } else {
          const fecha = new Date(tarea.fecha);
          const year = fecha.getFullYear();
          const month = String(fecha.getMonth() + 1).padStart(2, '0');
          const day = String(fecha.getDate()).padStart(2, '0');
          fechaFormateada = `${year}-${month}-${day}`;
        }
      } else {
        fechaFormateada = getTodayDate();
      }
      
      setFormData({
        nombre: tarea.nombre || '',
        descripcion: tarea.descripcion || '',
        fecha: fechaFormateada,
        hora_inicio: tarea.hora_inicio || '',
        hora_fin: tarea.hora_fin || '',
        prioridad: tarea.prioridad || 'media',
        empleados: tarea.empleados || []
      });
      setErrors({});
    } else {
      // Si es una nueva tarea, establecer fecha por defecto
      const today = getTodayDate();
      setFormData(prev => ({
        ...prev,
        fecha: today
      }));
    }
  }, [tarea]);

  // Función para obtener la hora actual con margen
  const getCurrentTimeWithMargin = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Manejar cambios en la selección de empleados
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

  // Validar todos los campos del formulario
  const validateForm = () => {
    const newErrors = {};
    const today = getTodayDate();
    const currentTime = getCurrentTimeWithMargin();

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre de la tarea es requerido';
    } else if (formData.nombre.trim().length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres';
    }

    // Validar fecha
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    } else {
      const selectedDate = new Date(formData.fecha);
      const todayDate = new Date(today);
      
      selectedDate.setHours(0, 0, 0, 0);
      todayDate.setHours(0, 0, 0, 0);

      // No permitir fechas en el pasado
      if (selectedDate < todayDate) {
        newErrors.fecha = 'La fecha no puede ser en el pasado';
      }
      
      // Validar hora para fechas actuales
      if (formData.fecha === today && formData.hora_inicio) {
        if (formData.hora_inicio < currentTime) {
          newErrors.hora_inicio = `Para hoy, la hora debe ser ${currentTime} o posterior`;
        }
      }
    }

    // Validar hora de inicio
    if (!formData.hora_inicio) {
      newErrors.hora_inicio = 'La hora de inicio es requerida';
    }

    // Validar que hora fin sea posterior a hora inicio
    if (formData.hora_fin && formData.hora_inicio) {
      if (formData.hora_fin <= formData.hora_inicio) {
        newErrors.hora_fin = 'La hora de fin debe ser posterior a la hora de inicio';
      }
    }

    // Validar que se haya asignado al menos un empleado
    if (formData.empleados.length === 0) {
      newErrors.empleados = 'Debe asignar al menos un empleado';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
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
      {/* Mostrar error general si existe */}
      {errors.submit && (
        <Alert variant="danger" className="mb-3">
          <strong>Error:</strong> {errors.submit}
        </Alert>
      )}

      {/* Campo: Nombre de la tarea */}
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

      {/* Campo: Descripción */}
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

      {/* Campo: Fecha */}
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

      {/* Fila con Hora de inicio y Hora de fin */}
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

      {/* Campo: Prioridad con emojis */}
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

      {/* Selector de empleados */}
      <div className="mb-4">
        <EmpleadoSelector
          empleados={empleados}
          selectedEmpleados={formData.empleados}
          onChange={handleEmpleadosChange}
          isInvalid={!!errors.empleados}
        />
      </div>

      {/* Botones de acción */}
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
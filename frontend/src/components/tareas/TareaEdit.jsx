import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import EmpleadoSelector from './EmpleadoSelector';

// Componente modal para editar tareas existentes
const TareaEdit = ({ tarea, show, onHide, onUpdate, empleados }) => {
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
    return today.toISOString().split('T')[0];
  };

  // Función para obtener la hora actual en formato HH:MM
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Efecto para cargar datos de la tarea cuando se abre el modal
  useEffect(() => {
    if (tarea && show) {
      const fechaTarea = tarea.fecha ? new Date(tarea.fecha).toISOString().split('T')[0] : '';
      
      setFormData({
        nombre: tarea.nombre || '',
        descripcion: tarea.descripcion || '',
        fecha: fechaTarea,
        hora_inicio: tarea.hora_inicio || '',
        hora_fin: tarea.hora_fin || '',
        prioridad: tarea.prioridad || 'media',
        empleados: tarea.empleados || []
      });
      setErrors({});
    }
  }, [tarea, show]);

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
    const currentTime = getCurrentTime();

    // Validar nombre
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    // Validar fecha
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    } else {
      const selectedDate = new Date(formData.fecha);
      const todayDate = new Date(today);
      
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
      await onUpdate(formData);
      onHide();
    } catch (error) {
      console.error('Error al actualizar tarea:', error);
      setErrors({ submit: 'Error al actualizar la tarea' });
    } finally {
      setLoading(false);
    }
  };

  // Manejar cierre del modal
  const handleClose = () => {
    setErrors({});
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>
          <i className="fas fa-edit me-2"></i>
          Editar Tarea
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* Mostrar error general si existe */}
          {errors.submit && (
            <Alert variant="danger">
              {errors.submit}
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
              placeholder="Descripción detallada de la tarea"
            />
          </Form.Group>

          {/* Fila con Fecha y Hora de inicio */}
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Fecha *</Form.Label>
                <Form.Control
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  isInvalid={!!errors.fecha}
                  min={getTodayDate()}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.fecha}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  No se permiten fechas del pasado
                </Form.Text>
              </Form.Group>
            </div>
            
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Hora de inicio *</Form.Label>
                <Form.Control
                  type="time"
                  name="hora_inicio"
                  value={formData.hora_inicio}
                  onChange={handleChange}
                  isInvalid={!!errors.hora_inicio}
                  min={formData.fecha === getTodayDate() ? getCurrentTime() : undefined}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.hora_inicio}
                </Form.Control.Feedback>
                {formData.fecha === getTodayDate() && (
                  <Form.Text className="text-muted">
                    Para hoy, la hora mínima es {getCurrentTime()}
                  </Form.Text>
                )}
              </Form.Group>
            </div>
          </div>

          {/* Fila con Hora de fin y Prioridad */}
          <div className="row">
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Hora de fin estimada</Form.Label>
                <Form.Control
                  type="time"
                  name="hora_fin"
                  value={formData.hora_fin}
                  onChange={handleChange}
                  isInvalid={!!errors.hora_fin}
                  min={formData.hora_inicio || undefined}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.hora_fin}
                </Form.Control.Feedback>
                {formData.hora_inicio && (
                  <Form.Text className="text-muted">
                    La hora de fin debe ser posterior a {formData.hora_inicio}
                  </Form.Text>
                )}
              </Form.Group>
            </div>
            
            <div className="col-md-6">
              <Form.Group className="mb-3">
                <Form.Label>Prioridad</Form.Label>
                <Form.Select
                  name="prioridad"
                  value={formData.prioridad}
                  onChange={handleChange}
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </Form.Select>
              </Form.Group>
            </div>
          </div>

          {/* Selector de empleados */}
          <div className="mb-3">
            <EmpleadoSelector
              empleados={empleados}
              selectedEmpleados={formData.empleados}
              onChange={handleEmpleadosChange}
              isInvalid={!!errors.empleados}
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            variant="dark"
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Actualizando...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                Actualizar Tarea
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default TareaEdit;
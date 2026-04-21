import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import EmpleadoSelector from './EmpleadoSelector';
import tareaService from '../../services/tareaService';

const TareaEdit = ({ tarea, show, onHide, onUpdate, empleados }) => {
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
  const [cargandoDatos, setCargandoDatos] = useState(false);

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 🔧 FUNCIÓN SIMPLIFICADA: Solo extraer YYYY-MM-DD, sin restar días
  const extraerFechaYYYYMMDD = (fechaBackend) => {
    if (!fechaBackend) return '';
    
    // Si es string YYYY-MM-DD, devolverlo directamente
    if (typeof fechaBackend === 'string' && fechaBackend.match(/^\d{4}-\d{2}-\d{2}/)) {
      const match = fechaBackend.match(/(\d{4}-\d{2}-\d{2})/);
      return match ? match[1] : '';
    }
    
    // Si es objeto Date o string ISO
    const fechaObj = new Date(fechaBackend);
    if (!isNaN(fechaObj)) {
      const year = fechaObj.getFullYear();
      const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const day = String(fechaObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return '';
  };

  const cargarDatosActualizados = async (tareaId) => {
    if (!tareaId) return;
    
    setCargandoDatos(true);
    try {
      const response = await tareaService.getTarea(tareaId);
      const tareaActualizada = response.data;
      
      // 🔧 Usar la fecha directamente del backend, sin modificaciones
      const fechaParaMostrar = extraerFechaYYYYMMDD(tareaActualizada.fecha);
      
      console.log('📅 Fecha backend:', tareaActualizada.fecha);
      console.log('📅 Fecha a mostrar (sin modificar):', fechaParaMostrar);
      
      setFormData({
        nombre: tareaActualizada.nombre || '',
        descripcion: tareaActualizada.descripcion || '',
        fecha: fechaParaMostrar,
        hora_inicio: tareaActualizada.hora_inicio || '',
        hora_fin: tareaActualizada.hora_fin || '',
        prioridad: tareaActualizada.prioridad || 'media',
        empleados: tareaActualizada.empleados || []
      });
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    if (tarea && show) {
      cargarDatosActualizados(tarea.id);
      setErrors({});
    }
  }, [tarea, show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleEmpleadosChange = (selectedEmpleados) => {
    setFormData(prev => ({ ...prev, empleados: selectedEmpleados }));
    if (errors.empleados) setErrors(prev => ({ ...prev, empleados: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    const today = getTodayDate();

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    } else {
      if (formData.fecha < today) {
        newErrors.fecha = `La fecha no puede ser en el pasado. Hoy es ${today}`;
      }
    }
    
    if (!formData.hora_inicio) newErrors.hora_inicio = 'La hora de inicio es requerida';
    
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
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const dataToSend = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        fecha: formData.fecha,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin || null,
        prioridad: formData.prioridad,
        empleados: formData.empleados
      };
      
      console.log('📤 Enviando al backend:', dataToSend);
      await onUpdate(dataToSend);
      onHide();
    } catch (error) {
      console.error('Error:', error);
      setErrors({ submit: 'Error al actualizar la tarea' });
    } finally {
      setLoading(false);
    }
  };

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
          {cargandoDatos && <Spinner animation="border" size="sm" className="ms-2" />}
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {errors.submit && <Alert variant="danger">{errors.submit}</Alert>}
          
          {cargandoDatos ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="dark" />
              <p className="mt-2 text-muted">Cargando datos actualizados...</p>
            </div>
          ) : (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Nombre de la tarea *</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  isInvalid={!!errors.nombre}
                />
                <Form.Control.Feedback type="invalid">{errors.nombre}</Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                />
              </Form.Group>

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
                    <Form.Control.Feedback type="invalid">{errors.fecha}</Form.Control.Feedback>
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
                    />
                    <Form.Control.Feedback type="invalid">{errors.hora_inicio}</Form.Control.Feedback>
                  </Form.Group>
                </div>
              </div>

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
                    />
                    <Form.Control.Feedback type="invalid">{errors.hora_fin}</Form.Control.Feedback>
                  </Form.Group>
                </div>
                
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Prioridad</Form.Label>
                    <Form.Select name="prioridad" value={formData.prioridad} onChange={handleChange}>
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>

              <div className="mb-3">
                <EmpleadoSelector
                  empleados={empleados}
                  selectedEmpleados={formData.empleados}
                  onChange={handleEmpleadosChange}
                  isInvalid={!!errors.empleados}
                />
              </div>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose} disabled={loading || cargandoDatos}>
            Cancelar
          </Button>
          <Button variant="dark" type="submit" disabled={loading || cargandoDatos}>
            {loading ? 'Actualizando...' : 'Actualizar Tarea'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default TareaEdit;
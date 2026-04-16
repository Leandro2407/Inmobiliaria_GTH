import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import EmpleadoSelector from './EmpleadoSelector';

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
  const [fechaOriginalBackend, setFechaOriginalBackend] = useState('');

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 🔧 CORRECCIÓN: Ajustar la fecha según la diferencia
  const ajustarFechaParaMostrar = (fechaBackend) => {
    if (!fechaBackend) return '';
    
    // Extraer la fecha como string YYYY-MM-DD
    let fechaStr = '';
    if (typeof fechaBackend === 'string') {
      const match = fechaBackend.match(/(\d{4}-\d{2}-\d{2})/);
      if (match) fechaStr = match[1];
    } else {
      const d = new Date(fechaBackend);
      fechaStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    }
    
    if (!fechaStr) return '';
    
    // Obtener fecha actual local
    const hoy = getTodayDate();
    
    console.log('📅 Fecha backend:', fechaStr);
    console.log('📅 Fecha actual:', hoy);
    
    // Si la fecha del backend es mayor que hoy (ej: 2026-04-17 vs hoy 2026-04-16)
    if (fechaStr > hoy) {
      // Restar 1 día
      const [year, month, day] = fechaStr.split('-').map(Number);
      const fechaObj = new Date(year, month - 1, day);
      fechaObj.setDate(fechaObj.getDate() - 1);
      const resultado = `${fechaObj.getFullYear()}-${String(fechaObj.getMonth()+1).padStart(2,'0')}-${String(fechaObj.getDate()).padStart(2,'0')}`;
      console.log('📅 Se resta 1 día:', resultado);
      return resultado;
    }
    
    // Si la fecha del backend es igual o menor a hoy, mostrarla tal cual
    console.log('📅 Se muestra fecha original:', fechaStr);
    return fechaStr;
  };

  useEffect(() => {
    if (tarea && show) {
      // Guardar fecha original
      let fechaOriginal = '';
      if (tarea.fecha) {
        const match = String(tarea.fecha).match(/(\d{4}-\d{2}-\d{2})/);
        if (match) fechaOriginal = match[1];
      }
      setFechaOriginalBackend(fechaOriginal);
      
      // Ajustar fecha para mostrar
      const fechaParaMostrar = ajustarFechaParaMostrar(tarea.fecha);
      
      setFormData({
        nombre: tarea.nombre || '',
        descripcion: tarea.descripcion || '',
        fecha: fechaParaMostrar,
        hora_inicio: tarea.hora_inicio || '',
        hora_fin: tarea.hora_fin || '',
        prioridad: tarea.prioridad || 'media',
        empleados: tarea.empleados || []
      });
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
    
    if (!fechaOriginalBackend) {
      newErrors.fecha = 'La fecha es requerida';
    } else {
      if (fechaOriginalBackend < today) {
        newErrors.fecha = `No se puede editar una tarea con fecha anterior a hoy (${today})`;
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
        fecha: fechaOriginalBackend,
        hora_inicio: formData.hora_inicio,
        hora_fin: formData.hora_fin || null,
        prioridad: formData.prioridad,
        empleados: formData.empleados
      };
      
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
        <Modal.Title><i className="fas fa-edit me-2"></i>Editar Tarea</Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {errors.submit && <Alert variant="danger">{errors.submit}</Alert>}

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
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="dark" type="submit" disabled={loading}>
            {loading ? 'Actualizando...' : 'Actualizar Tarea'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default TareaEdit;
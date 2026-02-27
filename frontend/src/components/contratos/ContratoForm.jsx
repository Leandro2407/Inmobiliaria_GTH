import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { toast } from 'react-toastify';
import contratoService from '../../services/contratoService';
import propiedadService from '../../services/propiedadService';

const ContratoForm = ({ show, onHide, cliente, contrato, onSuccess }) => {
  const [formData, setFormData] = useState({
    tipo: 'alquiler',
    propiedad: '',
    fecha_inicio: '',
    fecha_fin: '',
    monto: '',
    porcentaje_comision: '',
    comision: '',
    estado: 'activo', // 🔒 Estado por defecto siempre 'activo' para nuevos contratos
    descripcion: ''
  });
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPropiedades, setLoadingPropiedades] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // Obtener fecha actual en formato YYYY-MM-DD
  const getFechaActual = () => {
    const ahora = new Date();
    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, '0');
    const day = String(ahora.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para calcular la comisión basada en el monto y el porcentaje
  const calcularComision = (monto, porcentaje) => {
    if (monto && porcentaje && !isNaN(monto) && !isNaN(porcentaje)) {
      const montoNum = parseFloat(monto);
      const porcentajeNum = parseFloat(porcentaje);
      if (montoNum > 0 && porcentajeNum > 0) {
        return (montoNum * porcentajeNum / 100).toFixed(2);
      }
    }
    return '';
  };

  // Validar que la fecha de fin sea posterior a la fecha de inicio
  const validarFechas = (fechaInicio, fechaFin) => {
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      
      if (fin < inicio) {
        return 'La fecha de fin no puede ser anterior a la fecha de inicio';
      }
      
      // Validar que la fecha de fin sea al menos 1 día después
      const diferenciaDias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
      if (diferenciaDias < 1) {
        return 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }
    return '';
  };

  // Validar que la fecha de inicio no sea anterior a hoy
  const validarFechaInicio = (fecha) => {
    if (fecha) {
      const hoy = new Date(getFechaActual());
      const fechaInicio = new Date(fecha);
      
      // Resetear horas para comparar solo fechas
      hoy.setHours(0, 0, 0, 0);
      fechaInicio.setHours(0, 0, 0, 0);
      
      if (fechaInicio < hoy) {
        return 'La fecha de inicio no puede ser anterior a hoy';
      }
    }
    return '';
  };

  // Efecto para actualizar la comisión cuando cambia el monto o el porcentaje
  useEffect(() => {
    const comisionCalculada = calcularComision(formData.monto, formData.porcentaje_comision);
    setFormData(prev => ({
      ...prev,
      comision: comisionCalculada
    }));
  }, [formData.monto, formData.porcentaje_comision]);

  // Efecto para validar fechas cuando cambian
  useEffect(() => {
    const newErrors = { ...errors };
    
    // Validar fecha de inicio
    const errorInicio = validarFechaInicio(formData.fecha_inicio);
    if (errorInicio) {
      newErrors.fecha_inicio = errorInicio;
    } else {
      delete newErrors.fecha_inicio;
    }
    
    // Validar relación entre fechas
    const errorFechas = validarFechas(formData.fecha_inicio, formData.fecha_fin);
    if (errorFechas) {
      newErrors.fecha_fin = errorFechas;
    } else if (formData.fecha_fin) {
      delete newErrors.fecha_fin;
    }
    
    setErrors(newErrors);
  }, [formData.fecha_inicio, formData.fecha_fin]);

  useEffect(() => {
    if (show) {
      cargarPropiedades();
      if (contrato) {
        // 🔄 Es edición - cargar todos los datos incluyendo el estado guardado
        let porcentajeCalculado = '';
        if (contrato.monto && contrato.comision && parseFloat(contrato.monto) > 0) {
          const montoNum = parseFloat(contrato.monto);
          const comisionNum = parseFloat(contrato.comision);
          if (montoNum > 0 && comisionNum > 0) {
            porcentajeCalculado = ((comisionNum / montoNum) * 100).toFixed(2);
          }
        }

        setFormData({
          tipo: contrato.tipo || 'alquiler',
          propiedad: contrato.propiedad || '',
          fecha_inicio: contrato.fecha_inicio || '',
          fecha_fin: contrato.fecha_fin || '',
          monto: contrato.monto || '',
          porcentaje_comision: porcentajeCalculado,
          comision: contrato.comision || '',
          estado: contrato.estado || 'activo', // 🔄 En edición, cargar el estado guardado
          descripcion: contrato.descripcion || ''
        });
      } else {
        // 🆕 Es creación - estado siempre 'activo' y no modificable
        setFormData({
          tipo: 'alquiler',
          propiedad: '',
          fecha_inicio: '',
          fecha_fin: '',
          monto: '',
          porcentaje_comision: '',
          comision: '',
          estado: 'activo', // 🔒 Fijo en 'activo' para nuevos contratos
          descripcion: ''
        });
      }
      setErrors({});
      setSubmitError('');
    }
  }, [show, contrato]);

  const cargarPropiedades = async () => {
    try {
      setLoadingPropiedades(true);
      console.log('🔄 Cargando propiedades para contrato...');
      const response = await propiedadService.getAll();
      
      // Manejar diferentes formatos de respuesta
      let propiedadesData = [];
      
      if (Array.isArray(response)) {
        propiedadesData = response;
      } else if (response && Array.isArray(response.results)) {
        propiedadesData = response.results;
      } else if (response && typeof response === 'object') {
        propiedadesData = [response];
      }
      
      console.log('✅ Propiedades cargadas:', propiedadesData.length);
      console.log('📋 Detalles de propiedades:', propiedadesData);
      
      setPropiedades(propiedadesData);
    } catch (error) {
      console.error('❌ Error al cargar propiedades:', error);
      toast.error('Error al cargar las propiedades');
      setPropiedades([]);
    } finally {
      setLoadingPropiedades(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Permitir solo números y un punto decimal para campos numéricos
    if (name === 'monto' || name === 'porcentaje_comision' || name === 'comision') {
      const regex = /^\d*\.?\d*$/;
      if (value === '' || regex.test(value)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!cliente || !cliente.id) {
      newErrors.cliente = 'No se ha seleccionado un cliente válido';
    }
    if (!formData.propiedad) {
      newErrors.propiedad = 'La propiedad es obligatoria';
    }
    if (!formData.fecha_inicio) {
      newErrors.fecha_inicio = 'La fecha de inicio es obligatoria';
    } else {
      // Validar fecha de inicio no anterior a hoy
      const errorInicio = validarFechaInicio(formData.fecha_inicio);
      if (errorInicio) {
        newErrors.fecha_inicio = errorInicio;
      }
    }
    
    if (formData.fecha_fin) {
      // Validar relación entre fechas
      const errorFechas = validarFechas(formData.fecha_inicio, formData.fecha_fin);
      if (errorFechas) {
        newErrors.fecha_fin = errorFechas;
      }
    }
    
    if (!formData.monto) {
      newErrors.monto = 'El monto es obligatorio';
    } else if (parseFloat(formData.monto) <= 0) {
      newErrors.monto = 'El monto debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar formulario antes de enviar
    if (!validateForm()) {
      setLoading(false);
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      const contratoData = {
        ...formData,
        cliente: cliente.id,
        propiedad: parseInt(formData.propiedad),
        monto: parseFloat(formData.monto),
        porcentaje_comision: formData.porcentaje_comision ? parseFloat(formData.porcentaje_comision) : null,
        comision: formData.comision ? parseFloat(formData.comision) : null,
      };

      console.log('📤 Enviando datos del contrato:', contratoData);

      if (contrato && contrato.id) {
        await contratoService.update(contrato.id, contratoData);
        toast.success('Contrato actualizado correctamente');
      } else {
        await contratoService.create(contratoData);
        toast.success('Contrato creado correctamente');
      }

      onHide();
      
      setTimeout(() => {
        onSuccess();
      }, 350);
    } catch (error) {
      console.error('❌ Error al guardar contrato:', error);
      console.error('Detalles del error:', error.response?.data);
      
      let errorMessage = 'Error al guardar el contrato';
      
      if (error.response?.status === 405) {
        errorMessage = 'Error 405: Método no permitido. Verifica la configuración del backend.';
      } else if (error.response?.data) {
        const errorData = error.response.data;
        
        if (typeof errorData === 'object') {
          const errorDetails = Object.values(errorData).flat().join(', ');
          errorMessage = errorDetails || errorMessage;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Error de conexión con el servidor';
      }
      
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (error) {
      return '';
    }
  };

  // Función segura para obtener propiedades de objetos
  const getSafe = (obj, path, defaultValue = '') => {
    return path.split('.').reduce((acc, key) => {
      return acc && acc[key] !== undefined ? acc[key] : defaultValue;
    }, obj);
  };

  // Si no hay cliente seleccionado, mostrar advertencia
  if (show && (!cliente || !cliente.id)) {
    return (
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            No se ha seleccionado un cliente válido. Por favor, selecciona un cliente primero.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  // Determinar si es modo edición
  const esEdicion = !!contrato;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-file-contract me-2"></i>
          {esEdicion ? 'Editar Contrato' : 'Nuevo Contrato'} - {cliente?.nombre_completo}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {submitError && (
            <Alert variant="danger" className="mb-3">
              <strong>Error:</strong> {submitError}
            </Alert>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tipo de Contrato *</Form.Label>
                <Form.Select
                  name="tipo"
                  value={formData.tipo || 'alquiler'}
                  onChange={handleChange}
                  isInvalid={!!errors.tipo}
                >
                  <option value="alquiler">Alquiler</option>
                  <option value="venta">Venta</option>
                  <option value="administracion">Administración</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.tipo}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Propiedad *</Form.Label>
                {loadingPropiedades ? (
                  <div className="text-center py-2">
                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                    Cargando propiedades...
                  </div>
                ) : (
                  <>
                    <Form.Select
                      name="propiedad"
                      value={formData.propiedad || ''}
                      onChange={handleChange}
                      isInvalid={!!errors.propiedad}
                    >
                      <option value="">Seleccionar propiedad</option>
                      {Array.isArray(propiedades) && propiedades.map(prop => (
                        <option key={prop.id} value={prop.id}>
                          {getSafe(prop, 'titulo', 'Propiedad sin título')} - 
                          {getSafe(prop, 'direccion', 'Sin dirección')} - 
                          {getSafe(prop, 'ciudad', 'Sin ciudad')}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.propiedad}
                    </Form.Control.Feedback>
                    
                    <div className="mt-2">
                      {propiedades.length === 0 ? (
                        <Alert variant="warning" className="py-2 mb-0 small">
                          <i className="fas fa-exclamation-triangle me-2"></i>
                          No hay propiedades disponibles. 
                          <Button 
                            variant="link" 
                            className="p-0 ms-1" 
                            onClick={cargarPropiedades}
                            size="sm"
                          >
                            Reintentar
                          </Button>
                        </Alert>
                      ) : (
                        <div className="text-muted small">
                          <i className="fas fa-info-circle me-1"></i>
                          {propiedades.length} propiedad(es) disponible(s)
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha de Inicio *</Form.Label>
                <Form.Control
                  type="date"
                  name="fecha_inicio"
                  value={formatDateForInput(formData.fecha_inicio)}
                  onChange={handleChange}
                  min={getFechaActual()}
                  isInvalid={!!errors.fecha_inicio}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.fecha_inicio}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  No se permiten fechas anteriores a hoy
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha de Fin</Form.Label>
                <Form.Control
                  type="date"
                  name="fecha_fin"
                  value={formatDateForInput(formData.fecha_fin)}
                  onChange={handleChange}
                  min={formData.fecha_inicio || getFechaActual()}
                  isInvalid={!!errors.fecha_fin}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.fecha_fin}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  <i className="fas fa-info-circle me-1"></i>
                  Debe ser posterior a la fecha de inicio
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Monto *</Form.Label>
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    type="text"
                    name="monto"
                    value={formData.monto || ''}
                    onChange={handleChange}
                    placeholder="0.00"
                    isInvalid={!!errors.monto}
                  />
                </InputGroup>
                <Form.Control.Feedback type="invalid">
                  {errors.monto}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Porcentaje de Comisión (%)</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="text"
                    name="porcentaje_comision"
                    value={formData.porcentaje_comision || ''}
                    onChange={handleChange}
                    placeholder="Ej: 10"
                  />
                  <InputGroup.Text>%</InputGroup.Text>
                </InputGroup>
                <Form.Text className="text-muted">
                  Ingresa el porcentaje y la comisión se calculará automáticamente
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Comisión Calculada</Form.Label>
                <InputGroup>
                  <InputGroup.Text>$</InputGroup.Text>
                  <Form.Control
                    type="text"
                    name="comision"
                    value={formData.comision || ''}
                    onChange={handleChange}
                    placeholder="0.00"
                    readOnly
                    style={{ backgroundColor: '#f8f9fa' }}
                  />
                </InputGroup>
                <Form.Text className="text-muted">
                  Este campo se calcula automáticamente
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Estado</Form.Label>
                {esEdicion ? (
                  // 🔓 Modo edición: Select habilitado con todas las opciones
                  <Form.Select
                    name="estado"
                    value={formData.estado || 'activo'}
                    onChange={handleChange}
                  >
                    <option value="activo">Activo</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="finalizado">Finalizado</option>
                    <option value="cancelado">Cancelado</option>
                  </Form.Select>
                ) : (
                  // 🔒 Modo creación: Select deshabilitado mostrando solo "Activo"
                  <Form.Select
                    name="estado"
                    value="activo"
                    disabled
                    style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                  >
                    <option value="activo">Activo</option>
                  </Form.Select>
                )}
                {!esEdicion && (
                  <Form.Text className="text-muted">
                    <i className="fas fa-lock me-1"></i>
                    El estado es "Activo" por defecto al crear un contrato
                  </Form.Text>
                )}
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Descripción</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="descripcion"
              value={formData.descripcion || ''}
              onChange={handleChange}
              placeholder="Descripción del contrato..."
            />
          </Form.Group>

          <div className="text-muted small">
            <strong>Nota:</strong> Los campos marcados con * son obligatorios.
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading || propiedades.length === 0 || Object.keys(errors).length > 0}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Guardando...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                {esEdicion ? 'Actualizar Contrato' : 'Guardar Contrato'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ContratoForm;
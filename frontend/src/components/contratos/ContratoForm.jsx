import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Form, Button, Row, Col, Alert, InputGroup, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';
import contratoService from '../../services/contratoService';
import propiedadService from '../../services/propiedadService';
import SelectorPropiedadContratoModal from './SelectorPropiedadContratoModal';

const generarPDFContrato = (contrato, cliente, propiedad) => {
  // ... (la misma función que ya tenías, se omite por brevedad pero debe estar igual)
  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  const formatCurrency = (v) => {
    if (!v) return '$ 0,00';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);
  };

  const hoy = formatDate(new Date());
  const tipoLabel = contrato.tipo === 'alquiler' ? 'Alquiler' : 'Venta';
  const clienteNombre = cliente?.nombre_completo || `${cliente?.nombre || ''} ${cliente?.apellido || ''}`.trim() || '—';
  const propDireccion = propiedad?.direccion || '—';
  const propCiudad = propiedad?.ciudad || '—';
  const propTipo = (propiedad?.tipo || '').charAt(0).toUpperCase() + (propiedad?.tipo || '').slice(1);

  const fechasSection = contrato.tipo === 'alquiler' && contrato.fecha_inicio ? `
    <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;width:40%">Fecha de Inicio</td>
    <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600">${formatDate(contrato.fecha_inicio)}</td>
  </tr>
  ${contrato.fecha_fin ? `
    <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Fecha de Fin</td>
    <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600">${formatDate(contrato.fecha_fin)}</td>
  </tr>` : ''}
  ` : '';

  const htmlContent = `<!DOCTYPE html>...`; // Mantén tu función de PDF igual

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    toast.error('No se pudo abrir la ventana de impresión. Verifica que el navegador no bloquee popups.');
  }
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

const ContratoForm = ({ show, onHide, cliente, contrato, onSuccess }) => {
  const [formData, setFormData] = useState({
    tipo: 'alquiler',
    propiedad: '',
    fecha_inicio: '',
    fecha_fin: '',
    monto: '',
    porcentaje_comision: '',
    comision: '',
    estado: 'activo',
    descripcion: '',
  });

  const [propiedades, setPropiedades] = useState([]);
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingPropiedades, setLoadingPropiedades] = useState(false);
  const [showSelectorPropiedad, setShowSelectorPropiedad] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const getFechaActual = () => {
    const ahora = new Date();
    return `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
  };

  const calcularComision = (monto, porcentaje) => {
    if (monto && porcentaje && !isNaN(monto) && !isNaN(porcentaje)) {
      const m = parseFloat(monto);
      const p = parseFloat(porcentaje);
      if (m > 0 && p > 0) return (m * p / 100).toFixed(2);
    }
    return '';
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try { return new Date(dateString).toISOString().split('T')[0]; } catch { return ''; }
  };

  const validarFechas = useCallback((fechaInicio, fechaFin) => {
    if (fechaInicio && fechaFin) {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      if (fin < inicio) return 'La fecha de fin no puede ser anterior a la fecha de inicio';
      if (Math.ceil((fin - inicio) / 86400000) < 1) return 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
    return '';
  }, []);

  const validarFechaInicio = useCallback((fecha) => {
    if (fecha) {
      const hoy = new Date(getFechaActual());
      const fechaInicio = new Date(fecha);
      hoy.setHours(0, 0, 0, 0);
      fechaInicio.setHours(0, 0, 0, 0);
      if (fechaInicio < hoy) return 'La fecha de inicio no puede ser anterior a hoy';
    }
    return '';
  }, []);

  useEffect(() => {
    setFormData(prev => ({ ...prev, comision: calcularComision(prev.monto, prev.porcentaje_comision) }));
  }, [formData.monto, formData.porcentaje_comision]);

  useEffect(() => {
    if (formData.tipo === 'alquiler') {
      setErrors(prev => {
        const next = { ...prev };
        const eInicio = validarFechaInicio(formData.fecha_inicio);
        if (eInicio) next.fecha_inicio = eInicio; else delete next.fecha_inicio;
        const eFin = validarFechas(formData.fecha_inicio, formData.fecha_fin);
        if (eFin) next.fecha_fin = eFin; else if (formData.fecha_fin) delete next.fecha_fin;
        return next;
      });
    }
  }, [formData.fecha_inicio, formData.fecha_fin, formData.tipo, validarFechaInicio, validarFechas]);

  const cargarPropiedades = async () => {
    try {
      setLoadingPropiedades(true);
      const params = { estado: 'disponible' };
      const response = await propiedadService.getAll(params);
      let data = [];
      if (Array.isArray(response)) data = response;
      else if (response && Array.isArray(response.results)) data = response.results;
      else if (response && typeof response === 'object') data = [response];
      setPropiedades(data);
    } catch (error) {
      console.error('❌ Error al cargar propiedades:', error);
      toast.error('Error al cargar las propiedades');
      setPropiedades([]);
    } finally {
      setLoadingPropiedades(false);
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    if (show) {
      cargarPropiedades();
      if (contrato) {
        let porcentajeCalculado = '';
        if (contrato.monto && contrato.comision && parseFloat(contrato.monto) > 0) {
          const m = parseFloat(contrato.monto);
          const c = parseFloat(contrato.comision);
          if (m > 0 && c > 0) porcentajeCalculado = ((c / m) * 100).toFixed(2);
        }
        setFormData({
          tipo: contrato.tipo || 'alquiler',
          propiedad: contrato.propiedad || '',
          fecha_inicio: contrato.fecha_inicio || '',
          fecha_fin: contrato.fecha_fin || '',
          monto: contrato.monto || '',
          porcentaje_comision: porcentajeCalculado,
          comision: contrato.comision || '',
          estado: contrato.estado || 'activo',
          descripcion: contrato.descripcion || '',
        });
        if (contrato.propiedad_info) {
          setPropiedadSeleccionada(contrato.propiedad_info);
        }
        // Si es edición y ya tiene propiedad, no abrir selector
      } else {
        setFormData({
          tipo: 'alquiler',
          propiedad: '',
          fecha_inicio: '',
          fecha_fin: '',
          monto: '',
          porcentaje_comision: '',
          comision: '',
          estado: 'activo',
          descripcion: '',
        });
        setPropiedadSeleccionada(null);
        // 🔧 NUEVO: Para nuevo contrato, abrir el selector de propiedad inmediatamente
        // y NO mostrar el modal de contrato hasta que se seleccione una propiedad
        setShowSelectorPropiedad(true);
      }
      setErrors({});
      setSubmitError('');
    }
  }, [show, contrato]);

  const handleSeleccionarPropiedad = (prop) => {
    console.log('🏠 Propiedad seleccionada:', prop);
    
    let precio = '';
    const tipoContrato = prop.operacion === 'venta' ? 'venta' : 'alquiler';
    
    if (tipoContrato === 'venta') {
      precio = prop.precio_venta ? String(prop.precio_venta) : '';
    } else {
      precio = prop.precio_alquiler ? String(prop.precio_alquiler) : '';
    }
    
    if (!precio && prop.precio_display) {
      const match = prop.precio_display.match(/(\d+[.\d]*)/);
      if (match) {
        precio = match[1].replace(/\./g, '');
      }
    }
    
    console.log('💰 Monto autocompletado:', precio);
    
    setPropiedadSeleccionada(prop);
    
    setFormData(prev => ({
      ...prev,
      propiedad: prop.id,
      monto: precio,
      tipo: tipoContrato,
      fecha_inicio: tipoContrato === 'venta' ? '' : prev.fecha_inicio,
      fecha_fin: tipoContrato === 'venta' ? '' : prev.fecha_fin,
      porcentaje_comision: '',
      comision: '',
    }));
    
    // Cerrar selector de propiedad
    setShowSelectorPropiedad(false);
    
    if (precio) {
      toast.success(`Propiedad: ${prop.titulo} - Monto: ${prop.moneda || 'ARS'} ${Number(precio).toLocaleString('es-AR')}`);
    } else {
      toast.warning(`Propiedad: ${prop.titulo} - Ingresa el monto manualmente`);
    }
  };

  // 🔧 NUEVO: Volver al selector de propiedad - cierra el modal de contrato y abre solo el selector
  const handleVolverSeleccionPropiedad = () => {
    // Limpiar la propiedad seleccionada
    setPropiedadSeleccionada(null);
    setFormData(prev => ({
      ...prev,
      propiedad: '',
      monto: '',
      tipo: 'alquiler',
      porcentaje_comision: '',
      comision: '',
    }));
    // Abrir solo el selector de propiedad
    setShowSelectorPropiedad(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'monto' || name === 'porcentaje_comision') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!cliente || !cliente.id) newErrors.cliente = 'No se ha seleccionado un cliente válido';
    if (!formData.propiedad) newErrors.propiedad = 'La propiedad es obligatoria';

    if (formData.tipo === 'alquiler') {
      if (!formData.fecha_inicio) {
        newErrors.fecha_inicio = 'La fecha de inicio es obligatoria para contratos de alquiler';
      } else {
        const eI = validarFechaInicio(formData.fecha_inicio);
        if (eI) newErrors.fecha_inicio = eI;
      }
      if (formData.fecha_fin) {
        const eF = validarFechas(formData.fecha_inicio, formData.fecha_fin);
        if (eF) newErrors.fecha_fin = eF;
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
    if (!validateForm()) {
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

      if (formData.tipo === 'venta') {
        delete contratoData.fecha_inicio;
        delete contratoData.fecha_fin;
      }

      if (contrato && contrato.id) {
        await contratoService.update(contrato.id, contratoData);
        toast.success('Contrato actualizado correctamente');
      } else {
        await contratoService.create(contratoData);
        toast.success('Contrato creado exitosamente.');
      }

      onHide();
      setTimeout(() => onSuccess(), 350);
    } catch (error) {
      console.error('❌ Error al guardar contrato:', error);
      let errorMessage = 'Error al guardar el contrato';
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          errorMessage = Object.values(errorData).flat().join(', ') || errorMessage;
        }
      }
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDescargarPDF = () => {
    if (!cliente) { toast.error('Falta información del cliente'); return; }
    generarPDFContrato(formData, cliente, propiedadSeleccionada);
  };

  // Si no hay cliente, mostrar error
  if (show && (!cliente || !cliente.id)) {
    return (
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton><Modal.Title>Error</Modal.Title></Modal.Header>
        <Modal.Body>
          <Alert variant="danger">
            No se ha seleccionado un cliente válido. Por favor, selecciona un cliente primero.
          </Alert>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cerrar</Button>
        </Modal.Footer>
      </Modal>
    );
  }

  const esEdicion = !!contrato;
  const esAlquiler = formData.tipo === 'alquiler';

  return (
    <>
      {/* Modal de selección de propiedad - SOLO este visible cuando showSelectorPropiedad = true */}
      <SelectorPropiedadContratoModal
        show={showSelectorPropiedad}
        onHide={() => {
          // Si se cierra el selector sin seleccionar propiedad, cerrar todo el flujo
          setShowSelectorPropiedad(false);
          onHide();
        }}
        propiedades={propiedades}
        onSeleccionarPropiedad={handleSeleccionarPropiedad}
        loading={loadingPropiedades}
        onActualizarPropiedades={cargarPropiedades}
      />

      {/* Modal de contrato - SOLO visible cuando hay propiedad seleccionada y NO estamos en el selector */}
      <Modal show={show && !showSelectorPropiedad && propiedadSeleccionada !== null} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-file-contract me-2"></i>
            {esEdicion ? 'Editar Contrato' : `Nuevo Contrato de ${esAlquiler ? 'Alquiler' : 'Venta'}`} — {cliente?.nombre_completo}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {submitError && (
              <Alert variant="danger" className="mb-3">
                <strong>Error:</strong> {submitError}
              </Alert>
            )}

            {esEdicion && (
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Tipo de Contrato *</Form.Label>
                    <Form.Select name="tipo" value={formData.tipo} onChange={handleChange}>
                      <option value="alquiler">Alquiler</option>
                      <option value="venta">Venta</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            )}

            {/* Resumen de la propiedad seleccionada con botón "Volver a seleccionar propiedad" */}
            <div className="mb-4 p-3 border rounded bg-light">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <h6 className="mb-0 text-primary">
                  <i className="fas fa-building me-2"></i>
                  Propiedad Seleccionada
                </h6>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={handleVolverSeleccionPropiedad}
                >
                  <i className="fas fa-arrow-left me-1"></i>
                  Volver a seleccionar propiedad
                </Button>
              </div>
              <hr className="my-2" />
              <div>
                <strong>{propiedadSeleccionada?.titulo || 'Sin título'}</strong>
                <br />
                <small className="text-muted">
                  {propiedadSeleccionada?.direccion || ''}{propiedadSeleccionada?.ciudad ? ` — ${propiedadSeleccionada?.ciudad}` : ''}
                </small>
                <div className="mt-2">
                  <Badge bg={propiedadSeleccionada?.operacion === 'alquiler' ? 'info' : 'success'} className="text-capitalize me-2">
                    {propiedadSeleccionada?.operacion}
                  </Badge>
                  <Badge bg="secondary" className="text-capitalize">
                    {propiedadSeleccionada?.tipo}
                  </Badge>
                </div>
              </div>
            </div>

            {!esEdicion && (
              <Alert variant={esAlquiler ? 'info' : 'success'} className="py-2 mb-3">
                <i className={`fas fa-${esAlquiler ? 'key' : 'handshake'} me-2`}></i>
                <strong>Contrato de {esAlquiler ? 'Alquiler' : 'Venta'}</strong>
              </Alert>
            )}

            {esAlquiler && (
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
                    <Form.Control.Feedback type="invalid">{errors.fecha_inicio}</Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      <i className="fas fa-info-circle me-1"></i>No se permiten fechas anteriores a hoy
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
                    <Form.Control.Feedback type="invalid">{errors.fecha_fin}</Form.Control.Feedback>
                    <Form.Text className="text-muted">
                      <i className="fas fa-info-circle me-1"></i>Debe ser posterior a la fecha de inicio (opcional)
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            )}

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
                  {errors.monto && <div className="text-danger small mt-1">{errors.monto}</div>}
                  {!esEdicion && (
                    <Form.Text className="text-muted text-success">
                      <i className="fas fa-magic me-1"></i>Monto autocompletado desde la propiedad. Puedes modificarlo si es necesario.
                    </Form.Text>
                  )}
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
                    Ingresá el porcentaje y la comisión se calculará automáticamente
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
                      readOnly
                      style={{ backgroundColor: '#f8f9fa' }}
                      placeholder="0.00"
                    />
                  </InputGroup>
                  <Form.Text className="text-muted">Este campo se calcula automáticamente</Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Estado</Form.Label>
                  {esEdicion ? (
                    <Form.Select name="estado" value={formData.estado || 'activo'} onChange={handleChange}>
                      <option value="activo">Activo</option>
                      <option value="pendiente">Pendiente</option>
                      <option value="finalizado">Finalizado</option>
                      <option value="cancelado">Cancelado</option>
                    </Form.Select>
                  ) : (
                    <Form.Select name="estado" value="activo" disabled style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}>
                      <option value="activo">Activo</option>
                    </Form.Select>
                  )}
                  {!esEdicion && (
                    <Form.Text className="text-muted">
                      <i className="fas fa-lock me-1"></i>El estado es "Activo" por defecto al crear un contrato
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
              variant="outline-dark"
              type="button"
              disabled={!formData.propiedad || !formData.monto}
              onClick={handleDescargarPDF}
              title="Descargar contrato en PDF"
            >
              <i className="fas fa-file-pdf me-2"></i>
              Descargar PDF
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading || Object.keys(errors).length > 0}
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
    </>
  );
};

export default ContratoForm;
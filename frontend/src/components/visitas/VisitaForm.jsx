import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { toast } from 'react-toastify';
import visitaService from '../../services/visitaService';

// Componente modal para crear y editar visitas con diferentes modos de operación
const VisitaForm = ({ show, onHide, visita, cliente, onSuccess }) => {
  // Estados para el formulario y validaciones
  const [formData, setFormData] = useState({
    fecha: '',
    hora: '',
    resultado: '',
    descripcion: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [esEdicion, setEsEdicion] = useState(false);
  
  // 🆕 Estados para verificación de bloqueo
  const [verificandoBloqueo, setVerificandoBloqueo] = useState(false);
  const [clienteBloqueado, setClienteBloqueado] = useState(false);
  const [minutosRestantes, setMinutosRestantes] = useState(0);
  const [tiempoBloqueoHoras, setTiempoBloqueoHoras] = useState(2);
  const [finBloqueo, setFinBloqueo] = useState(null); // 🆕 Fecha/hora fin de bloqueo
  const [visitaDentroBloqueo, setVisitaDentroBloqueo] = useState(false); // 🆕 Si la visita está dentro del bloqueo

  // Obtener fecha actual en formato YYYY-MM-DD
  const getFechaActual = () => {
    const ahora = new Date();
    const year = ahora.getFullYear();
    const month = String(ahora.getMonth() + 1).padStart(2, '0');
    const day = String(ahora.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 🆕 Verificar si el cliente está bloqueado
  const verificarBloqueoCliente = async (clienteId) => {
    try {
      setVerificandoBloqueo(true);
      const data = await visitaService.verificarCliente(clienteId);
      
      console.log('✅ Verificación de bloqueo:', data);
      
      setClienteBloqueado(!data.puede_agendar);
      setMinutosRestantes(data.minutos_restantes || 0);
      setTiempoBloqueoHoras(data.tiempo_bloqueo_horas || 2);
      setFinBloqueo(data.fin_bloqueo ? new Date(data.fin_bloqueo) : null);
      
      return data.puede_agendar;
    } catch (error) {
      console.error('❌ Error al verificar bloqueo:', error);
      // En caso de error, permitir continuar
      setClienteBloqueado(false);
      setMinutosRestantes(0);
      setFinBloqueo(null);
      return true;
    } finally {
      setVerificandoBloqueo(false);
    }
  };

  // 🆕 Verificar si la fecha/hora seleccionada está dentro del período de bloqueo
  const verificarVisitaDentroBloqueo = () => {
    if (!finBloqueo || !formData.fecha || !formData.hora) {
      setVisitaDentroBloqueo(false);
      return false;
    }

    try {
      // Crear objeto Date con la fecha y hora seleccionada
      const [year, month, day] = formData.fecha.split('-');
      const [hours, minutes] = formData.hora.split(':');
      const fechaHoraVisita = new Date(year, month - 1, day, hours, minutes);

      // Comparar con el fin del bloqueo
      const dentroBloqueo = fechaHoraVisita < finBloqueo;
      setVisitaDentroBloqueo(dentroBloqueo);
      
      console.log('🔍 Verificación de horario:', {
        fechaHoraVisita: fechaHoraVisita.toISOString(),
        finBloqueo: finBloqueo.toISOString(),
        dentroBloqueo
      });
      
      return dentroBloqueo;
    } catch (error) {
      console.error('❌ Error al verificar horario:', error);
      setVisitaDentroBloqueo(false);
      return false;
    }
  };

  // 🆕 Formatear tiempo restante
  const formatearTiempoRestante = (minutos) => {
    if (minutos >= 60) {
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      return `${horas}h ${mins}m`;
    }
    return `${minutos} minutos`;
  };

  // 🆕 Formatear fecha/hora del fin de bloqueo
  const formatearFinBloqueo = () => {
    if (!finBloqueo) return '';
    
    const dia = finBloqueo.getDate().toString().padStart(2, '0');
    const mes = (finBloqueo.getMonth() + 1).toString().padStart(2, '0');
    const año = finBloqueo.getFullYear();
    const horas = finBloqueo.getHours().toString().padStart(2, '0');
    const minutos = finBloqueo.getMinutes().toString().padStart(2, '0');
    
    return `${dia}/${mes}/${año} ${horas}:${minutos}`;
  };

  // 🆕 Calcular porcentaje de progreso
  const calcularPorcentajeProgreso = (minutosRestantes) => {
    const totalMinutos = tiempoBloqueoHoras * 60;
    const progreso = ((totalMinutos - minutosRestantes) / totalMinutos) * 100;
    return Math.max(0, Math.min(100, progreso));
  };

  // Efecto para inicializar el formulario según el modo (crear/editar)
  useEffect(() => {
    if (visita) {
      setEsEdicion(true);
      
      // Bloquear edición de visitas finalizadas con datos completos
      if (visita.estado === 'finalizada' && visita.resultado) {
        console.log('❌ Visita finalizada con datos completos, no se puede editar');
        toast.error('Esta visita ya está completa y no puede ser editada');
        onHide();
        return;
      }
      
      // Formatear fecha para input type="date"
      const fechaParts = visita.fecha.split('-');
      const fechaLocal = `${fechaParts[0]}-${fechaParts[1]}-${fechaParts[2]}`;
      
      console.log('📋 Cargando visita en formulario:', visita);
      
      // Cargar datos de la visita existente
      setFormData({
        fecha: fechaLocal,
        hora: visita.hora || '',
        resultado: visita.resultado || '',
        descripcion: visita.descripcion || '',
      });
      
      // No verificar bloqueo en modo edición
      setClienteBloqueado(false);
    } else if (cliente) {
      // Inicializar para nueva visita
      setEsEdicion(false);
      setFormData({
        fecha: getFechaActual(),
        hora: '',
        resultado: '',
        descripcion: '',
      });
      
      // 🆕 Verificar bloqueo para nuevas visitas
      verificarBloqueoCliente(cliente.id);
    }
    setErrors({});
  }, [visita, cliente, show, onHide]);

  // Obtener hora mínima permitida (para visitas del día actual)
  const getHoraMinima = () => {
    const ahora = new Date();
    if (formData.fecha === getFechaActual()) {
      const hora = ahora.getHours().toString().padStart(2, '0');
      const minutos = ahora.getMinutes().toString().padStart(2, '0');
      return `${hora}:${minutos}`;
    }
    return '00:00';
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
    
    // 🆕 Verificar si la fecha/hora está dentro del bloqueo cuando cambian
    if ((name === 'fecha' || name === 'hora') && finBloqueo) {
      // Usar setTimeout para dar tiempo a que se actualice el estado
      setTimeout(() => {
        verificarVisitaDentroBloqueo();
      }, 100);
    }
  };

  // Validar formulario según el modo de operación
  const validateForm = () => {
    const newErrors = {};
    const hoy = getFechaActual();

    // Validación específica para visitas finalizadas (completar información)
    if (esEdicion && visita?.estado === 'finalizada') {
      if (!formData.resultado || formData.resultado === '') {
        newErrors.resultado = 'El resultado es requerido';
      }
      
      if (!formData.descripcion || formData.descripcion.trim() === '') {
        newErrors.descripcion = 'La descripción es requerida';
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    // Validaciones de cambio de estado
    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida';
    } else if (formData.fecha < hoy) {
      newErrors.fecha = 'No se puede programar una visita en el pasado';
    }

    if (!formData.hora) {
      newErrors.hora = 'La hora es requerida';
    } else if (formData.fecha === hoy) {
      const [horas, minutos] = formData.hora.split(':');
      const ahora = new Date();
      const horaVisita = new Date();
      horaVisita.setHours(parseInt(horas), parseInt(minutos), 0, 0);
      
      if (horaVisita <= ahora) {
        newErrors.hora = 'La hora debe ser posterior a la hora actual';
      }
    }

    // 🆕 Validación de horario dentro del bloqueo
    if (!esEdicion && finBloqueo && formData.fecha && formData.hora) {
      const dentroBloqueo = verificarVisitaDentroBloqueo();
      if (dentroBloqueo) {
        newErrors.submit = `No puedes agendar una visita antes de ${formatearFinBloqueo()}. Selecciona un horario posterior.`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 Iniciando submit...');
    
    if (!validateForm()) {
      console.log('❌ Validación fallida');
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    console.log('✅ Validación exitosa');

    setLoading(true);
    try {
      let datosParaEnviar = {};
      let response;

      // Caso 1: Completar información de visita finalizada
      if (esEdicion && visita?.estado === 'finalizada' && !visita.resultado) {
        datosParaEnviar = {
          resultado: formData.resultado,
          descripcion: formData.descripcion.trim()
        };
        
        console.log('📤 Completando información de visita finalizada:', datosParaEnviar);
        response = await visitaService.update(visita.id, datosParaEnviar);
        console.log('✅ Respuesta del servidor:', response);
        
        toast.success('Información de la visita guardada exitosamente');
        onSuccess();
        onHide();
      } 
      // Caso 2: Editar visita pendiente (solo fecha y hora)
      else if (esEdicion && visita?.estado === 'pendiente') {
        datosParaEnviar = {
          cliente: visita.cliente,
          fecha: formData.fecha,
          hora: formData.hora
        };
        
        console.log('📤 Actualizando visita pendiente:', datosParaEnviar);
        response = await visitaService.update(visita.id, datosParaEnviar);
        console.log('✅ Respuesta del servidor:', response);
        
        toast.success('Visita actualizada exitosamente');
        onSuccess();
        onHide();
      }
      // Caso 3: Crear nueva visita
      else if (!esEdicion) {
        datosParaEnviar = {
          cliente: cliente.id,
          fecha: formData.fecha,
          hora: formData.hora
        };
        
        console.log('📤 Creando nueva visita:', datosParaEnviar);
        response = await visitaService.create(datosParaEnviar);
        
        console.log('✅ Respuesta completa del servidor:', response);
        console.log('✅ Tipo de respuesta:', typeof response);
        console.log('✅ ¿Es objeto?', typeof response === 'object' && response !== null);
        
        // Validar respuesta del servidor
        if (response && typeof response === 'object') {
          console.log('✅ Visita creada exitosamente');
          toast.success('Visita agendada exitosamente');
          onSuccess();
          onHide();
        } else {
          console.error('❌ Respuesta inválida:', response);
          throw new Error('Respuesta inválida del servidor');
        }
      }
    } catch (error) {
      console.error('❌ Error al guardar visita:', error);
      console.error('📋 Tipo de error:', typeof error);
      console.error('📋 Error completo:', JSON.stringify(error, null, 2));
      
      let errorMostrado = false;
      
      // 🆕 Manejar error específico de bloqueo de tiempo
      if (error.cliente && typeof error.cliente === 'string' && error.cliente.includes('esperar')) {
        setErrors({ submit: error.cliente });
        toast.error(error.cliente);
        
        // Actualizar información de bloqueo
        if (error.minutos_restantes) {
          setClienteBloqueado(true);
          setMinutosRestantes(error.minutos_restantes);
        }
        errorMostrado = true;
      }
      
      // Manejar errores de validación específicos del backend
      const erroresDelBackend = ['fecha', 'hora', 'estado', 'resultado', 'descripcion'];
      
      erroresDelBackend.forEach(campo => {
        if (error[campo]) {
          const mensaje = Array.isArray(error[campo]) ? error[campo][0] : error[campo];
          setErrors(prev => ({ ...prev, [campo]: mensaje }));
          if (!errorMostrado) {
            toast.error(`Error en ${campo}: ${mensaje}`);
          }
          errorMostrado = true;
        }
      });
      
      // Error genérico si no se manejó un error específico
      if (!errorMostrado) {
        const mensaje = error.detail || error.message || 'Error al guardar la visita';
        setErrors({ submit: mensaje });
        toast.error(mensaje);
      }
    } finally {
      setLoading(false);
    }
  };

  // Manejar cierre del modal
  const handleClose = () => {
    setFormData({
      fecha: getFechaActual(),
      hora: '',
      resultado: '',
      descripcion: '',
    });
    setErrors({});
    setClienteBloqueado(false);
    setMinutosRestantes(0);
    setFinBloqueo(null);
    setVisitaDentroBloqueo(false);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-calendar-plus me-2"></i>
          {visita?.estado === 'finalizada' 
            ? 'Completar Información de Visita' 
            : (visita ? 'Editar Visita' : 'Agendar Nueva Visita')
          }
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {/* Mostrar error general si existe */}
          {errors.submit && (
            <Alert variant="danger">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {errors.submit}
            </Alert>
          )}

          {/* 🆕 Alerta de bloqueo para nuevas visitas */}
          {!esEdicion && verificandoBloqueo && (
            <Alert variant="info">
              <Spinner animation="border" size="sm" className="me-2" />
              Verificando disponibilidad del cliente...
            </Alert>
          )}

          {!esEdicion && finBloqueo && (
            <Alert variant={visitaDentroBloqueo ? "danger" : "success"}>
              <div className="d-flex align-items-center mb-2">
                <i className={`fas ${visitaDentroBloqueo ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2`}></i>
                <strong>
                  {visitaDentroBloqueo 
                    ? 'Horario dentro del período de bloqueo' 
                    : 'Información de disponibilidad'}
                </strong>
              </div>
              
              {visitaDentroBloqueo ? (
                <>
                  <p className="mb-2">
                    El horario seleccionado está dentro del período de bloqueo. 
                    No puedes agendar una visita antes de <strong>{formatearFinBloqueo()}</strong>.
                  </p>
                  <p className="mb-0">
                    <i className="fas fa-lightbulb me-1"></i>
                    <strong>Solución:</strong> Selecciona un horario posterior a {formatearFinBloqueo()}
                  </p>
                </>
              ) : (
                <>
                  <p className="mb-2">
                    Este cliente tiene un período de bloqueo hasta <strong>{formatearFinBloqueo()}</strong>.
                  </p>
                  <p className="mb-0 text-success">
                    <i className="fas fa-check-circle me-1"></i>
                    El horario seleccionado está fuera del bloqueo y puede ser agendado.
                  </p>
                </>
              )}
              
              <ProgressBar 
                now={calcularPorcentajeProgreso(minutosRestantes)} 
                variant={visitaDentroBloqueo ? "danger" : "success"}
                style={{ height: '10px' }}
                className="mt-2"
              />
              <small className="text-muted d-block mt-1">
                Tiempo de espera requerido: {tiempoBloqueoHoras} horas desde la última visita agendada
              </small>
            </Alert>
          )}

          {/* Mostrar información del cliente para nuevas visitas */}
          {cliente && !visita && (
            <Alert variant="info">
              <strong>Cliente:</strong> {cliente.nombre_completo}
              {cliente.dni && <>, DNI: {cliente.dni}</>}
            </Alert>
          )}

          {/* Campos para fecha y hora (no disponibles para visitas finalizadas) */}
          {(!esEdicion || visita?.estado !== 'finalizada') && (
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha *</Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    isInvalid={!!errors.fecha}
                    min={getFechaActual()}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.fecha}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted d-block">
                    Solo se permiten fechas desde hoy en adelante
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Hora *</Form.Label>
                  <Form.Control
                    type="time"
                    name="hora"
                    value={formData.hora}
                    onChange={handleChange}
                    isInvalid={!!errors.hora}
                    min={formData.fecha === getFechaActual() ? getHoraMinima() : '00:00'}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.hora}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          )}

          {/* Campos específicos para completar información de visitas finalizadas */}
          {esEdicion && visita?.estado === 'finalizada' && !visita.resultado && (
            <>
              <Alert variant="warning" className="mb-3">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Importante:</strong> Esta información solo puede ser ingresada una vez.
                Una vez guardada, no podrá ser modificada.
                <br /><br />
                <strong>Cliente:</strong> {visita.cliente_info?.nombre_completo || visita.cliente_nombre}
                <br />
                <strong>Fecha:</strong> {new Date(visita.fecha + 'T00:00:00').toLocaleDateString()} - {visita.hora}
                <br />
                <strong>Hora de finalización:</strong> {new Date().toLocaleTimeString()}
              </Alert>

              {/* Campo: Resultado de la visita */}
              <Form.Group className="mb-3">
                <Form.Label>Resultado *</Form.Label>
                <Form.Select
                  name="resultado"
                  value={formData.resultado}
                  onChange={handleChange}
                  isInvalid={!!errors.resultado}
                >
                  <option value="">Seleccionar resultado...</option>
                  <option value="interesado">Cliente Interesado</option>
                  <option value="no_interesado">Cliente No Interesado</option>
                  <option value="agendada_visita">Se agendó nueva visita</option>
                  <option value="vendido">Se concretó venta/alquiler</option>
                  <option value="pendiente_evaluacion">Pendiente de evaluación</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.resultado}
                </Form.Control.Feedback>
              </Form.Group>

              {/* Campo: Descripción detallada */}
              <Form.Group className="mb-3">
                <Form.Label>Descripción *</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Describe los detalles de la visita: qué se conversó, acuerdos alcanzados, próximos pasos, observaciones importantes, etc."
                  isInvalid={!!errors.descripcion}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.descripcion}
                </Form.Control.Feedback>
              </Form.Group>
            </>
          )}

          {/* Información contextual según el modo */}
          {esEdicion && visita?.estado === 'pendiente' && (
            <Alert variant="info" className="mt-3">
              <i className="fas fa-info-circle me-2"></i>
              <strong>Editando visita pendiente</strong>
              <br />
              <small>
                Solo puedes modificar la fecha y hora de la visita. Los campos de resultado
                y descripción estarán disponibles después de finalizar la visita.
              </small>
            </Alert>
          )}

          {!esEdicion && !finBloqueo && (
            <Alert variant="warning" className="mt-3">
              <i className="fas fa-info-circle me-2"></i>
              <strong>Nota:</strong> Los campos de resultado y descripción 
              estarán disponibles después de finalizar la visita.
            </Alert>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            variant={visita?.estado === 'finalizada' ? 'success' : 'dark'}
            type="submit" 
            disabled={loading || verificandoBloqueo || visitaDentroBloqueo}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Guardando...
              </>
            ) : visitaDentroBloqueo ? (
              <>
                <i className="fas fa-lock me-2"></i>
                Horario bloqueado
              </>
            ) : (
              <>
                <i className={`fas ${visita?.estado === 'finalizada' ? 'fa-save' : (visita ? 'fa-save' : 'fa-calendar-plus')} me-2`}></i>
                {visita?.estado === 'finalizada' ? 'Guardar Información (Único)' : (visita ? 'Actualizar Visita' : 'Agendar Visita')}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default VisitaForm;
import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Badge, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import visitaService from '../../services/visitaService';

// Componente modal para mostrar detalles completos de una visita
const VisitaDetalle = ({ show, onHide, visitaId, onEdit }) => {
  // Estados para datos de la visita y operaciones
  const [visita, setVisita] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);

  // Efecto para cargar datos de la visita cuando se abre el modal
  useEffect(() => {
    const cargarVisita = async () => {
      if (visitaId) {
        try {
          setLoading(true);
          const visitaData = await visitaService.getById(visitaId);
          setVisita(visitaData);
        } catch (error) {
          console.error('Error al cargar visita:', error);
          toast.error('Error al cargar los datos de la visita');
        } finally {
          setLoading(false);
        }
      }
    };

    if (show && visitaId) {
      cargarVisita();
    }
  }, [show, visitaId]);

  // Obtener color del badge según el estado de la visita
  const getEstadoBadge = (estado) => {
    const variants = {
      pendiente: 'warning',
      en_curso: 'primary',
      finalizada: 'success',
      cancelada: 'danger',
    };
    return `bg-${variants[estado] || 'secondary'}`;
  };

  // Obtener color del badge según el resultado de la visita
  const getResultadoBadge = (resultado) => {
    if (!resultado) return 'bg-secondary';
    
    const variants = {
      // 🎯 OPCIONES ACTUALIZADAS - Quitadas "contactado" y "no_contactado"
      interesado: 'success',
      no_interesado: 'danger',
      agendada_visita: 'primary',
      vendido: 'success',
      pendiente_evaluacion: 'warning',
    };
    return `bg-${variants[resultado] || 'secondary'}`;
  };

  // Manejar cambio de estado de la visita
  const handleCambiarEstado = async (nuevoEstado) => {
    try {
      setCambiandoEstado(true);
      await visitaService.cambiarEstado(visitaId, nuevoEstado);
      
      // Si se finaliza la visita, abrir formulario de edición automáticamente
      if (nuevoEstado === 'finalizada') {
        toast.success('Visita finalizada. Completa la información de resultado.');
        
        // Recargar datos actualizados
        const visitaData = await visitaService.getById(visitaId);
        setVisita(visitaData);
        
        // Cerrar este modal y abrir el formulario de edición
        onHide();
        setTimeout(() => {
          onEdit(visitaData);
        }, 300);
      } else {
        toast.success('Estado actualizado correctamente');
        
        // Recargar datos actualizados
        const visitaData = await visitaService.getById(visitaId);
        setVisita(visitaData);
      }
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error(error.error || 'Error al cambiar el estado');
    } finally {
      setCambiandoEstado(false);
    }
  };

  // Manejar edición de la visita con validaciones
  const handleEditarVisita = () => {
    // Solo permitir editar si está pendiente O si está finalizada SIN datos
    if (visita.estado === 'pendiente') {
      onHide();
      onEdit(visita);
    } else if (visita.estado === 'finalizada' && !visita.resultado) {
      // Solo permitir editar visitas finalizadas que NO tienen resultado
      onHide();
      onEdit(visita);
    } else if (visita.estado === 'finalizada' && visita.resultado) {
      toast.warning('Esta visita ya tiene información completa y no puede ser editada');
    } else {
      toast.info('Solo se pueden editar visitas pendientes');
    }
  };

  // Determinar si la visita puede ser editada
  const puedeEditar = () => {
    // Solo permitir edición de visitas pendientes o finalizadas SIN resultado
    return visita && (
      visita.estado === 'pendiente' || 
      (visita.estado === 'finalizada' && !visita.resultado)
    );
  };

  // Mostrar spinner mientras carga
  if (loading) {
    return (
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Body className="text-center py-5">
          <Spinner animation="border" variant="dark" />
          <p className="mt-2">Cargando información de la visita...</p>
        </Modal.Body>
      </Modal>
    );
  }

  // Mostrar mensaje si no se encuentra la visita
  if (!visita) {
    return (
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Body className="text-center py-5">
          <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
          <h5>Visita no encontrada</h5>
          <Button variant="dark" onClick={onHide} className="mt-3">
            Cerrar
          </Button>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-calendar-check me-2"></i>
          Detalles de la Visita
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* Header con información principal */}
        <Row className="mb-4">
          <Col md={8}>
            {/* 🎯 NOMBRE DEL CLIENTE EN NEGRO */}
            <h5 className="text-dark" style={{ color: '#000', fontWeight: 'bold' }}>
              {visita.cliente_info?.nombre_completo || visita.cliente_nombre}
            </h5>
            <div className="d-flex gap-2 align-items-center">
              <Badge className={getEstadoBadge(visita.estado)}>
                {visita.estado.replace('_', ' ').toUpperCase()}
              </Badge>
              {visita.resultado && (
                <Badge className={getResultadoBadge(visita.resultado)}>
                  {visita.resultado.replace('_', ' ').toUpperCase()}
                </Badge>
              )}
            </div>
          </Col>
          <Col md={4} className="text-end">
            <small className="text-muted">
              ID: #{visita.id}
            </small>
          </Col>
        </Row>

        {/* Información detallada en dos columnas */}
        <Row>
          <Col md={6}>
            <ListGroup variant="flush">
              <ListGroup.Item className="d-flex justify-content-between">
                <strong>Fecha:</strong>
                <span>{new Date(visita.fecha + 'T00:00:00').toLocaleDateString()}</span>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between">
                <strong>Hora programada:</strong>
                <span>{visita.hora}</span>
              </ListGroup.Item>
              <ListGroup.Item className="d-flex justify-content-between">
                <strong>Estado:</strong>
                <Badge className={getEstadoBadge(visita.estado)}>
                  {visita.estado.replace('_', ' ').toUpperCase()}
                </Badge>
              </ListGroup.Item>
            </ListGroup>
          </Col>
          
          <Col md={6}>
            <ListGroup variant="flush">
              <ListGroup.Item className="d-flex justify-content-between">
                <strong>Resultado:</strong>
                {visita.resultado ? (
                  <Badge className={getResultadoBadge(visita.resultado)}>
                    {visita.resultado.replace('_', ' ').toUpperCase()}
                  </Badge>
                ) : (
                  <span className="text-muted">No especificado</span>
                )}
              </ListGroup.Item>
              
              {/*Hora de finalización */}
              {visita.hora_finalizacion && (
                <ListGroup.Item className="d-flex justify-content-between">
                  <strong>Hora de finalización:</strong>
                  <span>{visita.hora_finalizacion}</span>
                </ListGroup.Item>
              )}
              
              <ListGroup.Item className="d-flex justify-content-between">
                <strong>Creada por:</strong>
                <span>{visita.creado_por_nombre}</span>
              </ListGroup.Item>
            </ListGroup>
          </Col>
        </Row>

        {/* Descripción de la visita (si existe) */}
        {visita.descripcion && (
          <div className="mt-4">
            <h6 className="text-muted mb-2">Descripción</h6>
            <div className="border rounded p-3 bg-light">
              <p style={{ whiteSpace: 'pre-wrap' }} className="mb-0">
                {visita.descripcion}
              </p>
            </div>
          </div>
        )}

        {/* Información de fechas importantes */}
        <div className="mt-4">
          <h6 className="text-muted mb-2">Información de Auditoría</h6>
          <Row>
            <Col md={6}>
              <small className="text-muted d-block">
                <strong>Fecha de creación:</strong> {new Date(visita.fecha_creacion).toLocaleString()}
              </small>
            </Col>
            <Col md={6}>
              {visita.fecha_finalizacion && (
                <small className="text-muted d-block">
                  <strong>Fecha de finalización:</strong> {new Date(visita.fecha_finalizacion).toLocaleString()}
                </small>
              )}
              {visita.fecha_cancelacion && (
                <small className="text-muted d-block">
                  <strong>Fecha de cancelación:</strong> {new Date(visita.fecha_cancelacion).toLocaleString()}
                </small>
              )}
            </Col>
          </Row>
        </div>

        {/* Alertas informativas según el estado */}
        {visita.estado === 'pendiente' && (
          <Alert variant="warning" className="mt-3">
            <i className="fas fa-clock me-2"></i>
            <strong>Visita Pendiente</strong>
            <br />
            <small>
              Esta visita cambiará automáticamente a "En Curso" cuando llegue la hora programada.
              Puedes editar la fecha y hora si es necesario.
            </small>
          </Alert>
        )}

        {visita.estado === 'en_curso' && (
          <Alert variant="info" className="mt-3">
            <i className="fas fa-play-circle me-2"></i>
            <strong>Visita En Curso</strong>
            <br />
            <small>
              La visita está actualmente en desarrollo. Al finalizarla, se abrirá automáticamente 
              el formulario para agregar el resultado y descripción.
            </small>
          </Alert>
        )}

        {visita.estado === 'finalizada' && !visita.resultado && (
          <Alert variant="warning" className="mt-3">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>Visita Finalizada - Información Incompleta</strong>
            <br />
            <small>
              Esta visita ha sido finalizada pero aún no tiene resultado.
              Haz clic en "Completar Información" para agregarla.
            </small>
          </Alert>
        )}

        {visita.estado === 'finalizada' && visita.resultado && (
          <Alert variant="success" className="mt-3">
            <i className="fas fa-check-double me-2"></i>
            <strong>Visita Completada</strong>
            <br />
            <small>
              Esta visita ha sido completada con toda su información. Los datos están bloqueados 
              y no pueden ser modificados para mantener la integridad del registro.
            </small>
          </Alert>
        )}

        {visita.estado === 'cancelada' && (
          <Alert variant="danger" className="mt-3">
            <i className="fas fa-times-circle me-2"></i>
            <strong>Visita Cancelada</strong>
            <br />
            <small>
              Esta visita ha sido cancelada y no se puede modificar.
            </small>
          </Alert>
        )}

        {/* Panel de acciones según el estado */}
        <div className="mt-4 p-3 bg-light rounded">
          <h6 className="mb-3">Acciones de Estado</h6>
          <div className="d-flex gap-2 flex-wrap">
            {/* Cancelar visita (solo para visitas pendientes) */}
            {visita.puede_ser_cancelada && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleCambiarEstado('cancelada')}
                disabled={cambiandoEstado}
              >
                {cambiandoEstado ? (
                  <Spinner animation="border" size="sm" className="me-2" />
                ) : (
                  <i className="fas fa-times me-2"></i>
                )}
                Cancelar Visita
              </Button>
            )}
            
            {/* Finalizar visita (solo para visitas en curso) */}
            {visita.puede_ser_finalizada && (
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => handleCambiarEstado('finalizada')}
                disabled={cambiandoEstado}
              >
                {cambiandoEstado ? (
                  <Spinner animation="border" size="sm" className="me-2" />
                ) : (
                  <i className="fas fa-check me-2"></i>
                )}
                Finalizar Visita
              </Button>
            )}
            
            {/* Información de bloqueo para visitas completadas */}
            {(visita.esta_finalizada || visita.esta_cancelada) && visita.resultado && (
              <div className="w-100">
                <small className="text-muted">
                  <i className="fas fa-lock me-1"></i>
                  Esta visita está bloqueada y no puede ser modificada
                </small>
              </div>
            )}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
        {/* Botón de edición condicional */}
        {puedeEditar() && (
          <Button 
            variant={visita.estado === 'finalizada' ? 'warning' : 'dark'}
            onClick={handleEditarVisita}
          >
            <i className="fas fa-edit me-2"></i>
            {visita.estado === 'finalizada' && !visita.resultado 
              ? 'Completar Información' 
              : 'Editar Visita'
            }
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default VisitaDetalle;
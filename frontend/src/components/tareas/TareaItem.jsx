import React, { useState } from 'react';
import { Modal, Button, Card, Badge, Spinner, Alert } from 'react-bootstrap';

// Componente para mostrar cada tarea individual en la lista
const TareaItem = ({ tarea, onEdit, onDelete, onFinalizar }) => {
  // Estados para controlar modales y acciones
  const [showDetalles, setShowDetalles] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [showConfirmacionEliminar, setShowConfirmacionEliminar] = useState(false);
  const [showConfirmacionFinalizar, setShowConfirmacionFinalizar] = useState(false);

  // Obtener color del badge según la prioridad
  const getPrioridadBadge = (prioridad) => {
    const variants = {
      alta: 'danger',
      media: 'warning', 
      baja: 'primary'
    };
    return `bg-${variants[prioridad] || 'secondary'}`;
  };

  // Formatear fecha para mostrar
  const formatFecha = (fechaString) => {
    if (!fechaString) return 'No especificada';
    try {
      let fecha;
      
      if (typeof fechaString === 'string') {
        if (fechaString.match(/^\d{4}-\d{2}-\d{2}$/)) {
          fecha = new Date(fechaString + 'T12:00:00-03:00');
        } else if (fechaString.includes('T')) {
          fecha = new Date(fechaString);
        } else {
          fecha = new Date(fechaString);
        }
      } else {
        fecha = new Date(fechaString);
      }
      
      if (isNaN(fecha.getTime())) {
        return 'Fecha inválida';
      }
      
      return fecha.toLocaleDateString('es-AR', {
        timeZone: 'America/Argentina/Salta',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return 'Fecha no disponible';
    }
  };

  // Formatear fecha de creación con hora
  const formatFechaCreacion = (fechaString) => {
    if (!fechaString) return 'No disponible';
    try {
      let fecha;
      
      if (typeof fechaString === 'string') {
        if (fechaString.includes('T')) {
          fecha = new Date(fechaString);
        } else {
          fecha = new Date(fechaString + 'T12:00:00-03:00');
        }
      } else {
        fecha = new Date(fechaString);
      }
      
      if (isNaN(fecha.getTime())) {
        return 'Fecha inválida';
      }
      
      return fecha.toLocaleDateString('es-AR', {
        timeZone: 'America/Argentina/Salta',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };

  // Obtener nombres de los empleados asignados
  const getNombresEmpleados = () => {
    if (tarea.empleados_detalle && Array.isArray(tarea.empleados_detalle)) {
      return tarea.empleados_detalle.map(emp => {
        let nombreCompleto = emp.nombre_completo || `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
        
        if (!nombreCompleto || nombreCompleto === ' ') {
          nombreCompleto = emp.username || 'Empleado';
        }
        
        return nombreCompleto;
      });
    }
    
    if (tarea.empleados && Array.isArray(tarea.empleados)) {
      if (tarea.empleados.length > 0) {
        if (tarea.empleados.length === 1) {
          return ['1 empleado asignado'];
        } else {
          return [`${tarea.empleados.length} empleados asignados`];
        }
      }
    }
    
    return null;
  };

  // Obtener título para la sección de empleados
  const getTituloEmpleados = () => {
    if (!empleadosNombres || empleadosNombres.length === 0) {
      return 'Empleados Asignados';
    }
    
    const cantidadEmpleados = tarea.empleados_detalle ? tarea.empleados_detalle.length : 
                             tarea.empleados ? tarea.empleados.length : 0;
    
    if (cantidadEmpleados === 1) {
      return 'Empleado Asignado';
    }
    
    return 'Empleados Asignados';
  };

  // Obtener texto resumido para empleados (para la vista previa)
  const getTextoEmpleadosResumido = () => {
    if (!empleadosNombres || empleadosNombres.length === 0) {
      return null;
    }
    
    const cantidadEmpleados = tarea.empleados_detalle ? tarea.empleados_detalle.length : 
                             tarea.empleados ? tarea.empleados.length : 0;
    
    if (cantidadEmpleados === 1) {
      return 'Empleado Asignado';
    } else {
      return `${cantidadEmpleados} Empleados Asignados`;
    }
  };

  // Obtener nombres reales de empleados para mostrar
  const getNombresEmpleadosReales = () => {
    if (tarea.empleados_detalle && Array.isArray(tarea.empleados_detalle)) {
      return tarea.empleados_detalle.map(emp => {
        let nombreCompleto = emp.nombre_completo || `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
        
        if (!nombreCompleto || nombreCompleto === ' ') {
          nombreCompleto = emp.username || 'Empleado';
        }
        
        return nombreCompleto;
      });
    }
    
    if (tarea.empleados && Array.isArray(tarea.empleados)) {
      // Si no tenemos detalles, solo mostrar cantidad
      return [];
    }
    
    return null;
  };

  // Manejar clic en botón finalizar
  const handleFinalizarClick = () => {
    setShowConfirmacionFinalizar(true);
  };

  // Confirmar finalización de tarea
  const handleConfirmarFinalizar = async () => {
    setShowConfirmacionFinalizar(false);
    setFinalizando(true);
    try {
      await onFinalizar(tarea.id);
    } finally {
      setFinalizando(false);
    }
  };

  // Cancelar finalización
  const handleCancelarFinalizar = () => {
    setShowConfirmacionFinalizar(false);
  };

  // Manejar clic en botón eliminar
  const handleEliminarClick = () => {
    setShowConfirmacionEliminar(true);
  };

  // Confirmar eliminación de tarea
  const handleConfirmarEliminar = async () => {
    setShowConfirmacionEliminar(false);
    try {
      await onDelete(tarea.id);
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
    }
  };

  // Cancelar eliminación
  const handleCancelarEliminar = () => {
    setShowConfirmacionEliminar(false);
  };

  // Controlar visibilidad del modal de detalles
  const handleCloseDetalles = () => setShowDetalles(false);
  const handleShowDetalles = () => setShowDetalles(true);

  const empleadosNombres = getNombresEmpleados();
  const tituloEmpleados = getTituloEmpleados();
  const textoEmpleadosResumido = getTextoEmpleadosResumido();
  const nombresEmpleadosReales = getNombresEmpleadosReales();

  return (
    <>
      {/* Estilos CSS personalizados para el componente */}
      <style>
        {`
          .btn-orange-outline {
            background-color: transparent;
            border-color: #e67e22;
            color: #e67e22;
            border-width: 2px;
          }
          .btn-orange-outline:hover {
            background-color: #e67e22;
            border-color: #e67e22;
            color: white;
          }
          .tarea-finalizada {
            opacity: 0.7;
            background-color: #f8f9fa;
          }
          .botones-tarea {
            display: flex;
            gap: 8px;
            flex-wrap: nowrap;
            justify-content: flex-end;
          }
          .boton-compacto {
            white-space: nowrap;
            font-size: 0.875rem;
            padding: 6px 12px;
          }
          
          /* Estilos mejorados para la tarjeta de tarea */
          .tarea-card {
            transition: all 0.3s ease;
            border-left: 5px solid #343a40 !important;
            border-radius: 8px !important;
            overflow: hidden;
          }
          
          .tarea-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
          }
          
          .tarea-card.tarea-finalizada {
            border-left-color: #28a745 !important;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          }
          
          .tarea-prioridad-alta {
            border-left-color: #dc3545 !important;
          }
          
          .tarea-prioridad-media {
            border-left-color: #ffc107 !important;
          }
          
          .tarea-prioridad-baja {
            border-left-color: #007bff !important;
          }
          
          .tarea-header {
            padding: 1rem 1.25rem 0.5rem 1.25rem;
          }
          
          .tarea-contenido {
            padding: 0.5rem 1.25rem 1rem 1.25rem;
          }
          
          .titulo-tarea {
            margin-left: 0.5rem;
            padding: 0.5rem 0;
          }

          .contenedor-empleados {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 4px;
          }

          .empleado-item {
            background-color: #e9ecef;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 0.8rem;
            display: flex;
            align-items: center;
            gap: 4px;
            border: 1px solid #dee2e6;
          }

          .icono-empleado {
            color: #000;
          }

          .nombre-empleado {
            color: #000;
            font-weight: 500;
          }
        `}
      </style>

      {/* Tarjeta principal de la tarea */}
      <Card className={`mb-3 tarea-card shadow-sm ${
        tarea.finalizada ? 'tarea-finalizada' : ''
      } ${
        tarea.prioridad === 'alta' ? 'tarea-prioridad-alta' :
        tarea.prioridad === 'media' ? 'tarea-prioridad-media' :
        'tarea-prioridad-baja'
      }`}>
        <Card.Body className="p-0">
          {/* Header de la tarjeta con título y badges */}
          <div className="tarea-header">
            <div className="row align-items-center">
              <div className="col">
                <div className="d-flex align-items-center justify-content-between titulo-tarea">
                  <div className="d-flex align-items-center">
                    <h5 className="card-title mb-0 me-3 fw-bold text-dark">{tarea.nombre}</h5>
                    <Badge className={getPrioridadBadge(tarea.prioridad)}>
                      {tarea.prioridad.toUpperCase()}
                    </Badge>
                    {tarea.finalizada && (
                      <Badge bg="success" className="ms-2">
                        <i className="fas fa-check-circle me-1"></i>
                        FINALIZADA
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <hr className="my-2 mx-3" />

          {/* Contenido de la tarjeta con horarios, empleados y botones */}
          <div className="tarea-contenido">
            <div className="row align-items-center">
              <div className="col-md-8">
                <div className="d-flex flex-column h-100">
                  <div className="mb-2">
                    <small className="text-muted d-block mb-1">
                      <i className="fas fa-clock me-1"></i>
                      <strong>Horario:</strong>
                    </small>
                    <span className="text-dark fw-semibold">
                      Desde {tarea.hora_inicio} 
                      {tarea.hora_fin ? (
                        <> hasta {tarea.hora_fin}</>
                      ) : (
                        <> (sin fin)</>
                      )}
                    </span>
                  </div>
                  
                  {/* 🎯 CORREGIDO: Información de empleados asignados en vista previa */}
                  {textoEmpleadosResumido && (
                    <div>
                      <small className="text-muted d-block mb-1">
                        <i className="fas fa-users me-1"></i>
                        <strong>{textoEmpleadosResumido}</strong>
                      </small>
                      <div className="contenedor-empleados">
                        {nombresEmpleadosReales && nombresEmpleadosReales.length > 0 ? (
                          nombresEmpleadosReales.map((nombre, index) => (
                            <div key={index} className="empleado-item">
                              <i className="fas fa-user icono-empleado"></i>
                              <span className="nombre-empleado">{nombre}</span>
                            </div>
                          ))
                        ) : (
                          <div className="empleado-item">
                            <i className="fas fa-user icono-empleado"></i>
                            <span className="nombre-empleado">
                              {textoEmpleadosResumido.includes('1') 
                                ? '1 Empleado Asignado'
                                : `${tarea.empleados ? tarea.empleados.length : 0} Empleados Asignados`
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de acción */}
              <div className="col-md-4">
                <div className="botones-tarea">
                  <Button 
                    variant="outline-dark" 
                    size="sm"
                    onClick={handleShowDetalles}
                    className="boton-compacto border-2"
                  >
                    <i className="fas fa-eye me-1"></i>Detalles
                  </Button>
                  
                  {/* Botón Finalizar (solo para tareas no finalizadas) */}
                  {!tarea.finalizada && (
                    <Button 
                      variant="outline-success" 
                      size="sm"
                      onClick={handleFinalizarClick}
                      disabled={finalizando}
                      className="boton-compacto border-2"
                    >
                      {finalizando ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-1" />
                          Finalizando...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check me-1"></i>Finalizar
                        </>
                      )}
                    </Button>
                  )}
                  
                  {/* Botón Editar (solo para tareas no finalizadas) */}
                  {!tarea.finalizada && (
                    <Button 
                      className="btn-orange-outline boton-compacto"
                      size="sm"
                      onClick={() => onEdit(tarea)}
                    >
                      <i className="fas fa-edit me-1"></i>Editar
                    </Button>
                  )}
                  
                  {/* Botón Eliminar */}
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={handleEliminarClick}
                    className="boton-compacto border-2"
                    disabled={tarea.finalizada}
                    title={tarea.finalizada ? 'No se puede eliminar una tarea finalizada' : 'Eliminar'}
                  >
                    <i className="fas fa-trash me-1"></i>Eliminar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Modal de confirmación para finalizar tarea */}
      <Modal 
        show={showConfirmacionFinalizar} 
        onHide={handleCancelarFinalizar} 
        centered
        size="md"
      >
        <Modal.Header closeButton className="bg-success text-white border-bottom">
          <Modal.Title>
            <i className="fas fa-check-circle me-2"></i>
            Finalizar Tarea
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="text-center py-4">
          <div className="mb-3">
            <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
            <h5 className="text-dark fw-bold">¿Finalizar esta tarea?</h5>
          </div>
          
          <Alert variant="info" className="text-start">
            <div className="d-flex align-items-start">
              <i className="fas fa-info-circle me-2 mt-1 text-info"></i>
              <div>
                <strong className="d-block">Esta acción no se puede deshacer</strong>
                <small className="text-muted">
                  Una vez finalizada, la tarea no podrá ser editada.
                </small>
              </div>
            </div>
          </Alert>

          <div className="mt-4">
            <p className="text-muted mb-3">
              <strong>Tarea a finalizar:</strong><br />
              <span className="fw-semibold text-dark">"{tarea.nombre}"</span><br />
              <small>
                Fecha: {formatFecha(tarea.fecha)} | Hora: {tarea.hora_inicio}
                {tarea.hora_fin && ` - ${tarea.hora_fin}`}
              </small>
            </p>
          </div>
        </Modal.Body>

        <Modal.Footer className="justify-content-center border-top-0">
          <Button 
            variant="outline-secondary" 
            onClick={handleCancelarFinalizar}
            className="px-4"
          >
            <i className="fas fa-times me-2"></i>
            Cancelar
          </Button>
          <Button 
            variant="success" 
            onClick={handleConfirmarFinalizar}
            className="px-4"
          >
            <i className="fas fa-check me-2"></i>
            Sí, Finalizar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de confirmación para eliminar tarea */}
      <Modal 
        show={showConfirmacionEliminar} 
        onHide={handleCancelarEliminar} 
        centered
        size="md"
      >
        <Modal.Header closeButton className="bg-danger text-white border-bottom">
          <Modal.Title>
            <i className="fas fa-exclamation-triangle me-2"></i>
            Confirmar Eliminación
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body className="text-center py-4">
          <div className="mb-3">
            <i className="fas fa-trash-alt fa-3x text-danger mb-3"></i>
            <h5 className="text-dark fw-bold">¿Estás seguro de que quieres eliminar esta tarea?</h5>
          </div>
          
          <Alert variant="warning" className="text-start">
            <div className="d-flex align-items-start">
              <i className="fas fa-info-circle me-2 mt-1 text-warning"></i>
              <div>
                <strong className="d-block">Esta acción no se puede deshacer</strong>
                <small className="text-muted">
                  La tarea "{tarea.nombre}" será eliminada permanentemente del sistema.
                </small>
              </div>
            </div>
          </Alert>

          <div className="mt-4">
            <p className="text-muted mb-3">
              <strong>Tarea a eliminar:</strong><br />
              <span className="fw-semibold text-dark">"{tarea.nombre}"</span><br />
              <small>
                Fecha: {formatFecha(tarea.fecha)} | Hora: {tarea.hora_inicio}
                {tarea.hora_fin && ` - ${tarea.hora_fin}`}
              </small>
            </p>
          </div>
        </Modal.Body>

        <Modal.Footer className="justify-content-center border-top-0">
          <Button 
            variant="outline-secondary" 
            onClick={handleCancelarEliminar}
            className="px-4"
          >
            <i className="fas fa-times me-2"></i>
            Cancelar
          </Button>
          <Button 
            variant="danger" 
            onClick={handleConfirmarEliminar}
            className="px-4"
          >
            <i className="fas fa-trash me-2"></i>
            Sí, Eliminar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de detalles de la tarea */}
      <Modal show={showDetalles} onHide={handleCloseDetalles} size="lg">
        <Modal.Header closeButton className="bg-dark text-white border-bottom">
          <Modal.Title>
            <i className="fas fa-info-circle me-2"></i>
            Detalles de la Tarea
          </Modal.Title>
        </Modal.Header>
        
        <Modal.Body>
          <div className="row mb-4">
            <div className="col-md-8">
              <h3 className="text-dark fw-bold">{tarea.nombre}</h3>
              <div className="d-flex gap-2">
                <Badge className={getPrioridadBadge(tarea.prioridad)}>
                  Prioridad: {tarea.prioridad.toUpperCase()}
                </Badge>
                {tarea.finalizada && (
                  <Badge bg="success">
                    <i className="fas fa-check-circle me-1"></i>
                    FINALIZADA
                  </Badge>
                )}
              </div>
            </div>
            <div className="col-md-4 text-end">
              <small className="text-muted">ID: #{tarea.id}</small>
            </div>
          </div>

          {/* Descripción de la tarea */}
          {tarea.descripcion ? (
            <div className="mb-4">
              <h6 className="text-muted mb-2">
                <i className="fas fa-align-left me-2"></i>Descripción
              </h6>
              <p className="mb-0">{tarea.descripcion}</p>
            </div>
          ) : (
            <div className="mb-4">
              <h6 className="text-muted mb-2">
                <i className="fas fa-align-left me-2"></i>Descripción
              </h6>
              <p className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                No hay descripción disponible
              </p>
            </div>
          )}

          {/* Fecha y horarios */}
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="mb-3">
                <h6 className="text-muted mb-2">
                  <i className="fas fa-calendar me-2"></i>Fecha
                </h6>
                <p className="mb-0 fs-6">{formatFecha(tarea.fecha)}</p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <h6 className="text-muted mb-2">
                  <i className="fas fa-clock me-2"></i>Horarios
                </h6>
                <div>
                  <div className="mb-2">
                    <strong>Desde:</strong> {tarea.hora_inicio}
                  </div>
                  {tarea.hora_fin ? (
                    <div>
                      <strong>Hasta:</strong> {tarea.hora_fin}
                    </div>
                  ) : (
                    <div className="text-muted">
                      <i className="fas fa-info-circle me-1"></i>
                      No hay hora de fin estimada
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Información de finalización (si está finalizada) */}
          {tarea.finalizada && tarea.fecha_finalizacion && (
            <div className="mb-4 p-3 bg-success bg-opacity-10 border border-success rounded">
              <h6 className="text-success mb-2">
                <i className="fas fa-check-circle me-2"></i>Tarea Finalizada
              </h6>
              <small className="text-muted">
                <i className="fas fa-clock me-1"></i>
                Finalizada el {formatFechaCreacion(tarea.fecha_finalizacion)}
              </small>
            </div>
          )}

          {/* Empleados asignados */}
          <div className="mb-4">
            <h6 className="text-muted mb-2">
              <i className="fas fa-users me-2"></i>
              {tituloEmpleados}
            </h6>
            {empleadosNombres ? (
              <div>
                {empleadosNombres.map((nombre, index) => (
                  <Badge 
                    key={index} 
                    bg="light" 
                    text="dark" 
                    className="me-2 mb-2 p-2 border"
                  >
                    <i className="fas fa-user me-1 text-dark"></i>
                    {nombre}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                No hay información de empleados asignados disponible
              </p>
            )}
          </div>

          {/* Información de creación */}
          <div className="border-top pt-3 mt-3">
            <small className="text-muted">
              <i className="fas fa-info-circle me-1"></i>
              {tarea.creado_en ? (
                <>Tarea creada el {formatFechaCreacion(tarea.creado_en)}</>
              ) : (
                <>Información de creación no disponible</>
              )}
            </small>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button 
            variant="outline-secondary" 
            onClick={handleCloseDetalles}
          >
            <i className="fas fa-times me-1"></i>Cerrar
          </Button>
          
          {/* Botón editar en modal de detalles (solo para tareas no finalizadas) */}
          {!tarea.finalizada && (
            <Button 
              className="btn-orange-outline"
              onClick={() => {
                handleCloseDetalles();
                onEdit(tarea);
              }}
            >
              <i className="fas fa-edit me-1"></i>Editar Tarea
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TareaItem;
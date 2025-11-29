import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, InputGroup, ListGroup, Badge, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import visitaService from '../../services/visitaService';

// Componente modal para seleccionar un cliente de una lista con bloqueo temporal
const SelectorClienteModal = ({ show, onHide, clientes, onSeleccionarCliente, loading, onActualizarClientes }) => {
  // Estados para búsqueda y filtrado
  const [busqueda, setBusqueda] = useState('');
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [actualizando, setActualizando] = useState(false);
  
  // 🆕 Estados para bloqueo de clientes
  const [clientesBloqueados, setClientesBloqueados] = useState({});
  const [cargandoBloqueos, setCargandoBloqueos] = useState(false);

  // 🆕 Cargar información de clientes bloqueados
  const cargarClientesBloqueados = async () => {
    try {
      setCargandoBloqueos(true);
      const data = await visitaService.getClientesBloqueados();
      setClientesBloqueados(data.clientes_bloqueados || {});
      console.log('✅ Clientes bloqueados cargados:', data.clientes_bloqueados);
    } catch (error) {
      console.error('❌ Error al cargar clientes bloqueados:', error);
    } finally {
      setCargandoBloqueos(false);
    }
  };

  // 🆕 Efecto para cargar bloqueos al abrir el modal
  useEffect(() => {
    if (show) {
      cargarClientesBloqueados();
      
      // Actualizar cada 30 segundos mientras el modal está abierto
      const interval = setInterval(() => {
        cargarClientesBloqueados();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [show]);

  // Efecto para filtrar clientes según la búsqueda
  useEffect(() => {
    if (clientes && clientes.length > 0) {
      if (busqueda.trim() === '') {
        setClientesFiltrados(clientes);
      } else {
        const busquedaLower = busqueda.toLowerCase();
        const filtrados = clientes.filter(cliente => {
          const nombreCompleto = cliente.nombre_completo?.toLowerCase() || '';
          const dni = cliente.dni?.toLowerCase() || '';
          const telefono = cliente.telefono?.toLowerCase() || '';
          const email = cliente.email?.toLowerCase() || '';
          
          return (
            nombreCompleto.includes(busquedaLower) ||
            dni.includes(busquedaLower) ||
            telefono.includes(busquedaLower) ||
            email.includes(busquedaLower)
          );
        });
        setClientesFiltrados(filtrados);
      }
    }
  }, [clientes, busqueda]);

  // Limpiar la búsqueda
  const handleLimpiarBusqueda = () => {
    setBusqueda('');
  };

  // 🆕 Verificar si un cliente está bloqueado
  const clienteEstaBloqueado = (clienteId) => {
    return clientesBloqueados[clienteId]?.bloqueado || false;
  };

  // 🆕 Obtener minutos restantes para un cliente bloqueado
  const getMinutosRestantes = (clienteId) => {
    return clientesBloqueados[clienteId]?.minutos_restantes || 0;
  };

  // 🆕 Formatear tiempo restante en formato legible
  const formatearTiempoRestante = (minutos) => {
    if (minutos >= 60) {
      const horas = Math.floor(minutos / 60);
      const mins = minutos % 60;
      return `${horas}h ${mins}m`;
    }
    return `${minutos} min`;
  };

  // 🆕 Calcular porcentaje de progreso (120 minutos = 100%)
  const calcularPorcentajeProgreso = (minutosRestantes) => {
    const totalMinutos = 120; // 2 horas
    const progreso = ((totalMinutos - minutosRestantes) / totalMinutos) * 100;
    return Math.max(0, Math.min(100, progreso));
  };

  // Manejar selección de cliente
  const handleSeleccionar = (cliente) => {
    // Verificar si el cliente está bloqueado
    if (clienteEstaBloqueado(cliente.id)) {
      const minutosRestantes = getMinutosRestantes(cliente.id);
      const tiempoFormateado = formatearTiempoRestante(minutosRestantes);
      const infoBloqueo = clientesBloqueados[cliente.id];
      
      // Calcular fecha/hora de fin de bloqueo
      let mensajeFinBloqueo = '';
      if (infoBloqueo && infoBloqueo.puede_agendar_desde) {
        const finBloqueo = new Date(infoBloqueo.puede_agendar_desde);
        const dia = finBloqueo.getDate().toString().padStart(2, '0');
        const mes = (finBloqueo.getMonth() + 1).toString().padStart(2, '0');
        const año = finBloqueo.getFullYear();
        const horas = finBloqueo.getHours().toString().padStart(2, '0');
        const minutos = finBloqueo.getMinutes().toString().padStart(2, '0');
        mensajeFinBloqueo = `\nPodrás agendar para horarios posteriores a: ${dia}/${mes}/${año} ${horas}:${minutos}`;
      }
      
      // Mostrar alerta informativa
      alert(`⏱️ Este cliente tiene un período de bloqueo activo.\n\n` +
            `Tiempo restante del bloqueo: ${tiempoFormateado}${mensajeFinBloqueo}\n\n` +
            `✅ Puedes agendar visitas para horarios posteriores al período de bloqueo.\n\n` +
            `Selecciona este cliente y elige un horario apropiado en el formulario.`);
    }
    
    setBusqueda('');
    onSeleccionarCliente(cliente);
  };

  // Manejar cierre del modal
  const handleClose = () => {
    setBusqueda('');
    onHide();
  };

  // Manejar actualización de la lista de clientes
  const handleActualizar = async () => {
    if (onActualizarClientes) {
      setActualizando(true);
      try {
        await onActualizarClientes();
        // También actualizar bloqueos
        await cargarClientesBloqueados();
      } finally {
        setActualizando(false);
      }
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-user-check me-2"></i>
          Seleccionar Cliente para la Visita
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* Información para el usuario */}
        <Alert variant="info" className="mb-3">
          <i className="fas fa-info-circle me-2"></i>
          Busca y selecciona un cliente para programar la nueva visita.
          <br />
          <small className="text-warning">
            <i className="fas fa-clock me-1"></i>
            <strong>Tiempo de espera:</strong> Existe un período de bloqueo de 2 horas desde la última visita agendada, pero puedes agendar visitas para horarios posteriores a ese período.
          </small>
        </Alert>

        {/* Campo de búsqueda con botón de actualizar */}
        <Form.Group className="mb-3">
          <Form.Label>
            <i className="fas fa-search me-2"></i>
            Buscar cliente
          </Form.Label>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Buscar por nombre, DNI, teléfono o email..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              autoFocus
            />
            {busqueda && (
              <Button 
                variant="outline-secondary" 
                onClick={handleLimpiarBusqueda}
                title="Limpiar búsqueda"
              >
                <i className="fas fa-times"></i>
              </Button>
            )}
            {onActualizarClientes && (
              <Button 
                variant="dark"
                onClick={handleActualizar}
                disabled={actualizando || loading}
                title="Actualizar lista de clientes"
              >
                <i className={`fas fa-sync-alt ${actualizando ? 'fa-spin' : ''} me-1`}></i>
                {actualizando ? 'Actualizando...' : 'Actualizar lista'}
              </Button>
            )}
          </InputGroup>
          <Form.Text className="text-muted">
            {clientesFiltrados.length} cliente(s) encontrado(s)
            {Object.keys(clientesBloqueados).length > 0 && (
              <span className="ms-2 text-warning">
                · {Object.keys(clientesBloqueados).length} bloqueado(s) temporalmente
              </span>
            )}
          </Form.Text>
        </Form.Group>

        {/* Lista de clientes con scroll mejorado */}
        {loading || actualizando || cargandoBloqueos ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="dark" />
            <p className="mt-2">
              {cargandoBloqueos ? 'Verificando disponibilidad...' : 
               actualizando ? 'Actualizando clientes...' : 
               'Cargando clientes...'}
            </p>
          </div>
        ) : (
          <div 
            style={{ 
              maxHeight: '450px', 
              overflowY: 'auto',
              overflowX: 'hidden',
              border: '1px solid #dee2e6',
              borderRadius: '0.375rem'
            }}
            className="custom-scrollbar"
          >
            <ListGroup variant="flush">
              {clientesFiltrados.length === 0 ? (
                // Estado vacío - sin resultados
                <ListGroup.Item className="text-center py-4">
                  <i className="fas fa-user-slash fa-2x text-muted mb-2 d-block"></i>
                  {busqueda ? (
                    <>
                      <p className="mb-0">No se encontraron clientes con "{busqueda}"</p>
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={handleLimpiarBusqueda}
                        className="mt-2"
                      >
                        Limpiar búsqueda
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="mb-0">No hay clientes disponibles</p>
                      {onActualizarClientes && (
                        <Button 
                          variant="dark"
                          size="sm" 
                          onClick={handleActualizar}
                          className="mt-2"
                          disabled={actualizando}
                        >
                          <i className="fas fa-sync-alt me-1"></i>
                          Actualizar lista
                        </Button>
                      )}
                    </>
                  )}
                </ListGroup.Item>
              ) : (
                // Lista de clientes filtrados
                clientesFiltrados.map((cliente) => {
                  const estaBloqueado = clienteEstaBloqueado(cliente.id);
                  const minutosRestantes = getMinutosRestantes(cliente.id);
                  const porcentajeProgreso = calcularPorcentajeProgreso(minutosRestantes);
                  
                  return (
                    <ListGroup.Item
                      key={cliente.id}
                      action
                      onClick={() => handleSeleccionar(cliente)}
                      className={`d-flex justify-content-between align-items-center ${estaBloqueado ? 'border-warning' : ''}`}
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: estaBloqueado ? 'rgba(255, 193, 7, 0.1)' : 'transparent'
                      }}
                    >
                      <div className="flex-grow-1">
                        {/* Nombre del cliente */}
                        <div className="d-flex align-items-center mb-1">
                          <i className={`fas fa-user me-2 ${estaBloqueado ? 'text-muted' : 'text-dark'}`}></i>
                          <strong className={estaBloqueado ? 'text-muted' : ''}>{cliente.nombre_completo}</strong>
                          
                          {/* 🆕 Badge de bloqueo */}
                          {estaBloqueado && (
                            <Badge bg="warning" text="dark" className="ms-2">
                              <i className="fas fa-clock me-1"></i>
                              Período de bloqueo activo
                            </Badge>
                          )}
                        </div>
                        
                        {/* Información de contacto */}
                        <div className="d-flex gap-3 flex-wrap">
                          {cliente.dni && (
                            <small className="text-muted">
                              <i className="fas fa-id-card me-1"></i>
                              DNI: {cliente.dni}
                            </small>
                          )}
                          {cliente.telefono && (
                            <small className="text-muted">
                              <i className="fas fa-phone me-1"></i>
                              {cliente.telefono}
                            </small>
                          )}
                          {cliente.email && (
                            <small className="text-muted">
                              <i className="fas fa-envelope me-1"></i>
                              {cliente.email}
                            </small>
                          )}
                        </div>
                        
                        {/* Badge de tipo de cliente */}
                        {cliente.tipo_cliente && (
                          <Badge 
                            bg={cliente.tipo_cliente === 'comprador' ? 'primary' : 'success'} 
                            className="mt-1"
                          >
                            {cliente.tipo_cliente.charAt(0).toUpperCase() + cliente.tipo_cliente.slice(1)}
                          </Badge>
                        )}
                        
                        {/* 🆕 Barra de progreso y tiempo restante para clientes bloqueados */}
                        {estaBloqueado && (
                          <div className="mt-2">
                            <small className="text-warning d-block mb-1">
                              <i className="fas fa-hourglass-half me-1"></i>
                              Bloqueo activo por: <strong>{formatearTiempoRestante(minutosRestantes)}</strong>
                            </small>
                            <ProgressBar 
                              now={porcentajeProgreso} 
                              variant="warning"
                              style={{ height: '8px' }}
                              label={`${Math.round(porcentajeProgreso)}%`}
                            />
                            <small className="text-muted d-block mt-1">
                              <i className="fas fa-info-circle me-1"></i>
                              Puedes agendar para horarios posteriores al bloqueo
                            </small>
                          </div>
                        )}
                      </div>
                      
                      {/* Icono de estado */}
                      {estaBloqueado ? (
                        <i className="fas fa-exclamation-circle text-warning" style={{ fontSize: '1.2rem' }}></i>
                      ) : (
                        <i className="fas fa-chevron-right text-muted"></i>
                      )}
                    </ListGroup.Item>
                  );
                })
              )}
            </ListGroup>
          </div>
        )}

        {/* Estilos para el scrollbar personalizado */}
        <style jsx>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}</style>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancelar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SelectorClienteModal;
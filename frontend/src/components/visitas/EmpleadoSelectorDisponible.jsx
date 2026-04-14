import React, { useState, useEffect } from 'react';
import { Form, InputGroup, Button, Badge, Spinner, ProgressBar } from 'react-bootstrap';

// Componente mejorado para seleccionar empleados con verificación de disponibilidad por horario
const EmpleadoSelectorDisponible = ({ 
  empleados, 
  selectedEmpleados, 
  onChange, 
  isInvalid,
  fechaSeleccionada,
  horaSeleccionada,
  visitasExistentes = []
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]);
  const [mostrarLista, setMostrarLista] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [empleadosConDisponibilidad, setEmpleadosConDisponibilidad] = useState({});

  // Función para calcular tiempo restante hasta que un empleado esté disponible
  const calcularTiempoRestante = (fechaHoraVisita, fechaHoraSeleccionada) => {
    const finConflicto = new Date(fechaHoraVisita.getTime() + (30 * 60 * 1000));
    const tiempoRestanteMs = finConflicto - fechaHoraSeleccionada;
    
    if (tiempoRestanteMs <= 0) return null;
    
    const minutosRestantes = Math.floor(tiempoRestanteMs / (1000 * 60));
    const horasRestantes = Math.floor(minutosRestantes / 60);
    const minutosMod = minutosRestantes % 60;
    
    if (horasRestantes > 0) {
      return `${horasRestantes}h ${minutosMod}m`;
    }
    return `${minutosRestantes} min`;
  };

  // Verificar disponibilidad de cada empleado según el horario seleccionado
  useEffect(() => {
    const verificarDisponibilidad = () => {
      if (!fechaSeleccionada || !horaSeleccionada || empleados.length === 0) {
        return;
      }
      
      setVerificando(true);
      
      const [year, month, day] = fechaSeleccionada.split('-');
      const [hours, minutes] = horaSeleccionada.split(':');
      const fechaHoraSeleccionada = new Date(year, month - 1, day, hours, minutes);
      
      const disponibilidadMap = {};
      
      for (const empleado of empleados) {
        let disponible = true;
        let conflictoInfo = null;
        let tiempoRestante = null;
        
        for (const visita of visitasExistentes) {
          if (visita.empleado === empleado.id && visita.estado !== 'cancelada' && visita.estado !== 'finalizada') {
            const [vYear, vMonth, vDay] = visita.fecha.split('-');
            const [vHours, vMinutes] = visita.hora.split(':');
            const fechaHoraVisita = new Date(vYear, vMonth - 1, vDay, vHours, vMinutes);
            
            const diffMinutos = Math.abs((fechaHoraVisita - fechaHoraSeleccionada) / (1000 * 60));
            
            if (diffMinutos <= 30) {
              disponible = false;
              tiempoRestante = calcularTiempoRestante(fechaHoraVisita, fechaHoraSeleccionada);
              
              conflictoInfo = {
                hora: visita.hora,
                diferencia: Math.round(diffMinutos),
                tiempoRestante: tiempoRestante
              };
              break;
            }
          }
        }
        
        disponibilidadMap[empleado.id] = {
          disponible,
          conflictoInfo,
          estaOcupado: !disponible,
          tiempoRestante: conflictoInfo?.tiempoRestante || null
        };
      }
      
      setEmpleadosConDisponibilidad(disponibilidadMap);
      setVerificando(false);
    };
    
    verificarDisponibilidad();
  }, [fechaSeleccionada, horaSeleccionada, empleados, visitasExistentes]);

  // Efecto para filtrar empleados según la búsqueda
  useEffect(() => {
    if (busqueda.trim() === '') {
      setEmpleadosFiltrados(empleados);
    } else {
      const busquedaLower = busqueda.toLowerCase();
      const filtrados = empleados.filter(empleado => {
        const nombreCompleto = empleado.full_name || 
                               empleado.username || 
                               `${empleado.first_name || ''} ${empleado.last_name || ''}`.trim();
        return nombreCompleto.toLowerCase().includes(busquedaLower);
      });
      setEmpleadosFiltrados(filtrados);
    }
  }, [busqueda, empleados]);

  // Manejar selección/deselección de empleados
  const handleToggleEmpleado = (empleadoId) => {
    const empleadoDisponible = empleadosConDisponibilidad[empleadoId];
    
    if (empleadoDisponible && !empleadoDisponible.disponible) {
      return;
    }
    
    let nuevosSeleccionados;
    if (selectedEmpleados.includes(empleadoId)) {
      nuevosSeleccionados = selectedEmpleados.filter(id => id !== empleadoId);
    } else {
      nuevosSeleccionados = [...selectedEmpleados, empleadoId];
    }
    onChange(nuevosSeleccionados);
  };

  // Remover un empleado específico de la selección
  const handleRemoveEmpleado = (empleadoId) => {
    const nuevosSeleccionados = selectedEmpleados.filter(id => id !== empleadoId);
    onChange(nuevosSeleccionados);
  };

  // Obtener nombre del empleado por ID
  const getNombreEmpleado = (empleadoId) => {
    const empleado = empleados.find(e => e.id === empleadoId);
    if (!empleado) return 'Empleado desconocido';
    
    let nombreCompleto = empleado.full_name || 
                        empleado.username || 
                        `${empleado.first_name || ''} ${empleado.last_name || ''}`.trim();
    
    if (!nombreCompleto || nombreCompleto === ' ') {
      nombreCompleto = 'Empleado sin nombre';
    }
    return nombreCompleto;
  };

  // Verificar si un empleado está ocupado en el horario seleccionado
  const isEmpleadoOcupado = (empleadoId) => {
    return empleadosConDisponibilidad[empleadoId]?.estaOcupado === true;
  };

  // Obtener información del conflicto
  const getConflictoInfo = (empleadoId) => {
    return empleadosConDisponibilidad[empleadoId]?.conflictoInfo;
  };

  // Calcular porcentaje de progreso
  const calcularPorcentajeProgreso = (tiempoRestanteStr) => {
    if (!tiempoRestanteStr) return 0;
    
    let minutos = 0;
    if (tiempoRestanteStr.includes('h')) {
      const horas = parseInt(tiempoRestanteStr.split('h')[0]);
      minutos = horas * 60;
      const resto = tiempoRestanteStr.split('h')[1];
      if (resto.includes('m')) {
        minutos += parseInt(resto.split('m')[0]);
      }
    } else if (tiempoRestanteStr.includes('min')) {
      minutos = parseInt(tiempoRestanteStr.split(' ')[0]);
    }
    
    const totalMinutos = 30;
    const progreso = ((totalMinutos - minutos) / totalMinutos) * 100;
    return Math.max(0, Math.min(100, progreso));
  };

  const handleLimpiarBusqueda = () => {
    setBusqueda('');
  };

  return (
    <div>
      {/* Mostrar empleados seleccionados como badges */}
      {selectedEmpleados.length > 0 && (
        <div className="mb-3">
          <small className="text-muted d-block mb-2">
            {selectedEmpleados.length === 1 ? 'Empleado seleccionado:' : 'Empleados seleccionados:'}
          </small>
          <div className="d-flex flex-wrap gap-2">
            {selectedEmpleados.map(empleadoId => {
              const estaOcupado = isEmpleadoOcupado(empleadoId);
              const conflictoInfo = getConflictoInfo(empleadoId);
              
              return (
                <Badge 
                  key={empleadoId}
                  bg={estaOcupado ? "warning" : "success"}
                  text="dark"
                  className="d-flex align-items-center gap-2 p-2"
                >
                  <i className="fas fa-user me-1"></i>
                  {getNombreEmpleado(empleadoId)}
                  {estaOcupado && conflictoInfo && (
                    <span className="ms-1 small">
                      <i className="fas fa-clock me-1"></i>
                      Disponible en {conflictoInfo.tiempoRestante}
                    </span>
                  )}
                  <button
                    type="button"
                    className="btn-close btn-close-dark"
                    style={{ fontSize: '0.6rem' }}
                    onClick={() => handleRemoveEmpleado(empleadoId)}
                    aria-label="Remover"
                  ></button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Campo de búsqueda de empleados */}
      <Form.Group>
        <Form.Label>Buscar empleados</Form.Label>
        <InputGroup>
          <InputGroup.Text>
            <i className="fas fa-search"></i>
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onFocus={() => setMostrarLista(true)}
            isInvalid={isInvalid && selectedEmpleados.length === 0}
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
        </InputGroup>
        {isInvalid && selectedEmpleados.length === 0 && (
          <div className="invalid-feedback d-block">
            Debe seleccionar al menos un empleado
          </div>
        )}
        <Form.Text className="text-muted">
          {empleadosFiltrados.length} empleado(s) disponible(s)
          {verificando && (
            <span className="ms-2">
              <Spinner animation="border" size="sm" />
              <span className="ms-1">Verificando disponibilidad...</span>
            </span>
          )}
        </Form.Text>
      </Form.Group>

      {/* Lista de empleados filtrados */}
      {(mostrarLista || busqueda) && (
        <div 
          className="border rounded mt-2 p-2"
          style={{ 
            maxHeight: '250px', 
            overflowY: 'auto',
            backgroundColor: '#f8f9fa'
          }}
        >
          {empleadosFiltrados.length === 0 ? (
            <div className="text-center text-muted py-3">
              <i className="fas fa-user-slash fa-2x mb-2 d-block"></i>
              <small>No se encontraron empleados</small>
            </div>
          ) : (
            empleadosFiltrados.map(empleado => {
              let nombreCompleto = empleado.full_name || 
                                  empleado.username || 
                                  `${empleado.first_name || ''} ${empleado.last_name || ''}`.trim();
              if (!nombreCompleto || nombreCompleto === ' ') {
                nombreCompleto = 'Sin nombre';
              }
              
              const isSelected = selectedEmpleados.includes(empleado.id);
              const estaOcupado = isEmpleadoOcupado(empleado.id);
              const conflictoInfo = getConflictoInfo(empleado.id);
              const isDisabled = estaOcupado;
              const porcentajeProgreso = calcularPorcentajeProgreso(conflictoInfo?.tiempoRestante);
              
              return (
                <div 
                  key={empleado.id}
                  className={`p-2 rounded mb-2 ${isSelected ? 'border border-secondary' : 'border border-light'}`}
                  style={{ 
                    cursor: isDisabled ? 'not-allowed' : 'pointer', 
                    backgroundColor: isDisabled ? 'rgba(255, 193, 7, 0.1)' : 'white',
                    borderLeft: isDisabled ? '4px solid #ffc107' : '4px solid transparent',
                    opacity: isDisabled ? 0.8 : 1
                  }}
                  onClick={() => handleToggleEmpleado(empleado.id)}
                >
                  <div className="d-flex align-items-start">
                    <Form.Check
                      type="checkbox"
                      id={`empleado-${empleado.id}`}
                      checked={isSelected}
                      onChange={() => {}}
                      disabled={isDisabled}
                      className="me-2 mt-1"
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center flex-wrap">
                        <i className={`fas fa-user me-2 ${isDisabled ? 'text-warning' : 'text-dark'}`}></i>
                        <strong className={isDisabled ? 'text-warning' : 'text-dark'}>{nombreCompleto}</strong>
                        
                        {estaOcupado && conflictoInfo && (
                          <Badge 
                            bg="warning" 
                            text="dark"
                            className="ms-2"
                            title={`Conflicto con visita programada a las ${conflictoInfo.hora} (diferencia de ${conflictoInfo.diferencia} minutos)`}
                          >
                            <i className="fas fa-clock me-1"></i>
                            Ocupado - Disponible en {conflictoInfo.tiempoRestante}
                          </Badge>
                        )}
                        
                        {!estaOcupado && fechaSeleccionada && horaSeleccionada && (
                          <Badge 
                            bg="success" 
                            className="ms-2"
                            title="Empleado disponible en este horario"
                          >
                            <i className="fas fa-check-circle me-1"></i>
                            Disponible
                          </Badge>
                        )}
                      </div>
                      
                      {empleado.email && (
                        <small className="text-muted d-block mt-1">
                          <i className="fas fa-envelope me-1"></i>
                          {empleado.email}
                        </small>
                      )}
                      
                      {estaOcupado && conflictoInfo && (
                        <div className="mt-2">
                          <small className="text-warning d-block mb-1">
                            <i className="fas fa-hourglass-half me-1"></i>
                            Período de ocupado: <strong>{conflictoInfo.tiempoRestante}</strong>
                            <span className="text-muted ms-2">
                              (Conflicto con visita a las {conflictoInfo.hora} - ±{conflictoInfo.diferencia}min)
                            </span>
                          </small>
                          <ProgressBar 
                            now={porcentajeProgreso} 
                            variant="warning"
                            style={{ height: '6px' }}
                          />
                          <small className="text-muted d-block mt-1">
                            <i className="fas fa-info-circle me-1"></i>
                            El empleado estará disponible después del margen de 30 minutos
                          </small>
                        </div>
                      )}
                    </div>
                    
                    {isSelected && !isDisabled && (
                      <i className="fas fa-check text-success ms-2 mt-1"></i>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Botones para mostrar/ocultar la lista */}
      {!mostrarLista && !busqueda && (
        <Button 
          variant="outline-secondary" 
          size="sm"
          className="mt-2 w-100"
          onClick={() => setMostrarLista(!mostrarLista)}
        >
          <i className={`fas fa-chevron-${mostrarLista ? 'up' : 'down'} me-2`}></i>
          {mostrarLista ? 'Ocultar lista' : 'Mostrar lista de empleados'}
        </Button>
      )}

      {mostrarLista && !busqueda && (
        <Button 
          variant="outline-secondary" 
          size="sm"
          className="mt-2 w-100"
          onClick={() => setMostrarLista(false)}
        >
          <i className="fas fa-chevron-up me-2"></i>
          Ocultar lista
        </Button>
      )}
    </div>
  );
};

export default EmpleadoSelectorDisponible;
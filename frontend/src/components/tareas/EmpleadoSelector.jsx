import React, { useState, useEffect } from 'react';
import { Form, InputGroup, Button, Badge } from 'react-bootstrap';

// Componente para seleccionar múltiples empleados con búsqueda
const EmpleadoSelector = ({ empleados, selectedEmpleados, onChange, isInvalid }) => {
  // Estados para búsqueda, filtrado y visibilidad de la lista
  const [busqueda, setBusqueda] = useState('');
  const [empleadosFiltrados, setEmpleadosFiltrados] = useState([]);
  const [mostrarLista, setMostrarLista] = useState(false);

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
    
    // Intentar obtener nombre de diferentes fuentes posibles
    let nombreCompleto = empleado.full_name || 
                        empleado.username || 
                        `${empleado.first_name || ''} ${empleado.last_name || ''}`.trim();
    
    if (!nombreCompleto || nombreCompleto === ' ') {
      nombreCompleto = 'Empleado sin nombre';
    }
    return nombreCompleto;
  };

  // Limpiar la búsqueda
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
            {selectedEmpleados.map(empleadoId => (
              <Badge 
                key={empleadoId}
                bg="light"
                text="dark"
                className="d-flex align-items-center gap-2 p-2 border"
              >
                <i className="fas fa-user text-dark"></i>
                {getNombreEmpleado(empleadoId)}
                <button
                  type="button"
                  className="btn-close"
                  style={{ fontSize: '0.6rem' }}
                  onClick={() => handleRemoveEmpleado(empleadoId)}
                  aria-label="Remover"
                ></button>
              </Badge>
            ))}
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
            Debe asignar al menos un empleado
          </div>
        )}
        <Form.Text className="text-muted">
          {empleadosFiltrados.length} empleado(s) disponible(s)
        </Form.Text>
      </Form.Group>

      {/* Lista de empleados filtrados con checkboxes */}
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
              
              return (
                <div 
                  key={empleado.id}
                  className={`p-2 rounded mb-1 d-flex align-items-center ${isSelected ? 'border border-secondary' : 'border border-light'}`}
                  style={{ cursor: 'pointer', backgroundColor: 'white' }}
                  onClick={() => handleToggleEmpleado(empleado.id)}
                >
                  <Form.Check
                    type="checkbox"
                    id={`empleado-${empleado.id}`}
                    checked={isSelected}
                    onChange={() => {}}
                    className="me-2 custom-checkbox"
                  />
                  <label 
                    htmlFor={`empleado-${empleado.id}`}
                    className="mb-0 flex-grow-1"
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="fas fa-user me-2 text-dark"></i>
                    <strong className="text-dark">{nombreCompleto}</strong>
                  </label>
                  {isSelected && (
                    <i className="fas fa-check text-dark"></i>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Botones para mostrar/ocultar la lista completa */}
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

      {/* Estilos CSS personalizados */}
      <style>
        {`
          .empleado-selector-scroll::-webkit-scrollbar {
            width: 6px;
          }
          
          .empleado-selector-scroll::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          
          .empleado-selector-scroll::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          
          .empleado-selector-scroll::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
          
          /* Estilos para checkboxes personalizados */
          .form-check-input.custom-checkbox:checked {
            background-color: #000 !important;
            border-color: #000 !important;
          }
          
          .form-check-input.custom-checkbox:focus {
            border-color: #6c757d !important;
            box-shadow: 0 0 0 0.2rem rgba(108, 117, 125, 0.25) !important;
          }
          
          .form-check-input.custom-checkbox {
            border-color: #6c757d;
          }
        `}
      </style>
    </div>
  );
};

export default EmpleadoSelector;
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Table, Badge, Spinner, Form, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import visitaService from '../../services/visitaService';

// Componente para listar visitas con funcionalidades de gestión
const VisitaList = ({ clienteId, onVerDetalle, onNuevaVisita, refreshTrigger, onEditarVisita }) => {
  // Estados para datos y UI
  const [visitas, setVisitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');

  // Cargar visitas desde el servicio
  // Usamos useCallback para que la función sea estable y pueda usarse en dependencias de useEffect
  const cargarVisitas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      let data;
      
      console.log('🔄 Cargando visitas, clienteId:', clienteId);
      
      // Cargar visitas según el contexto (cliente específico o todas)
      if (clienteId) {
        data = await visitaService.getPorCliente(clienteId);
      } else {
        const params = {};
        if (filtroEstado) params.estado = filtroEstado;
        data = await visitaService.getAll(params);
      }
      
      console.log('✅ Datos de visitas recibidos:', data);
      
      // Manejo seguro de la respuesta
      let visitasData = data;
      if (!Array.isArray(visitasData)) {
        console.warn('⚠️ Los datos no son un array, convirtiendo...', visitasData);
        visitasData = [];
      }
      
      setVisitas(visitasData);
      
    } catch (error) {
      console.error('💥 Error completo al cargar visitas:', error);
      const errorMessage = error.detail || error.message || 'Error al cargar las visitas';
      setError(errorMessage);
      toast.error(errorMessage);
      setVisitas([]);
    } finally {
      setLoading(false);
    }
  }, [clienteId, filtroEstado]);

  // Efecto para cargar visitas cuando cambian dependencias
  useEffect(() => {
    cargarVisitas();
  }, [cargarVisitas, refreshTrigger]);

  // Efecto para actualización automática periódica
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Actualización automática de visitas...');
      cargarVisitas();
    }, 30000);

    return () => clearInterval(interval);
  }, [cargarVisitas]);

  // Obtener color del badge según el estado
  const getEstadoBadge = (estado) => {
    const variants = {
      pendiente: 'warning',
      en_curso: 'primary',
      finalizada: 'success',
      cancelada: 'danger',
    };
    return `bg-${variants[estado] || 'secondary'}`;
  };

  // Obtener color del badge según el resultado
  const getResultadoBadge = (resultado) => {
    if (!resultado) return 'bg-secondary';
    
    const variants = {
      contactado: 'info',
      no_contactado: 'secondary',
      interesado: 'success',
      no_interesado: 'danger',
      agendada_visita: 'primary',
      vendido: 'success',
      pendiente_evaluacion: 'warning',
    };
    return `bg-${variants[resultado] || 'secondary'}`;
  };

  // Manejar cambio de estado de una visita
  const handleCambiarEstado = async (visitaId, nuevoEstado) => {
    try {
      console.log(`🔄 Cambiando estado de visita ${visitaId} a ${nuevoEstado}`);
      
      await visitaService.cambiarEstado(visitaId, nuevoEstado);
      toast.success('Estado actualizado correctamente');
      
      // Si se finalizó la visita, abrir automáticamente el formulario de edición
      if (nuevoEstado === 'finalizada') {
        console.log('✅ Visita finalizada, abriendo formulario...');
        
        // Recargar datos actualizados de la visita
        const visitaActualizada = await visitaService.getById(visitaId);
        
        // Abrir formulario de edición automáticamente
        if (onEditarVisita) {
          toast.info('Completa la información de resultado y calificación', {
            autoClose: 3000
          });
          
          setTimeout(() => {
            onEditarVisita(visitaActualizada);
          }, 500);
        }
      }
      
      // Recargar la lista completa de visitas
      cargarVisitas();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      toast.error(error.error || 'Error al cambiar el estado');
    }
  };

  // Formatear fecha sin problemas de zona horaria
  const formatearFecha = (fechaStr) => {
    const parts = fechaStr.split('-');
    const fecha = new Date(parts[0], parts[1] - 1, parts[2]);
    return fecha.toLocaleDateString();
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Body>
        {/* Header con título y controles */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="mb-0">
            <i className="fas fa-history me-2"></i>
            Historial de Visitas
          </h5>
          <div className="d-flex gap-2 align-items-center">
            {/* Filtro por estado (solo en vista general) */}
            {!clienteId && (
              <Form.Select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                style={{ width: '200px' }}
              >
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendientes</option>
                <option value="en_curso">En Curso</option>
                <option value="finalizada">Finalizadas</option>
                <option value="cancelada">Canceladas</option>
              </Form.Select>
            )}
            {/* Botón para nueva visita */}
            <Button
              variant="dark"
              size="sm"
              onClick={onNuevaVisita}
            >
              <i className="fas fa-plus me-2"></i>
              Nueva Visita
            </Button>
            {/* Botón para actualizar manualmente */}
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={cargarVisitas}
              disabled={loading}
            >
              <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''} me-2`}></i>
              {loading ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </div>
        </div>

        {/* Mostrar error si existe */}
        {error && (
          <Alert variant="danger" className="mb-4">
            <strong>Error:</strong> {error}
            <div className="mt-2">
              <small>
                Verifica que el backend de visitas esté configurado correctamente.
              </small>
            </div>
          </Alert>
        )}

        {/* Contenido principal - Loading o tabla con scroll */}
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="dark" />
            <p className="mt-2">Cargando visitas...</p>
          </div>
        ) : (
          <div 
            style={{ 
              maxHeight: '600px', 
              overflowY: 'auto',
              overflowX: 'hidden',
              border: '1px solid #dee2e6',
              borderRadius: '0.375rem'
            }}
            className="custom-scrollbar-visitas"
          >
            <Table hover className="align-middle mb-0">
              <thead className="table-dark" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr>
                  {/* Columna cliente solo en vista general */}
                  {!clienteId && <th>Cliente</th>}
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Estado</th>
                  <th>Resultado</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visitas.length === 0 ? (
                  // Estado vacío
                  <tr>
                    <td colSpan={clienteId ? 5 : 6} className="text-center py-4">
                      <i className="fas fa-calendar-times fa-3x text-muted mb-3 d-block"></i>
                      {error ? 'Error al cargar visitas' : 'No hay visitas registradas'}
                      <br />
                      <Button 
                        variant="outline-dark" 
                        size="sm" 
                        className="mt-2"
                        onClick={onNuevaVisita}
                      >
                        <i className="fas fa-plus me-2"></i>
                        Crear primera visita
                      </Button>
                    </td>
                  </tr>
                ) : (
                  // Lista de visitas
                  visitas.map((visita) => (
                    <tr key={visita.id}>
                      {/* Información del cliente (solo en vista general) */}
                      {!clienteId && (
                        <td>
                          <div>
                            <strong className="d-block">
                              {visita.cliente_nombre || visita.cliente_info?.nombre_completo}
                            </strong>
                            <small className="text-muted">
                              DNI: {visita.cliente_dni || visita.cliente_info?.dni}
                            </small>
                          </div>
                        </td>
                      )}
                      {/* Fecha formateada */}
                      <td>
                        <strong>{formatearFecha(visita.fecha)}</strong>
                      </td>
                      {/* Hora de la visita */}
                      <td>{visita.hora}</td>
                      {/* Estado con badge de color */}
                      <td>
                        <Badge className={getEstadoBadge(visita.estado)}>
                          {visita.estado.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </td>
                      {/* Resultado con badge condicional */}
                      <td>
                        {visita.resultado ? (
                          <Badge className={getResultadoBadge(visita.resultado)}>
                            {visita.resultado.replace('_', ' ').toUpperCase()}
                          </Badge>
                        ) : (
                          <span className="text-muted">No especificado</span>
                        )}
                      </td>
                      {/* Botones de acción */}
                      <td className="text-center">
                        <div className="btn-group">
                          {/* Botón ver detalles */}
                          <Button
                            variant="outline-info"
                            size="sm"
                            onClick={() => onVerDetalle && onVerDetalle(visita.id)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          
                          {/* Botón cancelar (solo si está permitido) */}
                          {visita.puede_ser_cancelada && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleCambiarEstado(visita.id, 'cancelada')}
                              title="Cancelar visita"
                            >
                              <i className="fas fa-times"></i>
                            </Button>
                          )}
                          
                          {/* Botón finalizar (solo si está permitido) */}
                          {visita.puede_ser_finalizada && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleCambiarEstado(visita.id, 'finalizada')}
                              title="Finalizar visita"
                            >
                              <i className="fas fa-check"></i>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>

      {/* 🆕 Estilos para scrollbar personalizado */}
      <style jsx>{`
        .custom-scrollbar-visitas::-webkit-scrollbar {
          width: 10px;
        }
        
        .custom-scrollbar-visitas::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .custom-scrollbar-visitas::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        
        .custom-scrollbar-visitas::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </Card>
  );
};

export default VisitaList;
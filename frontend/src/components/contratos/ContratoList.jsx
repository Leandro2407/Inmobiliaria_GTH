import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Badge, Spinner, Alert, Image } from 'react-bootstrap';
import { toast } from 'react-toastify';
import contratoService from '../../services/contratoService';
import { BACKEND_URL } from '../../services/api';

const ContratoList = ({ onVerDetalle, onEditarContrato, refreshTrigger, clienteId = null }) => {
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargarContratos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Cargando contratos...', clienteId ? `para cliente: ${clienteId}` : 'todos');
      
      let response;
      
      if (clienteId) {
        response = await contratoService.getByCliente(clienteId);
      } else {
        response = await contratoService.getAll();
      }
      
      let contratosData = [];
      
      if (Array.isArray(response)) {
        contratosData = response;
      } else if (response && Array.isArray(response.results)) {
        contratosData = response.results;
      } else if (response && typeof response === 'object') {
        contratosData = [response];
      }
      
      console.log('✅ Contratos procesados:', contratosData);
      setContratos(contratosData);
    } catch (error) {
      console.error('❌ Error al cargar contratos:', error);
      setError('Error al cargar la lista de contratos');
      toast.error('Error al cargar la lista de contratos');
      setContratos([]);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    cargarContratos();
  }, [cargarContratos, refreshTrigger]);

  const getBadgeVariant = (estado) => {
    switch (estado) {
      case 'activo':
        return 'success';
      case 'pendiente':
        return 'warning';
      case 'finalizado':
        return 'secondary';
      case 'cancelado':
        return 'danger';
      default:
        return 'light';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('es-ES', options);
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  // NOTE: eliminar contratos desde el frontend fue deshabilitado por decisión de producto.

  const getSafe = (obj, path, defaultValue = 'N/A') => {
    return path.split('.').reduce((acc, key) => {
      return acc && acc[key] !== undefined ? acc[key] : defaultValue;
    }, obj);
  };

  const getEmptyMessage = () => {
    if (clienteId) {
      return "Este cliente no tiene contratos registrados. Crea un nuevo contrato para comenzar.";
    }
    return "No hay contratos registrados. Crea un nuevo contrato para comenzar.";
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 mb-0">Cargando contratos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error al cargar contratos</Alert.Heading>
        <p>{error}</p>
        <Button variant="dark" onClick={cargarContratos}>
          Reintentar
        </Button>
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5 className="mb-0 fw-semibold text-dark">
          {clienteId ? 'Contratos del Cliente' : 'Lista de Contratos'}
        </h5>
      </div>

      {!Array.isArray(contratos) || contratos.length === 0 ? (
        <Alert variant="info">
          {getEmptyMessage()}
        </Alert>
      ) : (
        <div className="table-responsive">
          <Table striped hover>
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Propiedad</th>
                <th>Tipo</th>
                <th>Fecha Inicio</th>
                <th>Monto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((contrato) => (
                <tr key={contrato.id || `contrato-${contrato.tempId || Math.random()}`}>
                  <td>
                    <strong>{getSafe(contrato, 'cliente_info.nombre_completo', 'Cliente no disponible')}</strong>
                    <br />
                    <small className="text-muted">
                      {getSafe(contrato, 'cliente_info.email', 'Email no disponible')}
                    </small>
                  </td>
                  <td>
                    {(() => {
                      const prop = contrato.propiedad_info || contrato.propiedad || {};
                      const imagenUrl = (prop.imagen_principal && (prop.imagen_principal.startsWith('http') ? prop.imagen_principal : `${BACKEND_URL}${prop.imagen_principal}`)) || (prop.imagenes?.[0]?.imagen && (prop.imagenes[0].imagen.startsWith('http') ? prop.imagenes[0].imagen : `${BACKEND_URL}${prop.imagenes[0].imagen}`)) || 'https://via.placeholder.com/90x60?text=Sin+imagen';
                      return (
                        <div className="d-flex align-items-center">
                          <Image src={imagenUrl} rounded style={{ width: 90, height: 60, objectFit: 'cover' }} className="me-2" />
                          <div>
                            <div>{getSafe(contrato, 'propiedad_info.direccion', 'Dirección no disponible')}</div>
                            <small className="text-muted">{getSafe(contrato, 'propiedad_info.ciudad', 'Ciudad no disponible')}</small>
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    <span className="text-capitalize">{contrato.tipo || 'No especificado'}</span>
                  </td>
                  <td>{formatDate(contrato.fecha_inicio)}</td>
                  <td>{formatCurrency(contrato.monto)}</td>
                  <td>
                    <Badge bg={getBadgeVariant(contrato.estado)}>
                      {contrato.estado || 'Desconocido'}
                    </Badge>
                  </td>
                  <td>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-dark"
                        size="sm"
                        onClick={() => onVerDetalle(contrato.id)}
                        title="Ver detalle"
                      >
                        <i className="fas fa-eye"></i>
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => onEditarContrato(contrato)}
                        title="Editar contrato"
                      >
                        <i className="fas fa-edit"></i>
                      </Button>
                      {/* Eliminar contrato desde el frontend ha sido deshabilitado */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ContratoList;
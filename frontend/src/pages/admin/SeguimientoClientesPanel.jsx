import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Table, Form, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import clienteService from '../../services/clienteService';

const SeguimientoClientesPanel = ({ refreshTrigger }) => {
  // Estados para almacenar clientes, estado de carga y filtros
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    search: '',
    categoria: '',
    estado: '',
  });
  const navigate = useNavigate();

  // Función para cargar clientes con filtros aplicados
  const cargarClientes = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtros.search) params.search = filtros.search;
      if (filtros.categoria) params.categoria = filtros.categoria;
      if (filtros.estado) params.estado = filtros.estado;

      console.log('📄 Cargando clientes con params:', params);
      
      const data = await clienteService.getAll(params);
      
      console.log('📦 Respuesta de la API:', data);
      
      // Manejo seguro de la respuesta para asegurar que siempre sea un array
      let clientesData = data;
      
      if (!Array.isArray(clientesData)) {
        console.warn('⚠️ La respuesta no es un array. Buscando array dentro...');
        
        // Buscar array en diferentes estructuras posibles de respuesta
        if (clientesData && clientesData.results && Array.isArray(clientesData.results)) {
          clientesData = clientesData.results;
          console.log('✅ Array encontrado en "results"');
        } else if (clientesData && clientesData.data && Array.isArray(clientesData.data)) {
          clientesData = clientesData.data;
          console.log('✅ Array encontrado en "data"');
        } else {
          console.warn('❌ No se encontró array. Usando array vacío.');
          clientesData = [];
        }
      }
      
      console.log('🎯 Clientes procesados:', clientesData.length);
      setClientes(clientesData);
      
    } catch (error) {
      console.error('💥 Error completo:', error);
      
      // Manejo de diferentes tipos de errores
      if (error.response?.status === 401) {
        toast.error('Error 401: No autorizado. Verifica la autenticación.');
      } else if (error.response?.status === 404) {
        toast.error('Error 404: Endpoint no encontrado.');
      } else if (error.code === 'NETWORK_ERROR') {
        toast.error('Error de conexión: Verifica que el servidor Django esté corriendo');
      } else {
        toast.error('Error al cargar los clientes');
      }
      
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  // Efecto para cargar clientes cuando cambian los filtros
  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  // Efecto para recargar cuando cambia refreshTrigger
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('🔄 Recargando seguimientos por trigger externo...');
      cargarClientes();
    }
  }, [refreshTrigger, cargarClientes]);

  // Actualización automática cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Actualización automática de clientes en seguimiento...');
      cargarClientes();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [cargarClientes]);

  // Navegar a la página de detalle del cliente
  const handleVerSeguimiento = (clienteId) => {
    navigate(`/admin/seguimiento-clientes/${clienteId}`);
  };

  // Obtener color del badge según el estado del cliente
  const getBadgeColor = (estado) => {
    const colors = {
      activo: 'success',
      inactivo: 'secondary',
      prospecto: 'warning',
      convertido: 'primary',
    };
    return colors[estado] || 'secondary';
  };

  // Obtener color del badge según la categoría del cliente
  const getCategoriaColor = (categoria) => {
    const colors = {
      alquiler: 'info',
      compra: 'success',
      venta: 'warning',
      ambos: 'primary',
    };
    return colors[categoria] || 'secondary';
  };

  return (
    <div>
      {/* Tarjeta principal con lista de clientes */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          {/* Header con título y contador */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">
              <i className="fas fa-chart-line me-2"></i>
              Seguimiento de Clientes
            </h4>
            <div className="d-flex align-items-center gap-2">
              <small className="text-muted">
                Total: {clientes.length} cliente(s)
              </small>
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={cargarClientes}
                disabled={loading}
              >
                <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''} me-1`}></i>
                Actualizar
              </Button>
            </div>
          </div>

          {/* Sección de filtros */}
          <Row className="mb-4">
            <Col md={4}>
              <Form.Control
                type="text"
                placeholder="Buscar cliente..."
                value={filtros.search}
                onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
              />
            </Col>
            <Col md={3}>
              <Form.Select
                value={filtros.categoria}
                onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
              >
                <option value="">Todas las categorías</option>
                <option value="alquiler">Alquiler</option>
                <option value="compra">Compra</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button
                variant="outline-secondary"
                onClick={() => setFiltros({ search: '', categoria: '', estado: '' })}
                className="w-100"
              >
                <i className="fas fa-redo me-2"></i>
                Limpiar
              </Button>
            </Col>
          </Row>

          {/* Tabla de clientes CON SCROLL FUNCIONAL */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="dark" />
              <p className="mt-2">Cargando clientes...</p>
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
              className="scroll-container"
            >
              <Table hover className="align-middle mb-0">
                <thead className="table-dark" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th>Cliente</th>
                    <th>Contacto</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th>Registro</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4">
                        <i className="fas fa-users fa-3x text-muted mb-3 d-block"></i>
                        No hay clientes para mostrar
                        <br />
                        <small className="text-muted">
                          Intenta ajustar los filtros o crear un nuevo cliente
                        </small>
                      </td>
                    </tr>
                  ) : (
                    clientes.map((cliente) => (
                      <tr key={cliente.id} className="cursor-pointer">
                        <td>
                          <div>
                            <strong className="d-block">{cliente.nombre_completo}</strong>
                            <small className="text-muted">DNI: {cliente.dni}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <small className="d-block">
                              <i className="fas fa-envelope me-1"></i>
                              {cliente.email}
                            </small>
                            <small className="text-muted">
                              <i className="fas fa-phone me-1"></i>
                              {cliente.telefono}
                            </small>
                          </div>
                        </td>
                        <td>
                          <Badge bg={getCategoriaColor(cliente.categoria)} className="text-capitalize">
                            {cliente.categoria}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={getBadgeColor(cliente.estado)} className="text-capitalize">
                            {cliente.estado}
                          </Badge>
                        </td>
                        <td>
                          <small>
                            {new Date(cliente.fecha_registro).toLocaleDateString()}
                          </small>
                        </td>
                        <td className="text-center">
                          <Button
                            variant="dark"
                            size="sm"
                            onClick={() => handleVerSeguimiento(cliente.id)}
                            title="Ver seguimiento"
                          >
                            <i className="fas fa-chart-line me-1"></i>
                            Seguimiento
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Estilos para el scroll personalizado */}
      <style>{`
        .scroll-container::-webkit-scrollbar {
          width: 10px;
        }
        
        .scroll-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .scroll-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        
        .scroll-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        /* Para Firefox */
        .scroll-container {
          scrollbar-width: thin;
          scrollbar-color: #888 #f1f1f1;
        }

        /* Efecto hover para filas */
        .cursor-pointer:hover {
          background-color: rgba(0, 0, 0, 0.02);
        }
      `}</style>
    </div>
  );
};

export default SeguimientoClientesPanel;
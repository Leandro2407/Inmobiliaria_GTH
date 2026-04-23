import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Table, Form, Row, Col, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import clienteService from '../../services/clienteService';

const SeguimientoClientesPanel = ({ refreshTrigger }) => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    search: '',
    categoria: '',
  });
  const navigate = useNavigate();

  const cargarClientes = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtros.search) params.search = filtros.search;
      if (filtros.categoria) params.categoria = filtros.categoria;

      const data = await clienteService.getAll(params);
      
      let clientesData = data;
      if (!Array.isArray(clientesData)) {
        if (clientesData && clientesData.results && Array.isArray(clientesData.results)) {
          clientesData = clientesData.results;
        } else if (clientesData && clientesData.data && Array.isArray(clientesData.data)) {
          clientesData = clientesData.data;
        } else {
          clientesData = [];
        }
      }
      
      setClientes(clientesData);
    } catch (error) {
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

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      cargarClientes();
    }
  }, [refreshTrigger, cargarClientes]);

  useEffect(() => {
    const interval = setInterval(() => {
      cargarClientes();
    }, 30000); 

    return () => clearInterval(interval);
  }, [cargarClientes]);

  const handleVerSeguimiento = (clienteId) => {
    navigate(`/admin/seguimiento-clientes/${clienteId}`);
  };

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
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0"><i className="fas fa-chart-line me-2"></i> Seguimiento de Clientes</h4>
            <div className="d-flex align-items-center gap-2">
              <small className="text-muted">Total: {clientes.length} cliente(s)</small>
              <Button variant="outline-secondary" size="sm" onClick={cargarClientes} disabled={loading}>
                <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''} me-1`}></i> Actualizar
              </Button>
            </div>
          </div>

          <Row className="mb-4">
            <Col md={6}>
              <Form.Control type="text" placeholder="Buscar cliente..." value={filtros.search} onChange={(e) => setFiltros({ ...filtros, search: e.target.value })} />
            </Col>
            <Col md={4}>
              <Form.Select value={filtros.categoria} onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}>
                <option value="">Todas las categorías</option>
                <option value="alquiler">Alquiler</option>
                <option value="compra">Compra</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button variant="outline-secondary" onClick={() => setFiltros({ search: '', categoria: '' })} className="w-100"><i className="fas fa-redo me-2"></i> Limpiar</Button>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" variant="dark" /><p className="mt-2">Cargando clientes...</p></div>
          ) : (
            <div style={{ maxHeight: '600px', overflowY: 'auto', overflowX: 'hidden', border: '1px solid #dee2e6', borderRadius: '0.375rem' }} className="scroll-container">
              <Table hover className="align-middle mb-0">
                <thead className="table-dark" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr>
                    <th>Cliente</th>
                    <th>Contacto</th>
                    <th>Categoría</th>
                    <th>Registro</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4">
                        <i className="fas fa-users fa-3x text-muted mb-3 d-block"></i> No hay clientes para mostrar
                        <br /><small className="text-muted">Intenta ajustar los filtros o crear un nuevo cliente</small>
                      </td>
                    </tr>
                  ) : (
                    clientes.map((cliente) => (
                      <tr key={cliente.id} className="cursor-pointer">
                        <td>
                          <div>
                            <strong className="d-block">{cliente.nombre_completo}</strong>
                            {/* Ocultamos la palabra PENDIENTE si es que viene de la BD */}
                            <small className="text-muted">DNI: {cliente.dni?.includes('PENDIENTE') ? 'No especificado' : cliente.dni}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <small className="d-block"><i className="fas fa-envelope me-1"></i> {cliente.email}</small>
                            <small className="text-muted"><i className="fas fa-phone me-1"></i> {cliente.telefono}</small>
                          </div>
                        </td>
                        <td>
                          <Badge bg={getCategoriaColor(cliente.categoria)} className="text-capitalize">{cliente.categoria}</Badge>
                        </td>
                        <td><small>{new Date(cliente.fecha_registro).toLocaleDateString()}</small></td>
                        <td className="text-center">
                          <Button variant="dark" size="sm" onClick={() => handleVerSeguimiento(cliente.id)} title="Ver seguimiento">
                            <i className="fas fa-chart-line me-1"></i> Seguimiento
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

      <style>{`
        .scroll-container::-webkit-scrollbar { width: 10px; }
        .scroll-container::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .scroll-container::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
        .scroll-container::-webkit-scrollbar-thumb:hover { background: #555; }
        .scroll-container { scrollbar-width: thin; scrollbar-color: #888 #f1f1f1; }
        .cursor-pointer:hover { background-color: rgba(0, 0, 0, 0.02); }
      `}</style>
    </div>
  );
};

export default SeguimientoClientesPanel;
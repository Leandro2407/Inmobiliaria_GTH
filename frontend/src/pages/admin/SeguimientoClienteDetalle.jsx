import React, { useState, useEffect } from 'react';
import { BACKEND_URL } from '../../services/api';
import { Card, Button, Row, Col, Badge, Spinner, Tab, Tabs, ListGroup } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import clienteService from '../../services/clienteService';

// Componentes para gestión de visitas
import VisitaList from '../../components/visitas/VisitaList';
import VisitaForm from '../../components/visitas/VisitaForm';
import ContratosPanel from '../../components/contratos/ContratosPanel';
import VisitaDetalle from '../../components/visitas/VisitaDetalle';

const SeguimientoClienteDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('perfil');
  
  const [showVisitaForm, setShowVisitaForm] = useState(false);
  const [showVisitaDetalle, setShowVisitaDetalle] = useState(false);
  const [visitaSeleccionada, setVisitaSeleccionada] = useState(null);
  const [visitaParaEditar, setVisitaParaEditar] = useState(null);
  const [refreshVisitas, setRefreshVisitas] = useState(0); 

  useEffect(() => {
    const cargarCliente = async () => {
      try {
        setLoading(true);
        const clienteData = await clienteService.getById(id);
        setCliente(clienteData);
      } catch (error) {
        console.error('Error al cargar cliente:', error);
        toast.error('Error al cargar los datos del cliente');
        navigate('/admin/seguimiento-clientes');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      cargarCliente();
    }
  }, [id, navigate]);

  const getBadgeColor = (estado) => {
    const colors = {
      activo: 'success',
      inactivo: 'secondary',
      prospecto: 'warning',
      convertido: 'primary',
    };
    return colors[estado] || 'secondary';
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

  const handleFinalizarVisita = (visitaData) => {
    setVisitaParaEditar(visitaData);
    setShowVisitaForm(true);
  };

  const handleSuccessVisita = () => {
    setRefreshVisitas(prev => prev + 1); 
    setShowVisitaForm(false);
    setVisitaParaEditar(null);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="dark" />
        <p className="mt-2">Cargando información del cliente...</p>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="text-center py-5">
        <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
        <h4>Cliente no encontrado</h4>
        <Button variant="dark" onClick={() => navigate('/admin/seguimiento-clientes')} className="mt-3">
          Volver al listado
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Row className="align-items-center">
            <Col md={8}>
              <div className="d-flex align-items-center">
                <div className="me-4">
                  <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white" 
                       style={{width: '60px', height: '60px', fontSize: '24px'}}>
                    {cliente.nombre?.charAt(0)}{cliente.apellido?.charAt(0)}
                  </div>
                </div>
                <div>
                  <h3 className="mb-1">{cliente.nombre_completo}</h3>
                  <div className="d-flex gap-2 align-items-center">
                    <Badge bg={getBadgeColor(cliente.estado)} className="text-capitalize">
                      {cliente.estado}
                    </Badge>
                    <Badge bg={getCategoriaColor(cliente.categoria)} className="text-capitalize">
                      {cliente.categoria}
                    </Badge>
                    <small className="text-muted">DNI: {cliente.dni}</small>
                  </div>
                </div>
              </div>
            </Col>
            <Col md={4} className="text-end">
              <Button variant="outline-dark" onClick={() => navigate('/admin/seguimiento-clientes')}>
                <i className="fas fa-arrow-left me-2"></i> Volver al listado
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Tabs activeKey={activeTab} onSelect={(tab) => setActiveTab(tab)} className="mb-4" fill>
        <Tab eventKey="perfil" title={<span style={{ color: '#000', fontWeight: '500' }}><i className="fas fa-user me-2"></i> Perfil </span>}>
          <Row>
            <Col md={6}>
              <Card className="h-100">
                <Card.Header style={{ backgroundColor: '#000', color: 'white' }}>
                  <h6 className="mb-0"><i className="fas fa-id-card me-2"></i> Información Personal </h6>
                </Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    <ListGroup.Item className="d-flex justify-content-between"><strong>Nombre:</strong><span>{cliente.nombre_completo}</span></ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between"><strong>DNI:</strong><span>{cliente.dni}</span></ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between"><strong>Email:</strong><span>{cliente.email}</span></ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between"><strong>Teléfono:</strong><span>{cliente.telefono}</span></ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between"><strong>Fecha Registro:</strong><span>{new Date(cliente.fecha_registro).toLocaleDateString()}</span></ListGroup.Item>
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="h-100">
                <Card.Header style={{ backgroundColor: '#000', color: 'white' }}>
                  <h6 className="mb-0"><i className="fas fa-map-marker-alt me-2"></i> Ubicación </h6>
                </Card.Header>
                <Card.Body>
                  <ListGroup variant="flush">
                    <ListGroup.Item><strong>Domicilio:</strong><br/>{cliente.domicilio}</ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between"><strong>Ciudad:</strong><span>{cliente.ciudad}</span></ListGroup.Item>
                    {cliente.codigo_postal && (
                      <ListGroup.Item className="d-flex justify-content-between"><strong>Código Postal:</strong><span>{cliente.codigo_postal}</span></ListGroup.Item>
                    )}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row className="mt-4">
            <Col md={12}>
              <Card>
                <Card.Header style={{ backgroundColor: '#000', color: 'white' }}>
                  <h6 className="mb-0"><i className="fas fa-info-circle me-2"></i> Información Adicional</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p><strong>Presupuesto:</strong></p>
                      {cliente.presupuesto_min || cliente.presupuesto_max ? (
                        <div>
                          {cliente.presupuesto_min && <p className="mb-1">Mínimo: ${cliente.presupuesto_min}</p>}
                          {cliente.presupuesto_max && <p className="mb-0">Máximo: ${cliente.presupuesto_max}</p>}
                        </div>
                      ) : (
                        <p className="text-muted">No especificado</p>
                      )}
                    </Col>
                    <Col md={6}>
                      {cliente.notas && (
                        <div>
                          <p><strong>Notas:</strong></p>
                          <p style={{ whiteSpace: 'pre-wrap' }}>{cliente.notas}</p>
                        </div>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        <Tab eventKey="visitas" title={<span style={{ color: '#000', fontWeight: '500' }}><i className="fas fa-calendar-check me-2"></i> Visitas </span>}>
          <VisitaList 
            clienteId={id}
            onVerDetalle={(visitaId) => {
              setVisitaSeleccionada(visitaId);
              setShowVisitaDetalle(true);
            }}
            onNuevaVisita={() => {
              setVisitaParaEditar(null);
              setShowVisitaForm(true);
            }}
            refreshTrigger={refreshVisitas}
            onEditarVisita={handleFinalizarVisita}
          />
        </Tab>

        <Tab eventKey="contratos" title={<span style={{ color: '#000', fontWeight: '500' }}><i className="fas fa-file-contract me-2"></i> Contratos </span>}>
          <ContratosPanel clienteId={id} />
        </Tab>
      </Tabs>

      <VisitaForm
        show={showVisitaForm}
        onHide={() => {
          setShowVisitaForm(false);
          setVisitaParaEditar(null);
        }}
        visita={visitaParaEditar}
        cliente={cliente}
        onSuccess={handleSuccessVisita}
      />

      <VisitaDetalle
        show={showVisitaDetalle}
        onHide={() => setShowVisitaDetalle(false)}
        visitaId={visitaSeleccionada}
        onEdit={handleFinalizarVisita} 
      />
    </div>
  );
};

export default SeguimientoClienteDetalle;
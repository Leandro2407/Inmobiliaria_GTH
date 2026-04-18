import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Nav, Tab, Button, Badge, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { Outlet, useMatch } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import clienteService from '../../services/clienteService';
import propiedadService from '../../services/propiedadService';
import solicitudVisitaService from '../../services/solicitudVisitaService';
import ClientesPanel from '../../components/admin/ClientesPanel';
import PropiedadesPanel from '../../components/admin/PropiedadesPanel';
import EmpleadoList from '../../components/admin/EmpleadoList';
import { TareaList } from '../../components/tareas';
import tareaService from '../../services/tareaService';
import VisitaList from '../../components/visitas/VisitaList';
import VisitaDetalle from '../../components/visitas/VisitaDetalle';
import VisitaForm from '../../components/visitas/VisitaForm';
import visitaService from '../../services/visitaService';
import SeguimientoClientesPanel from './SeguimientoClientesPanel';
import ContratosPanel from '../../components/contratos/ContratosPanel'; 
import SelectorClienteModal from '../../components/visitas/SelectorClienteModal';
import '../../styles/Dashboard.css';

// Componente principal del Dashboard de administración
const Dashboard = () => {
  // Obtener información del usuario desde Redux store
  const { user } = useSelector((state) => state.auth);
  
  // Estados para controlar la pestaña activa y refrescar datos
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshVisitas, setRefreshVisitas] = useState(0);
  const [refreshSeguimientos, setRefreshSeguimientos] = useState(0);

  // Detectar si la ruta actual corresponde a un detalle de seguimiento de cliente
  const isSeguimientoDetail = useMatch('/admin/seguimiento-clientes/:id');

  // Si entramos directamente a /admin/seguimiento-clientes/:id, activar la pestaña 'seguimientos'
  useEffect(() => {
    if (isSeguimientoDetail) setActiveTab('seguimientos');
  }, [isSeguimientoDetail]);

  // Estado para almacenar estadísticas de la aplicación
  const [estadisticas, setEstadisticas] = useState({
    clientes: null,
    propiedades: null,
    tareas: null,
    visitas: null,
  });
  
  // Estados para controlar loading y datos
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [showClienteSelector, setShowClienteSelector] = useState(false);
  
  // Estados específicos para el manejo de visitas
  const [showVisitaDetalle, setShowVisitaDetalle] = useState(false);
  const [showVisitaForm, setShowVisitaForm] = useState(false);
  const [visitaSeleccionada, setVisitaSeleccionada] = useState(null);
  const [visitaParaEditar, setVisitaParaEditar] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  // Estados para solicitudes de visita
  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [showAprobarModal, setShowAprobarModal] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [fechaVisita, setFechaVisita] = useState('');
  const [horaVisita, setHoraVisita] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');

  // Función para cargar la lista de clientes desde el servicio
  const cargarClientes = useCallback(async () => {
    try {
      setLoadingClientes(true);
      console.log('🔄 Cargando clientes...');
      const response = await clienteService.getAll();
      const clientesData = response.results || response;
      console.log('✅ Clientes cargados:', clientesData.length);
      setClientes(clientesData);
    } catch (error) {
      console.error('❌ Error al cargar clientes:', error);
      toast.error('Error al cargar la lista de clientes');
    } finally {
      setLoadingClientes(false);
    }
  }, []);

  // Función para calcular estadísticas de tareas
  const cargarEstadisticasTareas = useCallback(async () => {
    try {
      const response = await tareaService.getTareas();
      const tareas = response.data;
      
      // Retornar objeto con conteos por prioridad
      return {
        total: tareas.length,
        pendientes: tareas.filter(t => t.prioridad === 'pendiente').length,
        alta: tareas.filter(t => t.prioridad === 'alta').length,
        media: tareas.filter(t => t.prioridad === 'media').length,
        baja: tareas.filter(t => t.prioridad === 'baja').length,
      };
    } catch (error) {
      console.error('Error al cargar estadísticas de tareas:', error);
      return { total: 0, pendientes: 0, alta: 0, media: 0, baja: 0 };
    }
  }, []);

  // Función para calcular estadísticas de visitas
  const cargarEstadisticasVisitas = useCallback(async () => {
    try {
      const response = await visitaService.getAll();
      const visitas = response;
      
      // Retornar objeto con conteos por estado
      return {
        total: visitas.length,
        pendientes: visitas.filter(v => v.estado === 'pendiente').length,
        en_curso: visitas.filter(v => v.estado === 'en_curso').length,
        finalizadas: visitas.filter(v => v.estado === 'finalizada').length,
        canceladas: visitas.filter(v => v.estado === 'cancelada').length,
      };
    } catch (error) {
      console.error('Error al cargar estadísticas de visitas:', error);
      return { total: 0, pendientes: 0, en_curso: 0, finalizadas: 0, canceladas: 0 };
    }
  }, []);

  // Función para cargar solicitudes de visita
  const cargarSolicitudes = useCallback(async () => {
    try {
      setLoadingSolicitudes(true);
      const data = await solicitudVisitaService.getPendientes();
      setSolicitudes(data);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      toast.error('Error al cargar las solicitudes de visita');
    } finally {
      setLoadingSolicitudes(false);
    }
  }, []);

  // Función principal para cargar todas las estadísticas
  const cargarEstadisticas = useCallback(async () => {
    try {
      setLoading(true);
      // Cargar múltiples estadísticas en paralelo usando Promise.all
      const [clientesStats, propiedadesStats, tareasStats, visitasStats] = await Promise.all([
        clienteService.getEstadisticas(),
        propiedadService.getEstadisticas(),
        cargarEstadisticasTareas(),
        cargarEstadisticasVisitas(),
      ]);
      
      // Actualizar estado con todas las estadísticas
      setEstadisticas({
        clientes: clientesStats,
        propiedades: propiedadesStats,
        tareas: tareasStats,
        visitas: visitasStats,
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      toast.error('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  }, [cargarEstadisticasTareas, cargarEstadisticasVisitas]);

  // Efecto para cargar datos iniciales cuando el componente se monta
  useEffect(() => {
    cargarEstadisticas();
    cargarClientes();
  }, [cargarEstadisticas, cargarClientes]);

  // 🆕 Efecto para recargar clientes cuando se cambia a la pestaña de clientes
  useEffect(() => {
    if (activeTab === 'clientes') {
      cargarClientes();
    }
  }, [activeTab, cargarClientes]);

  // Efecto para cargar solicitudes cuando se activa la pestaña
  useEffect(() => {
    if (activeTab === 'solicitudes') {
      cargarSolicitudes();
    }
  }, [activeTab, cargarSolicitudes]);

  // ===== FUNCIONES PARA MANEJAR VISITAS =====

  // Manejar clic en "Ver detalle" de una visita
  const handleVerDetalleVisita = (visitaId) => {
    setVisitaSeleccionada(visitaId);
    setShowVisitaDetalle(true);
  };

  // Manejar clic en "Nueva visita" - muestra selector de cliente primero
  const handleNuevaVisita = async () => {
    // 🆕 Recargar clientes antes de abrir el modal
    console.log('🔄 Recargando clientes antes de abrir modal...');
    await cargarClientes();
    setShowClienteSelector(true);
  };

  // Manejar selección de cliente para nueva visita
  const handleSeleccionarCliente = (cliente) => {
    setClienteSeleccionado(cliente);
    setShowClienteSelector(false);
    setShowVisitaForm(true);
  };

  // Manejar edición de una visita existente
  const handleEditarVisita = (visita) => {
    setVisitaParaEditar(visita);
    setShowVisitaForm(true);
  };

  // Manejar éxito en operación de visita (crear/editar)
  const handleSuccessVisita = () => {
    cargarEstadisticas();
    setRefreshVisitas(prev => prev + 1); // Forzar recarga de la lista de visitas
    setShowVisitaForm(false);
    setShowVisitaDetalle(false);
    setClienteSeleccionado(null);
    setVisitaParaEditar(null);
  };

  // Cerrar todos los modales y resetear estados
  const handleCloseModals = () => {
    setShowVisitaForm(false);
    setShowVisitaDetalle(false);
    setShowClienteSelector(false);
    setVisitaSeleccionada(null);
    setVisitaParaEditar(null);
    setClienteSeleccionado(null);
    setShowAprobarModal(false);
    setSolicitudSeleccionada(null);
    setFechaVisita('');
    setHoraVisita('');
    setMotivoRechazo('');
  };

  // Función para aprobar una solicitud
  const handleAprobarSolicitud = async () => {
    if (!fechaVisita || !horaVisita) {
      toast.error('Debes seleccionar fecha y hora para la visita');
      return;
    }

    try {
      await solicitudVisitaService.aprobar(solicitudSeleccionada.id, fechaVisita, horaVisita);
      toast.success('Solicitud aprobada y visita creada exitosamente');
      cargarSolicitudes();
      cargarEstadisticas();
      setRefreshVisitas((prev) => prev + 1);
      handleCloseModals();
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      toast.error('Error al aprobar la solicitud');
    }
  };

  // Función para rechazar una solicitud
  const handleRechazarSolicitud = async (solicitudId) => {
    if (!motivoRechazo.trim()) {
      toast.error('Debes proporcionar un motivo de rechazo');
      return;
    }

    try {
      await solicitudVisitaService.rechazar(solicitudId, motivoRechazo);
      toast.success('Solicitud rechazada exitosamente');
      cargarSolicitudes();
      handleCloseModals();
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      toast.error('Error al rechazar la solicitud');
    }
  };

  // Función para mostrar modal de aprobación
  const mostrarModalAprobar = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setShowAprobarModal(true);
  };

  // Función para mostrar modal de rechazo
  const mostrarModalRechazar = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setMotivoRechazo('');
    // Usar window.confirm por simplicidad
    const motivo = window.prompt('Motivo del rechazo (opcional):');
    if (motivo !== null) { // No canceló
      setMotivoRechazo(motivo);
      handleRechazarSolicitud(solicitud.id);
    }
  };

  // 🆕 Función para manejar la creación exitosa de un cliente desde ClientesPanel
  const handleClienteCreado = () => {
    console.log('✅ Cliente creado, recargando lista...');
    cargarClientes();
    cargarEstadisticas();
    // 🆕 Forzar recarga del panel de seguimientos
    setRefreshSeguimientos(prev => prev + 1);
  };

  // ===== RENDER DEL COMPONENTE =====
  return (
    <div className="dashboard-container">
      {/* Header del Dashboard */}
      <div className="dashboard-header bg-dark text-white py-4">
        <Container>
          <Row>
            <Col>
              <h2 className="mb-0">
                <i className="fas fa-tachometer-alt me-2"></i>
                Panel de Administración
              </h2>
              <p className="mb-0 mt-2">
                Bienvenido, {user?.full_name || user?.username}
              </p>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Contenido principal con sistema de pestañas */}
      <Container fluid className="py-4">
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Row>
            {/* Sidebar de navegación */}
            <Col lg={2} className="mb-4">
              <Card className="shadow-sm sticky-top" style={{ top: '20px' }}>
                <Card.Body className="p-0">
                  <Nav variant="pills" className="flex-column dashboard-nav">
                    <Nav.Item>
                      <Nav.Link eventKey="overview">
                        <i className="fas fa-chart-line me-2"></i>
                        Resumen
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="clientes">
                        <i className="fas fa-users me-2"></i>
                        Clientes
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="propiedades">
                        <i className="fas fa-building me-2"></i>
                        Propiedades
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="tareas">
                        <i className="fas fa-tasks me-2"></i>
                        Tareas
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="visitas">
                        <i className="fas fa-calendar-check me-2"></i>
                        Visitas
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="solicitudes">
                        <i className="fas fa-calendar-plus me-2"></i>
                        Solicitudes
                        {solicitudes.length > 0 && (
                          <Badge bg="danger" className="ms-2" style={{ fontSize: '0.7rem' }}>
                            {solicitudes.length}
                          </Badge>
                        )}
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link eventKey="seguimientos">
                        <i className="fas fa-clipboard-check me-2"></i>
                        Seguimientos
                      </Nav.Link>
                    </Nav.Item>
                    
                    {/* ✅ PESTAÑA DE CONTRATOS INCORPORADA */}
                    <Nav.Item>
                      <Nav.Link eventKey="contratos">
                        <i className="fas fa-file-contract me-2"></i>
                        Contratos
                      </Nav.Link>
                    </Nav.Item>

                    {/* ✅ PESTAÑA DE EMPLEADOS */}
                    <Nav.Item>
                      <Nav.Link eventKey="empleados">
                        <i className="fas fa-users me-2"></i>
                        Empleados
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Card.Body>
              </Card>
            </Col>

            {/* Contenido dinámico según pestaña seleccionada */}
            <Col lg={10}>
              <Tab.Content>
                {/* Pestaña: Resumen/Overview */}
                <Tab.Pane eventKey="overview">
                  <Row>
                    <Col md={12}>
                      <Card className="shadow-sm border-0">
                        <Card.Body>
                          <h5>Resumen General</h5>
                          <p className="text-muted">
                            Bienvenido al panel de administración. Selecciona una sección del menú para comenzar.
                          </p>
                          
                          {/* Estadísticas en tarjetas */}
                          {!loading && estadisticas.clientes && (
                            <Row className="mt-4">
                              <Col md={3}>
                                <Card className="text-center stat-card stat-clientes">
                                  <Card.Body>
                                    <h3>{estadisticas.clientes.total || 0}</h3>
                                    <p className="mb-0">Clientes</p>
                                  </Card.Body>
                                </Card>
                              </Col>
                              <Col md={3}>
                                <Card className="text-center stat-card stat-propiedades">
                                  <Card.Body>
                                    <h3>{estadisticas.propiedades.total || 0}</h3>
                                    <p className="mb-0">Propiedades</p>
                                  </Card.Body>
                                </Card>
                              </Col>
                              <Col md={3}>
                                <Card className="text-center stat-card stat-tareas">
                                  <Card.Body>
                                    <h3>{estadisticas.tareas.total || 0}</h3>
                                    <p className="mb-0">Tareas</p>
                                  </Card.Body>
                                </Card>
                              </Col>
                              <Col md={3}>
                                <Card className="text-center stat-card stat-visitas">
                                  <Card.Body>
                                    <h3>{estadisticas.visitas.total || 0}</h3>
                                    <p className="mb-0">Visitas</p>
                                  </Card.Body>
                                </Card>
                              </Col>
                            </Row>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab.Pane>

                {/* Pestaña: Gestión de Clientes */}
                <Tab.Pane eventKey="clientes">
                  <ClientesPanel onClienteCreado={handleClienteCreado} />
                </Tab.Pane>

                {/* Pestaña: Gestión de Propiedades */}
                <Tab.Pane eventKey="propiedades">
                  <PropiedadesPanel />
                </Tab.Pane>

                {/* Pestaña: Gestión de Tareas */}
                <Tab.Pane eventKey="tareas">
                  <Card className="shadow-sm border-0">
                    <Card.Body>
                      <TareaList />
                    </Card.Body>
                  </Card>
                </Tab.Pane>

                {/* Pestaña: Gestión de Visitas */}
                <Tab.Pane eventKey="visitas">
                  <Card className="shadow-sm border-0">
                    <Card.Body>
                      <VisitaList 
                        onVerDetalle={handleVerDetalleVisita}
                        onNuevaVisita={handleNuevaVisita}
                        refreshTrigger={refreshVisitas}
                        onEditarVisita={handleEditarVisita}
                      />
                    </Card.Body>
                  </Card>
                </Tab.Pane>

                {/* Pestaña: Solicitudes de Visita */}
                <Tab.Pane eventKey="solicitudes">
                  <Card className="shadow-sm border-0">
                    <Card.Header className="bg-light">
                      <div className="d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">
                          <i className="fas fa-calendar-plus me-2"></i>
                          Solicitudes de Visita Pendientes
                        </h5>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={cargarSolicitudes}
                          disabled={loadingSolicitudes}
                        >
                          {loadingSolicitudes ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <i className="fas fa-sync-alt me-2"></i>
                          )}
                          Actualizar
                        </Button>
                      </div>
                    </Card.Header>
                    <Card.Body>
                      {loadingSolicitudes ? (
                        <div className="text-center py-5">
                          <Spinner animation="border" variant="primary" />
                          <p className="mt-2">Cargando solicitudes...</p>
                        </div>
                      ) : solicitudes.length === 0 ? (
                        <Alert variant="info" className="text-center">
                          <i className="fas fa-calendar-check fa-2x mb-3"></i>
                          <h5>No hay solicitudes pendientes</h5>
                          <p className="mb-0">
                            Todas las solicitudes han sido procesadas o no hay solicitudes nuevas.
                          </p>
                        </Alert>
                      ) : (
                        <Row>
                          {solicitudes.map((solicitud) => (
                            <Col md={6} lg={4} key={solicitud.id} className="mb-4">
                              <Card className="h-100 shadow-sm border-warning">
                                <Card.Header className="bg-warning text-dark">
                                  <div className="d-flex justify-content-between align-items-center">
                                    <small className="fw-bold">
                                      <i className="fas fa-clock me-1"></i>
                                      {new Date(solicitud.fecha_creacion).toLocaleDateString()}
                                    </small>
                                    <Badge bg="warning" text="dark">
                                      Pendiente
                                    </Badge>
                                  </div>
                                </Card.Header>

                                <Card.Body>
                                  <h6 className="fw-bold mb-2">
                                    <i className="fas fa-home me-2 text-primary"></i>
                                    {solicitud.propiedad_titulo}
                                  </h6>

                                  <div className="mb-2">
                                    <small className="text-muted d-block">
                                      <i className="fas fa-user me-1"></i>
                                      Cliente: {solicitud.cliente_nombre}
                                    </small>
                                    <small className="text-muted d-block">
                                      <i className="fas fa-id-card me-1"></i>
                                      DNI: {solicitud.cliente_dni}
                                    </small>
                                  </div>

                                  {solicitud.mensaje && (
                                    <div className="mb-3">
                                      <small className="fw-bold text-muted d-block mb-1">
                                        Mensaje del cliente:
                                      </small>
                                      <p className="small mb-0" style={{ fontStyle: 'italic' }}>
                                        "{solicitud.mensaje.length > 100
                                          ? `${solicitud.mensaje.substring(0, 100)}...`
                                          : solicitud.mensaje}"
                                      </p>
                                    </div>
                                  )}

                                  <div className="d-flex gap-2 mt-3">
                                    <Button
                                      variant="success"
                                      size="sm"
                                      onClick={() => mostrarModalAprobar(solicitud)}
                                      className="flex-fill"
                                    >
                                      <i className="fas fa-check me-1"></i>
                                      Aprobar
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => mostrarModalRechazar(solicitud)}
                                      className="flex-fill"
                                    >
                                      <i className="fas fa-times me-1"></i>
                                      Rechazar
                                    </Button>
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      )}
                    </Card.Body>
                  </Card>
                </Tab.Pane>

                {/* Pestaña: Seguimiento de Clientes */}
                <Tab.Pane eventKey="seguimientos">
                  {/* Si estamos en detalle de un cliente, renderizamos el Outlet (detalle),
                      si no, mostramos el listado normal */}
                  {isSeguimientoDetail ? (
                    <Outlet />
                  ) : (
                    <SeguimientoClientesPanel refreshTrigger={refreshSeguimientos} />
                  )}
                </Tab.Pane>

                {/* ✅ PESTAÑA DE CONTRATOS INCORPORADA */}
                <Tab.Pane eventKey="contratos">
                  <Card className="shadow-sm border-0">
                    <Card.Body>
                      <ContratosPanel />
                    </Card.Body>
                  </Card>
                </Tab.Pane>

                {/* ✅ PESTAÑA DE EMPLEADOS (lista + acciones) */}
                <Tab.Pane eventKey="empleados">
                  <div className="mb-4">
                    {/* Lista de empleados con acciones */}
                    <EmpleadoList />
                  </div>
                </Tab.Pane>
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      </Container>

      {/* 🆕 Modal mejorado para seleccionar cliente con actualización automática */}
      <SelectorClienteModal
        show={showClienteSelector}
        onHide={handleCloseModals}
        clientes={clientes}
        onSeleccionarCliente={handleSeleccionarCliente}
        loading={loadingClientes}
        onActualizarClientes={cargarClientes}
      />

      {/* Modal para ver detalles de una visita */}
      <VisitaDetalle
        show={showVisitaDetalle}
        onHide={handleCloseModals}
        visitaId={visitaSeleccionada}
        onEdit={handleEditarVisita}
      />

      {/* Modal para crear/editar visitas */}
      <VisitaForm
        show={showVisitaForm}
        onHide={handleCloseModals}
        visita={visitaParaEditar}
        cliente={clienteSeleccionado}
        onSuccess={handleSuccessVisita}
      />

      {/* Modal para aprobar solicitud de visita */}
      <Modal
        show={showAprobarModal}
        onHide={handleCloseModals}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-calendar-check me-2"></i>
            Aprobar Solicitud de Visita
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {solicitudSeleccionada && (
            <>
              <div className="mb-3">
                <h6 className="fw-bold">Detalles de la solicitud:</h6>
                <p className="mb-1"><strong>Cliente:</strong> {solicitudSeleccionada.cliente_nombre}</p>
                <p className="mb-1"><strong>Propiedad:</strong> {solicitudSeleccionada.propiedad_titulo}</p>
                {solicitudSeleccionada.mensaje && (
                  <p className="mb-0"><strong>Mensaje:</strong> {solicitudSeleccionada.mensaje}</p>
                )}
              </div>

              <hr />

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <i className="fas fa-calendar me-2"></i>
                  Fecha de la visita *
                </Form.Label>
                <Form.Control
                  type="date"
                  value={fechaVisita}
                  onChange={(e) => setFechaVisita(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-bold">
                  <i className="fas fa-clock me-2"></i>
                  Hora de la visita *
                </Form.Label>
                <Form.Control
                  type="time"
                  value={horaVisita}
                  onChange={(e) => setHoraVisita(e.target.value)}
                  required
                />
              </Form.Group>

              <Alert variant="info">
                <i className="fas fa-info-circle me-2"></i>
                Al aprobar esta solicitud, se creará automáticamente una visita programada
                que aparecerá en la sección de "Visitas".
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModals}>
            Cancelar
          </Button>
          <Button
            variant="success"
            onClick={handleAprobarSolicitud}
            disabled={!fechaVisita || !horaVisita}
          >
            <i className="fas fa-check me-2"></i>
            Aprobar y Crear Visita
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Dashboard;
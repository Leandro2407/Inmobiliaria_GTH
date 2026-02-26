import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Form, Modal, InputGroup, Badge } from 'react-bootstrap';
import TareaItem from './TareaItem';
import TareaForm from './TareaForm';
import TareaEdit from './TareaEdit';
import tareaService from '../../services/tareaService';

// Componente principal para la gestión y listado de tareas
const TareaList = () => {
  // Estados para datos y carga
  const [tareas, setTareas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTarea, setEditingTarea] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [empleados, setEmpleados] = useState([]);
  
  // Estados para filtros
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todas');
  const [busqueda, setBusqueda] = useState('');

  // Cargar tareas y empleados al montar el componente
  useEffect(() => {
    loadTareas();
    loadEmpleados();
  }, []);

  // Filtrar tareas según criterios seleccionados
  const tareasFiltradas = tareas.filter(tarea => {
    // Filtro por estado
    let cumpleEstado = true;
    switch (filtroEstado) {
      case 'pendientes':
        cumpleEstado = !tarea.finalizada;
        break;
      case 'finalizadas':
        cumpleEstado = tarea.finalizada;
        break;
      default:
        cumpleEstado = true;
    }

    // Filtro por prioridad
    let cumplePrioridad = true;
    switch (filtroPrioridad) {
      case 'alta':
        cumplePrioridad = tarea.prioridad === 'alta';
        break;
      case 'media':
        cumplePrioridad = tarea.prioridad === 'media';
        break;
      case 'baja':
        cumplePrioridad = tarea.prioridad === 'baja';
        break;
      default:
        cumplePrioridad = true;
    }

    // Filtro por búsqueda en nombre o descripción
    let cumpleBusqueda = true;
    if (busqueda.trim() !== '') {
      const busquedaLower = busqueda.toLowerCase();
      const nombre = tarea.nombre?.toLowerCase() || '';
      const descripcion = tarea.descripcion?.toLowerCase() || '';
      
      cumpleBusqueda = nombre.includes(busquedaLower) || descripcion.includes(busquedaLower);
    }

    // Combinar todos los filtros
    return cumpleEstado && cumplePrioridad && cumpleBusqueda;
  });

  // Cargar tareas desde el servicio
  const loadTareas = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Cargando tareas...');
      
      const response = await tareaService.getTareas();
      console.log('✅ Tareas cargadas:', response.data);
      
      setTareas(response.data);
    } catch (err) {
      console.error('❌ Error cargando tareas:', err);
      let errorMessage = 'Error al cargar las tareas';
      
      if (err.response) {
        errorMessage = `Error ${err.response.status}: ${err.response.data?.detail || 'Error del servidor'}`;
      } else if (err.request) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:8000';
      } else {
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Cargar lista de empleados disponibles
  const loadEmpleados = async () => {
    try {
      const empleadosReales = [
        { id: 1, first_name: 'Admin', last_name: 'Principal', username: 'admin', email: 'admin@inmobiliaria.com' },
        { id: 2, first_name: 'Juan', last_name: 'Pérez', username: 'juanperez', email: 'juan@inmobiliaria.com' },
        { id: 3, first_name: 'María', last_name: 'Gómez', username: 'mariagomez', email: 'maria@inmobiliaria.com' },
        { id: 4, first_name: 'Ana', last_name: 'Martínez', username: 'anamartinez', email: 'ana@inmobiliaria.com' },
        { id: 5, first_name: 'Pedro', last_name: 'Rodríguez', username: 'pedrorodriguez', email: 'pedro@inmobiliaria.com' },
        { id: 6, first_name: 'Laura', last_name: 'García', username: 'lauragarcia', email: 'laura@inmobiliaria.com' },
        { id: 7, first_name: 'Diego', last_name: 'Sánchez', username: 'diegosanchez', email: 'diego@inmobiliaria.com' }
      ];
      setEmpleados(empleadosReales);
      console.log('✅ Empleados cargados:', empleadosReales.length);
    } catch (err) {
      console.error('Error cargando empleados:', err);
    }
  };

  // Crear nueva tarea
  const handleCreateTarea = async (tareaData) => {
    try {
      console.log('🔄 Creando tarea:', tareaData);
      await tareaService.createTarea(tareaData);
      await loadTareas();
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creando tarea:', err);
      setError('Error al crear la tarea');
      throw err;
    }
  };

  // Actualizar tarea existente
  const handleUpdateTarea = async (tareaData) => {
    try {
      console.log('🔄 Actualizando tarea:', editingTarea.id, tareaData);
      await tareaService.updateTarea(editingTarea.id, tareaData);
      await loadTareas();
      setShowEdit(false);
      setEditingTarea(null);
    } catch (err) {
      console.error('Error actualizando tarea:', err);
      setError('Error al actualizar la tarea');
      throw err;
    }
  };

  // Eliminar tarea con confirmación
  const handleDeleteTarea = async (id) => {
    try {
      console.log('🔄 Eliminando tarea:', id);
      await tareaService.deleteTarea(id);
      await loadTareas();
    } catch (err) {
      console.error('Error eliminando tarea:', err);
      let errorMessage = 'Error al eliminar la tarea';
      if (err.response) {
        errorMessage = `Error ${err.response.status}: ${err.response.data?.detail || (typeof err.response.data === 'string' ? err.response.data : 'Error del servidor')}`;
      } else if (err.request) {
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:8000';
      } else {
        errorMessage = `Error: ${err.message}`;
      }
      setError(errorMessage);
    }
  };

  // Finalizar tarea (marcar como completada)
  const handleFinalizarTarea = async (id) => {
    try {
      console.log('🔄 Finalizando tarea:', id);
      await tareaService.finalizarTarea(id);
      await loadTareas();
    } catch (err) {
      console.error('Error finalizando tarea:', err);
      setError('Error al finalizar la tarea');
      throw err;
    }
  };

  // Iniciar edición de tarea
  const handleEditTarea = (tarea) => {
    setEditingTarea(tarea);
    setShowEdit(true);
  };

  // Limpiar búsqueda
  const handleLimpiarBusqueda = () => {
    setBusqueda('');
  };

  // Limpiar todos los filtros
  const handleLimpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('todas');
    setFiltroPrioridad('todas');
  };

  // Estadísticas para mostrar en tarjetas
  const tareasPendientes = tareas.filter(t => !t.finalizada).length;
  const tareasFinalizadas = tareas.filter(t => t.finalizada).length;
  const tareasAlta = tareas.filter(t => t.prioridad === 'alta').length;
  const tareasMedia = tareas.filter(t => t.prioridad === 'media').length;
  const tareasBaja = tareas.filter(t => t.prioridad === 'baja').length;

  // Componente para reintentar carga en caso de error
  const ReintentarButton = () => (
    <Button variant="warning" onClick={loadTareas} className="mt-3">
      <i className="fas fa-redo me-2"></i>
      Reintentar Carga
    </Button>
  );

  // Mostrar spinner mientras carga
  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <Spinner animation="border" role="status" variant="primary" className="mb-3" />
          <p>Cargando tareas...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* Header y Estadísticas */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="fw-bold text-dark">
                <i className="fas fa-tasks me-3"></i>
                Gestión de Tareas
              </h1>
            </div>
            <Button 
              variant="success" 
              size="lg"
              onClick={() => setShowCreateModal(true)}
              className="fw-bold px-4"
              disabled={!!error && tareas.length === 0}
            >
              <i className="fas fa-plus me-2"></i>
              Nueva Tarea
            </Button>
          </div>

          {/* Tarjetas de estadísticas */}
          {!error && (
            <Row className="mb-4">
              <Col md={2}>
                <Card className="border-0 shadow-sm bg-dark bg-opacity-10">
                  <Card.Body className="text-center">
                    <h3 className="text-dark mb-1">{tareas.length}</h3>
                    <small className="text-muted">Total</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="border-0 shadow-sm" style={{ backgroundColor: 'rgba(230, 126, 34, 0.1)' }}>
                  <Card.Body className="text-center">
                    <h3 className="mb-1" style={{ color: '#e67e22' }}>{tareasPendientes}</h3>
                    <small className="text-muted">Pendientes</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="border-0 shadow-sm bg-success bg-opacity-10">
                  <Card.Body className="text-center">
                    <h3 className="text-success mb-1">{tareasFinalizadas}</h3>
                    <small className="text-muted">Finalizadas</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="border-0 shadow-sm bg-danger bg-opacity-10">
                  <Card.Body className="text-center">
                    <h3 className="text-danger mb-1">{tareasAlta}</h3>
                    <small className="text-muted">Alta Prioridad</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="border-0 shadow-sm bg-warning bg-opacity-10">
                  <Card.Body className="text-center">
                    <h3 className="text-warning mb-1">{tareasMedia}</h3>
                    <small className="text-muted">Media Prioridad</small>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={2}>
                <Card className="border-0 shadow-sm bg-primary bg-opacity-10">
                  <Card.Body className="text-center">
                    <h3 className="text-primary mb-1">{tareasBaja}</h3>
                    <small className="text-muted">Baja Prioridad</small>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Col>
      </Row>

      {/* Mensajes de error */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <div className="d-flex align-items-center">
            <i className="fas fa-exclamation-triangle me-3 fa-2x"></i>
            <div className="flex-grow-1">
              <h5 className="alert-heading mb-2">Error al cargar tareas</h5>
              <p className="mb-3">{error}</p>
              <div className="d-flex gap-2">
                <ReintentarButton />
                <Button variant="outline-secondary" onClick={() => setError('')}>
                  <i className="fas fa-times me-2"></i>
                  Ocultar Error
                </Button>
              </div>
            </div>
          </div>
        </Alert>
      )}

      {/* Panel de filtros */}
      {!error && (
        <Row className="mb-3">
          <Col>
            <Card className="border-0 shadow-sm">
              <Card.Body className="py-3">
                <div className="row">
                  {/* Búsqueda por texto */}
                  <div className="col-md-4">
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <i className="fas fa-search me-2"></i>
                        Buscar tarea
                      </Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="text"
                          placeholder="Buscar por nombre o descripción..."
                          value={busqueda}
                          onChange={(e) => setBusqueda(e.target.value)}
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
                    </Form.Group>
                  </div>
                  
                  {/* Filtro por estado */}
                  <div className="col-md-3">
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <i className="fas fa-filter me-2"></i>
                        Estado
                      </Form.Label>
                      <Form.Select 
                        value={filtroEstado} 
                        onChange={(e) => setFiltroEstado(e.target.value)}
                      >
                        <option value="todas">Todas las tareas</option>
                        <option value="pendientes">Solo pendientes</option>
                        <option value="finalizadas">Solo finalizadas</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  
                  {/* Filtro por prioridad */}
                  <div className="col-md-3">
                    <Form.Group>
                      <Form.Label className="fw-bold">
                        <i className="fas fa-exclamation-circle me-2"></i>
                        Prioridad
                      </Form.Label>
                      <Form.Select 
                        value={filtroPrioridad} 
                        onChange={(e) => setFiltroPrioridad(e.target.value)}
                      >
                        <option value="todas">Todas las prioridades</option>
                        <option value="alta">Alta prioridad</option>
                        <option value="media">Media prioridad</option>
                        <option value="baja">Baja prioridad</option>
                      </Form.Select>
                    </Form.Group>
                  </div>
                  
                  {/* Botón para limpiar filtros */}
                  <div className="col-md-2 d-flex align-items-end">
                    <Button 
                      variant="outline-secondary" 
                      onClick={handleLimpiarFiltros}
                      disabled={busqueda === '' && filtroEstado === 'todas' && filtroPrioridad === 'todas'}
                      className="w-100"
                    >
                      <i className="fas fa-broom me-2"></i>
                      Limpiar
                    </Button>
                  </div>
                </div>
                
                {/* Información de filtros aplicados */}
                <div className="mt-3">
                  <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    {tareasFiltradas.length} tarea(s) encontrada(s)
                    {tareas.length !== tareasFiltradas.length && ` de ${tareas.length} total(es)`}
                    
                    {/* Mostrar badges de filtros activos */}
                    {(filtroEstado !== 'todas' || filtroPrioridad !== 'todas' || busqueda) && (
                      <span className="ms-2">
                        Filtros: 
                        {filtroEstado !== 'todas' && (
                          <Badge 
                            className="ms-1"
                            style={{
                              backgroundColor: filtroEstado === 'pendientes' ? '#e67e22' : '#28a745'
                            }}
                          >
                            {filtroEstado === 'pendientes' ? 'Pendientes' : 'Finalizadas'}
                          </Badge>
                        )}
                        {filtroPrioridad !== 'todas' && (
                          <Badge 
                            bg={
                              filtroPrioridad === 'alta' ? 'danger' : 
                              filtroPrioridad === 'media' ? 'warning' : 'primary'
                            } 
                            className="ms-1"
                          >
                            {filtroPrioridad === 'alta' ? 'Alta' : filtroPrioridad === 'media' ? 'Media' : 'Baja'} Prioridad
                          </Badge>
                        )}
                        {busqueda && (
                          <Badge bg="dark" className="ms-1">
                            Búsqueda: "{busqueda}"
                          </Badge>
                        )}
                      </span>
                    )}
                  </small>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Lista de tareas con scroll */}
      <Row>
        <Col>
          <div 
            style={{ 
              maxHeight: '65vh', 
              overflowY: 'auto',
              overflowX: 'hidden',
              paddingRight: '10px'
            }}
            className="tareas-scroll-container"
          >
            {/* Estados vacíos o con error */}
            {error && tareas.length === 0 ? (
              <Card className="border-0 shadow-sm text-center py-5">
                <Card.Body>
                  <i className="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                  <h5 className="text-warning">No se pudieron cargar las tareas</h5>
                  <p className="text-muted mb-3">
                    {error.includes('conectar') 
                      ? 'Verifica que el servidor backend esté ejecutándose en http://localhost:8000'
                      : 'Hubo un problema al cargar las tareas desde el servidor.'}
                  </p>
                  <ReintentarButton />
                </Card.Body>
              </Card>
            ) : tareasFiltradas.length === 0 ? (
              <Card className="border-0 shadow-sm text-center py-5">
                <Card.Body>
                  <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">No hay tareas</h5>
                  <p className="text-muted mb-3">
                    {busqueda 
                      ? `No se encontraron tareas con "${busqueda}"`
                      : filtroEstado !== 'todas' || filtroPrioridad !== 'todas'
                        ? 'No hay tareas que coincidan con los filtros seleccionados.'
                        : 'No se encontraron tareas. Crea la primera tarea.'}
                  </p>
                  {(filtroEstado !== 'finalizadas' || busqueda || filtroPrioridad !== 'todas') && (
                    <div className="d-flex gap-2 justify-content-center">
                      {(busqueda || filtroEstado !== 'todas' || filtroPrioridad !== 'todas') && (
                        <Button variant="outline-secondary" onClick={handleLimpiarFiltros}>
                          <i className="fas fa-broom me-2"></i>
                          Limpiar Filtros
                        </Button>
                      )}
                      <Button variant="success" onClick={() => setShowCreateModal(true)}>
                        <i className="fas fa-plus me-2"></i>
                        Crear Tarea
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            ) : (
              // Lista de tareas filtradas
              tareasFiltradas.map(tarea => (
                <TareaItem
                  key={tarea.id}
                  tarea={tarea}
                  onEdit={handleEditTarea}
                  onDelete={handleDeleteTarea}
                  onFinalizar={handleFinalizarTarea}
                />
              ))
            )}
          </div>
        </Col>
      </Row>

      {/* Modal para crear nueva tarea */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton className="bg-dark text-white border-bottom">
          <Modal.Title>
            <i className="fas fa-plus-circle me-2"></i>
            Crear Nueva Tarea
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <TareaForm
            onSubmit={handleCreateTarea}
            onCancel={() => setShowCreateModal(false)}
            empleados={empleados}
          />
        </Modal.Body>
      </Modal>

      {/* Modal para editar tarea existente */}
      <TareaEdit
        tarea={editingTarea}
        show={showEdit}
        onHide={() => {
          setShowEdit(false);
          setEditingTarea(null);
        }}
        onUpdate={handleUpdateTarea}
        empleados={empleados}
      />

      {/* Estilos personalizados para el scroll */}
      <style>
        {`
          .tareas-scroll-container::-webkit-scrollbar {
            width: 8px;
          }
          
          .tareas-scroll-container::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          
          .tareas-scroll-container::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          
          .tareas-scroll-container::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        `}
      </style>
    </Container>
  );
};

export default TareaList;
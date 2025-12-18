import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import propiedadService from '../services/propiedadService';

const Properties = () => {
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo: '',
    operacion: '', // Venta/Alquiler
    barrio: '',
    zona: '',
    search: '',
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Leer query params y setear filtros iniciales
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tipo = params.get('tipo') || '';
    const operacion = params.get('operacion') || '';
    const barrio = params.get('barrio') || '';
    const zona = params.get('zona') || '';
    const search = params.get('search') || '';

    setFiltros({ tipo, operacion, barrio, zona, search });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const cargarPropiedades = useCallback(async () => {
    try {
      setLoading(true);
      // Pasamos los filtros al servicio (usar keys esperadas por la API)
      const params = {};
      if (filtros.search) params.search = filtros.search;
      if (filtros.tipo) params.tipo = filtros.tipo;
      if (filtros.operacion) params.operacion = filtros.operacion;
      if (filtros.barrio) params.barrio = filtros.barrio;
      if (filtros.zona) params.zona = filtros.zona;

      const data = await propiedadService.getPublicas(params);
      setPropiedades(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargarPropiedades();
  }, [cargarPropiedades]);

  const handleFilterChange = (e) => {
    const newFiltros = { ...filtros, [e.target.name]: e.target.value };
    setFiltros(newFiltros);

    // Actualizar query params en URL para que los filtros sean shareables
    const params = new URLSearchParams();
    if (newFiltros.search) params.set('search', newFiltros.search);
    if (newFiltros.tipo) params.set('tipo', newFiltros.tipo);
    if (newFiltros.operacion) params.set('operacion', newFiltros.operacion);
    if (newFiltros.barrio) params.set('barrio', newFiltros.barrio);
    if (newFiltros.zona) params.set('zona', newFiltros.zona);

    const qs = params.toString();
    navigate(qs ? `?${qs}` : location.pathname, { replace: true });
  };

  return (
    <Container className="py-5 mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Nuestras Propiedades</h2>
        <span className="text-muted">{propiedades.length} resultados</span>
      </div>

      {/* Filtros Simples */}
      <Row className="mb-5 g-3">
        <Col md={3}>
            <Form.Select name="operacion" value={filtros.operacion} onChange={handleFilterChange}>
                <option value="">Tipo de Operación</option>
            <option value="venta">Venta</option>
            <option value="alquiler">Alquiler</option>
            </Form.Select>
        </Col>
        <Col md={3}>
            <Form.Select name="tipo" value={filtros.tipo} onChange={handleFilterChange}>
                <option value="">Tipo de Propiedad</option>
            <option value="casa">Casa</option>
            <option value="departamento">Departamento</option>
            <option value="terreno">Terreno</option>
            </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Control
            placeholder="Buscar por dirección, título, barrio..."
            name="search"
            value={filtros.search}
            onChange={handleFilterChange}
          />
        </Col>
        <Col md={3} className="d-flex align-items-center">
          <Button variant="outline-secondary" onClick={() => setFiltros({ tipo: '', operacion: '', barrio: '', zona: '', search: '' })}>Limpiar</Button>
        </Col>
      </Row>

      {/* Filtros avanzados */}
      <Row className="mb-5 g-3">
        <Col md={3}>
          <Form.Select name="zona" value={filtros.zona} onChange={handleFilterChange}>
            <option value="">Zona</option>
            <option value="norte">Norte</option>
            <option value="sur">Sur</option>
            <option value="este">Este</option>
            <option value="oeste">Oeste</option>
            <option value="micro-centro">Micro Centro</option>
            <option value="macro-centro">Macro Centro</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Control
            placeholder="Barrio"
            name="barrio"
            value={filtros.barrio}
            onChange={handleFilterChange}
          />
        </Col>
        <Col md={3} className="d-flex align-items-center">
          <Button variant="outline-secondary" onClick={() => { setFiltros({ tipo: '', operacion: '', barrio: '', zona: '', search: '' }); navigate(location.pathname, { replace: true }); }}>Limpiar</Button>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center"><Spinner animation="border" /></div>
      ) : (
        <Row className="g-4">
          {propiedades.map((p) => (
            <Col lg={4} md={6} key={p.id}>
              <Card className="h-100 shadow-sm border-0 transition-hover">
                <div style={{ height: '250px', overflow: 'hidden', position: 'relative' }}>
                  <Card.Img 
                    variant="top" 
                    src={(p.imagen_principal && (p.imagen_principal.startsWith('http') ? p.imagen_principal : `${process.env.REACT_APP_API_URL}${p.imagen_principal}`)) || (p.imagenes?.[0]?.imagen && (p.imagenes[0].imagen.startsWith('http') ? p.imagenes[0].imagen : `${process.env.REACT_APP_API_URL}${p.imagenes[0].imagen}`)) || 'https://via.placeholder.com/400x300'} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                    <span className="badge bg-dark position-absolute top-0 end-0 m-3">{p.tipo_operacion}</span>
                </div>
                <Card.Body>
                  <Card.Title className="fw-bold">{p.titulo}</Card.Title>
                  <p className="text-muted small mb-2"><i className="fas fa-map-marker-alt me-1"></i> {p.direccion}, {p.ciudad}</p>
                  <h5 className="fw-bold text-primary my-3">
                    {p.moneda === 'USD' ? 'U$S' : '$'} {p.precio}
                  </h5>
                  <div className="d-flex justify-content-between small text-muted border-top pt-3">
                    <span><i className="fas fa-ruler-combined"></i> {p.m2_totales} m²</span>
                    <span><i className="fas fa-bed"></i> {p.dormitorios} dorm</span>
                    <span><i className="fas fa-bath"></i> {p.banos} baños</span>
                  </div>
                  <Button as={Link} to={`/propiedades/${p.id}`} variant="dark" className="w-100 mt-3">
                    Ver Propiedad
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Properties;
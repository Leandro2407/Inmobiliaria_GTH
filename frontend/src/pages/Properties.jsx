import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import propiedadService from '../services/propiedadService';
import { BACKEND_URL } from '../services/api';

const Properties = () => {
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo: '',
    operacion: '',
    barrio: '',
    zona: '',
    search: '',
  });

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setFiltros({
      tipo: params.get('tipo') || '',
      operacion: params.get('operacion') || '',
      barrio: params.get('barrio') || '',
      zona: params.get('zona') || '',
      search: params.get('search') || '',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const cargarPropiedades = useCallback(async () => {
    try {
      setLoading(true);
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

    const params = new URLSearchParams();
    if (newFiltros.search) params.set('search', newFiltros.search);
    if (newFiltros.tipo) params.set('tipo', newFiltros.tipo);
    if (newFiltros.operacion) params.set('operacion', newFiltros.operacion);
    if (newFiltros.barrio) params.set('barrio', newFiltros.barrio);
    if (newFiltros.zona) params.set('zona', newFiltros.zona);

    const qs = params.toString();
    navigate(qs ? `?${qs}` : location.pathname, { replace: true });
  };

  // ✅ FIX: Función centralizada para obtener la URL correcta de la imagen
  const getImageUrl = (p) => {
    // PropiedadListSerializer devuelve imagen_principal como URL absoluta
    if (p.imagen_principal) {
      const url = p.imagen_principal;
      if (url.startsWith('http')) return url;
      return `${BACKEND_URL}${url}`;
    }
    // Fallback al array de imágenes
    if (p.imagenes && p.imagenes.length > 0) {
      const url = p.imagenes[0].imagen;
      if (!url) return 'https://via.placeholder.com/400x300';
      if (url.startsWith('http')) return url;
      return `${BACKEND_URL}${url}`;
    }
    return 'https://via.placeholder.com/400x300';
  };

  const limpiarFiltros = () => {
    setFiltros({ tipo: '', operacion: '', barrio: '', zona: '', search: '' });
    navigate(location.pathname, { replace: true });
  };

  return (
    <Container className="py-5 mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Nuestras Propiedades</h2>
        <span className="text-muted">{propiedades.length} resultados</span>
      </div>

      {/* Filtros */}
      <Row className="mb-4 g-3">
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
        <Col md={2}>
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
            placeholder="Buscar por título, barrio..."
            name="search"
            value={filtros.search}
            onChange={handleFilterChange}
          />
        </Col>
        <Col md={1} className="d-flex align-items-center">
          <Button variant="outline-secondary" onClick={limpiarFiltros} className="w-100">✕</Button>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : propiedades.length === 0 ? (
        <div className="text-center py-5">
          <p className="text-muted">No se encontraron propiedades con esos filtros.</p>
          <Button variant="dark" onClick={limpiarFiltros}>Limpiar filtros</Button>
        </div>
      ) : (
        <Row className="g-4">
          {propiedades.map((p) => (
            <Col lg={4} md={6} key={p.id}>
              <Card className="h-100 shadow-sm border-0">
                <div style={{ height: '250px', overflow: 'hidden', position: 'relative' }}>
                  <Card.Img
                    variant="top"
                    src={getImageUrl(p)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300'; }}
                  />
                  {/* ✅ FIX: campo correcto es p.operacion */}
                  <span className="badge bg-dark position-absolute top-0 end-0 m-3 text-capitalize">
                    {p.operacion}
                  </span>
                </div>
                <Card.Body>
                  <Card.Title className="fw-bold">{p.titulo}</Card.Title>
                  <p className="text-muted small mb-2">
                    <i className="fas fa-map-marker-alt me-1"></i>
                    {p.barrio}
                  </p>
                  {/* ✅ FIX: usar precio_display que ya viene formateado del serializer */}
                  <h5 className="fw-bold text-primary my-3">
                    {p.precio_display || 'Consultar'}
                  </h5>
                  <div className="d-flex justify-content-between small text-muted border-top pt-3">
                    {/* ✅ FIX: campo correcto es superficie_total */}
                    <span><i className="fas fa-ruler-combined me-1"></i> {p.superficie_total} m²</span>
                    <span><i className="fas fa-bed me-1"></i> {p.dormitorios} dorm</span>
                    <span><i className="fas fa-bath me-1"></i> {p.banos} baños</span>
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

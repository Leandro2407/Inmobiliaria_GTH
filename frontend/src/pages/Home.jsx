// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../styles/Home.css';
import propiedadService from '../services/propiedadService';

const Home = () => {
  const [searchFilters, setSearchFilters] = useState({
    tipo: '',
    categoria: '',
    barrio: '',
    zona: '',
  });
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFilterChange = (e) => {
    setSearchFilters({
      ...searchFilters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implementación simple de búsqueda por filtros usando la API
    loadProperties();
  };

  const loadProperties = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchFilters.tipo) params.tipo = searchFilters.tipo;
      if (searchFilters.categoria) params.operacion = searchFilters.categoria;
      if (searchFilters.barrio) params.barrio = searchFilters.barrio;
      if (searchFilters.zona) params.zona = searchFilters.zona;

      const data = await propiedadService.getAll(params);
      // Si la API devuelve { results: [...] } o directamente [...]
      const props = data.results || data;
      setFeaturedProperties(props);
    } catch (error) {
      console.error('Error al cargar propiedades:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay">
          <Container>
            <Row className="justify-content-center">
              <Col lg={8} className="text-center text-white">
                <h1 className="display-4 fw-bold mb-4">Encontrá tu hogar ideal</h1>
                <p className="lead mb-5">Descubrí las mejores propiedades para vos y tu familia</p>

                {/* Search Form */}
                <div className="search-form bg-white p-4 rounded shadow">
                  <h5 className="text-dark mb-4">Búsqueda avanzada</h5>
                  <Form onSubmit={handleSearch}>
                    <Row className="g-3">
                      <Col md={3}>
                        <Form.Label className="text-dark">Tipo</Form.Label>
                        <Form.Select
                          name="tipo"
                          value={searchFilters.tipo}
                          onChange={handleFilterChange}
                        >
                          <option value="">Todos</option>
                          <option value="casa">Casa</option>
                          <option value="departamento">Departamento</option>
                          <option value="terreno">Terreno</option>
                        </Form.Select>
                      </Col>
                      <Col md={3}>
                        <Form.Label className="text-dark">Categoría</Form.Label>
                        <Form.Select
                          name="categoria"
                          value={searchFilters.categoria}
                          onChange={handleFilterChange}
                        >
                          <option value="">Todas</option>
                          <option value="venta">Venta</option>
                          <option value="alquiler">Alquiler</option>
                        </Form.Select>
                      </Col>
                      <Col md={3}>
                        <Form.Label className="text-dark">Barrio</Form.Label>
                        <Form.Select
                          name="barrio"
                          value={searchFilters.barrio}
                          onChange={handleFilterChange}
                        >
                          <option value="">Todos los barrios</option>
                        </Form.Select>
                      </Col>
                      <Col md={3}>
                        <Form.Label className="text-dark">Zona</Form.Label>
                        <Form.Select
                          name="zona"
                          value={searchFilters.zona}
                          onChange={handleFilterChange}
                        >
                          <option value="">Todas</option>
                          <option value="norte">Norte</option>
                          <option value="sur">Sur</option>
                          <option value="este">Este</option>
                          <option value="oeste">Oeste</option>
                          <option value="centro">Centro</option>
                        </Form.Select>
                      </Col>
                    </Row>
                    <div className="text-center mt-4">
                      <Button variant="dark" size="lg" className="px-5" type="submit">
                        <i className="fas fa-search me-2"></i>
                        Buscar
                      </Button>
                    </div>
                  </Form>
                </div>
              </Col>
            </Row>
          </Container>
        </div>
      </section>

      {/* Featured / Listado de Propiedades */}
      <section className="py-5" id="propiedades">
        <Container>
          <Row className="mb-5">
            <Col>
              <h2 className="fw-bold mb-3">Propiedades</h2>
              <p className="text-muted">Descubrí nuestras opciones disponibles</p>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-5 w-100">
              <Spinner animation="border" variant="dark" />
              <p className="mt-2">Cargando propiedades...</p>
            </div>
          ) : (
            <Row className="g-4">
              {featuredProperties.length === 0 ? (
                <Col>
                  <div className="text-center py-5">
                    <i className="fas fa-home fa-3x text-muted mb-3 d-block"></i>
                    <p className="text-muted">No hay propiedades para mostrar</p>
                    <Button as={Link} to="/propiedades" variant="dark">
                      Ir al panel de propiedades
                    </Button>
                  </div>
                </Col>
              ) : (
                featuredProperties.map((property) => (
                  <Col lg={4} md={6} key={property.id || property._id}>
                    <Card className="property-card h-100 shadow-sm border-0">
                      <div className="property-image-wrapper position-relative">
                        <Card.Img
                          variant="top"
                          src={
                            // intento usar la primera imagen; si no existe, placeholder
                            property.imagenes && property.imagenes.length > 0
                              ? property.imagenes[0].imagen
                              : property.imagen || 'https://via.placeholder.com/400x300/343a40/ffffff?text=Propiedad'
                          }
                          alt={property.titulo || property.title}
                          className="property-image"
                        />
                        <span className="property-badge position-absolute">
                          {property.operacion || property.tipo}
                        </span>
                      </div>
                      <Card.Body>
                        <Card.Title className="fw-bold">{property.titulo}</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted">
                          {property.dormitorios && `${property.dormitorios} dormitorios`}
                          {property.banos && ` • ${property.banos} baños`}
                          {` • ${property.superficie_total || property.superficie || ''}`}
                        </Card.Subtitle>
                        <Card.Text className="text-muted">
                          {property.descripcion?.slice(0, 120) || ''}
                          {property.descripcion && property.descripcion.length > 120 ? '...' : ''}
                        </Card.Text>
                        <div className="d-flex justify-content-between align-items-center mt-3">
                          <span className="property-price fw-bold fs-5">
                            {property.precio_display || (property.moneda ? `${property.moneda} ` : '')}
                            {property.precio_venta
                              ? parseFloat(property.precio_venta).toLocaleString()
                              : property.precio || ''}
                          </span>
                          <div>
                            <Button
                              as={Link}
                              to={`/propiedades/${property.id || property._id}`}
                              variant="outline-dark"
                              size="sm"
                              className="me-2"
                            >
                              Ver detalles
                            </Button>
                            <Button variant="success" size="sm">
                              <i className="fab fa-whatsapp"></i>
                            </Button>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))
              )}
            </Row>
          )}

          <Row className="mt-5">
            <Col className="text-center">
              <Button as={Link} to="/propiedades" variant="dark" size="lg">
                Ver todas las propiedades
                <i className="fas fa-arrow-right ms-2"></i>
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Services Section */}
      <section className="bg-light py-5" id="servicios">
        <Container>
          <Row className="mb-5">
            <Col className="text-center">
              <h2 className="fw-bold mb-3">Nuestros Servicios</h2>
              <p className="text-muted">Te acompañamos en cada paso de tu operación inmobiliaria</p>
            </Col>
          </Row>

          <Row className="g-4">
            <Col md={4}>
              <Card className="text-center border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <i className="fas fa-home fa-3x text-dark mb-3"></i>
                  <Card.Title className="fw-bold">Venta de Propiedades</Card.Title>
                  <Card.Text className="text-muted">
                    Gestionamos la venta de tu propiedad con el mejor precio del mercado
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <i className="fas fa-key fa-3x text-dark mb-3"></i>
                  <Card.Title className="fw-bold">Alquileres</Card.Title>
                  <Card.Text className="text-muted">
                    Encontramos el inquilino ideal y gestionamos todos los trámites
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center border-0 shadow-sm h-100">
                <Card.Body className="p-4">
                  <i className="fas fa-calculator fa-3x text-dark mb-3"></i>
                  <Card.Title className="fw-bold">Tasaciones</Card.Title>
                  <Card.Text className="text-muted">
                    Valuaciones precisas y actualizadas del mercado inmobiliario
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home;
// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../styles/Home.css';
import propiedadService from '../services/propiedadService';
import { BACKEND_URL } from '../services/api';

// list of barrios for select dropdown
const BARRIOS_SALTA = [
  "17 de Octubre", "20 de Febrero", "25 de Mayo", "9 de Julio", "A.G.A.S.", "Alborada", "Alejandro Heredia",
  "Alem", "Almudena", "Alto La Viña", "Ampliación Bancario", "Ampliación El Tribuno", "Ampliación Intersindical",
  "Ampliación San Carlos", "Ana María", "Anzoátegui", "Aráoz", "Arturo Illia", "Asunción", "Autódromo",
  "Bancario", "Bernardo de Irigoyen", "Bicentenario", "Calixto Gauna", "Canillitas", "Castañares",
  "Ceferino", "Centro", "Chartas", "Chachapoyas", "Ciudad del Milagro", "Constitución", "Coop. Policial",
  "Democracia", "Don Ceferino", "Don Emilio", "Don Santiago", "Dos Rosas", "Eduardo Falú", "El Aybal",
  "El Círculo (I, II, III, IV)", "El Carmen", "El Huaico", "El Jardín", "El Manjón", "El Milagro",
  "El Pilar", "El Portezuelo", "El Prado", "El Quebracho", "El Sol", "El Tribuno", "España",
  "Estación Alvarado", "Estrella del Sur", "Finca Valdivia", "Floresta", "Fuerza Aérea", "Gral. Mosconi",
  "Gral. Belgrano", "Gral. Güemes", "Grand Bourg", "Hernando de Lerma", "Hipódromo", "Independencia",
  "Intersindical", "Isabel la Católica", "Itaembé", "Jaime Dávalos", "Juan Calchaquí", "Juan Manuel de Rosas",
  "Juan Pablo II", "Juana Azurduy", "Kira", "La Alborada", "La Loma", "La Lucinda", "La Paz",
  "La Rivera", "La Tradición", "Las Costas", "Las Leñas", "Latinoamérica", "Libertad", "Limache",
  "Lomas de Medeiro", "Los Alisos", "Los Ceibos", "Los Gremios", "Los Olivos", "Los Pinos",
  "Los Sauces", "Luján", "Mirasoles", "Morosini", "Norte Grande", "Nueva Esperanza", "Odisa",
  "Olivos", "Once de Marzo", "Pablo Saravia", "Palermo (I, II, III)", "Parque Belgrano",
  "Parque General Belgrano", "Parque La Vega", "Paseo del Siglo", "Patrón Costas", "Periodista",
  "Portezuelo Norte", "Primera Junta", "Progreso", "Pueblo Nuevo", "Quijano", "Roberto Romero",
  "Rosario de Lerma (Zona)", "San Antonio", "San Benito", "San Calixto", "San Carlos", "San Cayetano",
  "San Francisco", "San Francisco Solano", "San Ignacio", "San José", "San Justo", "San Lucas",
  "San Luis (Delegación)", "San Martín", "San Nicolás", "San Rafael", "San Remo", "San Roque",
  "Santa Ana (I, II)", "Santa Cecilia", "Santa Clara", "Santa Lucía", "Santa Mónica", "Santa Rita",
  "Santa Victoria", "Sarmiento", "Siglo XXI", "Solidaridad", "Suiza", "Tauro", "Teresita",
  "Tránsito", "Tres Cerritos", "Union", "Universidad", "Universitario", "Vaqueros (Límite)",
  "Velez Sarsfield", "Vicente Solá", "Victoria", "Villa Angelita", "Villa Belgrano", "Villa Blanca",
  "Villa Chartas", "Villa Cristina", "Villa Estela", "Villa Juanita", "Villa Las Rosas", "Villa Mitre",
  "Villa Mónica", "Villa Palacios", "Villa Primavera", "Villa Rebeca", "Villa San José",
  "Villa San Lorenzo", "Villa Soledad", "Vinalar", "Virgen del Rosario"
];

const Home = () => {
  const [searchFilters, setSearchFilters] = useState({
    tipo: '',
    categoria: '',
    barrio: '',
    zona: '',
    search: '',
  });
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // <-- Nuevo estado agregado

  // Formatear número con separadores de miles
  const formatNumber = (value) => {
    if (!value) return '';
    return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleFilterChange = (e) => {
    setSearchFilters({
      ...searchFilters,
      [e.target.name]: e.target.value,
    });
  };

  // Debounced suggestions - Actualizado para detectar filtros
  useEffect(() => {
    const handler = setTimeout(async () => {
      const term = searchFilters.search?.trim() || '';
      const hasText = term.length >= 2;
      const hasFilters = searchFilters.tipo !== '' || searchFilters.categoria !== '' || searchFilters.barrio !== '' || searchFilters.zona !== '';

      if (!hasText && !hasFilters) {
        setSuggestions([]);
        setHasSearched(false);
        return;
      }

      setLoadingSuggestions(true);
      setHasSearched(true); // Indicamos que ya se hizo una búsqueda activa
      
      try {
        const params = {};
        if (term) params.search = term;
        if (searchFilters.tipo) params.tipo = searchFilters.tipo;
        if (searchFilters.categoria) params.operacion = searchFilters.categoria;
        if (searchFilters.barrio) params.barrio = searchFilters.barrio;
        if (searchFilters.zona) params.zona = searchFilters.zona;

        const data = await propiedadService.getPublicas(params);
        const results = Array.isArray(data) ? data : data.results || [];
        setSuggestions(results.slice(0, 6)); // Mostramos hasta 6 resultados rápidos
      } catch (error) {
        console.error('Error cargando sugerencias:', error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [searchFilters.search, searchFilters.tipo, searchFilters.categoria, searchFilters.barrio, searchFilters.zona]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Redirigir a la página de propiedades con los filtros en la query
    const params = new URLSearchParams();
    if (searchFilters.tipo) params.set('tipo', searchFilters.tipo);
    if (searchFilters.categoria) params.set('operacion', searchFilters.categoria);
    if (searchFilters.barrio) params.set('barrio', searchFilters.barrio);
    if (searchFilters.zona) params.set('zona', searchFilters.zona);
    if (searchFilters.search?.trim()) params.set('search', searchFilters.search.trim());

    navigate(`/propiedades?${params.toString()}`);
  };

  const loadProperties = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchFilters.tipo) params.tipo = searchFilters.tipo;
      if (searchFilters.categoria) params.operacion = searchFilters.categoria;
      if (searchFilters.barrio) params.barrio = searchFilters.barrio;
      if (searchFilters.zona) params.zona = searchFilters.zona;

      // Cargar propiedades destacadas
      const data = await propiedadService.getDestacadas();
      setFeaturedProperties(Array.isArray(data) ? data : []);
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
  const navigate = useNavigate();

  // Obtener imagen principal o primera imagen
  const getPropertyImage = (property) => {
    // Primero intentar con imagen_principal
    if (property.imagen_principal) {
      const url = property.imagen_principal;
      if (url.startsWith('http')) return url;
      return `${BACKEND_URL}${url}`;
    }
    
    // Luego intentar con el array de imágenes
    if (property.imagenes && Array.isArray(property.imagenes) && property.imagenes.length > 0) {
      // Buscar la imagen principal
      const principalImg = property.imagenes.find(img => img.es_principal);
      const imgToUse = principalImg || property.imagenes[0];
      
      if (imgToUse && imgToUse.imagen) {
        const url = imgToUse.imagen;
        if (url.startsWith('http')) return url;
        return `${BACKEND_URL}${url}`;
      }
    }
    
    // Fallback: imagen placeholder
    return 'https://via.placeholder.com/400x300/343a40/ffffff?text=Propiedad';
  };

  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const escapeHtml = (unsafe = '') => {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const renderHighlighted = (text = '', term = '') => {
    if (!term) return text;
    try {
      const safeText = escapeHtml(text);
      const re = new RegExp(`(${escapeRegExp(term)})`, 'ig');
      return safeText.replace(re, '<mark>$1</mark>');
    } catch (e) {
      return escapeHtml(text);
    }
  };

  const formatSuggestionPrice = (p) => {
    const precio = p.precio || p.precio_venta || p.precio_alquiler || null;
    const moneda = p.moneda || 'ARS';
    if (!precio) return '';
    const amt = typeof precio === 'number' ? precio : Number(precio);
    if (Number.isNaN(amt)) return '';
    return `${moneda === 'USD' ? 'U$S' : '$'} ${formatNumber(amt)}`;
  };

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
                      {/* Filters above the search input per request */}
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
                          {BARRIOS_SALTA.map((b, idx) => (
                            <option key={idx} value={b}>{b}</option>
                          ))}
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

                      <Col md={12}>
                        <div className="d-flex flex-column position-relative">
                          <div className="d-flex align-items-center">
                            <Form.Control
                              type="text"
                              placeholder="Buscar propiedad"
                              name="search"
                              value={searchFilters.search}
                              onChange={handleFilterChange}
                            />
                            {loadingSuggestions && (
                              <div className="ms-2">
                                <Spinner animation="border" size="sm" />
                              </div>
                            )}
                          </div>

                          {/* Dropdown modificado */}
                          {(suggestions.length > 0 || (hasSearched && !loadingSuggestions)) && (
                            <div className="suggestions-list bg-white rounded mt-1 p-2 shadow-sm text-start" style={{ maxHeight: 260, overflowY: 'auto', position: 'absolute', width: '100%', zIndex: 1000, top: '100%', marginTop: '4px' }}>
                              {suggestions.length > 0 ? (
                                suggestions.map(s => (
                                  <div key={s.id} className="suggestion-item d-flex align-items-center py-2 border-bottom" style={{ cursor: 'pointer' }} onClick={() => navigate(`/propiedades/${s.id}`)}>
                                    <div className="suggestion-thumb me-3">
                                      <img src={getPropertyImage(s)} alt={s.titulo} style={{ width: 96, height: 64, objectFit: 'cover', borderRadius: 6 }} />
                                    </div>
                                    <div className="flex-grow-1">
                                      <div className="suggestion-title fw-semibold text-dark" dangerouslySetInnerHTML={{ __html: renderHighlighted(s.titulo, searchFilters.search) }} />
                                      <div className="text-muted small">{s.barrio} • {s.zona}</div>
                                    </div>
                                    <div className="text-end ms-3">
                                      <div className="text-primary fw-bold">{formatSuggestionPrice(s)}</div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center p-3 text-muted fw-semibold">
                                  <i className="fas fa-search-minus mb-2 fs-4 d-block"></i>
                                  No hay propiedades disponibles con esos filtros en este momento.
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </Col>
                      
                    </Row>
                    <div className="text-center mt-4">
                      <Button variant="dark" size="lg" className="px-5" type="submit">
                        <i className="fas fa-search me-2"></i>
                        Ver propiedades
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
              <h2 className="fw-bold mb-3">Propiedades Destacadas</h2>
              <p className="text-muted">Descubrí nuestras mejores opciones disponibles</p>
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
                    <p className="text-muted">No hay propiedades destacadas para mostrar</p>
                    <Button as={Link} to="/propiedades" variant="dark">
                      Ver todas las propiedades
                    </Button>
                  </div>
                </Col>
              ) : (
                featuredProperties.map((property) => (
                  <Col lg={4} md={6} key={property.id}>
                    <Card className="property-card h-100 shadow-sm border-0">
                      <div className="property-image-wrapper position-relative">
                        <Card.Img
                          variant="top"
                          src={getPropertyImage(property)}
                          alt={property.titulo}
                          className="property-image"
                          style={{ height: '250px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x300/343a40/ffffff?text=Propiedad';
                          }}
                        />
                        <span className="property-badge position-absolute top-0 end-0 m-3 badge bg-dark">
                          {property.operacion}
                        </span>
                      </div>
                      <Card.Body className="d-flex flex-column">
                        <Card.Title className="fw-bold">{property.titulo}</Card.Title>
                        <Card.Subtitle className="mb-3 text-muted">
                          <i className="fas fa-map-marker-alt me-1"></i>
                          {property.barrio}
                        </Card.Subtitle>
                        
                        <div className="d-flex justify-content-between text-muted small mb-3">
                          {property.dormitorios > 0 && (
                            <span>
                              <i className="fas fa-bed me-1"></i>
                              {property.dormitorios}
                            </span>
                          )}
                          {property.banos > 0 && (
                            <span>
                              <i className="fas fa-bath me-1"></i>
                              {property.banos}
                            </span>
                          )}
                          {property.superficie_total && (
                            <span>
                              <i className="fas fa-ruler-combined me-1"></i>
                              {property.superficie_total} m²
                            </span>
                          )}
                        </div>

                        <Card.Text className="text-muted flex-grow-1">
                          {property.descripcion?.slice(0, 100) || ''}
                          {property.descripcion && property.descripcion.length > 100 ? '...' : ''}
                        </Card.Text>
                        
                        <div className="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
                          <span className="property-price fw-bold fs-5">
                            {property.moneda === 'USD' ? 'U$S' : '$'} 
                            {' '}
                            {property.precio_venta 
                              ? formatNumber(property.precio_venta)
                              : property.precio_alquiler 
                              ? formatNumber(property.precio_alquiler)
                              : ''}
                          </span>
                          <div>
                            <Button
                              as={Link}
                              to={`/propiedades/${property.id}`}
                              variant="dark"
                              size="sm"
                            >
                              Ver detalles
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

          {/* Modificado: justify-content-center para centrar los 2 servicios */}
          <Row className="justify-content-center g-4">
            <Col md={4}>
              <Card className="text-center border shadow-sm h-100 bg-white service-card">
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
              <Card className="text-center border shadow-sm h-100 bg-white service-card">
                <Card.Body className="p-4">
                  <i className="fas fa-key fa-3x text-dark mb-3"></i>
                  <Card.Title className="fw-bold">Alquileres</Card.Title>
                  <Card.Text className="text-muted">
                    Encontramos el inquilino ideal y gestionamos todos los trámites
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Nosotros Section */}
      <section className="py-5" id="nosotros">
        <Container>
          <Row className="mb-5">
            <Col className="text-center">
              <h2 className="fw-bold mb-3">Sobre Nosotros</h2>
              <p className="text-muted">Conocé nuestra historia y compromiso</p>
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col md={8} className="text-center">
              <p className="lead mb-4">
                GTH Negocios Inmobiliarios es una empresa fundada en 2021, 
                impulsada por un grupo de amigos con una visión en común: 
                ofrecer un servicio serio, profesional y centrado en las personas.
              </p>
              <Button as={Link} to="/nosotros" variant="dark" size="lg">
                Conocer más sobre nosotros
                
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Contact Section */}
      <section className="bg-light py-5" id="contacto">
        <Container>
          <Row className="mb-5">
            <Col className="text-center">
              <h2 className="fw-bold mb-3">Contactanos</h2>
              <p className="text-muted">Estamos para ayudarte en tu búsqueda</p>
            </Col>
          </Row>
          <Row className="justify-content-center">
            <Col md={8} className="text-center">
              <p className="lead mb-4">
                ¿Tenés dudas o querés agendar una visita? Nuestro equipo está 
                listo para atenderte y brindarte la mejor asesoría.
              </p>
              <Button as={Link} to="/contacto" variant="dark" size="lg">
                Ir a contacto
                
              </Button>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home;
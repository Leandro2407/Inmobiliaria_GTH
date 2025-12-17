import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Breadcrumb, Carousel, Button, Spinner, Modal } from 'react-bootstrap';
import propiedadService from '../services/propiedadService';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const [propiedad, setPropiedad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => {
    const fetchPropiedad = async () => {
      try {
        const data = await propiedadService.getById(id);
        setPropiedad(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPropiedad();
  }, [id]);

  // Formatear número con separadores de miles
  const formatNumber = (value) => {
    if (!value) return '';
    return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Abrir imagen en modal
  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center mt-5">
        <Spinner animation="border" variant="dark" />
        <p className="mt-2">Cargando propiedad...</p>
      </Container>
    );
  }

  if (!propiedad) {
    return (
      <Container className="py-5 mt-5">
        <h3>Propiedad no encontrada</h3>
      </Container>
    );
  }

  // Características (array o string)
  const features = Array.isArray(propiedad.caracteristicas_list)
    ? propiedad.caracteristicas_list
    : propiedad.caracteristicas?.split('\n').filter(c => c.trim() !== '') || [];

  // Seleccionar precio según operación
  const precioFinal =
    propiedad.operacion === "venta"
      ? propiedad.precio_venta
      : propiedad.operacion === "alquiler"
      ? propiedad.precio_alquiler
      : propiedad.precio_venta || propiedad.precio_alquiler;

  // Separar dirección en calle y número
  const direccionParts = propiedad.direccion ? propiedad.direccion.split(' ') : [];
  const numeroCalle = direccionParts[direccionParts.length - 1];
  const calle = direccionParts.slice(0, -1).join(' ');

  // Mensaje de WhatsApp
  const whatsappMessage = `Hola, me interesa la propiedad: ${propiedad.titulo}`;
  const whatsappLink = `https://wa.me/5493870000000?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <section className="py-5 bg-light" style={{ marginTop: '80px' }}>
      <Container>
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <Breadcrumb.Item href="/">Inicio</Breadcrumb.Item>
          <Breadcrumb.Item href="/propiedades">Propiedades</Breadcrumb.Item>
          <Breadcrumb.Item active>{propiedad.titulo}</Breadcrumb.Item>
        </Breadcrumb>

        {/* Título */}
        <h2 className="fw-bold mb-4">{propiedad.titulo}</h2>

        <Row className="g-5">
          {/* Columna Izquierda */}
          <Col lg={8}>
            {/* Galería con Carrusel Automático */}
            <div className="property-gallery mb-4 rounded overflow-hidden shadow-sm">
              <Carousel
                activeIndex={carouselIndex}
                onSelect={(selectedIndex) => setCarouselIndex(selectedIndex)}
                interval={3000} 
                pause="hover"
              >
                {propiedad.imagenes && propiedad.imagenes.length > 0 ? (
                  propiedad.imagenes.map((img, idx) => (
                    <Carousel.Item key={idx}>
                      <img
                        className="d-block w-100"
                        // La URL ya viene absoluta desde el backend corregido
                        src={img.imagen} 
                        alt={`Slide ${idx + 1}`}
                        style={{ height: '500px', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => handleImageClick(idx)}
                      />
                    </Carousel.Item>
                  ))
                ) : (
                  <Carousel.Item>
                    <img
                      className="d-block w-100"
                      src="https://via.placeholder.com/800x500?text=Sin+Imagen"
                      alt="Placeholder"
                      style={{ height: '500px', objectFit: 'cover' }}
                    />
                  </Carousel.Item>
                )}
              </Carousel>
            </div>

            {/* Precio y Características Principales */}
            <div className="bg-white p-4 rounded shadow-sm mb-4">
              <Row>
                <Col md={6}>
                  <h3 className="fw-bold mb-0" style={{ color: '#000' }}>
                    {propiedad.moneda === 'USD' ? 'U$S' : '$'} {formatNumber(precioFinal)}
                  </h3>
                  <span className={`badge bg-${
                    propiedad.operacion === 'venta' ? 'success' :
                    propiedad.operacion === 'alquiler' ? 'warning' : 'primary'
                  } mt-2`}>
                    {propiedad.operacion}
                  </span>
                </Col>
                <Col md={6} className="text-md-end">
                  <div className="d-flex gap-2 justify-content-md-end mt-3 mt-md-0">
                    <Button
                      variant="success"
                      href={whatsappLink}
                      target="_blank"
                    >
                      <i className="fab fa-whatsapp me-2"></i>WhatsApp
                    </Button>
                    <Button variant="dark">
                      <i className="fas fa-envelope me-2"></i>Consultar
                    </Button>
                  </div>
                </Col>
              </Row>

              <hr className="my-4" />

              <Row>
                <Col xs={6} md={3} className="text-center mb-3">
                  <i className="fas fa-bed fa-2x mb-2" style={{ color: '#6c757d' }}></i>
                  <p className="mb-0 fw-bold">{propiedad.dormitorios || 0}</p>
                  <small className="text-muted">Dormitorios</small>
                </Col>
                <Col xs={6} md={3} className="text-center mb-3">
                  <i className="fas fa-bath fa-2x mb-2" style={{ color: '#6c757d' }}></i>
                  <p className="mb-0 fw-bold">{propiedad.banos || 0}</p>
                  <small className="text-muted">Baños</small>
                </Col>
                <Col xs={6} md={3} className="text-center mb-3">
                  <i className="fas fa-ruler-combined fa-2x mb-2" style={{ color: '#6c757d' }}></i>
                  <p className="mb-0 fw-bold">{propiedad.superficie_total} m²</p>
                  <small className="text-muted">Sup. Total</small>
                </Col>
                {propiedad.superficie_cubierta && (
                  <Col xs={6} md={3} className="text-center mb-3">
                    <i className="fas fa-home fa-2x mb-2" style={{ color: '#6c757d' }}></i>
                    <p className="mb-0 fw-bold">{propiedad.superficie_cubierta} m²</p>
                    <small className="text-muted">Sup. Cubierta</small>
                  </Col>
                )}
                {propiedad.cocheras > 0 && (
                  <Col xs={6} md={3} className="text-center mb-3">
                    <i className="fas fa-car fa-2x mb-2" style={{ color: '#6c757d' }}></i>
                    <p className="mb-0 fw-bold">{propiedad.cocheras}</p>
                    <small className="text-muted">Cocheras</small>
                  </Col>
                )}
              </Row>
            </div>

            {/* Descripción */}
            <div className="bg-white p-4 rounded shadow-sm mb-4">
              <h4 className="fw-bold mb-3" style={{ color: '#2c2c2c' }}>
                <i className="fas fa-align-left me-2"></i>
                Descripción
              </h4>
              <p className="text-muted" style={{ whiteSpace: 'pre-line' }}>
                {propiedad.descripcion}
              </p>
            </div>

            {/* Características Principales */}
            {features.length > 0 && (
              <div className="bg-white p-4 rounded shadow-sm mb-4">
                <h4 className="fw-bold mb-3" style={{ color: '#2c2c2c' }}>
                  <i className="fas fa-check-square me-2"></i>
                  Características Principales
                </h4>
                <Row className="g-3">
                  {features.map((feature, index) => (
                    <Col md={6} key={index}>
                      <div className="d-flex align-items-center">
                        <i className="fas fa-check-circle text-success me-2"></i>
                        <span>{feature}</span>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Ubicación */}
            <div className="bg-white p-4 rounded shadow-sm">
              <h4 className="fw-bold mb-3" style={{ color: '#2c2c2c' }}>
                <i className="fas fa-map-marker-alt me-2"></i>
                Ubicación
              </h4>
              
              <div className="mb-3">
                <Row>
                  <Col md={12} className="mb-2">
                    <strong>Dirección:</strong> {calle} {numeroCalle}
                  </Col>
                  <Col md={4} className="mb-2">
                    <strong>Barrio:</strong> {propiedad.barrio}
                  </Col>
                  <Col md={4} className="mb-2">
                    <strong>Zona:</strong> <span className="text-capitalize">{propiedad.zona}</span>
                  </Col>
                  <Col md={4} className="mb-2">
                    <strong>Ciudad:</strong> {propiedad.ciudad}
                  </Col>
                </Row>
              </div>

              <div style={{ height: '400px', width: '100%' }} className="rounded overflow-hidden border">
                {propiedad.latitud && propiedad.longitud ? (
                  <iframe
                    title="mapa-propiedad"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    // CORRECCIÓN: Formato correcto de Google Maps Embed
                    src={`https://maps.google.com/maps?q=${propiedad.latitud},${propiedad.longitud}&z=15&output=embed`}
                    allowFullScreen
                  />
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 bg-light">
                    <span className="text-muted">Ubicación no disponible en mapa</span>
                  </div>
                )}
              </div>
            </div>
          </Col>

          {/* Columna Derecha - Agente */}
          <Col lg={4}>
            <div className="bg-white p-4 rounded shadow-sm sticky-top" style={{ top: '100px' }}>
              <h5 className="fw-bold mb-3" style={{ color: '#2c2c2c' }}>
                <i className="fas fa-user-tie me-2"></i>
                Agente a cargo
              </h5>
              <div className="d-flex align-items-center mb-4">
                <div className="me-3">
                  <i className="fas fa-user-circle fa-4x" style={{ color: '#6c757d' }}></i>
                </div>
                <div>
                  <h6 className="mb-1">{propiedad.agente_nombre || 'Agente Inmobiliario'}</h6>
                  <small className="text-muted">Asesor Inmobiliario</small>
                </div>
              </div>

              <div className="d-grid gap-2">
                <Button
                  variant="success"
                  size="lg"
                  href={whatsappLink}
                  target="_blank"
                >
                  <i className="fab fa-whatsapp me-2"></i>
                  Contactar por WhatsApp
                </Button>
                <Button variant="dark" size="lg">
                  <i className="fas fa-envelope me-2"></i>
                  Enviar Consulta
                </Button>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Modal para ver imágenes en grande */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)} 
        size="xl" 
        centered
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Imagen {selectedImageIndex + 1} de {propiedad.imagenes?.length || 0}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {propiedad.imagenes && propiedad.imagenes.length > 0 && (
            <Carousel
              activeIndex={selectedImageIndex}
              onSelect={(selectedIndex) => setSelectedImageIndex(selectedIndex)}
              interval={null}
            >
              {propiedad.imagenes.map((img, idx) => (
                <Carousel.Item key={idx}>
                  <img
                    className="d-block w-100"
                    src={img.imagen}
                    alt={`Imagen ${idx + 1}`}
                    style={{ maxHeight: '80vh', objectFit: 'contain', backgroundColor: '#000' }}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          )}
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default PropertyDetailPage;
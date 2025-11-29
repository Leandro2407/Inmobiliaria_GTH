import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Breadcrumb, Carousel, Button, Spinner } from 'react-bootstrap';
import propiedadService from '../services/propiedadService';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para iconos de Leaflet en React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const PropertyDetailPage = () => {
  const { id } = useParams();
  const [propiedad, setPropiedad] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" /></Container>;
  if (!propiedad) return <Container className="py-5"><h3>Propiedad no encontrada</h3></Container>;

  // Características (array o string)
  const features = Array.isArray(propiedad.caracteristicas_list)
    ? propiedad.caracteristicas_list
    : propiedad.caracteristicas?.split('\n') || [];

  // Seleccionar precio según operación
  const precioFinal =
    propiedad.operacion === "venta"
      ? propiedad.precio_venta
      : propiedad.operacion === "alquiler"
      ? propiedad.precio_alquiler
      : propiedad.precio_venta || propiedad.precio_alquiler;

  return (
    <section className="py-5 bg-light">
      <Container>
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <Breadcrumb.Item href="/">Inicio</Breadcrumb.Item>
          <Breadcrumb.Item href="/propiedades">Propiedades</Breadcrumb.Item>
          <Breadcrumb.Item active>{propiedad.titulo}</Breadcrumb.Item>
        </Breadcrumb>

        <Row className="g-5">
          {/* Columna Izquierda */}
          <Col lg={8}>
            {/* Galería */}
            <div className="property-gallery mb-4 rounded overflow-hidden shadow-sm">
              <Carousel>
                {propiedad.imagenes && propiedad.imagenes.length > 0 ? (
                  propiedad.imagenes.map((img, idx) => (
                    <Carousel.Item key={idx}>
                      <img
                        className="d-block w-100"
                        src={img.imagen}
                        alt={`Slide ${idx}`}
                        style={{ height: '500px', objectFit: 'cover' }}
                      />
                    </Carousel.Item>
                  ))
                ) : (
                  <Carousel.Item>
                    <img
                      className="d-block w-100"
                      src="https://via.placeholder.com/800x500"
                      alt="Placeholder"
                    />
                  </Carousel.Item>
                )}
              </Carousel>
            </div>

            {/* Descripción */}
            <div className="bg-white p-4 rounded shadow-sm mb-4">
              <h3 className="fw-bold mb-3">Descripción</h3>
              <p className="text-muted" style={{ whiteSpace: 'pre-line' }}>
                {propiedad.descripcion}
              </p>

              <h4 className="fw-bold mb-3 mt-4">Características Principales</h4>
              <Row className="g-3">
                {features.map((feature, index) => (
                  <Col md={6} key={index}>
                    <ul className="list-unstyled mb-0">
                      <li>
                        <i className="fas fa-check text-success me-2"></i>
                        {feature}
                      </li>
                    </ul>
                  </Col>
                ))}
              </Row>
            </div>

            {/* Ubicación */}
            <div className="bg-white p-4 rounded shadow-sm">
              <h3 className="fw-bold mb-3">Ubicación</h3>
              <div style={{ height: '300px', width: '100%' }} className="rounded overflow-hidden">
                {propiedad.latitud && propiedad.longitud ? (
                  <MapContainer
                    center={[propiedad.latitud, propiedad.longitud]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[propiedad.latitud, propiedad.longitud]}>
                      <Popup>{propiedad.titulo}</Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <div className="d-flex align-items-center justify-content-center h-100 bg-light">
                    <span className="text-muted">Ubicación no disponible en mapa</span>
                  </div>
                )}
              </div>
              <p className="mt-2 text-muted mb-0">
                <i className="fas fa-map-marker-alt me-2"></i>
                {propiedad.direccion}, {propiedad.ciudad}
              </p>
            </div>
          </Col>

          {/* Columna Derecha */}
          <Col lg={4}>
            {/* Precio y datos */}
            <div className="bg-white p-4 rounded shadow-sm mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="h2 fw-bold text-primary mb-0">
                  {propiedad.moneda === 'USD' ? 'U$S' : '$'} {precioFinal?.toLocaleString()}
                </span>

                <span className={`badge bg-${
                  propiedad.operacion === 'venta' ? 'success' :
                  propiedad.operacion === 'alquiler' ? 'warning' : 'primary'
                }`}>
                  {propiedad.operacion}
                </span>
              </div>

              <h4 className="fw-bold mb-3">{propiedad.titulo}</h4>

              <div className="mb-4">
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span><i className="fas fa-bed text-muted me-2"></i>Dormitorios</span>
                  <span className="fw-bold">{propiedad.dormitorios || 0}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span><i className="fas fa-bath text-muted me-2"></i>Baños</span>
                  <span className="fw-bold">{propiedad.banos || 0}</span>
                </div>
                <div className="d-flex justify-content-between py-2 border-bottom">
                  <span><i className="fas fa-ruler-combined text-muted me-2"></i>Sup. Total</span>
                  <span className="fw-bold">{propiedad.superficie_total} m²</span>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="d-grid gap-2">
                <Button
                  variant="success"
                  target="_blank"
                  href={`https://wa.me/5493870000000?text=Hola, me interesa la propiedad: ${propiedad.titulo}`}
                >
                  <i className="fab fa-whatsapp me-2"></i>WhatsApp
                </Button>
                <Button variant="outline-dark">
                  <i className="fas fa-envelope me-2"></i>Consultar
                </Button>
              </div>
            </div>

            {/* Agente a cargo */}
            <div className="bg-white p-4 rounded shadow-sm mt-4">
              <h5 className="fw-bold mb-3">Agente a cargo</h5>
              <div className="d-flex align-items-center mb-3">
                <div className="me-3">
                  <i className="fas fa-user-circle fa-3x text-secondary"></i>
                </div>
                <div>
                  <h6 className="mb-1">{propiedad.agente}</h6>
                  <small className="text-muted">Asesor Inmobiliario</small>
                </div>
              </div>

              <div className="d-grid gap-2">
                <Button variant="outline-dark" size="sm">Ver Perfil</Button>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default PropertyDetailPage;
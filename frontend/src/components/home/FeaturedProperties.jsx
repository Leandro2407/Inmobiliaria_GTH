import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

const FeaturedProperties = () => {
  // Propiedades de ejemplo (luego vendrán de la API)
  const properties = [
    {
      id: 1,
      title: 'Casa en Tres Cerritos',
      tipo: 'Venta',
      precio: '$320,000',
      dormitorios: 3,
      banos: 2,
      superficie: '180m²',
      imagen: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=500',
      descripcion: 'Hermosa casa con amplio jardín, piscina y quincho. Excelente ubicación cerca de colegios y servicios comerciales.',
    },
    {
      id: 2,
      title: 'Departamento en El Bosque',
      tipo: 'Alquiler',
      precio: '$450/mes',
      dormitorios: 2,
      banos: 1,
      superficie: '85m²',
      imagen: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=500',
      descripcion: 'Luminoso departamento con balcón terraza, cocina integrada y excelente vista.',
    },
    {
      id: 3,
      title: 'Terreno en Zona Norte',
      tipo: 'Venta',
      precio: '$150,000',
      dormitorios: null,
      banos: null,
      superficie: '1000m²',
      imagen: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500',
      descripcion: 'Excelente terreno en barrio cerrado con seguridad, servicios subterráneos y vista panorámica.',
    },
  ];

  const handleWhatsApp = (property) => {
    const message = `Hola, me interesa la propiedad: ${property.title}`;
    const phone = '5493874123456'; // Cambiar por el número real
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <section className="py-5" id="propiedades">
      <Container>
        <Row className="mb-5">
          <Col>
            <h2 className="fw-bold mb-3">Propiedades destacadas</h2>
            <p className="text-muted">Descubrí nuestras mejores opciones seleccionadas para vos</p>
          </Col>
        </Row>

        <Row className="g-4">
          {properties.map((property) => (
            <Col lg={4} md={6} key={property.id}>
              <Card className="property-card h-100 shadow-sm border-0">
                <div className="property-image-wrapper position-relative">
                  <Card.Img
                    variant="top"
                    src={property.imagen}
                    alt={property.title}
                    className="property-image"
                    style={{ height: '250px', objectFit: 'cover' }}
                  />
                  <span className="property-badge position-absolute bg-dark text-white px-3 py-1 rounded">
                    {property.tipo}
                  </span>
                </div>
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="fw-bold">{property.title}</Card.Title>
                  <Card.Subtitle className="mb-2 text-muted">
                    {property.dormitorios && `${property.dormitorios} dormitorios`}
                    {property.banos && ` • ${property.banos} baños`}
                    {` • ${property.superficie}`}
                  </Card.Subtitle>
                  <Card.Text className="text-muted flex-grow-1">
                    {property.descripcion}
                  </Card.Text>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="property-price fw-bold fs-5 text-dark">
                      {property.precio}
                    </span>
                    <div>
                      <Button
                        variant="outline-dark"
                        size="sm"
                        className="me-2"
                        onClick={() => console.log('Ver detalles', property.id)}
                      >
                        Ver detalles
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleWhatsApp(property)}
                      >
                        <i className="fab fa-whatsapp"></i>
                      </Button>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <Row className="mt-5">
          <Col className="text-center">
            <Button variant="dark" size="lg" className="px-5">
              Ver todas las propiedades
              <i className="fas fa-arrow-right ms-2"></i>
            </Button>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default FeaturedProperties;

import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const Services = () => {
  const services = [
    {
      id: 1,
      icon: 'fa-home',
      title: 'Venta de Propiedades',
      description: 'Gestionamos la venta de tu propiedad con el mejor precio del mercado',
    },
    {
      id: 2,
      icon: 'fa-key',
      title: 'Alquileres',
      description: 'Encontramos el inquilino ideal y gestionamos todos los trámites',
    },
    {
      id: 3,
      icon: 'fa-calculator',
      title: 'Tasaciones',
      description: 'Valuaciones precisas y actualizadas del mercado inmobiliario',
    },
  ];

  return (
    <section className="bg-light py-5" id="servicios">
      <Container>
        <Row className="mb-5">
          <Col className="text-center">
            <h2 className="fw-bold mb-3">Nuestros Servicios</h2>
            <p className="text-muted">Te acompañamos en cada paso de tu operación inmobiliaria</p>
          </Col>
        </Row>

        <Row className="g-4">
          {services.map((service) => (
            <Col md={4} key={service.id}>
              <Card className="text-center border-0 shadow-sm h-100 service-card">
                <Card.Body className="p-4">
                  <i className={`fas ${service.icon} fa-3x text-dark mb-3`}></i>
                  <Card.Title className="fw-bold">{service.title}</Card.Title>
                  <Card.Text className="text-muted">
                    {service.description}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </section>
  );
};

export default Services;

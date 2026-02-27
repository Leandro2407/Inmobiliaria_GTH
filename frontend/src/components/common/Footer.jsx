import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-4 mt-5">
      <Container>
        <Row className="align-items-center">
          <Col md={6}>
            <h5>
              <i className="fas fa-building me-2"></i>
              GTH Negocios Inmobiliarios
            </h5>
            <p className="mb-0">© 2025 GTH Negocios Inmobiliarios. Todos los derechos reservados.</p>
          </Col>
          <Col md={6} className="text-md-end d-flex flex-column justify-content-center align-items-md-end align-items-center">
            <h5>Nuestras redes</h5>
            <div className="d-flex justify-content-center footerhome" style={{ paddingRight: '38px' }}>
              <a href="https://www.instagram.com/gthinmobiliaria?igsh=djliNmZqMGQ1dXkw" className="text-white me-3">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://wa.me/5493873115079" className="text-white">
                <i className="fab fa-whatsapp"></i>
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
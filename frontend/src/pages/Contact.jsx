import React, { useEffect } from 'react';
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import '../styles/Contact.css';

const Contact = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const HOME_SELF = `${process.env.PUBLIC_URL}/casa.jpg`;

  // En este diseño eliminamos el formulario de envío y ofrecemos CTAs directas
  const mailtoContact = `mailto:contacto@gthinmobiliaria.com?subject=${encodeURIComponent('Consulta desde sitio')}`;
  const whatsappNumber = '+543874123456';
  const whatsappLink = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`;
  const telPrimary = 'tel:+543874123456';
  const telSecondary = 'tel:+543874123457';

  return (
    <div className="contact-page">

      {/* Hero Section */}
      <section 
        className="contact-hero text-white d-flex align-items-center position-relative"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.6)), url(${HOME_SELF})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat", 
          backgroundPosition: "center", 
          minHeight: "60vh" 
        }}
      >
        <Container className="text-center position-relative z-index-2">
          <h5 className="text-uppercase tracking-wider mb-3 opacity-75 fw-light">Contacto</h5>
          <h1 className="display-3 fw-bold mb-4">Hablemos de tu proyecto</h1>
          <p className="lead mx-auto" style={{ maxWidth: '700px' }}>
            Estamos aquí para ayudarte a encontrar la propiedad perfecta
          </p>
        </Container>
      </section>

      {/* Contact Content */}
      <section className="contact-content py-5 bg-light">
        <Container>
          <Row className="g-5 justify-content-center">
            {/* Información de Contacto - Lado Izquierdo */}
            <Col lg={5} md={6}>
              <div className="contact-info h-100">
                <h2 className="fw-bold text-dark mb-4">Ponte en contacto</h2>
                <p className="text-muted mb-5">
                  En GTH entendemos que cada operación inmobiliaria es única. 
                  Nuestro equipo está comprometido en brindarte soluciones personalizadas.
                </p>

                <div className="contact-details">
                  <div className="contact-item mb-4">
                    <div className="contact-icon">
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <div className="contact-text">
                      <h6 className="fw-bold text-dark mb-2">Oficina Central</h6>
                      <p className="text-muted mb-0">
                        Av. Reyes Catolicos 2274, Salta Capital<br />
                        Código Postal: 4400
                      </p>
                    </div>
                  </div>

                  <div className="contact-item mb-4">
                    <div className="contact-icon">
                      <i className="fas fa-envelope"></i>
                    </div>
                    <div className="contact-text">
                      <h6 className="fw-bold text-dark mb-2">Escríbinos</h6>
                      <p className="text-muted mb-0">
                        contacto@gthinmobiliaria.com<br />
                        info@gthinmobiliaria.com
                      </p>
                    </div>
                  </div>

                  <div className="contact-item mb-4">
                    <div className="contact-icon">
                      <i className="fas fa-phone"></i>
                    </div>
                    <div className="contact-text">
                      <h6 className="fw-bold text-dark mb-2">Llámanos</h6>
                      <p className="text-muted mb-0">
                        +54 387 412-3456<br />
                        +54 387 412-3457
                      </p>
                    </div>
                  </div>

                  <div className="contact-item">
                    <div className="contact-icon">
                      <i className="fas fa-clock"></i>
                    </div>
                    <div className="contact-text">
                      <h6 className="fw-bold text-dark mb-2">Horario de Atención</h6>
                      <p className="text-muted mb-0">
                        Lunes a Viernes: 9:00 - 18:00<br />
                        Sábados: 9:00 - 13:00
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Col>

            {/* CTAs de contacto - Lado Derecho (reemplazamos el formulario por botones directos) */}
            <Col lg={5} md={6}>
              <Card className="contact-form-card border-0 shadow-sm">
                <Card.Body className="p-4 p-md-5 text-center">
                  <h3 className="fw-bold text-dark mb-4">Contactanos</h3>

                  <p className="text-muted mb-4">Elige la forma más cómoda para comunicarte con nosotros.</p>

                  <div className="d-grid gap-2 mb-3">
                    <Button as="a" href={mailtoContact} variant="outline-dark" size="lg">
                      <i className="fas fa-envelope me-2"></i>
                      Enviar correo
                    </Button>
                    <Button as="a" href={whatsappLink} target="_blank" rel="noopener noreferrer" variant="success" size="lg">
                      <i className="fab fa-whatsapp me-2"></i>
                      Enviar por WhatsApp
                    </Button>
                    <Button as="a" href={telPrimary} variant="outline-secondary" size="lg">
                      <i className="fas fa-phone me-2"></i>
                      Llamar: +54 387 412-3456
                    </Button>
                    <Button as="a" href={telSecondary} variant="outline-secondary" size="lg">
                      <i className="fas fa-phone me-2"></i>
                      Llamar: +54 387 412-3457
                    </Button>
                  </div>

                  <hr />

                  <div className="contact-social text-center mt-3">
                    <p className="text-muted mb-2">También podés seguirnos en nuestras redes</p>
                    <div className="social-links d-flex justify-content-center gap-3">
                      {[
                        { href: "https://www.facebook.com/gthinmobiliaria", icon: "facebook", color: "#1877f2" },
                        { href: "https://www.instagram.com/gthinmobiliaria?igsh=djliNmZqMGQ1dXkw#", icon: "instagram", color: "#e4405f" },
                        { href: "#", icon: "linkedin", color: "#0077b5" },
                        { href: "#", icon: "whatsapp", color: "#25d366" }
                      ].map((social, index) => (
                        <a 
                          key={index}
                          href={social.href} 
                          className="social-link"
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ '--social-color': social.color }}
                        >
                          <i className={`fab fa-${social.icon}`}></i>
                        </a>
                      ))}
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Contact;
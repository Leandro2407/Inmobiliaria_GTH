import React, { useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import '../styles/Nosotros.css';

const Nosotros = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const IMAGES_PATH = "/";
  const LOGO_GTH = `${IMAGES_PATH}logo-gth.jpg`;
  const FOTO_NOSOTROS = `${IMAGES_PATH}fondo-nosotros.jpg`;

  const teamMembers = [
    { name: "Matias Hernandez", role: "Asesor Inmobiliario", img: `${IMAGES_PATH}matias.jpg` },
    { name: "Miguel Nazr", role: "Licenciado en Administración", img: `${IMAGES_PATH}miguel.jpg` },
    { name: "Facundo Torres", role: "Asesor Inmobiliario", img: `${IMAGES_PATH}facundo.jpg` },
    { name: "Gabriel Gomez", role: "Corredor Inmobiliario", img: `${IMAGES_PATH}gabriel.jpg` },
  ];

  const objetivos = [
    { title: "Transparencia", desc: "Procesos claros y honestos en cada operación." },
    { title: "Profesionalismo", desc: "Acompañamiento responsable y especializado." },
    { title: "Eficiencia", desc: "Gestiones ágiles y orientadas a resultados." },
    { title: "Soluciones a Medida", desc: "Cada cliente recibe el servicio que necesita." },
  ];

  return (
    <div className="nosotros-page">
    {/* string para el background-image */}
    <section 
        className="hero-section text-white d-flex align-items-center position-relative"
        style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.6)), url(${FOTO_NOSOTROS})`,
        backgroundSize: "90% auto",
        backgroundRepeat: "no-repeat", 
        backgroundPosition: "center", 
        minHeight: "60vh" 
        }}
    >
        <Container className="text-center position-relative z-index-2">
        <h5 className="text-uppercase tracking-wider mb-3 opacity-75 fw-light">Negocios Inmobiliarios</h5>
        <h1 className="display-3 fw-bold mb-4">Conocé nuestra esencia</h1>
        <p className="lead mx-auto" style={{ maxWidth: '700px' }}>
            Tu confianza es nuestro compromiso desde hace más de una década.
        </p>
        </Container>
    </section>

      {/* ¿QUIÉNES SOMOS? */}
      <section className="py-5 bg-light">
        <Container className="py-5">
          <Row className="align-items-center g-5">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-4 text-dark">¿Quiénes Somos?</h1>
              <p className="lead text-secondary mb-4">
                GTH Negocios Inmobiliarios es una empresa recien fundada en 2021, impulsada por un grupo de amigos con una visión en común: ofrecer un servicio serio, profesional y centrado en las personas.
              </p>
              <p className="lead text-secondary mb-4">
                Aquello que comenzó como un proyecto compartido se convirtió en una inmobiliaria reconocida por su confianza, transparencia y acompañamiento humano en cada operación.
              </p>
              <p className="lead text-secondary mb-4">
                Hoy seguimos creciendo con los mismos valores que nos impulsaron desde el inicio, priorizando siempre las necesidades y sueños de cada cliente.
              </p>
            </Col>
            <Col lg={6}>
            <div className="text-center">
                <img 
                src={LOGO_GTH} 
                alt="Nosotros" 
                className="img-fluid rounded-circle shadow-lg"
                style={{
                    width: '450px',
                    height: '450px',
                    objectFit: 'cover',
                    border: '5px solid #000',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }}
                />
            </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* MISIÓN */}
      <section className="py-5 bg-white">
        <Container className="py-5">
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h1 className="display-4 fw-bold mb-4 text-dark">Nuestra Misión</h1>
              <h6 className="display-6 fw-bold mb-2 text-dark lh-sm">
                Trabajar con transparencia, profesionalismo y compromiso
              </h6>
              <p className="lead text-secondary">
                Nuestra misión es construir relaciones inmobiliarias duraderas basadas en confianza, expertise y dedicación, ofreciendo soluciones personalizadas que aseguran procesos claros y resultados exitosos para cada cliente.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* OBJETIVOS */}
      <section className="py-5 bg-light">
        <Container className="py-5 text-center">
          <h3 className="fw-bold text-dark display-6 mb-5">Nuestros Objetivos</h3>
          <Row className="g-4 justify-content-center">
            {objetivos.map((obj, index) => (
              <Col md={3} key={index}>
                <Card className="p-4 shadow-lg border-0 h-100 bg-white" 
                      style={{ 
                        borderRadius: '15px', 
                        border: '2px solid #000',
                        transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-10px)';
                        e.currentTarget.style.boxShadow = '0 15px 30px rgba(0,0,0,0.2)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                      }}>
                  <h5 className="fw-bold text-dark mb-3" style={{ fontSize: '1.5rem' }}>{obj.title}</h5>
                  <p className="text-muted">{obj.desc}</p>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* EQUIPO */}
    <section className="py-5 bg-light">
    <Container className="py-5">
        <div className="text-center mb-5">
        <h2 className="fw-bold display-6 mb-2">Nuestro Equipo de Trabajo</h2>
        <p className="lead text-muted mb-4">Profesionales comprometidos con tu éxito inmobiliario</p>
        </div>
        
        <Row className="g-4 justify-content-center">
        {teamMembers.map((member, index) => (
            <Col lg={3} md={6} key={index}>
            <Card className="team-card border-0 h-100 text-center overflow-hidden">
                <div className="card-img-top position-relative pt-4">
                <img 
                    src={member.img} 
                    alt={member.name} 
                    className="rounded-circle img-fluid border border-5 border-white shadow-sm" 
                    style={{ 
                    width: '150px', 
                    height: '150px', 
                    objectFit: 'cover' 
                    }} 
                />
                </div>
                <Card.Body className="p-4">
                <h5 className="fw-bold mb-1 text-dark">{member.name}</h5>
                <p className="text-primary small text-uppercase fw-bold mb-3" style={{ letterSpacing: '1px' }}>
                    {member.role}
                </p>
                </Card.Body>
            </Card>
            </Col>
        ))}
        </Row>
    </Container>
    </section>
    </div>
  );
};

export default Nosotros;
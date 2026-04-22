import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Breadcrumb, Carousel, Button, Spinner, Modal, Form, Alert } from 'react-bootstrap';
import propiedadService from '../services/propiedadService';
import solicitudVisitaService from '../services/solicitudVisitaService';
import authService from '../services/authService';
import { BACKEND_URL } from '../services/api';
import '../styles/PropertyDetailPage.css'; // ← IMPORTANTE: Ruta correcta al CSS

const PropertyDetailPage = () => {
  const { id } = useParams();
  const [propiedad, setPropiedad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [carouselIndex, setCarouselIndex] = useState(0);
  // Pausar el autoplay del carrusel cuando hay un video activo en pantalla
  const [carouselPaused, setCarouselPaused] = useState(false);

  // Estados para el modal de agendar visita
  const [showVisitaModal, setShowVisitaModal] = useState(false);
  const [solicitandoVisita, setSolicitandoVisita] = useState(false);
  const [mensajeVisita, setMensajeVisita] = useState('');
  const [errorVisita, setErrorVisita] = useState('');
  const [visitaAgendada, setVisitaAgendada] = useState(false);

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

  // Abrir imagen en modal (solo se llama desde items de tipo 'image' en el carrusel)
  // idx es el índice dentro de mediaItems, hay que convertirlo al índice dentro de imagenes
  const handleImageClick = (mediaIdx) => {
    const imageIdx = mediaItems.slice(0, mediaIdx + 1).filter(i => i.type === 'image').length - 1;
    setSelectedImageIndex(Math.max(imageIdx, 0));
    setShowImageModal(true);
  };

  // Abrir modal de agendar visita
  const handleAgendarVisita = () => {
    const user = authService.getCurrentUser();
    if (!user) {
      setErrorVisita('Debes iniciar sesión para agendar una visita');
      return;
    }
    if (user.rol !== 'cliente') {
      setErrorVisita('Solo los clientes pueden agendar visitas');
      return;
    }
    setShowVisitaModal(true);
    setErrorVisita('');
    setMensajeVisita('');
  };

  // Enviar solicitud de visita
  const handleSubmitVisita = async (e) => {
    e.preventDefault();

    if (!mensajeVisita.trim()) {
      setErrorVisita('Por favor, escribe un mensaje para tu solicitud');
      return;
    }

    setSolicitandoVisita(true);
    setErrorVisita('');

    try {
      const solicitudData = {
        propiedad: id,
        mensaje: mensajeVisita.trim()
      };

      await solicitudVisitaService.create(solicitudData);
      setVisitaAgendada(true);
      setTimeout(() => {
        setShowVisitaModal(false);
        setVisitaAgendada(false);
        setMensajeVisita('');
      }, 2000);
    } catch (error) {
      console.error('Error al solicitar visita:', error);
      setErrorVisita(
        error.mensaje ||
        error.error ||
        'Error al enviar la solicitud. Inténtalo de nuevo.'
      );
    } finally {
      setSolicitandoVisita(false);
    }
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

  // Mensaje de WhatsApp que incluye enlace a la propiedad
  const propertyUrl = `${window.location.origin}/propiedades/${id}`;
  const whatsappMessage = `Hola, me interesa la propiedad: ${propiedad.titulo} - ${propertyUrl}`;
  const whatsappLink = `https://wa.me/5493870000000?text=${encodeURIComponent(whatsappMessage)}`;

  // Preparar enlace mailto para abrir cliente de correo con asunto y cuerpo prellenado
  const mailtoSubject = `Consulta por propiedad: ${propiedad.titulo}`;
  const mailtoBody = `Hola,\n\nMe interesa la propiedad: ${propiedad.titulo}\n${propertyUrl}\n\nMensaje:`;
  const mailtoLink = `mailto:contacto@gthinmobiliaria.com?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(mailtoBody)}`;

  // Obtener imágenes y asegurar URLs absolutas
  const imagenes = propiedad.imagenes && propiedad.imagenes.length > 0 
    ? propiedad.imagenes.map(imgObj => {
        const url = imgObj.imagen || '';
        if (url.startsWith('http')) return { ...imgObj, imagen: url };
        return { ...imgObj, imagen: `${BACKEND_URL}${url}` };
      })
    : [{ imagen: 'https://via.placeholder.com/800x500?text=Sin+Imagen' }];

  // Construir lista combinada: primero las imágenes, luego los videos
  // Cada item tiene: type ('image' | 'video' | 'youtube'), y los datos correspondientes
  const mediaItems = [
    ...imagenes.map(img => ({ type: 'image', ...img })),
    ...(propiedad.videos || []).map(vid => {
      if (vid.url_youtube) {
        // Convertir URL de YouTube a formato embed
        let embedUrl = vid.url_youtube;
        const ytMatch = embedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
        if (ytMatch) {
          embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`;
        }
        return { type: 'youtube', embedUrl, titulo: vid.titulo };
      }
      // Video de archivo subido al servidor
      const videoUrl = vid.video_url
        ? (vid.video_url.startsWith('http') ? vid.video_url : `${BACKEND_URL}${vid.video_url}`)
        : null;
      return { type: 'video', videoUrl, titulo: vid.titulo };
    }).filter(v => v.type === 'youtube' ? v.embedUrl : v.videoUrl),
  ];

  return (
    <section className="py-5 bg-light" style={{ marginTop: '80px' }}>
      <Container>
        {/* Breadcrumb - AHORA USA LA CLASE custom-breadcrumb */}
        <Breadcrumb className="mb-4 custom-breadcrumb">
          <Breadcrumb.Item href="/">
            Inicio
          </Breadcrumb.Item>
          <Breadcrumb.Item href="/propiedades">
            Propiedades
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            {propiedad.titulo}
          </Breadcrumb.Item>
        </Breadcrumb>

        <Row className="g-4">
          {/* Columna Izquierda - Galería */}
          <Col lg={7}>
            {/* Galería con Carrusel Automático */}
            <div className="property-gallery mb-4 rounded overflow-hidden shadow-sm">
              <Carousel
                activeIndex={carouselIndex}
                onSelect={(selectedIndex) => {
                  setCarouselIndex(selectedIndex);
                  // Pausar autoplay si el item seleccionado es un video
                  const item = mediaItems[selectedIndex];
                  setCarouselPaused(item?.type === 'video' || item?.type === 'youtube');
                }}
                interval={carouselPaused ? null : 3000}
                pause="hover"
              >
                {mediaItems.map((item, idx) => (
                  <Carousel.Item key={idx}>
                    {item.type === 'image' && (
                      <img
                        className="d-block w-100"
                        src={item.imagen}
                        alt={`Slide ${idx + 1}`}
                        style={{ height: '500px', objectFit: 'cover', cursor: 'pointer' }}
                        onClick={() => handleImageClick(idx)}
                      />
                    )}
                    {item.type === 'video' && (
                      <div style={{ height: '500px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <video
                          src={item.videoUrl}
                          controls
                          style={{ maxHeight: '500px', maxWidth: '100%', width: '100%' }}
                          onPlay={() => setCarouselPaused(true)}
                          onPause={() => setCarouselPaused(false)}
                          onEnded={() => setCarouselPaused(false)}
                        >
                          Tu navegador no soporta la reproducción de video.
                        </video>
                      </div>
                    )}
                    {item.type === 'youtube' && (
                      <div style={{ height: '500px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <iframe
                          title={item.titulo || `Video YouTube ${idx + 1}`}
                          width="100%"
                          height="500"
                          src={item.embedUrl}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ display: 'block' }}
                        />
                      </div>
                    )}
                  </Carousel.Item>
                ))}
              </Carousel>
            </div>
          </Col>

          {/* Columna Derecha - Información y Agente */}
          <Col lg={5}>
            {/* Título y Precio */}
            <div className="bg-white p-4 rounded shadow-sm mb-3">
              <h2 className="fw-bold mb-3" style={{ color: '#000', fontSize: '1.75rem' }}>
                {propiedad.titulo}
              </h2>
              
              <div className="d-flex align-items-center mb-3">
                <h3 className="fw-bold mb-0 me-3" style={{ color: '#000', fontSize: '2rem' }}>
                  {propiedad.moneda === 'USD' ? 'U$S' : '$'} {formatNumber(precioFinal)}
                </h3>
                <span className="badge bg-dark px-3 py-2" style={{ fontSize: '0.9rem' }}>
                  {propiedad.operacion}
                </span>
              </div>

              <hr className="my-3" style={{ borderColor: '#dee2e6' }} />

              {/* Características principales en formato compacto */}
              <Row className="g-3">
                <Col xs={6}>
                  <div className="d-flex align-items-center">
                    <i className="fas fa-ruler-combined fa-lg me-2" style={{ color: '#6c757d' }}></i>
                    <div>
                      <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Sup. Total</small>
                      <span className="fw-bold">{propiedad.superficie_total} m²</span>
                    </div>
                  </div>
                </Col>
                {propiedad.superficie_cubierta && (
                  <Col xs={6}>
                    <div className="d-flex align-items-center">
                      <i className="fas fa-home fa-lg me-2" style={{ color: '#6c757d' }}></i>
                      <div>
                        <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Sup. Cubierta</small>
                        <span className="fw-bold">{propiedad.superficie_cubierta} m²</span>
                      </div>
                    </div>
                  </Col>
                )}
                <Col xs={4}>
                  <div className="d-flex align-items-center">
                    <i className="fas fa-bed fa-lg me-2" style={{ color: '#6c757d' }}></i>
                    <div>
                      <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Dormitorios</small>
                      <span className="fw-bold">{propiedad.dormitorios || 0}</span>
                    </div>
                  </div>
                </Col>
                <Col xs={4}>
                  <div className="d-flex align-items-center">
                    <i className="fas fa-bath fa-lg me-2" style={{ color: '#6c757d' }}></i>
                    <div>
                      <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Baños</small>
                      <span className="fw-bold">{propiedad.banos || 0}</span>
                    </div>
                  </div>
                </Col>
                {propiedad.cocheras > 0 && (
                  <Col xs={4}>
                    <div className="d-flex align-items-center">
                      <i className="fas fa-car fa-lg me-2" style={{ color: '#6c757d' }}></i>
                      <div>
                        <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Cocheras</small>
                        <span className="fw-bold">{propiedad.cocheras}</span>
                      </div>
                    </div>
                  </Col>
                )}
              </Row>
            </div>

            {/* Agente a cargo */}
            <div className="bg-white p-4 rounded shadow-sm sticky-top" style={{ top: '100px' }}>
              <h5 className="fw-bold mb-3" style={{ color: '#000' }}>
                <i className="fas fa-user-tie me-2"></i>
                Agente a cargo
              </h5>
              <div className="d-flex align-items-center mb-4">
                <div className="me-3">
                  <i className="fas fa-user-circle fa-4x" style={{ color: '#6c757d' }}></i>
                </div>
                <div>
                  <h6 className="mb-1 fw-bold">{propiedad.agente_nombre || 'Agente Inmobiliario'}</h6>
                  <small className="text-muted">Asesor Inmobiliario</small>
                </div>
              </div>

              <div className="d-grid gap-2">
                <Button
                  variant="dark"
                  size="lg"
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="d-flex align-items-center justify-content-center"
                >
                  <i className="fab fa-whatsapp me-2"></i>
                  Contactar por WhatsApp
                </Button>
                <Button 
                  as="a"
                  href={mailtoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline-dark" 
                  size="lg"
                  className="d-flex align-items-center justify-content-center"
                >
                  <i className="fas fa-envelope me-2"></i>
                  Enviar Consulta
                </Button>
                <Button
                  variant="success"
                  size="lg"
                  onClick={handleAgendarVisita}
                  className="d-flex align-items-center justify-content-center"
                >
                  <i className="fas fa-calendar-check me-2"></i>
                  Agendar Visita
                </Button>
              </div>
            </div>
          </Col>
        </Row>

        {/* Sección de información completa debajo */}
        <Row className="mt-4">
          <Col lg={12}>
            {/* Descripción */}
            <div className="bg-white p-4 rounded shadow-sm mb-4">
              <h4 className="fw-bold mb-3" style={{ color: '#000' }}>
                <i className="fas fa-align-left me-2"></i>
                Descripción
              </h4>
              <p className="text-muted mb-0" style={{ whiteSpace: 'pre-line', lineHeight: '1.8' }}>
                {propiedad.descripcion}
              </p>
            </div>

            {/* Características Principales */}
            {features.length > 0 && (
              <div className="bg-white p-4 rounded shadow-sm mb-4">
                <h4 className="fw-bold mb-3" style={{ color: '#000' }}>
                  <i className="fas fa-check-square me-2"></i>
                  Características Principales
                </h4>
                <Row className="g-3">
                  {features.map((feature, index) => (
                    <Col md={6} key={index}>
                      <div className="d-flex align-items-center">
                        <i className="fas fa-check-circle me-2" style={{ color: '#6c757d' }}></i>
                        <span>{feature}</span>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* Ubicación */}
            <div className="bg-white p-4 rounded shadow-sm">
              <h4 className="fw-bold mb-3" style={{ color: '#000' }}>
                <i className="fas fa-map-marker-alt me-2"></i>
                Ubicación
              </h4>
              
              <div className="mb-4">
                <Row className="g-3">
                  <Col md={12}>
                    <div className="d-flex align-items-center mb-2">
                      <strong className="me-2" style={{ minWidth: '100px' }}>Dirección:</strong>
                      <span>{calle} {numeroCalle}</span>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="d-flex align-items-center">
                      <strong className="me-2">Barrio:</strong>
                      <span>{propiedad.barrio}</span>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="d-flex align-items-center">
                      <strong className="me-2">Zona:</strong>
                      <span className="text-capitalize">{propiedad.zona}</span>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="d-flex align-items-center">
                      <strong className="me-2">Ciudad:</strong>
                      <span>{propiedad.ciudad}</span>
                    </div>
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
        </Row>
      </Container>

      {/* Modal para agendar visita */}
      <Modal
        show={showVisitaModal}
        onHide={() => {
          if (!solicitandoVisita) {
            setShowVisitaModal(false);
            setErrorVisita('');
            setMensajeVisita('');
            setVisitaAgendada(false);
          }
        }}
        centered
      >
        <Modal.Header closeButton={!solicitandoVisita}>
          <Modal.Title>
            <i className="fas fa-calendar-check me-2"></i>
            Solicitar Visita
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitVisita}>
          <Modal.Body>
            {errorVisita && (
              <Alert variant="danger" className="mb-3">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {errorVisita}
              </Alert>
            )}

            {visitaAgendada ? (
              <Alert variant="success" className="text-center">
                <i className="fas fa-check-circle fa-2x mb-3"></i>
                <h5>¡Solicitud enviada!</h5>
                <p className="mb-0">
                  Tu solicitud de visita ha sido enviada correctamente.
                  Recibirás una notificación cuando sea procesada.
                </p>
              </Alert>
            ) : (
              <>
                <div className="mb-3">
                  <h6 className="fw-bold mb-2">Propiedad:</h6>
                  <p className="text-muted mb-0">{propiedad?.titulo}</p>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">
                    Mensaje para el agente <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Describe brevemente qué te gustaría ver en la visita, horarios preferidos, o cualquier información adicional..."
                    value={mensajeVisita}
                    onChange={(e) => setMensajeVisita(e.target.value)}
                    required
                    disabled={solicitandoVisita}
                  />
                  <Form.Text className="text-muted">
                    Este mensaje será enviado al agente inmobiliario junto con tu solicitud.
                  </Form.Text>
                </Form.Group>

                <Alert variant="info" className="mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Nota:</strong> El agente revisará tu solicitud y te contactará
                  para coordinar la fecha y hora de la visita.
                </Alert>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowVisitaModal(false);
                setErrorVisita('');
                setMensajeVisita('');
                setVisitaAgendada(false);
              }}
              disabled={solicitandoVisita}
            >
              {visitaAgendada ? 'Cerrar' : 'Cancelar'}
            </Button>
            {!visitaAgendada && (
              <Button
                variant="success"
                type="submit"
                disabled={solicitandoVisita || !mensajeVisita.trim()}
              >
                {solicitandoVisita ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane me-2"></i>
                    Enviar Solicitud
                  </>
                )}
              </Button>
            )}
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal para ver imágenes en grande */}
      <Modal 
        show={showImageModal} 
        onHide={() => setShowImageModal(false)} 
        size="xl" 
        centered
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title>Imagen {selectedImageIndex + 1} de {imagenes.length}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <Carousel
            activeIndex={selectedImageIndex}
            onSelect={(selectedIndex) => setSelectedImageIndex(selectedIndex)}
            interval={null}
          >
            {imagenes.map((img, idx) => (
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
        </Modal.Body>
      </Modal>
    </section>
  );
};

export default PropertyDetailPage;
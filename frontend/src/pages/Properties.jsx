import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, InputGroup } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import propiedadService from '../services/propiedadService';

const Properties = () => {
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({
    tipo_propiedad: '',
    tipo_operacion: '', // Venta/Alquiler
  });

  useEffect(() => {
    cargarPropiedades();
  }, [filtros]);

  const cargarPropiedades = async () => {
    try {
      setLoading(true);
      // Pasamos los filtros al servicio
      const data = await propiedadService.getPublicas(filtros);
      setPropiedades(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFiltros({ ...filtros, [e.target.name]: e.target.value });
  };

  return (
    <Container className="py-5 mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Nuestras Propiedades</h2>
        <span className="text-muted">{propiedades.length} resultados</span>
      </div>

      {/* Filtros Simples */}
      <Row className="mb-5 g-3">
        <Col md={3}>
            <Form.Select name="tipo_operacion" onChange={handleFilterChange}>
                <option value="">Tipo de Operación</option>
                <option value="Venta">Venta</option>
                <option value="Alquiler">Alquiler</option>
            </Form.Select>
        </Col>
        <Col md={3}>
            <Form.Select name="tipo_propiedad" onChange={handleFilterChange}>
                <option value="">Tipo de Propiedad</option>
                <option value="Casa">Casa</option>
                <option value="Departamento">Departamento</option>
                <option value="Terreno">Terreno</option>
            </Form.Select>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center"><Spinner animation="border" /></div>
      ) : (
        <Row className="g-4">
          {propiedades.map((p) => (
            <Col lg={4} md={6} key={p.id}>
              <Card className="h-100 shadow-sm border-0 transition-hover">
                <div style={{ height: '250px', overflow: 'hidden', position: 'relative' }}>
                    <Card.Img 
                        variant="top" 
                        src={p.imagen_principal || p.imagenes?.[0]?.imagen || 'https://via.placeholder.com/400x300'} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <span className="badge bg-dark position-absolute top-0 end-0 m-3">{p.tipo_operacion}</span>
                </div>
                <Card.Body>
                  <Card.Title className="fw-bold">{p.titulo}</Card.Title>
                  <p className="text-muted small mb-2"><i className="fas fa-map-marker-alt me-1"></i> {p.direccion}, {p.ciudad}</p>
                  <h5 className="fw-bold text-primary my-3">
                    {p.moneda === 'USD' ? 'U$S' : '$'} {p.precio}
                  </h5>
                  <div className="d-flex justify-content-between small text-muted border-top pt-3">
                    <span><i className="fas fa-ruler-combined"></i> {p.m2_totales} m²</span>
                    <span><i className="fas fa-bed"></i> {p.dormitorios} dorm</span>
                    <span><i className="fas fa-bath"></i> {p.banos} baños</span>
                  </div>
                  <Button as={Link} to={`/propiedades/${p.id}`} variant="dark" className="w-100 mt-3">
                    Ver Propiedad
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Properties;
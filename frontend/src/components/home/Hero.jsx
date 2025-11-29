import React, { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';

const Hero = () => {
  const [searchFilters, setSearchFilters] = useState({
    tipo: '',
    categoria: '',
    barrio: '',
    zona: '',
  });

  const handleFilterChange = (e) => {
    setSearchFilters({
      ...searchFilters,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    console.log('Buscando con filtros:', searchFilters);
    // TODO: Implementar búsqueda real
  };

  return (
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
                        <option value="compra">Compra</option>
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
                        <option value="tres-cerritos">Tres Cerritos</option>
                        <option value="el-bosque">El Bosque</option>
                        <option value="grand-bourg">Grand Bourg</option>
                        <option value="limache">Limache</option>
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
                        <option value="macro-centro">Macro Centro</option>
                        <option value="micro-centro">Micro Centro</option>
                      </Form.Select>
                    </Col>
                  </Row>
                  <div className="text-center mt-4">
                    <Button variant="dark" size="lg" className="px-5" type="submit">
                      <i className="fas fa-search me-2"></i>
                      Buscar
                    </Button>
                  </div>
                </Form>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </section>
  );
};

export default Hero;

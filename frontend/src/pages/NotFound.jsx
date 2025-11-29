import React from 'react';
import { Container, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container className="text-center py-5">
      <div className="py-5">
        <i className="fas fa-exclamation-triangle fa-5x text-warning mb-4"></i>
        <h1 className="display-1 fw-bold">404</h1>
        <h2 className="mb-4">Página No Encontrada</h2>
        <p className="lead text-muted mb-4">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <Button variant="dark" size="lg" onClick={() => navigate('/')}>
          <i className="fas fa-home me-2"></i>
          Volver al Inicio
        </Button>
      </div>
    </Container>
  );
};

export default NotFound;

import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Badge, Spinner, Alert, Card } from 'react-bootstrap';
import { toast } from 'react-toastify';
import contratoService from '../../services/contratoService';

// 🆕 Función para formatear la categoría para mostrar
const formatCategoriaForDisplay = (categoria) => {
  const map = {
    'alquiler': 'Inquilino',
    'compra': 'Comprador',
    'ambas': 'Ambos (Inquilino/Comprador)'
  };
  return map[categoria] || categoria;
};

// 🆕 Función para obtener el color del badge según categoría
const getCategoriaBadgeColor = (categoria) => {
  const colors = {
    'alquiler': 'info',
    'compra': 'primary',
    'ambas': 'success'
  };
  return colors[categoria] || 'secondary';
};

const ContratoDetalle = ({ show, onHide, contratoId, onEdit }) => {
  const [contrato, setContrato] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarContrato = async () => {
      if (!contratoId) return;
      
      try {
        setLoading(true);
        const response = await contratoService.getById(contratoId);
        setContrato(response);
      } catch (error) {
        console.error('Error al cargar contrato:', error);
        toast.error('Error al cargar los detalles del contrato');
      } finally {
        setLoading(false);
      }
    };

    if (show) {
      cargarContrato();
    }
  }, [show, contratoId]);

  const handleEdit = () => {
    onEdit(contrato);
    onHide();
  };

  const getBadgeVariant = (estado) => {
    switch (estado) {
      case 'activo':
        return 'success';
      case 'pendiente':
        return 'warning';
      case 'finalizado':
        return 'secondary';
      case 'cancelado':
        return 'danger';
      default:
        return 'light';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No especificada';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-file-contract me-2"></i>
          Detalle del Contrato
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 mb-0">Cargando contrato...</p>
          </div>
        ) : !contrato ? (
          <Alert variant="danger">
            Error al cargar el contrato. Por favor, intenta nuevamente.
          </Alert>
        ) : (
          <Row>
            {/* Información del Cliente */}
            <Col md={6}>
              <Card className="h-100">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <i className="fas fa-user me-2"></i>
                    Información del Cliente
                  </h6>
                </Card.Header>
                <Card.Body>
                  <p><strong>Nombre:</strong> {contrato.cliente_info?.nombre_completo}</p>
                  <p><strong>Email:</strong> {contrato.cliente_info?.email}</p>
                  <p><strong>Teléfono:</strong> {contrato.cliente_info?.telefono}</p>
                  <p>
                    <strong>Categoría:</strong>{' '}
                    <Badge bg={getCategoriaBadgeColor(contrato.cliente_info?.categoria)} className="ms-2">
                      {formatCategoriaForDisplay(contrato.cliente_info?.categoria) || 'No especificada'}
                    </Badge>
                  </p>
                </Card.Body>
              </Card>
            </Col>

            {/* Información de la Propiedad */}
            <Col md={6}>
              <Card className="h-100">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <i className="fas fa-building me-2"></i>
                    Información de la Propiedad
                  </h6>
                </Card.Header>
                <Card.Body>
                  <p><strong>Dirección:</strong> {contrato.propiedad_info?.direccion}</p>
                  <p><strong>Ciudad:</strong> {contrato.propiedad_info?.ciudad}</p>
                  <p><strong>Tipo:</strong> 
                    <Badge bg="secondary" className="ms-2 text-capitalize">
                      {contrato.propiedad_info?.tipo}
                    </Badge>
                  </p>
                  <p>
  <strong>Precio:</strong>{' '}
  {contrato.propiedad_info?.precio_display || 
    (contrato.propiedad_info?.precio_venta ? formatCurrency(contrato.propiedad_info.precio_venta) : 
     contrato.propiedad_info?.precio_alquiler ? formatCurrency(contrato.propiedad_info.precio_alquiler) : 
     'No especificado')}
</p>
                </Card.Body>
              </Card>
            </Col>

            {/* Detalles del Contrato */}
            <Col md={12} className="mt-3">
              <Card>
                <Card.Header className="bg-light">
                  <h6 className="mb-0">
                    <i className="fas fa-info-circle me-2"></i>
                    Detalles del Contrato
                  </h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p><strong>Tipo de Contrato:</strong> 
                        <Badge bg="primary" className="ms-2 text-capitalize">
                          {contrato.tipo}
                        </Badge>
                      </p>
                      <p><strong>Fecha de Inicio:</strong> {formatDate(contrato.fecha_inicio)}</p>
                      <p><strong>Fecha de Fin:</strong> {formatDate(contrato.fecha_fin)}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Monto:</strong> {formatCurrency(contrato.monto)}</p>
                      <p><strong>Comisión:</strong> {contrato.comision ? formatCurrency(contrato.comision) : 'No especificada'}</p>
                      <p>
                        <strong>Estado:</strong>{' '}
                        <Badge bg={getBadgeVariant(contrato.estado)} className="text-capitalize">
                          {contrato.estado}
                        </Badge>
                      </p>
                    </Col>
                  </Row>

                  {contrato.descripcion && (
                    <Row className="mt-2">
                      <Col md={12}>
                        <p><strong>Descripción:</strong></p>
                        <p className="text-muted">{contrato.descripcion}</p>
                      </Col>
                    </Row>
                  )}

                  <Row className="mt-3">
                    <Col md={6}>
                      <p><strong>Fecha de Creación:</strong> {formatDate(contrato.created_at)}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Última Actualización:</strong> {formatDate(contrato.updated_at)}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <i className="fas fa-times me-1"></i>
          Cerrar
        </Button>
        <Button variant="primary" onClick={handleEdit}>
          <i className="fas fa-edit me-1"></i>
          Editar Contrato
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ContratoDetalle;
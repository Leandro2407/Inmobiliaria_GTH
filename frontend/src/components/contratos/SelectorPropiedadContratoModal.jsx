import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Button, Table, Alert, Spinner, Form, InputGroup, Badge, Row, Col } from 'react-bootstrap';

const ZONA_CHOICES = [
  { value: '', label: 'Todas las zonas' },
  { value: 'norte', label: 'Norte' },
  { value: 'sur', label: 'Sur' },
  { value: 'micro-centro', label: 'Centro' },
  { value: 'oeste', label: 'Oeste' },
  { value: 'este', label: 'Este' },
  { value: 'macro-centro', label: 'Macro Centro' },
];

const SelectorPropiedadContratoModal = ({
  show,
  onHide,
  propiedades,
  onSeleccionarPropiedad,
  loading,
  onActualizarPropiedades,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroOperacion, setFiltroOperacion] = useState('');
  const [filtroZona, setFiltroZona] = useState('');

  useEffect(() => {
    if (show) {
      setBusqueda('');
      setFiltroOperacion('');
      setFiltroZona('');
    }
  }, [show]);

  const propiedadesFiltradas = useMemo(() => {
    if (!Array.isArray(propiedades)) return [];
    return propiedades.filter((prop) => {
      const matchBusqueda =
        busqueda === '' ||
        (prop.titulo || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (prop.direccion || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (prop.barrio || '').toLowerCase().includes(busqueda.toLowerCase());

      const matchOperacion =
        filtroOperacion === '' || prop.operacion === filtroOperacion;

      const matchZona = filtroZona === '' || prop.zona === filtroZona;

      return matchBusqueda && matchOperacion && matchZona;
    });
  }, [propiedades, busqueda, filtroOperacion, filtroZona]);

  const getBadgeOperacion = (operacion) => {
    return operacion === 'alquiler' ? 'info' : 'success';
  };

  const formatPrecio = (prop) => {
    if (prop.precio_display) return prop.precio_display;
    if (prop.operacion === 'venta' && prop.precio_venta) {
      return `${prop.moneda || 'USD'} ${Number(prop.precio_venta).toLocaleString('es-AR')}`;
    }
    if (prop.operacion === 'alquiler' && prop.precio_alquiler) {
      return `${prop.moneda || 'ARS'} ${Number(prop.precio_alquiler).toLocaleString('es-AR')}/mes`;
    }
    return 'Consultar';
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-building me-2"></i>
          Seleccione una Propiedad
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row className="mb-3 g-2">
          <Col md={5}>
            <InputGroup>
              <InputGroup.Text>
                <i className="fas fa-search"></i>
              </InputGroup.Text>
              <Form.Control
                placeholder="Buscar por título, dirección o barrio..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <Button variant="outline-secondary" onClick={() => setBusqueda('')}>
                  <i className="fas fa-times"></i>
                </Button>
              )}
            </InputGroup>
          </Col>
          <Col md={3}>
            <Form.Select
              value={filtroOperacion}
              onChange={(e) => setFiltroOperacion(e.target.value)}
            >
              <option value="">Alquiler / Venta</option>
              <option value="alquiler">Alquiler</option>
              <option value="venta">Venta</option>
            </Form.Select>
          </Col>
          <Col md={3}>
            <Form.Select
              value={filtroZona}
              onChange={(e) => setFiltroZona(e.target.value)}
            >
              {ZONA_CHOICES.map((z) => (
                <option key={z.value} value={z.value}>
                  {z.label}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={1}>
            <Button
              variant="outline-primary"
              onClick={onActualizarPropiedades}
              disabled={loading}
              className="w-100"
              title="Actualizar lista"
            >
              <i className="fas fa-sync-alt"></i>
            </Button>
          </Col>
        </Row>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 mb-0">Cargando propiedades...</p>
          </div>
        ) : !Array.isArray(propiedades) || propiedades.length === 0 ? (
          <Alert variant="warning">
            No hay propiedades disponibles en el sistema.
          </Alert>
        ) : propiedadesFiltradas.length === 0 ? (
          <Alert variant="info">
            No se encontraron propiedades con los filtros aplicados.
          </Alert>
        ) : (
          <>
            <div className="text-muted small mb-2">
              Mostrando {propiedadesFiltradas.length} de {propiedades.length} propiedades
            </div>
            <div className="table-responsive" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <Table striped hover size="sm">
                <thead className="sticky-top bg-white">
                  <tr>
                    <th>Título / Dirección</th>
                    <th>Tipo</th>
                    <th>Operación</th>
                    <th>Zona / Barrio</th>
                    <th>Precio</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {propiedadesFiltradas.map((prop) => (
                    <tr key={prop.id}>
                      <td>
                        <strong>{prop.titulo || 'Sin título'}</strong>
                        <br />
                        <small className="text-muted">{prop.direccion || 'Sin dirección'}</small>
                      </td>
                      <td>
                        <span className="text-capitalize">{prop.tipo || '-'}</span>
                      </td>
                      <td>
                        <Badge bg={getBadgeOperacion(prop.operacion)} className="text-capitalize">
                          {prop.operacion || '-'}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-capitalize">{prop.zona || '-'}</span>
                        {prop.barrio && <><br /><small className="text-muted">{prop.barrio}</small></>}
                      </td>
                      <td>
                        <strong>{formatPrecio(prop)}</strong>
                      </td>
                      <td>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onSeleccionarPropiedad(prop)}
                        >
                          <i className="fas fa-check me-1"></i>
                          Seleccionar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancelar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SelectorPropiedadContratoModal;
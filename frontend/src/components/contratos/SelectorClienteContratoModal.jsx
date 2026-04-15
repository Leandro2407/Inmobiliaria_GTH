import React from 'react';
import { Modal, Button, Table, Alert, Spinner, Badge } from 'react-bootstrap';

// Mapeo de categorías del modelo Cliente
const getCategoriaLabel = (categoria) => {
  const map = {
    'alquiler': 'Inquilino',
    'compra': 'Comprador',
    'venta': 'Venta',
    'ambas': 'Ambos (Inquilino/Comprador)',
  };
  return map[categoria] || categoria || '—';
};

const getCategoriaBadgeBg = (categoria) => {
  const colors = {
    'alquiler': 'info',
    'compra': 'primary',
    'venta': 'success',
    'ambas': 'warning',
  };
  return colors[categoria] || 'secondary';
};

const SelectorClienteContratoModal = ({
  show,
  onHide,
  clientes,
  onSeleccionarCliente,
  loading,
  onActualizarClientes,
}) => {
  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-users me-2"></i>
          Seleccionar Cliente para Contrato
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">Lista de Clientes Existentes</h6>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={onActualizarClientes}
            disabled={loading}
          >
            <i className="fas fa-sync-alt me-1"></i>
            Actualizar Lista
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2 mb-0">Cargando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <Alert variant="warning">
            No hay clientes registrados. Por favor, crea un cliente primero.
          </Alert>
        ) : (
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Categoría</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id}>
                    <td>
                      <strong>{cliente.nombre_completo}</strong>
                    </td>
                    <td>{cliente.email}</td>
                    <td>{cliente.telefono}</td>
                    <td>
                      <Badge bg={getCategoriaBadgeBg(cliente.categoria)}>
                        {getCategoriaLabel(cliente.categoria)}
                      </Badge>
                    </td>
                    <td>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onSeleccionarCliente(cliente)}
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

export default SelectorClienteContratoModal;

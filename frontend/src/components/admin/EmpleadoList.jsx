import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Spinner } from 'react-bootstrap';
import api from '../../services/api';
import { toast } from 'react-toastify';
import EmpleadoForm from './EmpleadoForm';

const EmpleadoList = () => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users/');
      const data = res.data.results || res.data;
      // Filtrar por rol agente/administrador
      const lista = (Array.isArray(data) ? data : []).filter(u => ['agente', 'administrador'].includes(u.rol));
      setEmpleados(lista);
    } catch (error) {
      console.error('Error cargando empleados', error);
      toast.error('Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este empleado?')) return;
    try {
      await api.delete(`/auth/users/${id}/`);
      toast.success('Empleado eliminado');
      cargarEmpleados();
    } catch (error) {
      console.error('Error borrando empleado', error);
      toast.error('No se pudo eliminar el empleado');
    }
  };

  const handleEdit = (empleado) => {
    setSelectedEmpleado(empleado);
    setShowEditModal(true);
  };

  const handleView = (empleado) => {
    setSelectedEmpleado(empleado);
    setShowViewModal(true);
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Empleados</h5>
          <div>
            <Button variant="outline-secondary" className="me-2" onClick={cargarEmpleados}>Refrescar</Button>
            <Button variant="dark" onClick={() => setShowCreateModal(true)}>Nuevo empleado</Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center"><Spinner animation="border" /></div>
        ) : (
          <Table hover responsive>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Activo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empleados.map(e => (
                <tr key={e.id}>
                  <td>{e.first_name} {e.last_name}</td>
                  <td>{e.email}</td>
                  <td className="text-capitalize">{e.rol}</td>
                  <td>{e.is_active ? 'Sí' : 'No'}</td>
                  <td>
                    <Button
                      variant="outline-dark"
                      size="sm"
                      className="me-1"
                      onClick={() => handleView(e)}
                      title="Ver detalles"
                    >
                      <i className="fas fa-eye"></i>
                    </Button>
                    <Button
                      variant="outline-dark"
                      size="sm"
                      className="me-1"
                      onClick={() => handleEdit(e)}
                      title="Editar"
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button
                      variant="outline-dark"
                      size="sm"
                      onClick={() => handleDelete(e.id)}
                      title="Eliminar"
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {/* Create Modal */}
        <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Nuevo Empleado</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <EmpleadoForm onCreated={() => { setShowCreateModal(false); cargarEmpleados(); }} onCancel={() => setShowCreateModal(false)} />
          </Modal.Body>
        </Modal>

        {/* Edit Modal */}
        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>Editar Empleado</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedEmpleado ? (
              <EmpleadoForm
                userId={selectedEmpleado.id}
                initialValues={{
                  email: selectedEmpleado.email,
                  username: selectedEmpleado.username,
                  first_name: selectedEmpleado.first_name,
                  last_name: selectedEmpleado.last_name,
                  telefono: selectedEmpleado.telefono || '',
                  rol: selectedEmpleado.rol,
                }}
                onCreated={() => { setShowEditModal(false); cargarEmpleados(); }}
                onCancel={() => setShowEditModal(false)}
              />
            ) : null}
          </Modal.Body>
        </Modal>

        {/* View Modal */}
        <Modal show={showViewModal} onHide={() => setShowViewModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Información del Empleado</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedEmpleado ? (
              <div>
                <p><strong>Nombre:</strong> {selectedEmpleado.first_name} {selectedEmpleado.last_name}</p>
                <p><strong>Email:</strong> {selectedEmpleado.email}</p>
                <p><strong>Usuario:</strong> {selectedEmpleado.username}</p>
                <p><strong>Rol:</strong> {selectedEmpleado.rol}</p>
                <p><strong>Activo:</strong> {selectedEmpleado.is_active ? 'Sí' : 'No'}</p>
                <p><strong>Teléfono:</strong> {selectedEmpleado.telefono || '-'}</p>
              </div>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowViewModal(false)}>Cerrar</Button>
          </Modal.Footer>
        </Modal>
      </Card.Body>
    </Card>
  );
};

export default EmpleadoList;

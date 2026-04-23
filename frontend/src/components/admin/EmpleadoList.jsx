import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Spinner, Alert } from 'react-bootstrap';
import api from '../../services/api';
import { toast } from 'react-toastify';
import EmpleadoForm from './EmpleadoForm';
import authService from '../../services/authService';

const EmpleadoList = () => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmpleado, setSelectedEmpleado] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [empleadoToDelete, setEmpleadoToDelete] = useState(null);

  const cargarEmpleados = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users/');
      const data = res.data.results || res.data;
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

  const isAdmin = authService.isAdmin();

  const canModifyEmpleado = (empleado) => {
    if (!isAdmin) return false; 
    if (empleado.rol === 'administrador') return false; 
    return true; 
  };

  const openDeleteModal = (empleado) => {
    if (!canModifyEmpleado(empleado)) {
      toast.error('No tienes permisos para eliminar este empleado');
      return;
    }
    setEmpleadoToDelete(empleado);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!empleadoToDelete) return;
    try {
      await api.delete(`/auth/users/${empleadoToDelete.id}/`);
      toast.success('Empleado eliminado');
      setShowDeleteModal(false);
      setEmpleadoToDelete(null);
      cargarEmpleados();
    } catch (error) {
      console.error('Error borrando empleado', error);
      toast.error('No se pudo eliminar el empleado');
      setShowDeleteModal(false);
      setEmpleadoToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setEmpleadoToDelete(null);
  };

  const handleEdit = (empleado) => {
    if (!canModifyEmpleado(empleado)) {
      toast.error('No tienes permisos para editar este empleado');
      return;
    }
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
          <h5 className="mb-0">
            <i className="fas fa-users me-2"></i>
            Empleados
          </h5>
          <div>
            <Button variant="outline-secondary" className="me-2" onClick={cargarEmpleados}>
              <i className="fas fa-sync me-2"></i>
              Refrescar
            </Button>
            <Button 
              variant="dark" 
              onClick={() => setShowCreateModal(true)} 
              disabled={!isAdmin}
              title={!isAdmin ? 'Se necesita ser administrador' : 'Crear nuevo empleado'}
            >
              <i className="fas fa-plus me-2"></i>
              Nuevo empleado
            </Button>
          </div>
        </div>

        {!isAdmin && (
          <Alert variant="warning" className="mb-3">
            <i className="fas fa-lock me-2"></i>
            <strong>Acceso restringido:</strong> Se necesita ser administrador para crear, editar o eliminar empleados.
          </Alert>
        )}

        {isAdmin && (
          <Alert variant="info" className="mb-3">
            <i className="fas fa-info-circle me-2"></i>
            <strong>Permisos de administrador:</strong> Podés editar y eliminar agentes.
          </Alert>
        )}

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
                      title={!canModifyEmpleado(e) ? 
                        (e.rol === 'administrador' ? 'No puedes editar otros administradores' : 'Se necesita ser administrador para editar') 
                        : 'Editar empleado'}
                      disabled={!canModifyEmpleado(e)}
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button
                      variant="outline-dark"
                      size="sm"
                      onClick={() => openDeleteModal(e)}
                      title={!canModifyEmpleado(e) ? 
                        (e.rol === 'administrador' ? 'No puedes eliminar otros administradores' : 'Se necesita ser administrador para eliminar') 
                        : 'Eliminar empleado'}
                      disabled={!canModifyEmpleado(e)}
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
                  dni: selectedEmpleado.dni || '',
                  fecha_nacimiento: selectedEmpleado.fecha_nacimiento || '',
                  barrio: selectedEmpleado.barrio || '',
                  calle: selectedEmpleado.calle || '',
                  numeracion: selectedEmpleado.numeracion || '',
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
                <p><strong>DNI:</strong> {selectedEmpleado.dni || '-'}</p>
                <p><strong>Fecha de Nacimiento:</strong> {selectedEmpleado.fecha_nacimiento ? new Date(selectedEmpleado.fecha_nacimiento).toLocaleDateString() : '-'}</p>
                <p><strong>Email:</strong> {selectedEmpleado.email}</p>
                <p><strong>Usuario:</strong> {selectedEmpleado.username}</p>
                <p><strong>Rol:</strong> {selectedEmpleado.rol}</p>
                <p><strong>Activo:</strong> {selectedEmpleado.is_active ? 'Sí' : 'No'}</p>
                <p><strong>Teléfono:</strong> {selectedEmpleado.telefono || '-'}</p>
                <p><strong>Domicilio:</strong> {selectedEmpleado.barrio || selectedEmpleado.calle ? `${selectedEmpleado.barrio || ''} - ${selectedEmpleado.calle || ''} ${selectedEmpleado.numeracion || ''}` : '-'}</p>
              </div>
            ) : null}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowViewModal(false)}>Cerrar</Button>
          </Modal.Footer>
        </Modal>

        {/* Delete Modal */}
        <Modal show={showDeleteModal} onHide={handleDeleteCancel} centered>
          <Modal.Header className="border-0 pb-0">
            <Modal.Title className="w-100 text-center">¿Está seguro que desea eliminar a este empleado?</Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center px-4">
            <p className="mb-3">Esta acción no se puede deshacer.</p>
          </Modal.Body>
          <Modal.Footer className="border-0 justify-content-center pb-4">
            <Button 
              variant="secondary" 
              onClick={handleDeleteCancel}
              style={{ backgroundColor: '#6c757d', borderColor: '#6c757d' }}
              className="px-4"
            >
              Cancelar
            </Button>
            <Button 
              variant="dark" 
              onClick={handleDeleteConfirmed}
              style={{ backgroundColor: '#000', borderColor: '#000' }}
              className="px-4"
            >
              Eliminar
            </Button>
          </Modal.Footer>
        </Modal>
      </Card.Body>
    </Card>
  );
};

export default EmpleadoList;
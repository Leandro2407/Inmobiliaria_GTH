import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Table, Form, Row, Col, Modal, Badge, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { Formik } from 'formik';
import * as Yup from 'yup';
import clienteService from '../../services/clienteService';

// --- LISTA FIJA DE CIUDADES DE SALTA ---
const SALTA_CITIES = [
  'AGUARAY', 'AGUAS BLANCAS', 'ANGASTACO', 'ANIMANÁ', 'APOLINARIO SARAVIA', 'BALLIVIAN', 
  'CACHI', 'CAFAYATE', 'CAMPO QUIJANO', 'CAMPO SANTO', 'CERRILLOS', 'CHICOANA', 
  'COLONIA SANTA ROSA', 'CORONEL MOLDES', 'EL BORDO', 'EL CARRIL', 'EL GALPÓN', 
  'EL JARDÍN', 'EL POTRERO', 'EL QUEBRACHAL', 'EL TALA', 'EMBARCACION', 'GENERAL GÜEMES', 
  'GENERAL PIZARRO', 'GUACHIPAS', 'HIPÓLITO YRIGOYEN', 'IRUYA', 'ISLA DE CAÑAS', 
  'JOAQUÍN V. GONZALEZ', 'LA CALDERA', 'LA CANDELARIA', 'LA MERCED', 'LA POMA', 
  'LA VIÑA', 'LAS LAJITAS', 'LOS TOLDOS', 'METÁN', 'MOLINOS', 'MOSCONI', 'NAZARENO', 
  'PAYOGASTA', 'PICHANAL', 'RÍO PIEDRAS', 'RIVADAVIA BANDA NORTE', 'RIVADAVIA BANDA SUR', 
  'ROSARIO DE LA FRONTERA', 'ROSARIO DE LERMA', 'SALTA', 'SALVADOR MAZZA', 
  'SAN ANTONIO DE LOS COBRES', 'SAN CARLOS', 'SAN LORENZO', 'SAN RAMÓN DE LA NUEVA ORÁN', 
  'SANTA VICTORIA ESTE', 'SANTA VICTORIA OESTE', 'SECLANTÁS', 'TARTAGAL', 
  'TOLAR GRANDE', 'URUNDEL', 'VAQUEROS' 
];

const ClientesPanel = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [clienteEditar, setClienteEditar] = useState(null);
  const [clienteVer, setClienteVer] = useState(null);
  const [filtros, setFiltros] = useState({
    search: '',
    categoria: '',
    estado: '',
  });

  const cargarClientes = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtros.search) params.search = filtros.search;
      if (filtros.categoria) params.categoria = filtros.categoria;
      if (filtros.estado) params.estado = filtros.estado;

      const data = await clienteService.getAll(params);
      setClientes(data.results || data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      toast.error('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  const validationSchema = Yup.object().shape({
    nombre: Yup.string()
      .required('El nombre es requerido')
      .min(2, 'Mínimo 2 caracteres')
      .matches(/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/, 'Solo se permiten letras'),
    apellido: Yup.string()
      .required('El apellido es requerido')
      .min(2, 'Mínimo 2 caracteres')
      .matches(/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/, 'Solo se permiten letras'),
    dni: Yup.string()
      .required('El DNI es requerido')
      .matches(/^[0-9]+$/, 'Solo se permiten números')
      .min(7, 'El DNI debe tener al menos 7 dígitos')
      .max(10, 'El DNI no puede tener más de 10 dígitos'),
    email: Yup.string()
      .email('Email inválido')
      .required('El email es requerido')
      .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Debe contener @ y un dominio válido'),
    telefono: Yup.string()
      .required('El teléfono es requerido')
      .matches(/^[0-9]+$/, 'Solo se permiten números'),
    domicilio: Yup.string().required('El domicilio es requerido'),
    ciudad: Yup.string().required('La ciudad es requerida'),
    categoria: Yup.string()
      .required('La categoría es requerida')
      .oneOf(['alquiler', 'compra'], 'Seleccione una categoría válida'),
    estado: Yup.string()
      .oneOf(['activo', 'inactivo'], 'Estado inválido')
      .required('El estado es requerido'),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (clienteEditar) {
        await clienteService.update(clienteEditar.id, values);
        toast.success('Cliente actualizado exitosamente');
      } else {
        await clienteService.create(values);
        toast.success('Cliente registrado exitosamente');
      }
      
      setShowModal(false);
      resetForm();
      setClienteEditar(null);
      cargarClientes();
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      const errorMsg = error.dni?.[0] || error.email?.[0] || 'Error al guardar el cliente';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVer = (cliente) => {
    setClienteVer(cliente);
    setShowViewModal(true);
  };

  const handleEditar = (cliente) => {
    setClienteEditar(cliente);
    setShowModal(true);
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este cliente?')) {
      try {
        await clienteService.delete(id);
        toast.success('Cliente eliminado exitosamente');
        cargarClientes();
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        toast.error('Error al eliminar el cliente');
      }
    }
  };

  const getBadgeColor = (estado) => {
    const colors = {
      activo: 'success',
      inactivo: 'secondary',
      prospecto: 'warning',
      convertido: 'primary',
    };
    return colors[estado] || 'secondary';
  };

  return (
    <div>
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">
              <i className="fas fa-users me-2"></i>
              Gestión de Clientes
            </h4>
            <Button
              variant="dark"
              onClick={() => {
                setClienteEditar(null);
                setShowModal(true);
              }}
            >
              <i className="fas fa-plus me-2"></i>
              Nuevo Cliente
            </Button>
          </div>

          {/* Filtros */}
          <Row className="mb-4">
            <Col md={4}>
              <Form.Control
                type="text"
                placeholder="Buscar por nombre, DNI, email..."
                value={filtros.search}
                onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
              />
            </Col>
            <Col md={3}>
              <Form.Select
                value={filtros.categoria}
                onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
                className="custom-select"
              >
                <option value="">Todas las categorías</option>
                <option value="alquiler">Alquiler</option>
                <option value="compra">Compra</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filtros.estado}
                onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
                className="custom-select"
              >
                <option value="">Todos los estados</option>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button
                variant="outline-secondary"
                onClick={() => setFiltros({ search: '', categoria: '', estado: '' })}
                className="w-100"
              >
                <i className="fas fa-redo me-2"></i>
                Actualizar
              </Button>
            </Col>
          </Row>

          {/* Tabla */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="dark" />
              <p className="mt-2">Cargando clientes...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Nombre Completo</th>
                    <th>DNI</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Categoría</th>
                    <th>Estado</th>
                    <th>Fecha Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clientes.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        <i className="fas fa-inbox fa-3x text-muted mb-3 d-block"></i>
                        No hay clientes registrados
                      </td>
                    </tr>
                  ) : (
                    clientes.map((cliente) => (
                      <tr key={cliente.id}>
                        <td className="fw-bold">{cliente.nombre_completo}</td>
                        <td>{cliente.dni}</td>
                        <td>{cliente.email}</td>
                        <td>{cliente.telefono}</td>
                        <td>
                          <span className="text-capitalize">{cliente.categoria}</span>
                        </td>
                        <td>
                          <Badge bg={getBadgeColor(cliente.estado)} className="text-capitalize">
                            {cliente.estado}
                          </Badge>
                        </td>
                        <td>{new Date(cliente.fecha_registro).toLocaleDateString()}</td>
                        <td>
                          <Button
                            variant="outline-info"
                            size="sm"
                            className="me-1"
                            onClick={() => handleVer(cliente)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditar(cliente)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleEliminar(cliente.id)}
                            title="Eliminar"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal de Visualización */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-user me-2"></i>
            Detalles del Cliente
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {clienteVer && (
            <div>
              <Row className="mb-4 pb-3 border-bottom">
                <Col md={12}>
                  <h5 className="text-primary mb-3">
                    <i className="fas fa-id-card me-2"></i>
                    Información Personal
                  </h5>
                </Col>
                <Col md={6} className="mb-3">
                  <p className="mb-1"><strong>Nombre Completo:</strong></p>
                  <p className="text-muted">{clienteVer.nombre_completo}</p>
                </Col>
                <Col md={6} className="mb-3">
                  <p className="mb-1"><strong>DNI:</strong></p>
                  <p className="text-muted">{clienteVer.dni}</p>
                </Col>
                <Col md={6} className="mb-3">
                  <p className="mb-1"><strong>Email:</strong></p>
                  <p className="text-muted">{clienteVer.email}</p>
                </Col>
                <Col md={6} className="mb-3">
                  <p className="mb-1"><strong>Teléfono:</strong></p>
                  <p className="text-muted">{clienteVer.telefono}</p>
                </Col>
              </Row>

              <Row className="mb-4 pb-3 border-bottom">
                <Col md={12}>
                  <h5 className="text-primary mb-3">
                    <i className="fas fa-map-marker-alt me-2"></i>
                    Ubicación
                  </h5>
                </Col>
                <Col md={12} className="mb-3">
                  <p className="mb-1"><strong>Domicilio:</strong></p>
                  <p className="text-muted">{clienteVer.domicilio}</p>
                </Col>
                <Col md={6} className="mb-3">
                  <p className="mb-1"><strong>Ciudad:</strong></p>
                  <p className="text-muted">{clienteVer.ciudad}</p>
                </Col>
                {clienteVer.codigo_postal && (
                  <Col md={6} className="mb-3">
                    <p className="mb-1"><strong>Código Postal:</strong></p>
                    <p className="text-muted">{clienteVer.codigo_postal}</p>
                  </Col>
                )}
              </Row>

              <Row className="mb-3">
                <Col md={12}>
                  <h5 className="text-primary mb-3">
                    <i className="fas fa-info-circle me-2"></i>
                    Información Adicional
                  </h5>
                </Col>
                <Col md={4} className="mb-3">
                  <p className="mb-1"><strong>Categoría:</strong></p>
                  <p className="text-muted text-capitalize">{clienteVer.categoria}</p>
                </Col>
                <Col md={4} className="mb-3">
                  <p className="mb-1"><strong>Estado:</strong></p>
                  <Badge bg={getBadgeColor(clienteVer.estado)} className="text-capitalize">
                    {clienteVer.estado}
                  </Badge>
                </Col>
                <Col md={4} className="mb-3">
                  <p className="mb-1"><strong>Fecha de Registro:</strong></p>
                  <p className="text-muted">{new Date(clienteVer.fecha_registro).toLocaleDateString()}</p>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Cerrar
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowViewModal(false);
              handleEditar(clienteVer);
            }}
          >
            <i className="fas fa-edit me-2"></i>
            Editar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Formulario */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {clienteEditar ? 'Editar Cliente' : 'Nuevo Cliente'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={{
              nombre: clienteEditar?.nombre || '',
              apellido: clienteEditar?.apellido || '',
              dni: clienteEditar?.dni || '',
              email: clienteEditar?.email || '',
              telefono: clienteEditar?.telefono || '',
              domicilio: clienteEditar?.domicilio || '',
              ciudad: clienteEditar?.ciudad || 'SALTA',
              codigo_postal: clienteEditar?.codigo_postal || '',
              categoria: clienteEditar?.categoria || '',
              estado: clienteEditar?.estado || 'activo',
              presupuesto_min: clienteEditar?.presupuesto_min || '',
              presupuesto_max: clienteEditar?.presupuesto_max || '',
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
            enableReinitialize
          >
            {({
              values,
              errors,
              touched,
              handleChange,
              handleBlur,
              handleSubmit,
              isSubmitting,
              setFieldValue,
            }) => (
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nombre *</Form.Label>
                      <Form.Control
                        type="text"
                        name="nombre"
                        value={values.nombre}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Solo permite letras y espacios
                          if (value === '' || /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]*$/.test(value)) {
                            setFieldValue('nombre', value);
                          }
                        }}
                        onBlur={handleBlur}
                        isInvalid={touched.nombre && errors.nombre}
                        placeholder="Ingrese solo letras"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.nombre}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Apellido *</Form.Label>
                      <Form.Control
                        type="text"
                        name="apellido"
                        value={values.apellido}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Solo permite letras y espacios
                          if (value === '' || /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]*$/.test(value)) {
                            setFieldValue('apellido', value);
                          }
                        }}
                        onBlur={handleBlur}
                        isInvalid={touched.apellido && errors.apellido}
                        placeholder="Ingrese solo letras"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.apellido}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>DNI *</Form.Label>
                      <Form.Control
                        type="text"
                        name="dni"
                        value={values.dni}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Solo permite números
                          if (value === '' || /^[0-9]*$/.test(value)) {
                            setFieldValue('dni', value);
                          }
                        }}
                        onBlur={handleBlur}
                        isInvalid={touched.dni && errors.dni}
                        placeholder="Ingrese solo números"
                        maxLength={10}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.dni}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Email *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.email && errors.email}
                        placeholder="ejemplo@dominio.com"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Teléfono *</Form.Label>
                      <Form.Control
                        type="tel"
                        name="telefono"
                        value={values.telefono}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Solo permite números
                          if (value === '' || /^[0-9]*$/.test(value)) {
                            setFieldValue('telefono', value);
                          }
                        }}
                        onBlur={handleBlur}
                        isInvalid={touched.telefono && errors.telefono}
                        placeholder="Ingrese solo números"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.telefono}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ciudad *</Form.Label>
                      <Form.Select
                        name="ciudad"
                        value={values.ciudad}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.ciudad && errors.ciudad}
                        className="custom-select"
                      >
                        <option value="">Seleccione Ciudad</option>
                        {SALTA_CITIES.map(city => (
                          <option key={city} value={city}>
                            {city}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.ciudad}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Domicilio *</Form.Label>
                  <Form.Control
                    type="text"
                    name="domicilio"
                    value={values.domicilio}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.domicilio && errors.domicilio}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.domicilio}
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Categoría *</Form.Label>
                      <Form.Select
                        name="categoria"
                        value={values.categoria}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.categoria && errors.categoria}
                        className="custom-select"
                      >
                        <option value="">Seleccione...</option>
                        <option value="alquiler">Alquiler</option>
                        <option value="compra">Compra</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.categoria}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Estado *</Form.Label>
                      <Form.Select
                        name="estado"
                        value={values.estado}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.estado && errors.estado}
                        disabled={!clienteEditar}
                        className="custom-select"
                      >
                        <option value="activo">Activo</option>
                        {clienteEditar && <option value="inactivo">Inactivo</option>}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.estado}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="dark"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Guardar
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </Modal.Body>
      </Modal>

      {/* Estilos CSS para cambiar el color al pasar el cursor */}
      <style>
        {`
          .custom-select option:hover {
            background-color: black !important;
            color: white !important;
          }
          .custom-select option:checked {
            background-color: #f8f9fa !important;
            color: black !important;
          }
        `}
      </style>
    </div>
  );
};

export default ClientesPanel;
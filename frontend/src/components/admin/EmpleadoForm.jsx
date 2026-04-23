import React from 'react';
import { Card, Form, Button, Row, Col } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import api from '../../services/api';
import { toast } from 'react-toastify';

const EmpleadoForm = ({ onCreated, initialValues: initialPropValues, userId, onCancel }) => {
  const defaultValues = {
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    telefono: '',
    dni: '',
    fecha_nacimiento: '',
    barrio: '',
    calle: '',
    numeracion: '',
    rol: 'agente',
    password: '',
    password2: '',
  };

  const initialValues = initialPropValues || defaultValues;

  const validationSchema = Yup.object().shape({
    email: Yup.string().email('Email inválido').required('Requerido'),
    username: Yup.string().required('Requerido'),
    first_name: Yup.string().required('Requerido'),
    last_name: Yup.string().required('Requerido'),
    telefono: Yup.string().matches(/^\d+$/, 'Solo números').notRequired(),
    dni: Yup.string().matches(/^\d+$/, 'Solo números').required('Requerido'),
    fecha_nacimiento: Yup.date().required('Requerido'),
    barrio: Yup.string().required('Requerido'),
    calle: Yup.string().required('Requerido'),
    numeracion: Yup.string().matches(/^\d+$/, 'Solo números').required('Requerido'),
    rol: Yup.string().oneOf(['agente', 'administrador']).required('Requerido'),
    password: userId ? Yup.string().min(8, 'Mínimo 8 caracteres').notRequired() : Yup.string().min(8, 'Mínimo 8 caracteres').required('Requerido'),
    password2: userId ? Yup.string().oneOf([Yup.ref('password'), null], 'Las contraseñas no coinciden').notRequired() : Yup.string().oneOf([Yup.ref('password'), null], 'Las contraseñas no coinciden').required('Requerido'),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (userId) {
        await api.patch(`/auth/users/${userId}/`, values);
        toast.success('Empleado actualizado correctamente');
        if (onCreated) onCreated();
      } else {
        await api.post('/auth/empleados/', values);
        toast.success('Empleado creado correctamente');
        resetForm();
        if (onCreated) onCreated();
      }
    } catch (error) {
      console.error('Error creando/actualizando empleado:', error?.response?.data ? JSON.stringify(error.response.data, null, 2) : error);
      const data = error.response?.data;
      let msg = userId ? 'Error al actualizar empleado' : 'Error al crear empleado';

      if (data) {
        if (typeof data === 'string') {
          msg = data;
        } else if (typeof data === 'object') {
          msg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('; ') : v}`).join(' | ');
        }
      }

      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm border-0">
      <Card.Body>
        <h5>{userId ? 'Editar Empleado' : 'Agregar Nuevo Empleado'}</h5>
        <p className="text-muted">{userId ? 'Edita los datos del empleado. Dejar contraseña en blanco mantiene la actual.' : "Crea un agente o administrador desde aquí. Solo usuarios con rol 'administrador' pueden acceder."}</p>

        <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={handleSubmit} enableReinitialize>
          {({ handleSubmit, handleChange, values, errors, touched, isSubmitting }) => (
            <Form noValidate onSubmit={handleSubmit}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Email *</Form.Label>
                    <Form.Control type="email" name="email" value={values.email} onChange={handleChange} isInvalid={touched.email && errors.email} />
                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Usuario (username) *</Form.Label>
                    <Form.Control name="username" value={values.username} onChange={handleChange} isInvalid={touched.username && errors.username} />
                    <Form.Control.Feedback type="invalid">{errors.username}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Nombre *</Form.Label>
                    <Form.Control name="first_name" value={values.first_name} onChange={handleChange} isInvalid={touched.first_name && errors.first_name} />
                    <Form.Control.Feedback type="invalid">{errors.first_name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Apellido *</Form.Label>
                    <Form.Control name="last_name" value={values.last_name} onChange={handleChange} isInvalid={touched.last_name && errors.last_name} />
                    <Form.Control.Feedback type="invalid">{errors.last_name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>DNI *</Form.Label>
                    <Form.Control name="dni" value={values.dni} onChange={handleChange} isInvalid={touched.dni && errors.dni} placeholder="Solo números" />
                    <Form.Control.Feedback type="invalid">{errors.dni}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Fecha de Nacimiento *</Form.Label>
                    <Form.Control type="date" name="fecha_nacimiento" value={values.fecha_nacimiento} onChange={handleChange} isInvalid={touched.fecha_nacimiento && errors.fecha_nacimiento} />
                    <Form.Control.Feedback type="invalid">{errors.fecha_nacimiento}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Teléfono</Form.Label>
                    <Form.Control name="telefono" value={values.telefono} onChange={handleChange} isInvalid={touched.telefono && errors.telefono} placeholder="Solo números" />
                    <Form.Control.Feedback type="invalid">{errors.telefono}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <h6 className="mt-2 mb-3 text-muted">Domicilio</h6>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Barrio *</Form.Label>
                    <Form.Control name="barrio" value={values.barrio} onChange={handleChange} isInvalid={touched.barrio && errors.barrio} />
                    <Form.Control.Feedback type="invalid">{errors.barrio}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={5}>
                  <Form.Group className="mb-3">
                    <Form.Label>Calle *</Form.Label>
                    <Form.Control name="calle" value={values.calle} onChange={handleChange} isInvalid={touched.calle && errors.calle} />
                    <Form.Control.Feedback type="invalid">{errors.calle}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Numeración *</Form.Label>
                    <Form.Control name="numeracion" value={values.numeracion} onChange={handleChange} isInvalid={touched.numeracion && errors.numeracion} placeholder="Números" />
                    <Form.Control.Feedback type="invalid">{errors.numeracion}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <hr />

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Rol *</Form.Label>
                    <Form.Select name="rol" value={values.rol} onChange={handleChange} isInvalid={touched.rol && errors.rol}>
                      <option value="agente">Agente</option>
                      <option value="administrador">Administrador</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.rol}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Contraseña {userId ? '' : '*'}</Form.Label>
                    {userId ? (
                      <div>
                        <Form.Control value={'********'} readOnly disabled />
                        <Form.Text className="text-muted">La contraseña no puede editarse aquí.</Form.Text>
                      </div>
                    ) : (
                      <>
                        <Form.Control type="password" name="password" value={values.password} onChange={handleChange} isInvalid={touched.password && errors.password} />
                        <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                      </>
                    )}
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                { !userId && (
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Confirmar Contraseña *</Form.Label>
                      <Form.Control type="password" name="password2" value={values.password2} onChange={handleChange} isInvalid={touched.password2 && errors.password2} />
                      <Form.Control.Feedback type="invalid">{errors.password2}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                )}
              </Row>

              <div className="d-flex justify-content-end mt-3">
                <Button variant="outline-secondary" className="me-2" onClick={() => { if (onCancel) onCancel(); else if (onCreated) onCreated(); }}>Cancelar</Button>
                <Button variant="dark" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : (userId ? 'Guardar cambios' : 'Crear Empleado')}</Button>
              </div>
            </Form>
          )}
        </Formik>
      </Card.Body>
    </Card>
  );
};

export default EmpleadoForm;
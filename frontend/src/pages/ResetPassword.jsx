import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Form, Button, Spinner, Card, InputGroup } from 'react-bootstrap';
import authService from '../services/authService';
import { toast } from 'react-toastify';
import '../styles/AuthModal.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  // Estados para controlar la visibilidad de las contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  useEffect(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }, []);

  const validationSchema = Yup.object().shape({
    newPassword: Yup.string()
      .required('La contraseña es requerida')
      .min(8, 'Mínimo 8 caracteres')
      .matches(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .matches(/[a-z]/, 'Debe contener al menos una minúscula')
      .matches(/\d/, 'Debe contener al menos un número'),
    newPassword2: Yup.string()
      .required('Confirme la contraseña')
      .oneOf([Yup.ref('newPassword'), null], 'Las contraseñas no coinciden'),
  });

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await authService.confirmPasswordReset(token, values.newPassword, values.newPassword2);
      toast.success('Contraseña cambiada con éxito. Ingresa con tu nueva contraseña.');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      let errorMessage = 'Ha ocurrido un error al cambiar la contraseña.';
      if (error?.detail) errorMessage = error.detail;
      else if (typeof error === 'object') {
        const val = Object.values(error)[0];
        errorMessage = Array.isArray(val) ? val[0] : val;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <h2 className="mb-4 text-center">Cambiar contraseña</h2>

              <Formik
                initialValues={{ newPassword: '', newPassword2: '' }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >{
                ({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleBlur,
                  handleSubmit,
                  isSubmitting,
                }) => (
                  <Form onSubmit={handleSubmit} noValidate>
                    <Form.Group className="mb-3">
                      <Form.Label>Nueva contraseña</Form.Label>
                      <InputGroup hasValidation>
                        <Form.Control
                          type={showPassword ? "text" : "password"}
                          name="newPassword"
                          placeholder="Ingresa la nueva contraseña"
                          value={values.newPassword}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.newPassword && !!errors.newPassword}
                        />
                        <Button 
                          variant="outline-secondary" 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ borderColor: touched.newPassword && !!errors.newPassword ? '#dc3545' : '#ced4da' }}
                        >
                          <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                        </Button>
                        <Form.Control.Feedback type="invalid">
                          {errors.newPassword}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Confirmar contraseña</Form.Label>
                      <InputGroup hasValidation>
                        <Form.Control
                          type={showPasswordConfirm ? "text" : "password"}
                          name="newPassword2"
                          placeholder="Repite la contraseña"
                          value={values.newPassword2}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.newPassword2 && !!errors.newPassword2}
                        />
                        <Button 
                          variant="outline-secondary" 
                          type="button"
                          onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                          style={{ borderColor: touched.newPassword2 && !!errors.newPassword2 ? '#dc3545' : '#ced4da' }}
                        >
                          <i className={showPasswordConfirm ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                        </Button>
                        <Form.Control.Feedback type="invalid">
                          {errors.newPassword2}
                        </Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>

                    <div className="mb-3">
                      <ul className="ps-3 mb-0" style={{ fontSize: '0.95rem' }}>
                        <li className={values.newPassword.length >= 8 ? 'text-success' : 'text-muted'}>
                          8 caracteres como mínimo
                        </li>
                        <li className={/[A-Z]/.test(values.newPassword) ? 'text-success' : 'text-muted'}>
                          Al menos una mayúscula
                        </li>
                        <li className={/[a-z]/.test(values.newPassword) ? 'text-success' : 'text-muted'}>
                          Al menos una minúscula
                        </li>
                        <li className={/\d/.test(values.newPassword) ? 'text-success' : 'text-muted'}>
                          Al menos un número
                        </li>
                      </ul>
                    </div>

                    <Button type="submit" className="w-100" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><Spinner animation="border" size="sm" className="me-2" />Guardando...</>
                      ) : (
                        'Guardar'
                      )}
                    </Button>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

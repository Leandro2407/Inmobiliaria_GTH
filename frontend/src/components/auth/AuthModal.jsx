import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { login, register, clearError } from '../../store/slices/authSlice';
import authService from '../../services/authService';
import { toast } from 'react-toastify';
import '../../styles/AuthModal.css';

const AuthModal = ({ show, onHide }) => {
  const [mode, setMode] = useState('login'); // 'login', 'register', 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [allPasswordRequirementsMet, setAllPasswordRequirementsMet] = useState(false);
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!show) {
      setMode('login');
      setShowPassword(false);
      dispatch(clearError());
    }
  }, [show, dispatch]);

  // Validación Login
  const loginSchema = Yup.object().shape({
    email: Yup.string()
      .required('Ingrese su usuario o correo electrónico'),
    password: Yup.string()
      .required('La contraseña es requerida'),
  });

  // Validación Registro
  const registerSchema = Yup.object().shape({
    first_name: Yup.string()
      .required('Nombre requerido')
      .min(2, 'Mínimo 2 caracteres'),
    last_name: Yup.string()
      .required('Apellido requerido')
      .min(2, 'Mínimo 2 caracteres'),
    email: Yup.string()
      .email('Correo inválido')
      .required('Correo requerido'),
    username: Yup.string()
      .required('Usuario requerido')
      .min(3, 'Mínimo 3 caracteres')
      .matches(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guiones'),
    password: Yup.string()
      .required('Contraseña requerida')
      .min(8, 'Mínimo 8 caracteres')
      .matches(/[A-Z]/, 'Una mayúscula')
      .matches(/[a-z]/, 'Una minúscula')
      .matches(/\d/, 'Un número'),
    password2: Yup.string()
      .required('Confirme la contraseña')
      .oneOf([Yup.ref('password'), null], 'Las contraseñas no coinciden'),
    acceptTerms: Yup.boolean()
      .oneOf([true], 'Debe aceptar los términos'),
  });

  // Validación Olvidé Contraseña
  const forgotSchema = Yup.object().shape({
    email: Yup.string()
      .email('Correo inválido')
      .required('El correo es requerido'),
  });

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (mode === 'login') {
        await dispatch(login(values)).unwrap();
        toast.success('¡Bienvenido de nuevo!');
        onHide();
      } else if (mode === 'register') {
        // Extraemos acceptTerms para no enviarlo al backend
        const { acceptTerms, ...dataToSend } = values; 
        
        await dispatch(register(dataToSend)).unwrap();
        toast.success('¡Registro exitoso!');
        onHide();
      } else if (mode === 'forgot') {
        await authService.requestPasswordReset(values.email);
        toast.success('Se han enviado las instrucciones a tu correo.');
        setMode('login');
      }
      resetForm();
    } catch (err) {
      console.error('Error:', err);
      let errorMessage = 'Ha ocurrido un error.';
      if (err?.detail) errorMessage = err.detail;
      else if (typeof err === 'object') {
          const val = Object.values(err)[0];
          errorMessage = Array.isArray(val) ? val[0] : val;
      } else if (typeof err === 'string') {
          errorMessage = err;
      }
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    dispatch(clearError());
    onHide();
  };

  const PasswordRequirement = ({ isValid, text }) => (
    <div className={`password-requirement ${isValid ? 'valid' : 'invalid'}`}>
      <i className={`fas fa-${isValid ? 'check-circle' : 'circle'} me-2`}></i>
      {text}
    </div>
  );

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      centered 
      size="lg" 
      className="auth-modal"
      backdrop="static"
    >
      <div className="auth-modal-content">
        <button className="auth-modal-close" onClick={handleClose}>
          <i className="fas fa-times"></i>
        </button>

        <div className="auth-modal-left">
          <div className="auth-left-content">
            <img src="/logo-gth.jpg" alt="GTH" className="auth-logo" />
            <p className="auth-welcome-text">
              {mode === 'register' 
                ? 'Únete a la comunidad GTH' 
                : mode === 'forgot'
                ? 'Recupera tu cuenta'
                : 'Sabemos dónde querés vivir'}
            </p>
          </div>
        </div>

        <div className="auth-modal-right">
          <div className="auth-form-container">
            
            {mode === 'forgot' && (
              <button className="back-btn" onClick={() => setMode('login')}>
                <i className="fas fa-arrow-left me-2"></i> Volver
              </button>
            )}

            <h3 className="auth-form-title">
              {mode === 'login' && 'Acceder'}
              {mode === 'register' && 'Crear Cuenta'}
              {mode === 'forgot' && 'Recuperar Contraseña'}
            </h3>

            <Formik
              initialValues={
                mode === 'login'
                  ? { email: '', password: '', rememberMe: false }
                  : mode === 'register'
                  ? { first_name: '', last_name: '', email: '', username: '', password: '', password2: '', acceptTerms: false, rol: 'cliente' }
                  : { email: '' }
              }
              validationSchema={
                mode === 'login' ? loginSchema : 
                mode === 'register' ? registerSchema : 
                forgotSchema
              }
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
              }) => {
                // Verificar si todos los requisitos de contraseña se cumplen
                if (mode === 'register' && values.password) {
                  const allMet = 
                    values.password.length >= 8 &&
                    /[A-Z]/.test(values.password) &&
                    /[a-z]/.test(values.password) &&
                    /\d/.test(values.password);
                  
                  if (allMet !== allPasswordRequirementsMet) {
                    setAllPasswordRequirementsMet(allMet);
                  }
                }

                return (
                <Form onSubmit={handleSubmit} noValidate>
                  
                  {/* --- VISTA LOGIN --- */}
                  {mode === 'login' && (
                    <>
                      <Form.Group className="auth-input-group">
                        <div className={`input-with-icon ${touched.email && errors.email ? 'is-invalid' : ''}`}>
                          <div className="input-icon-box"><i className="fas fa-user"></i></div>
                          <Form.Control
                            type="text"
                            name="email"
                            placeholder="Usuario o Correo electrónico"
                            value={values.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className="auth-input"
                          />
                        </div>
                        {touched.email && errors.email && <div className="error-message">{errors.email}</div>}
                      </Form.Group>

                      <Form.Group className="auth-input-group">
                        <div className={`input-with-icon ${touched.password && errors.password ? 'is-invalid' : ''}`}>
                          <div className="input-icon-box"><i className="fas fa-lock"></i></div>
                          <Form.Control
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Contraseña"
                            value={values.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className="auth-input"
                          />
                          <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                          </div>
                        </div>
                        {touched.password && errors.password && <div className="error-message">{errors.password}</div>}
                      </Form.Group>

                      <div className="auth-options">
                        <Form.Check
                          type="checkbox"
                          name="rememberMe"
                          label="Recordar"
                          checked={values.rememberMe}
                          onChange={handleChange}
                          id="remember-me"
                        />
                        <a 
                          href="#!" 
                          className="forgot-password-link"
                          onClick={(e) => {
                            e.preventDefault();
                            setMode('forgot');
                          }}
                        >
                          ¿Olvidaste tu contraseña?
                        </a>
                      </div>
                    </>
                  )}

                  {/* --- VISTA REGISTRO --- */}
                  {mode === 'register' && (
                    <>
                      <div className="row g-2">
                        <div className="col-6">
                          <Form.Group className="auth-input-group">
                            <div className={`input-with-icon ${touched.first_name && errors.first_name ? 'is-invalid' : ''}`}>
                              <div className="input-icon-box"><i className="fas fa-user"></i></div>
                              <Form.Control
                                type="text"
                                name="first_name"
                                placeholder="Nombre"
                                value={values.first_name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className="auth-input"
                              />
                            </div>
                            {touched.first_name && errors.first_name && <div className="error-message">{errors.first_name}</div>}
                          </Form.Group>
                        </div>
                        <div className="col-6">
                          <Form.Group className="auth-input-group">
                            <div className={`input-with-icon ${touched.last_name && errors.last_name ? 'is-invalid' : ''}`}>
                              <div className="input-icon-box"><i className="fas fa-user"></i></div>
                              <Form.Control
                                type="text"
                                name="last_name"
                                placeholder="Apellido"
                                value={values.last_name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className="auth-input"
                              />
                            </div>
                            {touched.last_name && errors.last_name && <div className="error-message">{errors.last_name}</div>}
                          </Form.Group>
                        </div>
                      </div>

                      <Form.Group className="auth-input-group">
                        <div className={`input-with-icon ${touched.email && errors.email ? 'is-invalid' : ''}`}>
                          <div className="input-icon-box"><i className="fas fa-envelope"></i></div>
                          <Form.Control
                            type="email"
                            name="email"
                            placeholder="Correo Electrónico"
                            value={values.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className="auth-input"
                          />
                        </div>
                        {touched.email && errors.email && <div className="error-message">{errors.email}</div>}
                      </Form.Group>

                      <Form.Group className="auth-input-group">
                        <div className={`input-with-icon ${touched.username && errors.username ? 'is-invalid' : ''}`}>
                          <div className="input-icon-box"><i className="fas fa-user"></i></div>
                          <Form.Control
                            type="text"
                            name="username"
                            placeholder="Nombre de Usuario"
                            value={values.username}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            className="auth-input"
                          />
                        </div>
                        {touched.username && errors.username && <div className="error-message">{errors.username}</div>}
                      </Form.Group>

                      <div className="row g-2">
                        <div className="col-6">
                          <Form.Group className="auth-input-group">
                            <div className={`input-with-icon ${touched.password && errors.password ? 'is-invalid' : ''}`}>
                              <div className="input-icon-box"><i className="fas fa-lock"></i></div>
                              <Form.Control
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                placeholder="Contraseña"
                                value={values.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className="auth-input"
                              />
                            </div>
                          </Form.Group>
                        </div>
                        <div className="col-6">
                          <Form.Group className="auth-input-group">
                            <div className={`input-with-icon ${touched.password2 && errors.password2 ? 'is-invalid' : ''}`}>
                              <div className="input-icon-box"><i className="fas fa-lock"></i></div>
                              <Form.Control
                                type="password"
                                name="password2"
                                placeholder="Confirmar"
                                value={values.password2}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                className="auth-input"
                              />
                            </div>
                          </Form.Group>
                        </div>
                      </div>
                      
                      {/* Mostrar errores de contraseñas */}
                      {touched.password && errors.password && <div className="error-message mb-2">{errors.password}</div>}
                      {touched.password2 && errors.password2 && <div className="error-message mb-2">{errors.password2}</div>}

                      {/* Requisitos visuales de contraseña (solo si no se cumplen todos) */}
                      {values.password && !allPasswordRequirementsMet && (
                        <div className="password-requirements mb-3">
                           <PasswordRequirement isValid={values.password.length >= 8} text="8 caracteres como mínimo" />
                           <PasswordRequirement isValid={/[A-Z]/.test(values.password)} text="Una Mayúscula" />
                           <PasswordRequirement isValid={/[a-z]/.test(values.password)} text="Una Minúscula" />
                           <PasswordRequirement isValid={/\d/.test(values.password)} text="Un Número" />
                        </div>
                      )}

                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          name="acceptTerms"
                          label={<span style={{fontSize: '10px'}}>Acepto los Términos y Condiciones</span>}
                          checked={values.acceptTerms}
                          onChange={handleChange}
                          id="accept-terms"
                        />
                        {touched.acceptTerms && errors.acceptTerms && <div className="error-message">{errors.acceptTerms}</div>}
                      </Form.Group>
                    </>
                  )}

                  {/* --- VISTA OLVIDÉ CONTRASEÑA --- */}
                  {mode === 'forgot' && (
                    <Form.Group className="auth-input-group mb-4">
                      <p className="text-muted mb-3" style={{fontSize: '14px'}}>
                        Ingresa tu correo y te enviaremos instrucciones.
                      </p>
                      <div className={`input-with-icon ${touched.email && errors.email ? 'is-invalid' : ''}`}>
                        <div className="input-icon-box"><i className="fas fa-envelope"></i></div>
                        <Form.Control
                          type="email"
                          name="email"
                          placeholder="Correo Electrónico"
                          value={values.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="auth-input"
                        />
                      </div>
                      {touched.email && errors.email && <div className="error-message">{errors.email}</div>}
                    </Form.Group>
                  )}

                  {/* BOTÓN SUBMIT */}
                  <Button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={isSubmitting || loading}
                  >
                    {(isSubmitting || loading) ? (
                      <Spinner animation="border" size="sm" className="me-2" />
                    ) : (
                      mode === 'login' ? 'Ingresar' : 
                      mode === 'register' ? 'Registrarse' : 
                      'Enviar Enlace'
                    )}
                  </Button>

                  {/* TOGGLE FOOTER */}
                  {mode !== 'forgot' && (
                    <div className="auth-toggle">
                      <span className="auth-toggle-text">
                        {mode === 'login' ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? '}
                      </span>
                      <a
                        href="#!"
                        className="auth-toggle-link"
                        onClick={(e) => {
                          e.preventDefault();
                          setMode(mode === 'login' ? 'register' : 'login');
                        }}
                      >
                        {mode === 'login' ? 'Regístrate Aquí' : 'Inicia Sesión'}
                      </a>
                    </div>
                  )}
                </Form>
              )}}
            </Formik>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AuthModal;
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Image, Badge, Tab, Tabs, Alert } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import solicitudVisitaService from '../services/solicitudVisitaService';
import { BACKEND_URL } from '../services/api';
import { setUser } from '../store/slices/authSlice';
import '../styles/Perfil.css';

const DefaultAvatar = ({ themeColors }) => (
  <div
    className="d-flex align-items-center justify-content-center mb-3 rounded-circle"
    style={{
      width: '150px',
      height: '150px',
      margin: '0 auto',
      background: `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
      border: `4px solid ${themeColors.highlight}`,
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      transition: 'all 0.3s ease',
    }}
    onMouseEnter={(e) => {
      const el = e.currentTarget;
      el.style.transform = 'scale(1.05)';
      el.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
    }}
    onMouseLeave={(e) => {
      const el = e.currentTarget;
      el.style.transform = 'scale(1)';
      el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    }}
  >
    <i className="fas fa-user text-white" style={{ fontSize: '4rem' }}></i>
  </div>
);

const ModalCancelar = ({ modalCancelar, onCerrar, onConfirmar, onEjecutar, onAtras, onMotivoChange }) => {
  if (!modalCancelar.visible) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(2px)',
        animation: 'fadeInOverlay 0.2s ease',
      }}
      onClick={onCerrar}
    >
      <div
        style={{
          background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '440px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)', overflow: 'hidden',
          animation: 'slideUpModal 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ background: 'linear-gradient(90deg, #2c3e50 0%, #34495e 100%)', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-calendar-times" style={{ color: '#fff', fontSize: '1rem' }}></i>
            </div>
            <span style={{ color: '#fff', fontWeight: '600', fontSize: '1.05rem' }}>Cancelar Solicitud</span>
          </div>
          <button onClick={onCerrar} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '1.3rem', cursor: 'pointer', lineHeight: 1, padding: '0 4px' }}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div style={{ padding: '1.75rem 1.5rem' }}>
          {modalCancelar.paso === 1 ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f8f9fa', border: '2px solid #e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <i className="fas fa-exclamation-triangle" style={{ fontSize: '1.75rem', color: '#2c3e50' }}></i>
                </div>
                <p style={{ color: '#2c3e50', fontWeight: '600', fontSize: '1rem', marginBottom: '0.4rem' }}>¿Estás seguro?</p>
                <p style={{ color: '#6c757d', fontSize: '0.9rem', margin: 0 }}>¿Deseas cancelar esta solicitud de visita? Esta acción no se puede deshacer.</p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button onClick={onCerrar} style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', border: '2px solid #2c3e50', background: '#fff', color: '#2c3e50', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8f9fa'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                  <i className="fas fa-arrow-left me-2"></i>Volver
                </button>
                <button onClick={onConfirmar} style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(90deg, #2c3e50 0%, #34495e 100%)', color: '#fff', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                  <i className="fas fa-check me-2"></i>Continuar
                </button>
              </div>
            </>
          ) : (
            <>
              <p style={{ color: '#2c3e50', fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                <i className="fas fa-comment-alt me-2" style={{ color: '#6c757d' }}></i>Motivo de la cancelación <span style={{ color: '#6c757d', fontWeight: '400' }}>(opcional)</span>
              </p>
              <textarea
                value={modalCancelar.motivo}
                onChange={(e) => onMotivoChange(e.target.value)}
                placeholder="Ej: Ya no puedo asistir en esa fecha..."
                rows={4}
                style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: '2px solid #e9ecef', fontSize: '0.9rem', color: '#2c3e50', resize: 'none', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                onFocus={e => { e.currentTarget.style.borderColor = '#2c3e50'; }}
                onBlur={e => { e.currentTarget.style.borderColor = '#e9ecef'; }}
              />
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button onClick={onAtras} style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', border: '2px solid #2c3e50', background: '#fff', color: '#2c3e50', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8f9fa'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}>
                  <i className="fas fa-arrow-left me-2"></i>Atrás
                </button>
                <button onClick={onEjecutar} style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', border: 'none', background: 'linear-gradient(90deg, #2c3e50 0%, #34495e 100%)', color: '#fff', fontWeight: '600', fontSize: '0.95rem', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
                  <i className="fas fa-ban me-2"></i>Cancelar Solicitud
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUpModal { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

const Perfil = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [activeTab, setActiveTab] = useState('perfil');

  // Modal de cancelación personalizado
  const [modalCancelar, setModalCancelar] = useState({ visible: false, solicitudId: null, paso: 1, motivo: '' });

  const isEmpleado = user?.rol === 'agente' || user?.rol === 'administrador';

  const themeColors = {
    primary: '#2c3e50',
    secondary: '#34495e',
    accent: '#e74c3c',
    success: '#27ae60',
    light: '#ecf0f1',
    dark: '#2c3e50',
    highlight: '#3498db',
  };

  useEffect(() => {
    if (user?.foto_perfil) {
      const imageUrl = user.foto_perfil.startsWith('http') 
        ? user.foto_perfil 
        : `${BACKEND_URL}${user.foto_perfil}`;
      setPreviewImage(imageUrl);
      setImageError(false);
    }

    if (user?.rol === 'cliente') {
      cargarSolicitudes();
    }
  }, [user]);

  const cargarSolicitudes = async () => {
    try {
      setLoadingSolicitudes(true);
      const data = await solicitudVisitaService.getMisSolicitudes();
      setSolicitudes(data);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);
      toast.error('Error al cargar las solicitudes de visita');
    } finally {
      setLoadingSolicitudes(false);
    }
  };

  const handleCancelarSolicitud = (solicitudId) => {
    setModalCancelar({ visible: true, solicitudId, paso: 1, motivo: '' });
  };

  const handleConfirmarCancelacion = () => {
    setModalCancelar((prev) => ({ ...prev, paso: 2 }));
  };

  const handleEjecutarCancelacion = async () => {
    try {
      await solicitudVisitaService.cancelar(modalCancelar.solicitudId, modalCancelar.motivo.trim());
      toast.success('Solicitud cancelada exitosamente');
      setModalCancelar({ visible: false, solicitudId: null, paso: 1, motivo: '' });
      cargarSolicitudes();
    } catch (error) {
      console.error('Error al cancelar solicitud:', error);
      toast.error(error.error || 'Error al cancelar la solicitud');
    }
  };

  const handleCerrarModal = () => {
    setModalCancelar({ visible: false, solicitudId: null, paso: 1, motivo: '' });
  };

  const getEstadoBadgeVariant = (estado) => {
    switch (estado) {
      case 'pendiente': return 'warning';
      case 'aprobada': return 'success';
      case 'rechazada': return 'danger';
      case 'cancelada': return 'secondary';
      default: return 'light';
    }
  };

  const getEstadoText = (estado) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'aprobada': return 'Aprobada';
      case 'rechazada': return 'Rechazada';
      case 'cancelada': return 'Cancelada';
      default: return estado;
    }
  };

  const handleImageError = () => {
    setImageError(true);
    setPreviewImage(null);
    toast.error('Error al cargar la imagen. Se mostrará el avatar por defecto.');
  };

  const empleadoSchema = Yup.object().shape({
    first_name: Yup.string()
      .required('El nombre es requerido')
      .min(2, 'Mínimo 2 caracteres')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
    last_name: Yup.string()
      .required('El apellido es requerido')
      .min(2, 'Mínimo 2 caracteres')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras y espacios'),
    email: Yup.string()
      .email('Correo electrónico inválido')
      .required('El correo electrónico es requerido'),
    telefono: Yup.string()
      .matches(/^\d+$/, 'El teléfono solo puede contener números')
      .min(8, 'Mínimo 8 caracteres')
      .max(20, 'Máximo 20 caracteres'),
    dni: Yup.string()
      .required('El DNI es requerido')
      .matches(/^\d+$/, 'El DNI solo puede contener números')
      .min(7, 'Mínimo 7 dígitos')
      .max(15, 'Máximo 15 dígitos'),
    fecha_nacimiento: Yup.date()
      .required('La fecha de nacimiento es requerida')
      .max(new Date(), 'La fecha no puede ser futura'),
    barrio: Yup.string()
      .required('El barrio es requerido')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\d]+$/, 'El barrio solo puede contener letras, números y espacios'),
    calle: Yup.string()
      .required('La calle es requerida')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s\d]+$/, 'La calle solo puede contener letras, números y espacios'),
    numeracion: Yup.string()
      .required('La numeración es requerida')
      .matches(/^[\d]+$/, 'La numeración solo puede contener números'),
  });

  const clienteSchema = Yup.object().shape({
    first_name: Yup.string()
      .required('El nombre es requerido')
      .min(2, 'Mínimo 2 caracteres')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
    last_name: Yup.string()
      .required('El apellido es requerido')
      .min(2, 'Mínimo 2 caracteres')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El apellido solo puede contener letras y espacios'),
    email: Yup.string()
      .email('Correo electrónico inválido')
      .required('El correo electrónico es requerido'),
    telefono: Yup.string()
      .matches(/^\d+$/, 'El teléfono solo puede contener números')
      .min(8, 'Mínimo 8 caracteres')
      .max(20, 'Máximo 20 caracteres'),
  });

  const empleadoInitialValues = {
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    dni: user?.dni || '',
    fecha_nacimiento: user?.fecha_nacimiento || '',
    barrio: user?.barrio || '',
    calle: user?.calle || '',
    numeracion: user?.numeracion || '',
  };

  const clienteInitialValues = {
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
  };

  const handleImageChange = (event) => {
    const file = event.currentTarget.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecciona un archivo de imagen válido (JPEG, PNG, etc.)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 5MB');
        return;
      }

      setSelectedFile(file);
      setImageError(false);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.onerror = () => {
        toast.error('Error al procesar la imagen');
        setImageError(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatPhoneNumber = (value) => {
    return value.replace(/\D/g, ''); // Solo deja números
  };

  const validateOnlyLetters = (value) => {
    return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  };

  const validateOnlyNumbers = (value) => {
    return value.replace(/\D/g, '');
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setLoading(true);
      const formData = new FormData();
      
      Object.keys(values).forEach(key => {
        if (values[key] && key !== 'foto_perfil') {
          formData.append(key, values[key]);
        }
      });
      
      if (selectedFile && !imageError) {
        formData.append('foto_perfil', selectedFile);
      }

      const response = await authService.updateProfile(formData);
      dispatch(setUser(response));
      setSelectedFile(null);
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.foto_perfil?.[0] ||
                          'Error al actualizar el perfil';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem', borderWidth: '0.3em' }} />
        <p className="mt-3" style={{ color: themeColors.primary, fontWeight: '500' }}>Cargando perfil...</p>
      </Container>
    );
  }

  return (
    <>
    <ModalCancelar
      modalCancelar={modalCancelar}
      onCerrar={handleCerrarModal}
      onConfirmar={handleConfirmarCancelacion}
      onEjecutar={handleEjecutarCancelacion}
      onAtras={() => setModalCancelar((prev) => ({ ...prev, paso: 1 }))}
      onMotivoChange={(motivo) => setModalCancelar((prev) => ({ ...prev, motivo }))}
    />
    <Container className="mt-5 mb-5" style={{ maxWidth: '1200px' }}>
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-lg" style={{ border: 'none', borderRadius: '20px', overflow: 'hidden', background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)' }}>
            <Card.Header style={{ background: `linear-gradient(90deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`, borderBottom: 'none', padding: '1.5rem 2rem' }}>
              <div className="d-flex align-items-center justify-content-between">
                <h2 className="mb-0 text-white" style={{ fontWeight: '600' }}>
                  <i className="fas fa-user-circle me-3"></i>
                  {isEmpleado ? 'Perfil de Empleado' : 'Mi Perfil'}
                </h2>
                <Badge bg={isEmpleado ? "primary" : "success"} style={{ fontSize: '0.9rem', padding: '0.5rem 1rem', borderRadius: '50px', fontWeight: '500' }}>
                  <i className={isEmpleado ? "fas fa-briefcase me-1" : "fas fa-user-tie me-1"}></i>
                  {isEmpleado ? 'Empleado' : 'Cliente'}
                </Badge>
              </div>
            </Card.Header>
            
            <Card.Body className="p-4 p-md-5">
              <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4" justify>
                <Tab eventKey="perfil" title={<><i className="fas fa-user me-2"></i>Perfil</>}>
                  <div className="mt-4">
                    <Formik
                      initialValues={isEmpleado ? empleadoInitialValues : clienteInitialValues}
                      validationSchema={isEmpleado ? empleadoSchema : clienteSchema}
                      onSubmit={handleSubmit}
                      enableReinitialize
                    >
                      {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue, isSubmitting }) => (
                        <Form onSubmit={handleSubmit}>
                          <div className="text-center mb-5">
                            <div className="profile-image-container position-relative d-inline-block">
                              {previewImage && !imageError ? (
                                <Image
                                  src={previewImage}
                                  roundedCircle
                                  className="profile-image mb-3"
                                  style={{ width: '160px', height: '160px', objectFit: 'cover', border: `5px solid ${themeColors.light}`, boxShadow: '0 8px 25px rgba(0,0,0,0.15)', transition: 'all 0.3s ease' }}
                                  onError={handleImageError}
                                />
                              ) : (
                                <DefaultAvatar themeColors={themeColors} />
                              )}
                              <div className="position-absolute bottom-0 end-0 translate-middle">
                                <Form.Group>
                                  <Form.Label className="btn btn-sm d-flex align-items-center justify-content-center" style={{ backgroundColor: themeColors.accent, color: 'white', width: '40px', height: '40px', borderRadius: '50%', border: 'none', cursor: 'pointer', boxShadow: '0 4px 10px rgba(231, 76, 60, 0.3)' }}>
                                    <i className="fas fa-camera"></i>
                                    <Form.Control type="file" accept="image/jpeg,image/png,image/jpg,image/gif" onChange={handleImageChange} style={{ display: 'none' }} />
                                  </Form.Label>
                                </Form.Group>
                              </div>
                            </div>
                            {selectedFile && (
                              <div className="mt-3"><Badge bg="success" className="px-3 py-2" style={{ borderRadius: '50px' }}><i className="fas fa-check-circle me-2"></i>Archivo seleccionado: {selectedFile.name.substring(0, 20)}...</Badge></div>
                            )}
                            <p className="text-muted mt-3" style={{ fontSize: '0.9rem' }}>Haz clic en la cámara para cambiar tu foto de perfil</p>
                          </div>

                          <div className="mb-4">
                            <h5 className="mb-4" style={{ color: themeColors.primary, borderBottom: `2px solid ${themeColors.light}`, paddingBottom: '0.5rem', fontWeight: '600' }}>
                              <i className="fas fa-id-card me-2"></i> Información Personal
                            </h5>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-4">
                                  <Form.Label className="fw-semibold"><i className="fas fa-user me-2 text-primary"></i>Nombre *</Form.Label>
                                  <Form.Control type="text" name="first_name" value={values.first_name} onChange={(e) => setFieldValue('first_name', validateOnlyLetters(e.target.value))} onBlur={handleBlur} isInvalid={touched.first_name && errors.first_name} placeholder="Ingresa tu nombre" className="py-2" style={{ borderRadius: '10px' }} />
                                  <Form.Control.Feedback type="invalid">{errors.first_name}</Form.Control.Feedback>
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-4">
                                  <Form.Label className="fw-semibold"><i className="fas fa-user me-2 text-primary"></i>Apellido *</Form.Label>
                                  <Form.Control type="text" name="last_name" value={values.last_name} onChange={(e) => setFieldValue('last_name', validateOnlyLetters(e.target.value))} onBlur={handleBlur} isInvalid={touched.last_name && errors.last_name} placeholder="Ingresa tu apellido" className="py-2" style={{ borderRadius: '10px' }} />
                                  <Form.Control.Feedback type="invalid">{errors.last_name}</Form.Control.Feedback>
                                </Form.Group>
                              </Col>
                            </Row>

                            <Form.Group className="mb-4">
                              <Form.Label className="fw-semibold"><i className="fas fa-envelope me-2 text-primary"></i>Correo Electrónico *</Form.Label>
                              <Form.Control type="email" name="email" value={values.email} onChange={handleChange} onBlur={handleBlur} isInvalid={touched.email && errors.email} placeholder="ejemplo@correo.com" className="py-2" style={{ borderRadius: '10px' }} />
                              <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                            </Form.Group>

                            <Form.Group className="mb-4">
                              <Form.Label className="fw-semibold"><i className="fas fa-phone me-2 text-primary"></i>Número de Teléfono</Form.Label>
                              <Form.Control type="tel" name="telefono" placeholder="Ej: 3874123456" value={values.telefono} onChange={(e) => setFieldValue('telefono', formatPhoneNumber(e.target.value))} onBlur={handleBlur} isInvalid={touched.telefono && errors.telefono} className="py-2" style={{ borderRadius: '10px' }} />
                              <Form.Text className="text-muted d-flex align-items-center mt-2">
                                <i className="fas fa-info-circle me-2"></i> Solo números
                              </Form.Text>
                              <Form.Control.Feedback type="invalid">{errors.telefono}</Form.Control.Feedback>
                            </Form.Group>
                          </div>

                          {isEmpleado && (
                            <div key="empleado-fields">
                              <div className="mb-4">
                                <h5 className="mb-4" style={{ color: themeColors.primary, borderBottom: `2px solid ${themeColors.light}`, paddingBottom: '0.5rem', fontWeight: '600' }}>
                                  <i className="fas fa-id-badge me-2"></i> Información Laboral
                                </h5>
                                <Row>
                                  <Col md={6}>
                                    <Form.Group className="mb-4">
                                      <Form.Label className="fw-semibold"><i className="fas fa-address-card me-2 text-primary"></i>DNI *</Form.Label>
                                      <Form.Control type="text" name="dni" value={values.dni} onChange={(e) => setFieldValue('dni', validateOnlyNumbers(e.target.value))} onBlur={handleBlur} isInvalid={touched.dni && errors.dni} placeholder="Solo números" maxLength={15} className="py-2" style={{ borderRadius: '10px' }} />
                                      <Form.Control.Feedback type="invalid">{errors.dni}</Form.Control.Feedback>
                                    </Form.Group>
                                  </Col>
                                  <Col md={6}>
                                    <Form.Group className="mb-4">
                                      <Form.Label className="fw-semibold"><i className="fas fa-birthday-cake me-2 text-primary"></i>Fecha de Nacimiento *</Form.Label>
                                      <Form.Control type="date" name="fecha_nacimiento" value={values.fecha_nacimiento} onChange={handleChange} onBlur={handleBlur} isInvalid={touched.fecha_nacimiento && errors.fecha_nacimiento} className="py-2" style={{ borderRadius: '10px' }} />
                                      <Form.Control.Feedback type="invalid">{errors.fecha_nacimiento}</Form.Control.Feedback>
                                    </Form.Group>
                                  </Col>
                                </Row>

                                <div className="mb-4">
                                  <h6 className="mb-3" style={{ color: themeColors.secondary, fontWeight: '600' }}>
                                    <i className="fas fa-home me-2"></i> Domicilio
                                  </h6>
                                  <Row>
                                    <Col md={4}>
                                      <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold">Barrio *</Form.Label>
                                        <Form.Control type="text" name="barrio" value={values.barrio} onChange={handleChange} onBlur={handleBlur} isInvalid={touched.barrio && errors.barrio} placeholder="Letras y números" className="py-2" style={{ borderRadius: '10px' }} />
                                        <Form.Control.Feedback type="invalid">{errors.barrio}</Form.Control.Feedback>
                                      </Form.Group>
                                    </Col>
                                    <Col md={5}>
                                      <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold">Calle *</Form.Label>
                                        <Form.Control type="text" name="calle" value={values.calle} onChange={handleChange} onBlur={handleBlur} isInvalid={touched.calle && errors.calle} placeholder="Letras y números" className="py-2" style={{ borderRadius: '10px' }} />
                                        <Form.Control.Feedback type="invalid">{errors.calle}</Form.Control.Feedback>
                                      </Form.Group>
                                    </Col>
                                    <Col md={3}>
                                      <Form.Group className="mb-4">
                                        <Form.Label className="fw-semibold">Numeración *</Form.Label>
                                        <Form.Control type="text" name="numeracion" value={values.numeracion} onChange={(e) => setFieldValue('numeracion', validateOnlyNumbers(e.target.value))} onBlur={handleBlur} isInvalid={touched.numeracion && errors.numeracion} placeholder="Solo números" maxLength={10} className="py-2" style={{ borderRadius: '10px' }} />
                                        <Form.Control.Feedback type="invalid">{errors.numeracion}</Form.Control.Feedback>
                                      </Form.Group>
                                    </Col>
                                  </Row>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="d-grid gap-2 mt-5 pt-3" style={{ borderTop: `1px solid ${themeColors.light}` }}>
                            <Button variant="primary" type="submit" size="lg" disabled={isSubmitting || loading} className="fw-bold py-3" style={{ background: `linear-gradient(90deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`, border: 'none', borderRadius: '12px' }}>
                              {loading ? (
                                <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-3" /><span className="fw-bold">Guardando Cambios...</span></>
                              ) : (
                                <><i className="fas fa-save me-3"></i><span className="fw-bold">Guardar Cambios</span></>
                              )}
                            </Button>
                            <p className="text-center text-muted mt-3 mb-0" style={{ fontSize: '0.85rem' }}><i className="fas fa-shield-alt me-2"></i> Tus datos están protegidos y solo se usarán para fines administrativos</p>
                          </div>
                        </Form>
                      )}
                    </Formik>
                  </div>
                </Tab>

                {!isEmpleado && (
                  <Tab eventKey="agenda" title={<><i className="fas fa-calendar-check me-2"></i>Agenda</>}>
                    <div className="mt-4">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="mb-0" style={{ color: themeColors.primary }}><i className="fas fa-calendar-alt me-2"></i> Mis Solicitudes de Visita</h5>
                        <Button variant="outline-primary" size="sm" onClick={cargarSolicitudes} disabled={loadingSolicitudes}>
                          {loadingSolicitudes ? <Spinner animation="border" size="sm" /> : <i className="fas fa-sync-alt me-2"></i>} Actualizar
                        </Button>
                      </div>

                      {loadingSolicitudes ? (
                        <div className="text-center py-5"><Spinner animation="border" variant="primary" /><p className="mt-2">Cargando solicitudes...</p></div>
                      ) : solicitudes.length === 0 ? (
                        <Alert variant="info" className="text-center"><i className="fas fa-calendar-times fa-2x mb-3"></i><h5>No tienes solicitudes de visita</h5></Alert>
                      ) : (
                        <Row>
                          {solicitudes.map((solicitud) => (
                            <Col md={6} lg={4} key={solicitud.id} className="mb-4">
                              <Card className="h-100 shadow-sm" style={{ borderRadius: '15px' }}>
                                <Card.Header style={{ background: `linear-gradient(90deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`, color: 'white', borderTopLeftRadius: '15px', borderTopRightRadius: '15px' }}>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <small className="fw-bold"><i className="fas fa-calendar me-1"></i> {new Date(solicitud.fecha_creacion).toLocaleDateString()}</small>
                                    <Badge bg={getEstadoBadgeVariant(solicitud.estado)}>{getEstadoText(solicitud.estado)}</Badge>
                                  </div>
                                </Card.Header>
                                <Card.Body>
                                  <h6 className="fw-bold mb-2" style={{ color: themeColors.primary }}><i className="fas fa-home me-2"></i> {solicitud.propiedad_titulo}</h6>
                                  {solicitud.mensaje && <p className="text-muted small mb-3">"{solicitud.mensaje}"</p>}
                                  <div className="d-flex justify-content-between align-items-center">
                                    <small className="text-muted"><i className="fas fa-clock me-1"></i> {new Date(solicitud.fecha_creacion).toLocaleTimeString()}</small>
                                    {['pendiente', 'aprobada'].includes(solicitud.estado) && (
                                      <Button variant="outline-danger" size="sm" onClick={() => handleCancelarSolicitud(solicitud.id)}><i className="fas fa-times me-1"></i> Cancelar</Button>
                                    )}
                                  </div>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      )}
                    </div>
                  </Tab>
                )}
              </Tabs>
            </Card.Body>
            
            <Card.Footer className="text-center py-3" style={{ background: themeColors.light, borderTop: `1px solid ${themeColors.light}`, borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px' }}>
              <small className="text-muted"><i className="fas fa-history me-2"></i> Última actualización: {new Date().toLocaleDateString()}</small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
    </>
  );
};

export default Perfil;
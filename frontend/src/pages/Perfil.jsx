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

// ✅ FIX CRÍTICO: DefaultAvatar definido FUERA del componente Perfil.
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

const Perfil = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Estados para la agenda (solo para clientes)
  const [solicitudes, setSolicitudes] = useState([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [activeTab, setActiveTab] = useState('perfil');

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
      console.log('🖼️ Cargando foto de perfil del usuario:', user.foto_perfil);
        const imageUrl = user.foto_perfil.startsWith('http') 
          ? user.foto_perfil 
          : `${BACKEND_URL}${user.foto_perfil}`;
      setPreviewImage(imageUrl);
      setImageError(false);
    }

    // Cargar solicitudes de visita si es cliente
    if (user?.rol === 'cliente') {
      cargarSolicitudes();
    }
  }, [user]);

  // Función para cargar solicitudes de visita
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

  // Función para cancelar una solicitud
  const handleCancelarSolicitud = async (solicitudId) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar esta solicitud de visita?')) {
      return;
    }

    const motivo = window.prompt('Motivo de la cancelación (opcional):');
    if (motivo === null) {
      return;
    }

    try {
      await solicitudVisitaService.cancelar(solicitudId, motivo.trim());
      toast.success('Solicitud cancelada exitosamente');
      cargarSolicitudes(); // Recargar la lista
    } catch (error) {
      console.error('Error al cancelar solicitud:', error);
      toast.error(error.error || 'Error al cancelar la solicitud');
    }
  };

  // Función para obtener el color del badge según el estado
  const getEstadoBadgeVariant = (estado) => {
    switch (estado) {
      case 'pendiente': return 'warning';
      case 'aprobada': return 'success';
      case 'rechazada': return 'danger';
      case 'cancelada': return 'secondary';
      default: return 'light';
    }
  };

  // Función para obtener el texto del estado
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
    console.error('❌ Error cargando la imagen:', previewImage);
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
      .matches(/^[\d\s+\-()]+$/, 'El teléfono solo puede contener números y caracteres de teléfono (+, -, espacios)')
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
    ciudad: Yup.string()
      .required('La ciudad es requerida')
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'La ciudad solo puede contener letras y espacios'),
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
      .matches(/^[\d\s+\-()]+$/, 'El teléfono solo puede contener números y caracteres de teléfono (+, -, espacios)')
      .min(8, 'Mínimo 8 caracteres')
      .max(20, 'Máximo 20 caracteres'),
    ciudad_interes: Yup.string()
      .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, 'La ciudad de interés solo puede contener letras y espacios'),
    intereses: Yup.string(),
  });

  const empleadoInitialValues = {
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    dni: user?.dni || '',
    fecha_nacimiento: user?.fecha_nacimiento || '',
    ciudad: user?.ciudad || '',
    barrio: user?.barrio || '',
    calle: user?.calle || '',
    numeracion: user?.numeracion || '',
  };

  const clienteInitialValues = {
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    telefono: user?.telefono || '',
    ciudad_interes: user?.ciudad_interes || '',
    intereses: user?.intereses || '',
  };

  const handleImageChange = (event) => {
    const file = event.currentTarget.files[0];
    if (file) {
      console.log('📁 Archivo seleccionado:', file.name, file.type, file.size);
      
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
        console.log('✅ Preview de imagen creado');
        setPreviewImage(reader.result);
      };
      reader.onerror = () => {
        console.error('❌ Error leyendo el archivo');
        toast.error('Error al procesar la imagen');
        setImageError(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/[^\d+\-()\s]/g, '');
    return cleaned;
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
      console.log('📤 Iniciando envío del formulario...');
      
      const formData = new FormData();
      
      Object.keys(values).forEach(key => {
        if (values[key] && key !== 'foto_perfil') {
          formData.append(key, values[key]);
        }
      });
      
      if (selectedFile && !imageError) {
        console.log('🖼️ Agregando imagen al FormData:', selectedFile.name);
        formData.append('foto_perfil', selectedFile);
      } else {
        console.log('ℹ️ No se agregó imagen al FormData');
      }

      console.log('🚀 Enviando datos al servidor...');
      
      // ✅ FIX APLICADO: authService.updateProfile ya retorna response.data internamente
      const response = await authService.updateProfile(formData);
      
      console.log('✅ Respuesta del servidor:', response);
      
      // ✅ FIX APLICADO: pasamos "response" directamente, sin el ".data" que causaba el undefined
      dispatch(setUser(response));
      
      setSelectedFile(null);
      
      toast.success('Perfil actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error completo al actualizar perfil:', error);
      console.error('❌ Detalles del error:', error.response?.data);
      
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
        <Spinner 
          animation="border" 
          variant="primary"
          style={{ width: '3rem', height: '3rem', borderWidth: '0.3em' }}
        />
        <p className="mt-3" style={{ color: themeColors.primary, fontWeight: '500' }}>
          Cargando perfil...
        </p>
      </Container>
    );
  }

  return (
    <Container className="mt-5 mb-5" style={{ maxWidth: '1200px' }}>
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="shadow-lg" style={{ 
            border: 'none', 
            borderRadius: '20px',
            overflow: 'hidden',
            background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)'
          }}>
            <Card.Header style={{ 
              background: `linear-gradient(90deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
              borderBottom: 'none',
              padding: '1.5rem 2rem'
            }}>
              <div className="d-flex align-items-center justify-content-between">
                <h2 className="mb-0 text-white" style={{ fontWeight: '600' }}>
                  <i className="fas fa-user-circle me-3"></i>
                  {isEmpleado ? 'Perfil de Empleado' : 'Mi Perfil'}
                </h2>
                <Badge 
                  bg={isEmpleado ? "primary" : "success"}
                  style={{ 
                    fontSize: '0.9rem', 
                    padding: '0.5rem 1rem',
                    borderRadius: '50px',
                    fontWeight: '500'
                  }}
                >
                  <i className={isEmpleado ? "fas fa-briefcase me-1" : "fas fa-user-tie me-1"}></i>
                  {isEmpleado ? 'Empleado' : 'Cliente'}
                </Badge>
              </div>
            </Card.Header>
            
            <Card.Body className="p-4 p-md-5">
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="mb-4"
                justify
              >
                <Tab eventKey="perfil" title={<><i className="fas fa-user me-2"></i>Perfil</>}>
                  <div className="mt-4">
                    <Formik
                      initialValues={isEmpleado ? empleadoInitialValues : clienteInitialValues}
                      validationSchema={isEmpleado ? empleadoSchema : clienteSchema}
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
                        setFieldValue,
                        isSubmitting,
                      }) => (
                        <Form onSubmit={handleSubmit}>
                    <div className="text-center mb-5">
                      <div className="profile-image-container position-relative d-inline-block">
                        {previewImage && !imageError ? (
                          <Image
                            src={previewImage}
                            roundedCircle
                            className="profile-image mb-3"
                            style={{ 
                              width: '160px', 
                              height: '160px', 
                              objectFit: 'cover',
                              border: `5px solid ${themeColors.light}`,
                              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                              transition: 'all 0.3s ease'
                            }}
                            onError={handleImageError}
                            onMouseEnter={(e) => {
                              const el = e.currentTarget;
                              el.style.transform = 'scale(1.05)';
                              el.style.boxShadow = '0 12px 30px rgba(0,0,0,0.2)';
                            }}
                            onMouseLeave={(e) => {
                              const el = e.currentTarget;
                              el.style.transform = 'scale(1)';
                              el.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                            }}
                          />
                        ) : (
                          <DefaultAvatar themeColors={themeColors} />
                        )}
                        
                        <div className="position-absolute bottom-0 end-0 translate-middle">
                          <Form.Group>
                            <Form.Label 
                              className="btn btn-sm d-flex align-items-center justify-content-center"
                              style={{ 
                                backgroundColor: themeColors.accent,
                                color: 'white',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(231, 76, 60, 0.3)',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                const el = e.currentTarget;
                                el.style.backgroundColor = '#c0392b';
                                el.style.transform = 'scale(1.1)';
                              }}
                              onMouseLeave={(e) => {
                                const el = e.currentTarget;
                                el.style.backgroundColor = themeColors.accent;
                                el.style.transform = 'scale(1)';
                              }}
                            >
                              <i className="fas fa-camera"></i>
                              <Form.Control
                                type="file"
                                accept="image/jpeg,image/png,image/jpg,image/gif"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                              />
                            </Form.Label>
                          </Form.Group>
                        </div>
                      </div>
                      
                      {selectedFile && (
                        <div className="mt-3 animate__animated animate__fadeIn">
                          <Badge 
                            bg="success" 
                            className="px-3 py-2"
                            style={{ 
                              borderRadius: '50px',
                              fontSize: '0.85rem',
                              fontWeight: '500'
                            }}
                          >
                            <i className="fas fa-check-circle me-2"></i>
                            Archivo seleccionado: {selectedFile.name.substring(0, 20)}...
                          </Badge>
                        </div>
                      )}
                      
                      {imageError && (
                        <div className="text-danger small mt-2 animate__animated animate__shakeX">
                          <i className="fas fa-exclamation-triangle me-1"></i>
                          Error al cargar la imagen
                        </div>
                      )}
                      
                      <p className="text-muted mt-3" style={{ fontSize: '0.9rem' }}>
                        Haz clic en la cámara para cambiar tu foto de perfil
                      </p>
                    </div>

                    <div className="mb-4">
                      <h5 className="mb-4" style={{ 
                        color: themeColors.primary,
                        borderBottom: `2px solid ${themeColors.light}`,
                        paddingBottom: '0.5rem',
                        fontWeight: '600'
                      }}>
                        <i className="fas fa-id-card me-2"></i>
                        Información Personal
                      </h5>
                      
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">
                              <i className="fas fa-user me-2 text-primary"></i>
                              Nombre *
                            </Form.Label>
                            <Form.Control
                              type="text"
                              name="first_name"
                              value={values.first_name}
                              onChange={(e) => {
                                const filteredValue = validateOnlyLetters(e.target.value);
                                setFieldValue('first_name', filteredValue);
                              }}
                              onBlur={handleBlur}
                              isInvalid={touched.first_name && errors.first_name}
                              placeholder="Ingresa tu nombre"
                              className="py-2"
                              style={{ 
                                borderRadius: '10px',
                                border: `1px solid ${touched.first_name && errors.first_name ? themeColors.accent : '#dee2e6'}`,
                                transition: 'all 0.3s ease'
                              }}
                            />
                            {touched.first_name && errors.first_name && (
                              <div className="d-flex align-items-center mt-2 animate__animated animate__fadeIn">
                                <i className="fas fa-exclamation-circle me-2" style={{ color: themeColors.accent }}></i>
                                <small style={{ color: themeColors.accent }}>{errors.first_name}</small>
                              </div>
                            )}
                          </Form.Group>
                        </Col>

                        <Col md={6}>
                          <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">
                              <i className="fas fa-user me-2 text-primary"></i>
                              Apellido *
                            </Form.Label>
                            <Form.Control
                              type="text"
                              name="last_name"
                              value={values.last_name}
                              onChange={(e) => {
                                const filteredValue = validateOnlyLetters(e.target.value);
                                setFieldValue('last_name', filteredValue);
                              }}
                              onBlur={handleBlur}
                              isInvalid={touched.last_name && errors.last_name}
                              placeholder="Ingresa tu apellido"
                              className="py-2"
                              style={{ 
                                borderRadius: '10px',
                                border: `1px solid ${touched.last_name && errors.last_name ? themeColors.accent : '#dee2e6'}`,
                                transition: 'all 0.3s ease'
                              }}
                            />
                            {touched.last_name && errors.last_name && (
                              <div className="d-flex align-items-center mt-2 animate__animated animate__fadeIn">
                                <i className="fas fa-exclamation-circle me-2" style={{ color: themeColors.accent }}></i>
                                <small style={{ color: themeColors.accent }}>{errors.last_name}</small>
                              </div>
                            )}
                          </Form.Group>
                        </Col>
                      </Row>

                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold">
                          <i className="fas fa-envelope me-2 text-primary"></i>
                          Correo Electrónico *
                        </Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={values.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.email && errors.email}
                          placeholder="ejemplo@correo.com"
                          className="py-2"
                          style={{ 
                            borderRadius: '10px',
                            border: `1px solid ${touched.email && errors.email ? themeColors.accent : '#dee2e6'}`,
                            transition: 'all 0.3s ease'
                          }}
                        />
                        {touched.email && errors.email && (
                          <div className="d-flex align-items-center mt-2 animate__animated animate__fadeIn">
                            <i className="fas fa-exclamation-circle me-2" style={{ color: themeColors.accent }}></i>
                            <small style={{ color: themeColors.accent }}>{errors.email}</small>
                          </div>
                        )}
                      </Form.Group>

                      <Form.Group className="mb-4">
                        <Form.Label className="fw-semibold">
                          <i className="fas fa-phone me-2 text-primary"></i>
                          Número de Teléfono
                        </Form.Label>
                        <Form.Control
                          type="tel"
                          name="telefono"
                          placeholder="+54 9 1234-5678"
                          value={values.telefono}
                          onChange={(e) => {
                            const formattedValue = formatPhoneNumber(e.target.value);
                            setFieldValue('telefono', formattedValue);
                          }}
                          onBlur={handleBlur}
                          isInvalid={touched.telefono && errors.telefono}
                          className="py-2"
                          style={{ 
                            borderRadius: '10px',
                            border: `1px solid ${touched.telefono && errors.telefono ? themeColors.accent : '#dee2e6'}`,
                            transition: 'all 0.3s ease'
                          }}
                        />
                        <Form.Text className="text-muted d-flex align-items-center mt-2">
                          <i className="fas fa-info-circle me-2"></i>
                          Solo números y caracteres telefónicos (+, -, espacios)
                        </Form.Text>
                        {touched.telefono && errors.telefono && (
                          <div className="d-flex align-items-center mt-2 animate__animated animate__fadeIn">
                            <i className="fas fa-exclamation-circle me-2" style={{ color: themeColors.accent }}></i>
                            <small style={{ color: themeColors.accent }}>{errors.telefono}</small>
                          </div>
                        )}
                      </Form.Group>
                    </div>

                    {/* ✅ FIX APLICADO: Reemplazado Fragment (<>) por <div> para estabilizar el DOM */}
                    {isEmpleado && (
                      <div key="empleado-fields">
                        <div className="mb-4">
                          <h5 className="mb-4" style={{ 
                            color: themeColors.primary,
                            borderBottom: `2px solid ${themeColors.light}`,
                            paddingBottom: '0.5rem',
                            fontWeight: '600'
                          }}>
                            <i className="fas fa-id-badge me-2"></i>
                            Información Laboral
                          </h5>
                          
                          <Row>
                            <Col md={6}>
                              <Form.Group className="mb-4">
                                <Form.Label className="fw-semibold">
                                  <i className="fas fa-address-card me-2 text-primary"></i>
                                  DNI *
                                </Form.Label>
                                <Form.Control
                                  type="text"
                                  name="dni"
                                  value={values.dni}
                                  onChange={(e) => {
                                    const filteredValue = validateOnlyNumbers(e.target.value);
                                    setFieldValue('dni', filteredValue);
                                  }}
                                  onBlur={handleBlur}
                                  isInvalid={touched.dni && errors.dni}
                                  placeholder="Solo números"
                                  maxLength={15}
                                  className="py-2"
                                  style={{ 
                                    borderRadius: '10px',
                                    border: `1px solid ${touched.dni && errors.dni ? themeColors.accent : '#dee2e6'}`,
                                    transition: 'all 0.3s ease'
                                  }}
                                />
                                {touched.dni && errors.dni && (
                                  <div className="d-flex align-items-center mt-2 animate__animated animate__fadeIn">
                                    <i className="fas fa-exclamation-circle me-2" style={{ color: themeColors.accent }}></i>
                                    <small style={{ color: themeColors.accent }}>{errors.dni}</small>
                                  </div>
                                )}
                              </Form.Group>
                            </Col>

                            <Col md={6}>
                              <Form.Group className="mb-4">
                                <Form.Label className="fw-semibold">
                                  <i className="fas fa-birthday-cake me-2 text-primary"></i>
                                  Fecha de Nacimiento *
                                </Form.Label>
                                <Form.Control
                                  type="date"
                                  name="fecha_nacimiento"
                                  value={values.fecha_nacimiento}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  isInvalid={touched.fecha_nacimiento && errors.fecha_nacimiento}
                                  className="py-2"
                                  style={{ 
                                    borderRadius: '10px',
                                    border: `1px solid ${touched.fecha_nacimiento && errors.fecha_nacimiento ? themeColors.accent : '#dee2e6'}`,
                                    transition: 'all 0.3s ease'
                                  }}
                                />
                                {touched.fecha_nacimiento && errors.fecha_nacimiento && (
                                  <div className="d-flex align-items-center mt-2 animate__animated animate__fadeIn">
                                    <i className="fas fa-exclamation-circle me-2" style={{ color: themeColors.accent }}></i>
                                    <small style={{ color: themeColors.accent }}>{errors.fecha_nacimiento}</small>
                                  </div>
                                )}
                              </Form.Group>
                            </Col>
                          </Row>

                          <Form.Group className="mb-4">
                            <Form.Label className="fw-semibold">
                              <i className="fas fa-city me-2 text-primary"></i>
                              Ciudad *
                            </Form.Label>
                            <Form.Control
                              type="text"
                              name="ciudad"
                              value={values.ciudad}
                              onChange={(e) => {
                                const filteredValue = validateOnlyLetters(e.target.value);
                                setFieldValue('ciudad', filteredValue);
                              }}
                              onBlur={handleBlur}
                              isInvalid={touched.ciudad && errors.ciudad}
                              placeholder="Solo letras y espacios"
                              className="py-2"
                              style={{ 
                                borderRadius: '10px',
                                border: `1px solid ${touched.ciudad && errors.ciudad ? themeColors.accent : '#dee2e6'}`,
                                transition: 'all 0.3s ease'
                              }}
                            />
                            {touched.ciudad && errors.ciudad && (
                              <div className="d-flex align-items-center mt-2 animate__animated animate__fadeIn">
                                <i className="fas fa-exclamation-circle me-2" style={{ color: themeColors.accent }}></i>
                                <small style={{ color: themeColors.accent }}>{errors.ciudad}</small>
                              </div>
                            )}
                          </Form.Group>

                          <div className="mb-4">
                            <h6 className="mb-3" style={{ 
                              color: themeColors.secondary,
                              fontWeight: '600'
                            }}>
                              <i className="fas fa-home me-2"></i>
                              Domicilio
                            </h6>
                            
                            <Row>
                              <Col md={4}>
                                <Form.Group className="mb-4">
                                  <Form.Label className="fw-semibold">Barrio *</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="barrio"
                                    value={values.barrio}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touched.barrio && errors.barrio}
                                    placeholder="Letras y números"
                                    className="py-2"
                                    style={{ 
                                      borderRadius: '10px',
                                      border: `1px solid ${touched.barrio && errors.barrio ? themeColors.accent : '#dee2e6'}`,
                                      transition: 'all 0.3s ease'
                                    }}
                                  />
                                  {touched.barrio && errors.barrio && (
                                    <div className="d-flex align-items-center mt-2 animate__animated animate__fadeIn">
                                      <i className="fas fa-exclamation-circle me-2" style={{ color: themeColors.accent }}></i>
                                      <small style={{ color: themeColors.accent }}>{errors.barrio}</small>
                                    </div>
                                  )}
                                </Form.Group>
                              </Col>

                              <Col md={5}>
                                <Form.Group className="mb-4">
                                  <Form.Label className="fw-semibold">Calle *</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="calle"
                                    value={values.calle}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    isInvalid={touched.calle && errors.calle}
                                    placeholder="Letras y números"
                                    className="py-2"
                                    style={{ 
                                      borderRadius: '10px',
                                      border: `1px solid ${touched.calle && errors.calle ? themeColors.accent : '#dee2e6'}`,
                                      transition: 'all 0.3s ease'
                                    }}
                                  />
                                  {touched.calle && errors.calle && (
                                    <div className="d-flex align-items-center mt-2 animate__animated animate__fadeIn">
                                      <i className="fas fa-exclamation-circle me-2" style={{ color: themeColors.accent }}></i>
                                      <small style={{ color: themeColors.accent }}>{errors.calle}</small>
                                    </div>
                                  )}
                                </Form.Group>
                              </Col>

                              <Col md={3}>
                                <Form.Group className="mb-4">
                                  <Form.Label className="fw-semibold">Numeración *</Form.Label>
                                  <Form.Control
                                    type="text"
                                    name="numeracion"
                                    value={values.numeracion}
                                    onChange={(e) => {
                                      const filteredValue = validateOnlyNumbers(e.target.value);
                                      setFieldValue('numeracion', filteredValue);
                                    }}
                                    onBlur={handleBlur}
                                    isInvalid={touched.numeracion && errors.numeracion}
                                    placeholder="Solo números"
                                    maxLength={10}
                                    className="py-2"
                                    style={{ 
                                      borderRadius: '10px',
                                      border: `1px solid ${touched.numeracion && errors.numeracion ? themeColors.accent : '#dee2e6'}`,
                                      transition: 'all 0.3s ease'
                                    }}
                                  />
                                  {touched.numeracion && errors.numeracion && (
                                    <div className="d-flex align-items-center mt-2 animate__animated animate__fadeIn">
                                      <i className="fas fa-exclamation-circle me-2" style={{ color: themeColors.accent }}></i>
                                      <small style={{ color: themeColors.accent }}>{errors.numeracion}</small>
                                    </div>
                                  )}
                                </Form.Group>
                              </Col>
                            </Row>
                          </div>

                        </div>
                      </div>
                    )}

                    {!isEmpleado && (
                      <div className="mb-4">
                        <h5 className="mb-4" style={{ 
                          color: themeColors.primary,
                          borderBottom: `2px solid ${themeColors.light}`,
                          paddingBottom: '0.5rem',
                          fontWeight: '600'
                        }}>
                          <i className="fas fa-heart me-2"></i>
                          Preferencias
                        </h5>
                        
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-semibold">
                            <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                            Ciudad de Interés
                          </Form.Label>
                          <Form.Control
                            type="text"
                            name="ciudad_interes"
                            placeholder="¿En qué ciudad buscas propiedades?"
                            value={values.ciudad_interes}
                            onChange={(e) => {
                              const filteredValue = validateOnlyLetters(e.target.value);
                              setFieldValue('ciudad_interes', filteredValue);
                            }}
                            onBlur={handleBlur}
                            isInvalid={touched.ciudad_interes && errors.ciudad_interes}
                            className="py-2"
                            style={{ 
                              borderRadius: '10px',
                              border: `1px solid ${touched.ciudad_interes && errors.ciudad_interes ? themeColors.accent : '#dee2e6'}`,
                              transition: 'all 0.3s ease'
                            }}
                          />
                          {touched.ciudad_interes && errors.ciudad_interes && (
                            <div className="d-flex align-items-center mt-2 animate__animated animate__fadeIn">
                              <i className="fas fa-exclamation-circle me-2" style={{ color: themeColors.accent }}></i>
                              <small style={{ color: themeColors.accent }}>{errors.ciudad_interes}</small>
                            </div>
                          )}
                        </Form.Group>

                        <Form.Group className="mb-4">
                          <Form.Label className="fw-semibold">
                            <i className="fas fa-search me-2 text-primary"></i>
                            Intereses
                          </Form.Label>
                          <Form.Select
                            name="intereses"
                            value={values.intereses}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.intereses && errors.intereses}
                            className="py-2"
                            style={{ 
                              borderRadius: '10px',
                              border: `1px solid ${touched.intereses && errors.intereses ? themeColors.accent : '#dee2e6'}`,
                              transition: 'all 0.3s ease',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="">Selecciona una opción</option>
                            <option value="comprar">Comprar</option>
                            <option value="alquilar">Alquilar</option>
                            <option value="ambos">Ambos</option>
                          </Form.Select>
                          {touched.intereses && errors.intereses && (
                            <div className="d-flex align-items-center mt-2 animate__animated animate__fadeIn">
                              <i className="fas fa-exclamation-circle me-2" style={{ color: themeColors.accent }}></i>
                              <small style={{ color: themeColors.accent }}>{errors.intereses}</small>
                            </div>
                          )}
                          <Form.Text className="text-muted d-flex align-items-center mt-2">
                            <i className="fas fa-info-circle me-2"></i>
                            ¿Qué tipo de operación te interesa?
                          </Form.Text>
                        </Form.Group>
                      </div>
                    )}

                    <div className="d-grid gap-2 mt-5 pt-3" style={{ borderTop: `1px solid ${themeColors.light}` }}>
                      <Button
                        variant="primary"
                        type="submit"
                        size="lg"
                        disabled={isSubmitting || loading}
                        className="fw-bold py-3"
                        style={{
                          background: `linear-gradient(90deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '1.1rem',
                          transition: 'all 0.3s ease',
                          boxShadow: `0 6px 15px ${themeColors.primary}40`
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-3px)';
                          e.target.style.boxShadow = `0 10px 25px ${themeColors.primary}60`;
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = `0 6px 15px ${themeColors.primary}40`;
                        }}
                      >
                        {loading ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-3"
                              style={{ width: '1.2rem', height: '1.2rem' }}
                            />
                            <span className="fw-bold">Guardando Cambios...</span>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-3"></i>
                            <span className="fw-bold">Guardar Cambios</span>
                          </>
                        )}
                      </Button>
                      
                      <p className="text-center text-muted mt-3 mb-0" style={{ fontSize: '0.85rem' }}>
                        <i className="fas fa-shield-alt me-2"></i>
                        Tus datos están protegidos y solo se usarán para fines administrativos
                      </p>
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
                        <h5 className="mb-0" style={{ color: themeColors.primary }}>
                          <i className="fas fa-calendar-alt me-2"></i>
                          Mis Solicitudes de Visita
                        </h5>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={cargarSolicitudes}
                          disabled={loadingSolicitudes}
                        >
                          {loadingSolicitudes ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <i className="fas fa-sync-alt me-2"></i>
                          )}
                          Actualizar
                        </Button>
                      </div>

                      {loadingSolicitudes ? (
                        <div className="text-center py-5">
                          <Spinner animation="border" variant="primary" />
                          <p className="mt-2">Cargando solicitudes...</p>
                        </div>
                      ) : solicitudes.length === 0 ? (
                        <Alert variant="info" className="text-center">
                          <i className="fas fa-calendar-times fa-2x mb-3"></i>
                          <h5>No tienes solicitudes de visita</h5>
                          <p className="mb-0">
                            Cuando solicites una visita a una propiedad, aparecerá aquí para que puedas hacer seguimiento.
                          </p>
                        </Alert>
                      ) : (
                        <Row>
                          {solicitudes.map((solicitud) => (
                            <Col md={6} lg={4} key={solicitud.id} className="mb-4">
                              <Card className="h-100 shadow-sm" style={{ borderRadius: '15px' }}>
                                <Card.Header style={{
                                  background: `linear-gradient(90deg, ${themeColors.primary} 0%, ${themeColors.secondary} 100%)`,
                                  color: 'white',
                                  borderTopLeftRadius: '15px',
                                  borderTopRightRadius: '15px'
                                }}>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <small className="fw-bold">
                                      <i className="fas fa-calendar me-1"></i>
                                      {new Date(solicitud.fecha_creacion).toLocaleDateString()}
                                    </small>
                                    <Badge bg={getEstadoBadgeVariant(solicitud.estado)} style={{ fontSize: '0.75rem' }}>
                                      {getEstadoText(solicitud.estado)}
                                    </Badge>
                                  </div>
                                </Card.Header>

                                <Card.Body>
                                  <h6 className="fw-bold mb-2" style={{ color: themeColors.primary }}>
                                    <i className="fas fa-home me-2"></i>
                                    {solicitud.propiedad_titulo}
                                  </h6>

                                  {solicitud.mensaje && (
                                    <p className="text-muted small mb-3" style={{ fontStyle: 'italic' }}>
                                      "{solicitud.mensaje.length > 100
                                        ? `${solicitud.mensaje.substring(0, 100)}...`
                                        : solicitud.mensaje}"
                                    </p>
                                  )}

                                  <div className="d-flex justify-content-between align-items-center">
                                    <small className="text-muted">
                                      <i className="fas fa-clock me-1"></i>
                                      {new Date(solicitud.fecha_creacion).toLocaleTimeString()}
                                    </small>

                                    {['pendiente', 'aprobada'].includes(solicitud.estado) && (
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleCancelarSolicitud(solicitud.id)}
                                      >
                                        <i className="fas fa-times me-1"></i>
                                        Cancelar
                                      </Button>
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
            
            <Card.Footer className="text-center py-3" style={{ 
              background: themeColors.light,
              borderTop: `1px solid ${themeColors.light}`,
              borderBottomLeftRadius: '20px',
              borderBottomRightRadius: '20px'
            }}>
              <small className="text-muted">
                <i className="fas fa-history me-2"></i>
                Última actualización: {new Date().toLocaleDateString()}
              </small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Perfil;
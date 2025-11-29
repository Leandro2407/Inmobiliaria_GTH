import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Image } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import { setUser } from '../store/slices/authSlice';
import '../styles/Perfil.css';

const Perfil = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const isEmpleado = user?.rol === 'agente' || user?.rol === 'administrador';

  // ✅ MODIFICADO: Solo las 2 opciones solicitadas
  const puestosOptions = [
    { value: 'agente_inmobiliario', label: 'Agente Inmobiliario' },
    { value: 'administrador', label: 'Administrador' },
  ];

  useEffect(() => {
    if (user?.foto_perfil) {
      console.log('🖼️ Cargando foto de perfil del usuario:', user.foto_perfil);
      const imageUrl = user.foto_perfil.startsWith('http') 
        ? user.foto_perfil 
        : `${window.location.origin}${user.foto_perfil}`;
      setPreviewImage(imageUrl);
      setImageError(false);
    }
  }, [user]);

  const handleImageError = () => {
    console.error('❌ Error cargando la imagen:', previewImage);
    setImageError(true);
    setPreviewImage(null);
    toast.error('Error al cargar la imagen. Se mostrará el avatar por defecto.');
  };

  // Esquema de validación para EMPLEADOS con validaciones específicas
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
    puesto: Yup.string()
      .required('El puesto es requerido'),
  });

  // Esquema de validación para CLIENTES con validaciones específicas
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

  // Valores iniciales para EMPLEADOS
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
    puesto: user?.puesto || '',
  };

  // Valores iniciales para CLIENTES
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
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecciona un archivo de imagen válido (JPEG, PNG, etc.)');
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen no debe superar los 5MB');
        return;
      }

      setSelectedFile(file);
      setImageError(false);

      // Crear preview
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

  // Función para formatear teléfono mientras se escribe
  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/[^\d+\-()\s]/g, '');
    return cleaned;
  };

  // Función para validar solo letras
  const validateOnlyLetters = (value) => {
    return value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
  };

  // Función para validar solo números
  const validateOnlyNumbers = (value) => {
    return value.replace(/\D/g, '');
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setLoading(true);
      console.log('📤 Iniciando envío del formulario...');
      
      const formData = new FormData();
      
      // Agregar campos de forma más robusta
      Object.keys(values).forEach(key => {
        if (values[key] && key !== 'foto_perfil') {
          formData.append(key, values[key]);
        }
      });
      
      // Manejo de archivo de imagen
      if (selectedFile && !imageError) {
        console.log('🖼️ Agregando imagen al FormData:', selectedFile.name);
        formData.append('foto_perfil', selectedFile);
      } else {
        console.log('ℹ️ No se agregó imagen al FormData');
      }

      console.log('🚀 Enviando datos al servidor...');
      const response = await authService.updateProfile(formData);
      
      console.log('✅ Respuesta del servidor:', response.data);
      dispatch(setUser(response.data));
      
      // LIMPIAR: Resetear archivo seleccionado después del éxito
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

  // Componente para avatar por defecto
  const DefaultAvatar = () => (
    <div 
      className="d-flex align-items-center justify-content-center mb-3 rounded-circle bg-dark"
      style={{ 
        width: '150px', 
        height: '150px', 
        margin: '0 auto',
        border: '3px solid #dee2e6',
        cursor: 'pointer'
      }}
    >
      <i 
        className="fas fa-user text-white" 
        style={{ fontSize: '4rem' }}
      ></i>
    </div>
  );

  if (!user) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
      </Container>
    );
  }

  return (
    <Container className="perfil-container mt-5 mb-5">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="perfil-card shadow">
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">
                {isEmpleado ? 'Perfil de Empleado' : 'Mi Perfil'}
              </h2>
              
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
                    {/* Foto de perfil */}
                    <div className="text-center mb-4">
                      <div className="profile-image-container">
                        {previewImage && !imageError ? (
                          <Image
                            src={previewImage}
                            roundedCircle
                            className="profile-image mb-3"
                            style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                            onError={handleImageError}
                          />
                        ) : (
                          <DefaultAvatar />
                        )}
                      </div>
                      
                      <Form.Group>
                        <Form.Label 
                          className="btn btn-outline-dark btn-sm"
                          style={{ 
                            borderColor: '#000', 
                            color: '#000',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#000';
                            e.target.style.color = '#fff';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent';
                            e.target.style.color = '#000';
                          }}
                        >
                          {selectedFile ? 'Cambiar Foto' : 'Seleccionar Foto'}
                          <Form.Control
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/gif"
                            onChange={handleImageChange}
                            style={{ display: 'none' }}
                          />
                        </Form.Label>
                      </Form.Group>
                      
                      {selectedFile && (
                        <div className="text-success small mt-2">
                          ✅ Archivo seleccionado: {selectedFile.name}
                        </div>
                      )}
                      
                      {imageError && (
                        <div className="text-danger small mt-2">
                          ❌ Error al cargar la imagen
                        </div>
                      )}
                    </div>

                    {/* Campos comunes */}
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nombre *</Form.Label>
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
                            placeholder="Solo letras y espacios"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.first_name}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Apellido *</Form.Label>
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
                            placeholder="Solo letras y espacios"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.last_name}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>Correo Electrónico *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={values.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.email && errors.email}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Número de Teléfono</Form.Label>
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
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.telefono}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Solo números y caracteres telefónicos (+, -, espacios)
                      </Form.Text>
                    </Form.Group>

                    {/* Campos específicos para EMPLEADOS */}
                    {isEmpleado && (
                      <>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>DNI *</Form.Label>
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
                              />
                              <Form.Control.Feedback type="invalid">
                                {errors.dni}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>

                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Fecha de Nacimiento *</Form.Label>
                              <Form.Control
                                type="date"
                                name="fecha_nacimiento"
                                value={values.fecha_nacimiento}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touched.fecha_nacimiento && errors.fecha_nacimiento}
                              />
                              <Form.Control.Feedback type="invalid">
                                {errors.fecha_nacimiento}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Form.Group className="mb-3">
                          <Form.Label>Ciudad *</Form.Label>
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
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.ciudad}
                          </Form.Control.Feedback>
                        </Form.Group>

                        <h5 className="mt-4 mb-3">Domicilio</h5>
                        <Row>
                          <Col md={4}>
                            <Form.Group className="mb-3">
                              <Form.Label>Barrio *</Form.Label>
                              <Form.Control
                                type="text"
                                name="barrio"
                                value={values.barrio}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touched.barrio && errors.barrio}
                                placeholder="Letras y números"
                              />
                              <Form.Control.Feedback type="invalid">
                                {errors.barrio}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>

                          <Col md={5}>
                            <Form.Group className="mb-3">
                              <Form.Label>Calle *</Form.Label>
                              <Form.Control
                                type="text"
                                name="calle"
                                value={values.calle}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                isInvalid={touched.calle && errors.calle}
                                placeholder="Letras y números"
                              />
                              <Form.Control.Feedback type="invalid">
                                {errors.calle}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>

                          <Col md={3}>
                            <Form.Group className="mb-3">
                              <Form.Label>Numeración *</Form.Label>
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
                              />
                              <Form.Control.Feedback type="invalid">
                                {errors.numeracion}
                              </Form.Control.Feedback>
                            </Form.Group>
                          </Col>
                        </Row>

                        <Form.Group className="mb-3">
                          <Form.Label>Puesto *</Form.Label>
                          <Form.Select
                            name="puesto"
                            value={values.puesto}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.puesto && errors.puesto}
                          >
                            <option value="">Selecciona un puesto</option>
                            {/* ✅ MODIFICADO: Solo las 2 opciones solicitadas */}
                            {puestosOptions.map((puesto) => (
                              <option key={puesto.value} value={puesto.value}>
                                {puesto.label}
                              </option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.puesto}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </>
                    )}

                    {/* Campos específicos para CLIENTES */}
                    {!isEmpleado && (
                      <>
                        <Form.Group className="mb-3">
                          <Form.Label>Ciudad de Interés</Form.Label>
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
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.ciudad_interes}
                          </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Intereses</Form.Label>
                          <Form.Select
                            name="intereses"
                            value={values.intereses}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            isInvalid={touched.intereses && errors.intereses}
                          >
                            <option value="">Selecciona una opción</option>
                            <option value="comprar">Comprar</option>
                            <option value="alquilar">Alquilar</option>
                            <option value="ambos">Ambos</option>
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.intereses}
                          </Form.Control.Feedback>
                          <Form.Text className="text-muted">
                            ¿Qué tipo de operación te interesa?
                          </Form.Text>
                        </Form.Group>
                      </>
                    )}

                    {/* Botón de guardar */}
                    <div className="d-grid gap-2 mt-4">
                      <Button
                        variant="dark"
                        type="submit"
                        size="lg"
                        disabled={isSubmitting || loading}
                        style={{
                          backgroundColor: '#000',
                          borderColor: '#000',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#333';
                          e.target.style.borderColor = '#333';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = '#000';
                          e.target.style.borderColor = '#000';
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
                              className="me-2"
                            />
                            Guardando...
                          </>
                        ) : (
                          'Guardar Cambios'
                        )}
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Perfil;
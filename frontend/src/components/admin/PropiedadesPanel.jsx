// src/components/admin/PropiedadesPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Table, Form, Row, Col, Modal, Badge, Spinner, Image } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { Formik } from 'formik';
import * as Yup from 'yup';
import propiedadService from '../../services/propiedadService';
import MapaSelector from '../common/MapaSelector';

const PropiedadesPanel = () => {
  const [propiedades, setPropiedades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [propiedadEditar, setPropiedadEditar] = useState(null);
  const [propiedadVer, setPropiedadVer] = useState(null);
  const [imagenesPrevias, setImagenesPrevias] = useState([]);
  const [imagenesSubir, setImagenesSubir] = useState([]);
  const [filtros, setFiltros] = useState({
    search: '',
    tipo: '',
    operacion: '',
  });

  const cargarPropiedades = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filtros.search) params.search = filtros.search;
      if (filtros.tipo) params.tipo = filtros.tipo;
      if (filtros.operacion) params.operacion = filtros.operacion;

      const data = await propiedadService.getAll(params);
      setPropiedades(data.results || data);
    } catch (error) {
      console.error('Error al cargar propiedades:', error);
      toast.error('Error al cargar las propiedades');
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    cargarPropiedades();
  }, [cargarPropiedades]);

  const validationSchema = Yup.object().shape({
    titulo: Yup.string().required('El título es requerido').min(10, 'Mínimo 10 caracteres'),
    descripcion: Yup.string().required('La descripción es requerida').min(50, 'Mínimo 50 caracteres'),
    tipo: Yup.string().required('El tipo es requerido'),
    operacion: Yup.string().required('La operación es requerida'),
    precio_venta: Yup.number().when('operacion', {
      is: (val) => val === 'venta' || val === 'ambos',
      then: (schema) => schema.required('El precio de venta es requerido').positive('Debe ser mayor a 0'),
    }),
    precio_alquiler: Yup.number().when('operacion', {
      is: (val) => val === 'alquiler' || val === 'ambos',
      then: (schema) => schema.required('El precio de alquiler es requerido').positive('Debe ser mayor a 0'),
    }),
    superficie_total: Yup.number().required('La superficie es requerida').positive('Debe ser mayor a 0'),
    direccion: Yup.string().required('La dirección es requerida'),
    barrio: Yup.string().required('El barrio es requerido'),
    zona: Yup.string().required('La zona es requerida'),
    agente: Yup.string().required('Seleccione un agente'),
    caracteristicas_list: Yup.array().of(Yup.string()).nullable(),
  });

  const handleImagenesChange = (e) => {
    const files = Array.from(e.target.files);

    // Validar tamaño y tipo
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} es muy grande. Máximo 5MB`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} no es una imagen`);
        return false;
      }
      return true;
    });

    // Crear previsualizaciones
    const previews = validFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImagenesPrevias(prev => [...prev, ...previews]);
    setImagenesSubir(prev => [...prev, ...validFiles]);
  };

  const handleRemoverImagen = (index) => {
    setImagenesPrevias(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].preview);
      newPreviews.splice(index, 1);
      return newPreviews;
    });

    setImagenesSubir(prev => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      let propiedadId;

      // Preparar características: vienen como array (caracteristicas_list)
      const propiedadData = {
        ...values,
        // mantener compatibilidad con backend si necesita string,
        // aquí enviamos caracteristicas_list (array) y también una versión en string si el backend la espera.
        caracteristicas: Array.isArray(values.caracteristicas_list)
          ? values.caracteristicas_list.join('\n')
          : (values.caracteristicas || ''),
      };

      if (propiedadEditar) {
        await propiedadService.update(propiedadEditar.id || propiedadEditar._id, propiedadData);
        propiedadId = propiedadEditar.id || propiedadEditar._id;
        toast.success('Propiedad actualizada exitosamente');
      } else {
        const nuevaPropiedad = await propiedadService.create(propiedadData);
        propiedadId = nuevaPropiedad.id || nuevaPropiedad._id;
        toast.success('Propiedad creada exitosamente');
      }

      // Subir imágenes
      if (imagenesSubir.length > 0) {
        toast.info('Subiendo imágenes...');

        for (let i = 0; i < imagenesSubir.length; i++) {
          const formData = new FormData();
          formData.append('imagen', imagenesSubir[i]);
          formData.append('orden', i);
          formData.append('es_principal', i === 0 ? 'true' : 'false');

          try {
            await propiedadService.subirImagen(propiedadId, formData);
          } catch (error) {
            console.error(`Error al subir imagen ${i + 1}:`, error);
          }
        }

        toast.success('Imágenes subidas exitosamente');
      }

      setShowModal(false);
      resetForm();
      setPropiedadEditar(null);
      setImagenesPrevias([]);
      setImagenesSubir([]);
      cargarPropiedades();
    } catch (error) {
      console.error('Error al guardar propiedad:', error);
      const errorMsg = error.titulo?.[0] || error.detail || 'Error al guardar la propiedad';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVer = (propiedad) => {
    setPropiedadVer(propiedad);
    setShowViewModal(true);
  };

  const handleEditar = (propiedad) => {
    // Convertir caracteristicas (string) a array si es necesario para inicializar el form
    const caracteristicasArray = propiedad.caracteristicas
      ? propiedad.caracteristicas.split('\n').filter(c => c.trim() !== '')
      : (propiedad.caracteristicas_list || []);

    setPropiedadEditar({
      ...propiedad,
      caracteristicas_list: caracteristicasArray,
    });

    // Previsualizaciones de imágenes (si las hay)
    if (propiedad.imagenes && propiedad.imagenes.length > 0) {
      const previews = propiedad.imagenes.map(img => ({
        preview: img.imagen,
        // file no disponible para imágenes ya subidas
      }));
      setImagenesPrevias(previews);
    } else {
      setImagenesPrevias([]);
    }

    setImagenesSubir([]);
    setShowModal(true);
  };

  const handleEliminar = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta propiedad? Esta acción no se puede deshacer.')) {
      try {
        await propiedadService.delete(id);
        toast.success('Propiedad eliminada exitosamente');
        cargarPropiedades();
      } catch (error) {
        console.error('Error al eliminar propiedad:', error);
        toast.error('Error al eliminar la propiedad');
      }
    }
  };

  return (
    <div>
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">
              <i className="fas fa-building me-2"></i>
              Gestión de Propiedades
            </h4>
            <Button
              variant="dark"
              onClick={() => {
                setPropiedadEditar(null);
                setImagenesPrevias([]);
                setImagenesSubir([]);
                setShowModal(true);
              }}
            >
              <i className="fas fa-plus me-2"></i>
              Nueva Propiedad
            </Button>
          </div>

          {/* Filtros */}
          <Row className="mb-4">
            <Col md={3}>
              <Form.Control
                type="text"
                placeholder="Buscar por título, dirección..."
                value={filtros.search}
                onChange={(e) => setFiltros({ ...filtros, search: e.target.value })}
              />
            </Col>
            <Col md={2}>
              <Form.Select
                value={filtros.tipo}
                onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              >
                <option value="">Todos los tipos</option>
                <option value="casa">Casa</option>
                <option value="departamento">Departamento</option>
                <option value="terreno">Terreno</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filtros.operacion}
                onChange={(e) => setFiltros({ ...filtros, operacion: e.target.value })}
              >
                <option value="">Todas las operaciones</option>
                <option value="venta">Venta</option>
                <option value="alquiler">Alquiler</option>
                <option value="ambos">Ambos</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Button
                variant="outline-secondary"
                onClick={() => setFiltros({ search: '', tipo: '', operacion: '' })}
                className="w-100"
              >
                <i className="fas fa-redo me-2"></i>
                Limpiar Filtros
              </Button>
            </Col>
          </Row>

          {/* Tabla */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="dark" />
              <p className="mt-2">Cargando propiedades...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Operación</th>
                    <th>Precio</th>
                    <th>Ubicación</th>
                    <th>Destacada</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {propiedades.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        <i className="fas fa-home fa-3x text-muted mb-3 d-block"></i>
                        No hay propiedades registradas
                      </td>
                    </tr>
                  ) : (
                    propiedades.map((propiedad) => (
                      <tr key={propiedad.id || propiedad._id}>
                        <td className="fw-bold">{propiedad.titulo}</td>
                        <td className="text-capitalize">{propiedad.tipo}</td>
                        <td className="text-capitalize">{propiedad.operacion}</td>
                        <td>{propiedad.precio_display || propiedad.precio || ''}</td>
                        <td>{propiedad.barrio}</td>
                        <td>
                          {propiedad.destacada ? (
                            <i className="fas fa-star text-warning"></i>
                          ) : (
                            <i className="far fa-star text-muted"></i>
                          )}
                        </td>
                        <td>
                          <Button
                            variant="outline-info"
                            size="sm"
                            className="me-1"
                            onClick={() => handleVer(propiedad)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditar(propiedad)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleEliminar(propiedad.id || propiedad._id)}
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
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="xl" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-building me-2"></i>
            Detalles de la Propiedad
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {propiedadVer && (
            <div>
              {/* Imágenes */}
              {propiedadVer.imagenes && propiedadVer.imagenes.length > 0 && (
                <Row className="mb-4">
                  <Col md={12}>
                    <h5 className="text-primary mb-3">
                      <i className="fas fa-images me-2"></i>
                      Imágenes
                    </h5>
                    <div className="d-flex flex-wrap gap-2">
                      {propiedadVer.imagenes.map((imagen, index) => (
                        <div key={index} className="position-relative">
                          <Image
                            src={imagen.imagen}
                            thumbnail
                            style={{ width: '200px', height: '200px', objectFit: 'cover' }}
                          />
                          {imagen.es_principal && (
                            <Badge bg="primary" className="position-absolute top-0 start-0 m-2">
                              Principal
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </Col>
                </Row>
              )}

              {/* Información Básica */}
              <Row className="mb-4">
                <Col md={12}>
                  <h5 className="text-primary mb-3">
                    <i className="fas fa-info-circle me-2"></i>
                    Información Básica
                  </h5>
                </Col>
                <Col md={12}>
                  <h4 className="mb-3">{propiedadVer.titulo}</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{propiedadVer.descripcion}</p>
                </Col>
                <Col md={4}>
                  <p><strong>Tipo:</strong><br/>
                    <span className="text-capitalize">{propiedadVer.tipo}</span>
                  </p>
                </Col>
                <Col md={4}>
                  <p><strong>Operación:</strong><br/>
                    <span className="text-capitalize">{propiedadVer.operacion}</span>
                  </p>
                </Col>
                <Col md={4}>
                  <p><strong>Agente a cargo:</strong><br/>
                    <span>{propiedadVer.agente || 'Sin asignar'}</span>
                  </p>
                </Col>
              </Row>

              {/* Precios */}
              <Row className="mb-4">
                <Col md={12}>
                  <h5 className="text-primary mb-3">
                    <i className="fas fa-dollar-sign me-2"></i>
                    Precios
                  </h5>
                </Col>
                {propiedadVer.precio_venta && (
                  <Col md={6}>
                    <p><strong>Precio de Venta:</strong><br/>
                      {propiedadVer.moneda} {parseFloat(propiedadVer.precio_venta).toLocaleString()}
                    </p>
                  </Col>
                )}
                {propiedadVer.precio_alquiler && (
                  <Col md={6}>
                    <p><strong>Precio de Alquiler (Mensual):</strong><br/>
                      {propiedadVer.moneda} {parseFloat(propiedadVer.precio_alquiler).toLocaleString()}
                    </p>
                  </Col>
                )}
              </Row>

              {/* Características */}
              <Row className="mb-4">
                <Col md={12}>
                  <h5 className="text-primary mb-3">
                    <i className="fas fa-list me-2"></i>
                    Características
                  </h5>
                </Col>
                <Col md={3}>
                  <p><strong>Superficie Total:</strong><br/>{propiedadVer.superficie_total} m²</p>
                </Col>
                {propiedadVer.superficie_cubierta && (
                  <Col md={3}>
                    <p><strong>Superficie Cubierta:</strong><br/>{propiedadVer.superficie_cubierta} m²</p>
                  </Col>
                )}
                <Col md={2}>
                  <p><strong>Dormitorios:</strong><br/>{propiedadVer.dormitorios}</p>
                </Col>
                <Col md={2}>
                  <p><strong>Baños:</strong><br/>{propiedadVer.banos}</p>
                </Col>
                <Col md={2}>
                  <p><strong>Cocheras:</strong><br/>{propiedadVer.cocheras}</p>
                </Col>
              </Row>

              {/* Ubicación */}
              <Row className="mb-4">
                <Col md={12}>
                  <h5 className="text-primary mb-3">
                    <i className="fas fa-map-marker-alt me-2"></i>
                    Ubicación
                  </h5>
                </Col>
                <Col md={12}>
                  <p><strong>Dirección:</strong><br/>{propiedadVer.direccion}</p>
                </Col>
                <Col md={4}>
                  <p><strong>Barrio:</strong><br/>{propiedadVer.barrio}</p>
                </Col>
                <Col md={4}>
                  <p><strong>Ciudad:</strong><br/>{propiedadVer.ciudad}</p>
                </Col>
                <Col md={4}>
                  <p><strong>Zona:</strong><br/>
                    <span className="text-capitalize">{propiedadVer.zona}</span>
                  </p>
                </Col>
                { (propiedadVer.latitud && propiedadVer.longitud) && (
                  <Col md={12} className="mt-3">
                    <div style={{ width: '100%', height: '300px' }}>
                      {/* Muestra un mapa estático con la ubicación (embed) si api key o preferencia */}
                      <iframe
                        title="mapa-propiedad"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://www.google.com/maps?q=${propiedadVer.latitud},${propiedadVer.longitud}&z=16&output=embed`}
                        allowFullScreen
                      />
                    </div>
                  </Col>
                )}
              </Row>

              {/* Características Principales (listado) */}
              { (propiedadVer.caracteristicas || propiedadVer.caracteristicas_list) && (
                <Row>
                  <Col md={12}>
                    <h5 className="text-primary mb-3">
                      <i className="fas fa-check-square me-2"></i>
                      Características Principales
                    </h5>
                    <ul>
                      {Array.isArray(propiedadVer.caracteristicas_list) && propiedadVer.caracteristicas_list.length > 0
                        ? propiedadVer.caracteristicas_list.map((c, idx) => <li key={idx}>{c}</li>)
                        : String(propiedadVer.caracteristicas || '')
                            .split('\n')
                            .filter(c => c.trim() !== '')
                            .map((c, idx) => <li key={idx}>{c}</li>)
                      }
                    </ul>
                  </Col>
                </Row>
              )}

              {/* Destacada */}
              {propiedadVer.destacada && (
                <Row>
                  <Col md={12}>
                    <Badge bg="warning" className="text-dark">
                      <i className="fas fa-star me-2"></i>
                      Propiedad Destacada
                    </Badge>
                  </Col>
                </Row>
              )}
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
              handleEditar(propiedadVer);
            }}
          >
            <i className="fas fa-edit me-2"></i>
            Editar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Formulario */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            {propiedadEditar ? 'Editar Propiedad' : 'Nueva Propiedad'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={{
              titulo: propiedadEditar?.titulo || '',
              descripcion: propiedadEditar?.descripcion || '',
              tipo: propiedadEditar?.tipo || '',
              operacion: propiedadEditar?.operacion || '',
              // estado ya no se edita desde UI; backend lo pondrá por defecto si hace falta
              precio_venta: propiedadEditar?.precio_venta || '',
              precio_alquiler: propiedadEditar?.precio_alquiler || '',
              moneda: propiedadEditar?.moneda || 'USD',
              superficie_total: propiedadEditar?.superficie_total || '',
              superficie_cubierta: propiedadEditar?.superficie_cubierta || '',
              dormitorios: propiedadEditar?.dormitorios || 0,
              banos: propiedadEditar?.banos || 0,
              cocheras: propiedadEditar?.cocheras || 0,
              direccion: propiedadEditar?.direccion || '',
              barrio: propiedadEditar?.barrio || '',
              ciudad: propiedadEditar?.ciudad || 'Salta',
              zona: propiedadEditar?.zona || '',
              latitud: propiedadEditar?.latitud || '',
              longitud: propiedadEditar?.longitud || '',
              caracteristicas_list: propiedadEditar?.caracteristicas_list || [],
              destacada: propiedadEditar?.destacada || false,
              agente: propiedadEditar?.agente || '',
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
                {/* Información Básica */}
                <h5 className="mb-3 text-primary">
                  <i className="fas fa-info-circle me-2"></i>
                  Información Básica
                </h5>

                <Form.Group className="mb-3">
                  <Form.Label>Título de la Publicación *</Form.Label>
                  <Form.Control
                    type="text"
                    name="titulo"
                    placeholder="Ej: Hermosa casa en Tres Cerritos con piscina"
                    value={values.titulo}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.titulo && errors.titulo}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.titulo}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Descripción *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="descripcion"
                    placeholder="Describa la propiedad en detalle..."
                    value={values.descripcion}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.descripcion && errors.descripcion}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.descripcion}
                  </Form.Control.Feedback>
                </Form.Group>

                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tipo de Propiedad *</Form.Label>
                      <Form.Select
                        name="tipo"
                        value={values.tipo}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.tipo && errors.tipo}
                      >
                        <option value="">Seleccione...</option>
                        <option value="casa">Casa</option>
                        <option value="departamento">Departamento</option>
                        <option value="terreno">Terreno</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.tipo}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Operación *</Form.Label>
                      <Form.Select
                        name="operacion"
                        value={values.operacion}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.operacion && errors.operacion}
                      >
                        <option value="">Seleccione...</option>
                        <option value="venta">Venta</option>
                        <option value="alquiler">Alquiler</option>
                        <option value="ambos">Venta y Alquiler</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.operacion}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Agente a cargo *</Form.Label>
                      <Form.Select
                        name="agente"
                        value={values.agente}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.agente && errors.agente}
                      >
                        <option value="">Seleccione un agente...</option>
                        <option value="Gabriel Gómez">Gabriel Gómez</option>
                        <option value="Facundo Torrez">Facundo Torrez</option>
                        <option value="Matías Hernandez">Matías Hernandez</option>
                        <option value="Miguel Nazr">Miguel Nazr</option>
                        <option value="Kevin Roldán">Kevin Roldán</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.agente}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Precios */}
                <h5 className="mb-3 text-primary mt-4">
                  <i className="fas fa-dollar-sign me-2"></i>
                  Precios
                </h5>

                <Row>
                  {(values.operacion === 'venta' || values.operacion === 'ambos') && (
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Precio de Venta *</Form.Label>
                        <Form.Control
                          type="number"
                          name="precio_venta"
                          placeholder="0.00"
                          value={values.precio_venta}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.precio_venta && errors.precio_venta}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.precio_venta}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  )}
                  {(values.operacion === 'alquiler' || values.operacion === 'ambos') && (
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Precio de Alquiler (Mensual) *</Form.Label>
                        <Form.Control
                          type="number"
                          name="precio_alquiler"
                          placeholder="0.00"
                          value={values.precio_alquiler}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          isInvalid={touched.precio_alquiler && errors.precio_alquiler}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.precio_alquiler}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  )}
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Moneda</Form.Label>
                      <Form.Select
                        name="moneda"
                        value={values.moneda}
                        onChange={handleChange}
                      >
                        <option value="USD">Dólares (USD)</option>
                        <option value="ARS">Pesos (ARS)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Características */}
                <h5 className="mb-3 text-primary mt-4">
                  <i className="fas fa-list me-2"></i>
                  Características
                </h5>

                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Superficie Total (m²) *</Form.Label>
                      <Form.Control
                        type="number"
                        name="superficie_total"
                        value={values.superficie_total}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.superficie_total && errors.superficie_total}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.superficie_total}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Superficie Cubierta (m²)</Form.Label>
                      <Form.Control
                        type="number"
                        name="superficie_cubierta"
                        value={values.superficie_cubierta}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>Dormitorios</Form.Label>
                      <Form.Control
                        type="number"
                        name="dormitorios"
                        value={values.dormitorios}
                        onChange={handleChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>Baños</Form.Label>
                      <Form.Control
                        type="number"
                        name="banos"
                        value={values.banos}
                        onChange={handleChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>Cocheras</Form.Label>
                      <Form.Control
                        type="number"
                        name="cocheras"
                        value={values.cocheras}
                        onChange={handleChange}
                        min="0"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Ubicación */}
                <h5 className="mb-3 text-primary mt-4">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Ubicación
                </h5>

                <Form.Group className="mb-3">
                  <Form.Label>Dirección *</Form.Label>
                  <Form.Control
                    type="text"
                    name="direccion"
                    placeholder="Calle y número"
                    value={values.direccion}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    isInvalid={touched.direccion && errors.direccion}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.direccion}
                  </Form.Control.Feedback>
                </Form.Group>

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
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.barrio}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Ciudad</Form.Label>
                      <Form.Control
                        type="text"
                        name="ciudad"
                        value={values.ciudad}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Zona *</Form.Label>
                      <Form.Select
                        name="zona"
                        value={values.zona}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.zona && errors.zona}
                      >
                        <option value="">Seleccione...</option>
                        <option value="norte">Norte</option>
                        <option value="sur">Sur</option>
                        <option value="este">Este</option>
                        <option value="oeste">Oeste</option>
                        <option value="micro-centro">Micro Centro</option>
                        <option value="macro-centro">Macro Centro</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.zona}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                {/* MAPA SELECTOR */}
                <Form.Group className="mb-3">
                  <Form.Label>Seleccionar ubicación en el mapa</Form.Label>
                  <MapaSelector
                    initialLat={values.latitud || null}
                    initialLng={values.longitud || null}
                    initialAddress={values.direccion || ''}
                    onLocationChange={({ lat, lng, address, barrio, ciudad }) => {
                      setFieldValue('latitud', lat);
                      setFieldValue('longitud', lng);
                      if (address) setFieldValue('direccion', address);
                      if (barrio) setFieldValue('barrio', barrio);
                      if (ciudad) setFieldValue('ciudad', ciudad);
                    }}
                  />
                  <Form.Text className="text-muted">
                    Busca la dirección y arrastra el marcador para ajustar la posición exacta.
                  </Form.Text>
                </Form.Group>

                {/* ocultos: lat/lng (guardamos por el mapa) */}
                <Row className="d-none">
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Latitud</Form.Label>
                      <Form.Control
                        type="number"
                        step="any"
                        name="latitud"
                        placeholder="-24.7821"
                        value={values.latitud}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Longitud</Form.Label>
                      <Form.Control
                        type="number"
                        step="any"
                        name="longitud"
                        placeholder="-65.4232"
                        value={values.longitud}
                        onChange={handleChange}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Características Principales (MULTISELECT) */}
                <h5 className="mb-3 text-primary mt-4">
                  <i className="fas fa-check-square me-2"></i>
                  Características Principales
                </h5>

                <Form.Group className="mb-3">
                  <Form.Label>Características</Form.Label>
                  <Form.Select
                    multiple
                    value={values.caracteristicas_list}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setFieldValue('caracteristicas_list', selected);
                    }}
                    onBlur={handleBlur}
                    name="caracteristicas_list"
                  >
                    <option value="Jardín">Jardín</option>
                    <option value="Cocina integrada">Cocina integrada</option>
                    <option value="Balcón">Balcón</option>
                    <option value="Pileta">Pileta</option>
                    <option value="Gimnasio">Gimnasio</option>
                  </Form.Select>
                  <Form.Text className="text-muted">
                    Mantén presionada Ctrl (Cmd en macOS) para seleccionar múltiples opciones.
                  </Form.Text>
                </Form.Group>

                {/* Imágenes */}
                <h5 className="mb-3 text-primary mt-4">
                  <i className="fas fa-images me-2"></i>
                  Imágenes
                </h5>

                <Form.Group className="mb-3">
                  <Form.Label>Subir Imágenes</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImagenesChange}
                  />
                  <Form.Text className="text-muted">
                    Puede seleccionar múltiples imágenes. Máximo 5MB por imagen. La primera será la principal.
                  </Form.Text>
                </Form.Group>

                {imagenesPrevias.length > 0 && (
                  <div className="mb-3">
                    <div className="d-flex flex-wrap gap-2">
                      {imagenesPrevias.map((prev, index) => (
                        <div key={index} className="position-relative">
                          <Image
                            src={prev.preview}
                            thumbnail
                            style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            className="position-absolute top-0 end-0 m-1"
                            onClick={() => handleRemoverImagen(index)}
                          >
                            <i className="fas fa-times"></i>
                          </Button>
                          {index === 0 && (
                            <Badge bg="primary" className="position-absolute bottom-0 start-0 m-1">
                              Principal
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Destacada */}
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Marcar como propiedad destacada"
                    name="destacada"
                    checked={values.destacada}
                    onChange={handleChange}
                  />
                </Form.Group>

                <div className="d-flex justify-content-end gap-2 mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowModal(false);
                      setImagenesPrevias([]);
                      setImagenesSubir([]);
                    }}
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
                        Guardar Propiedad
                      </>
                    )}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default PropiedadesPanel;
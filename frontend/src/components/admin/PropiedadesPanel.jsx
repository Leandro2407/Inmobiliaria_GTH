// src/components/admin/PropiedadesPanel.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Button, Table, Form, Row, Col, Modal, Badge, Spinner, Image } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { Formik } from 'formik';
import * as Yup from 'yup';
import propiedadService from '../../services/propiedadService';
import api, { BACKEND_URL } from '../../services/api'; 
import MapaSelector from '../common/MapaSelector';

// NOTE: Se eliminó la lógica de imágenes aleatorias y los imports asociados, ya que ahora se usan los archivos seleccionados por el usuario

// Componente de Modal de Confirmación Personalizado para Eliminar
const ConfirmDeleteModal = ({ show, onHide, onConfirm, propiedadTitulo }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="w-100 text-center">
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '3rem', color: '#6c757d' }}></i>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center px-4">
        <h5 className="mb-3">¿Está seguro que desea eliminar esta propiedad?</h5>
        <p className="text-muted mb-0">
          <strong>{propiedadTitulo}</strong>
        </p>
        <p className="text-muted small">
          Esta acción no se puede deshacer
        </p>
      </Modal.Body>
      <Modal.Footer className="border-0 justify-content-center pb-4">
        <Button 
          variant="outline-secondary" 
          onClick={onHide}
          className="px-4"
        >
          Cancelar
        </Button>
        <Button 
          variant="dark" 
          onClick={onConfirm}
          className="px-4"
        >
          Eliminar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const PropiedadesPanel = () => {
  const [propiedades, setPropiedades] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propiedadEditar, setPropiedadEditar] = useState(null);
  const [propiedadVer, setPropiedadVer] = useState(null);
  const [propiedadEliminar, setPropiedadEliminar] = useState(null);
  const [imagenesPrevias, setImagenesPrevias] = useState([]);
  const fileInputRef = React.useRef(null);
  // ✅ FIX: useRef para que handleSubmit siempre lea el valor actualizado de imagenesPrevias
  const imagenesPreviasRef = useRef([]);
  const [filtros, setFiltros] = useState({
    search: '',
    tipo: '',
    operacion: '',
  });

  // Estado para el tipo de propiedad en el wizard (para el indicador de progreso)
  const [currentPropertyType, setCurrentPropertyType] = useState('');

  // Estado para el wizard de pasos
  const [currentStep, setCurrentStep] = useState(0);

  // Definición de las secciones del wizard
  const steps = [
    {
      title: 'Información Básica',
      fields: ['titulo', 'descripcion', 'tipo', 'operacion', 'agente_cargo'],
      required: ['titulo', 'descripcion', 'tipo', 'operacion', 'agente_cargo']
    },
    {
      title: 'Precios',
      fields: values => values.operacion === 'venta' ? ['precio_venta'] : ['precio_alquiler'],
      required: values => values.operacion === 'venta' ? ['precio_venta'] : ['precio_alquiler']
    },
    {
      title: 'Características',
      fields: ['superficie_total'],
      required: ['superficie_total']
    },
    {
      title: 'Ubicación',
      fields: ['calle', 'numero_calle', 'barrio', 'zona'],
      required: ['calle', 'numero_calle', 'barrio', 'zona']
    },
    {
      title: 'Características Principales',
      fields: [],
      required: []
    },
    {
      title: 'Imágenes',
      fields: [],
      required: []
    }
  ];

  // Opciones de características principales
  const CARACTERISTICAS_OPTIONS = [
    'Jardín', 'Cocina integrada', 'Balcón', 'Pileta', 'Gimnasio', 'Quincho',
    'Seguridad', 'Aire Acondicionado', 'Calefacción', 'Lavadero', 'Patio'
  ];

  // Cargar propiedades
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

  // Cargar lista de Agentes
  const cargarAgentes = useCallback(async () => {
    try {
      const response = await api.get('/auth/agentes/');
      setAgentes(response.data.results || response.data);
    } catch (error) {
      console.error('Error al cargar agentes:', error);
    }
  }, []);

  useEffect(() => {
    cargarPropiedades();
    cargarAgentes();
  }, [cargarPropiedades, cargarAgentes]);

  const resetWizard = () => {
    setCurrentStep(0);
    setCurrentPropertyType('');
  };

  const ensureAbsoluteUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/400x300/343a40/ffffff?text=Propiedad';
    if (url.startsWith('http')) return url;
    return `${BACKEND_URL}${url}`;
  };

  const validationSchema = Yup.object().shape({
    titulo: Yup.string().required('El título es requerido').min(10, 'Mínimo 10 caracteres'),
    descripcion: Yup.string().required('La descripción es requerida').min(25, 'Mínimo 25 caracteres'),
    tipo: Yup.string().required('El tipo es requerido'),
    operacion: Yup.string().required('La operación es requerida'),
    precio_venta: Yup.number().when('operacion', {
      is: 'venta',
      then: (schema) => schema.required('El precio de venta es requerido').positive('Debe ser mayor a 0').integer('Debe ser un número entero'),
    }),
    precio_alquiler: Yup.number().when('operacion', {
      is: 'alquiler',
      then: (schema) => schema.required('El precio de alquiler es requerido').positive('Debe ser mayor a 0').integer('Debe ser un número entero'),
    }),
    superficie_total: Yup.number().required('La superficie es requerida').positive('Debe ser mayor a 0'),
    calle: Yup.string().required('El nombre de la calle es requerido'),
    numero_calle: Yup.string().required('El número es requerido'),
    barrio: Yup.string().required('El barrio es requerido'),
    zona: Yup.string().required('La zona es requerida'),
    agente_cargo: Yup.string().required('Seleccione un agente'),
  });

  // Formatear número con separadores de miles
  const formatNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Remover formato de número
  const unformatNumber = (value) => {
    if (!value) return '';
    return value.replace(/\./g, '');
  };

  const handleImagenesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const max = 5;
    const seleccionadas = files.slice(0, max);
    const previews = seleccionadas.map((file) => {
      return {
        preview: URL.createObjectURL(file),
        file: file,
        isNew: true,
      };
    });

    // ✅ FIX: actualizar tanto el estado como el ref
    setImagenesPrevias(prev => {
      const nuevas = [...prev, ...previews];
      imagenesPreviasRef.current = nuevas;
      return nuevas;
    });
    toast.info(`${previews.length} imagen(es) cargada(s)`);
  };

  const handleRemoverImagen = async (index) => {
    const imagenToRemove = imagenesPrevias[index];
    
    // liberar URL de objeto creada para preview si es nueva
    if (imagenToRemove.isNew && imagenToRemove.preview) {
      URL.revokeObjectURL(imagenToRemove.preview);
    }

    if (!imagenToRemove.isNew && imagenToRemove.id) {
       if(window.confirm("¿Deseas eliminar esta imagen guardada permanentemente?")) {
           try {
               await propiedadService.eliminarImagen(imagenToRemove.id);
               toast.success("Imagen eliminada");
           } catch(error) {
               toast.error("Error al eliminar imagen");
               return;
           }
       } else {
           return;
       }
    }

    setImagenesPrevias(prev => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      imagenesPreviasRef.current = newPreviews;
      return newPreviews;
    });
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      let propiedadId;

      // Construir dirección completa
      const direccionCompleta = `${values.calle} ${values.numero_calle}`;

      // Preparar datos de la propiedad
      const propiedadData = {
        ...values,
        direccion: direccionCompleta,
        caracteristicas: Array.isArray(values.caracteristicas_list) && values.caracteristicas_list.length > 0
          ? values.caracteristicas_list.join('\n')
          : '',
      };

      // Remover campos temporales
      delete propiedadData.calle;
      delete propiedadData.numero_calle;
      delete propiedadData.caracteristicas_list;

      // Normalizar campos para evitar enviar strings vacíos que fallan en el serializer
      if (propiedadData.precio_venta === '') delete propiedadData.precio_venta;
      if (propiedadData.precio_alquiler === '') delete propiedadData.precio_alquiler;
      if (propiedadData.latitud === '') delete propiedadData.latitud;
      if (propiedadData.longitud === '') delete propiedadData.longitud;
      if (propiedadData.agente_cargo === '') propiedadData.agente_cargo = null;

      // Coercer campos numéricos a Number
      const toNumber = (v, { allowDecimals = true, decimals = 8 } = {}) => {
        if (v === null || v === undefined || v === '') return undefined;
        let s = String(v).trim();

        if (allowDecimals) {
          s = s.replace(/\s/g, '').replace(',', '.');
        } else {
          s = s.replace(/\./g, '').replace(',', '.');
        }

        const n = Number(s);
        if (Number.isNaN(n)) return undefined;

        if (typeof decimals === 'number') {
          const factor = Math.pow(10, decimals);
          return Math.round(n * factor) / factor;
        }

        return n;
      };

      if ('precio_venta' in propiedadData) propiedadData.precio_venta = toNumber(propiedadData.precio_venta, { allowDecimals: false, decimals: 2 });
      if ('precio_alquiler' in propiedadData) propiedadData.precio_alquiler = toNumber(propiedadData.precio_alquiler, { allowDecimals: false, decimals: 2 });
      if ('superficie_total' in propiedadData) propiedadData.superficie_total = toNumber(propiedadData.superficie_total, { allowDecimals: true, decimals: 2 });
      if ('superficie_cubierta' in propiedadData) propiedadData.superficie_cubierta = toNumber(propiedadData.superficie_cubierta, { allowDecimals: true, decimals: 2 });
      if ('latitud' in propiedadData) propiedadData.latitud = toNumber(propiedadData.latitud, { allowDecimals: true, decimals: 8 });
      if ('longitud' in propiedadData) propiedadData.longitud = toNumber(propiedadData.longitud, { allowDecimals: true, decimals: 8 });

      // Asegurar que agente_cargo sea null o entero
      if (propiedadData.agente_cargo) {
        propiedadData.agente_cargo = Number(propiedadData.agente_cargo);
        if (Number.isNaN(propiedadData.agente_cargo)) propiedadData.agente_cargo = null;
      }

      if (propiedadEditar) {
        console.debug('Enviar propiedad (update):', propiedadData);
        await propiedadService.update(propiedadEditar.id, propiedadData);
        propiedadId = propiedadEditar.id;
        toast.success('Propiedad actualizada exitosamente');
      } else {
        console.debug('Enviar propiedad (create):', propiedadData);
        const nuevaPropiedad = await propiedadService.create(propiedadData);
        console.log('Nueva propiedad creada:', nuevaPropiedad); // DEBUG
        propiedadId = nuevaPropiedad.id;
        console.log('ID de la propiedad:', propiedadId); // DEBUG
        toast.success('Propiedad creada exitosamente');
      }

      // Validar que tenemos un ID válido antes de subir imágenes
      if (!propiedadId) {
        console.error('No se pudo obtener el ID de la propiedad');
        toast.error('Error: No se pudo obtener el ID de la propiedad');
        return;
      }

      // ✅ FIX: leer del ref para evitar stale closure con imagenesPrevias
      const imagenesNuevas = imagenesPreviasRef.current.filter(img => img.isNew && img.file);
      console.log('imagenesPreviasRef antes de upload:', imagenesPreviasRef.current);
      console.log('imagenesNuevas a procesar:', imagenesNuevas);
      
      if (imagenesNuevas.length > 0) {
        console.log(`Subiendo ${imagenesNuevas.length} imágenes a la propiedad ${propiedadId}`); // DEBUG
        let imagenesSubidas = 0;
        
        for (let i = 0; i < imagenesNuevas.length; i++) {
          const img = imagenesNuevas[i];
          const formData = new FormData();
          formData.append('imagen', img.file);
          formData.append('orden', i);
          formData.append('es_principal', i === 0);
          
          try {
            console.log(`Subiendo imagen ${i + 1} a propiedad ${propiedadId}`);
            const res = await propiedadService.subirImagen(propiedadId, formData);
            console.log('Respuesta upload:', res);
            imagenesSubidas++;
          } catch (error) {
            console.error('Error subiendo imagen:', error);
            const msg = error?.response?.data || error.message || 'desconocido';
            toast.error(`Error al subir imagen ${i + 1}: ${JSON.stringify(msg)}`);
          }
        }
        
        if (imagenesSubidas > 0) {
          toast.success(`${imagenesSubidas} imagen(es) subida(s) exitosamente`);
        }
      }

      setShowModal(false);
      
      // ✅ FIX: Esperar a que Bootstrap termine la transición del modal (300ms min)
      setTimeout(() => {
        resetForm();
        setPropiedadEditar(null);
        setImagenesPrevias([]);
        imagenesPreviasRef.current = [];
        resetWizard();
        cargarPropiedades();
      }, 350);
    } catch (error) {
      const serverData = error?.response?.data;
      try {
        console.error('Error al guardar propiedad:', serverData ? JSON.stringify(serverData, null, 2) : error);
      } catch (e) {
        console.error('Error al guardar propiedad (no JSON):', serverData || error);
      }
      if (error?.response?.status) console.error('Status:', error.response.status);
      const data = error.response?.data;
      let errorMsg = 'Error al guardar la propiedad';

      if (data) {
        if (typeof data === 'string') {
          errorMsg = data;
        } else if (typeof data === 'object') {
          errorMsg = Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join('; ') : v}`).join(' | ');
        }
      }

      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVer = async (propiedad) => {
    try {
      const propiedadCompleta = await propiedadService.getById(propiedad.id);
      setPropiedadVer(propiedadCompleta);
      setShowViewModal(true);
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      toast.error('Error al cargar los detalles de la propiedad');
    }
  };

  const handleEditar = async (propiedad) => {
    try {
      const propiedadCompleta = await propiedadService.getById(propiedad.id);
      
      // Separar dirección en calle y número
      const direccionParts = propiedadCompleta.direccion ? propiedadCompleta.direccion.split(' ') : ['', ''];
      const numero = direccionParts[direccionParts.length - 1];
      const calle = direccionParts.slice(0, -1).join(' ');

      // Convertir características
      const caracteristicasArray = propiedadCompleta.caracteristicas
        ? propiedadCompleta.caracteristicas.split('\n').filter(c => c.trim() !== '')
        : [];

      setPropiedadEditar({
        ...propiedadCompleta,
        calle: calle,
        numero_calle: numero,
        caracteristicas_list: caracteristicasArray,
      });

      setCurrentPropertyType(propiedadCompleta.tipo || '');

      // FIX: Cargar imagenes existentes y sincronizar el ref
      if (propiedadCompleta.imagenes && propiedadCompleta.imagenes.length > 0) {
        const previews = propiedadCompleta.imagenes.map(img => {
          const url = img.imagen || '';
          const previewUrl = url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
          return { preview: previewUrl, imagen: url, isNew: false, id: img.id };
        });
        setImagenesPrevias(previews);
        imagenesPreviasRef.current = previews;
      } else {
        setImagenesPrevias([]);
        imagenesPreviasRef.current = [];
      }

      resetWizard();
      setShowModal(true);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos de la propiedad');
    }
  };

  const handleEliminar = (propiedad) => {
    setPropiedadEliminar(propiedad);
    setShowDeleteModal(true);
  };

  const confirmarEliminar = async () => {
    if (!propiedadEliminar) return;
    
    try {
      await propiedadService.delete(propiedadEliminar.id);
      toast.success('Propiedad eliminada exitosamente');
      setShowDeleteModal(false);
      setPropiedadEliminar(null);
      cargarPropiedades();
    } catch (error) {
      console.error('Error al eliminar propiedad:', error);
      toast.error('Error al eliminar la propiedad');
    }
  };

  return (
    <div>
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0" style={{ color: '#000' }}>
              <i className="fas fa-building me-2"></i>
              Gestión de Propiedades
            </h4>
            <Button
              variant="dark"
              onClick={() => {
                setPropiedadEditar(null);
                setImagenesPrevias([]);
                resetWizard();
                setCurrentPropertyType('');
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
                      <tr key={propiedad.id}>
                        <td className="fw-bold">{propiedad.titulo}</td>
                        <td className="text-capitalize">{propiedad.tipo}</td>
                        <td className="text-capitalize">{propiedad.operacion}</td>
                        <td>{propiedad.precio_display || ''}</td>
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
                            variant="outline-dark"
                            size="sm"
                            className="me-1"
                            onClick={() => handleVer(propiedad)}
                            title="Ver detalles"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button
                            variant="outline-dark"
                            size="sm"
                            className="me-1"
                            onClick={() => handleEditar(propiedad)}
                            title="Editar"
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button
                            variant="outline-dark"
                            size="sm"
                            onClick={() => handleEliminar(propiedad)}
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
        <Modal.Header closeButton style={{ backgroundColor: '#2c2c2c', color: 'white', borderBottom: 'none' }}>
          <Modal.Title>
            <i className="fas fa-building me-2"></i>
            Detalles de la Propiedad
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: '#f8f9fa' }}>
          {propiedadVer && (
            <div>
              {/* Imágenes */}
              {propiedadVer.imagenes && propiedadVer.imagenes.length > 0 && (
                <Card className="mb-3 border-0 shadow-sm">
                  <Card.Body>
                    <h5 className="mb-3" style={{ color: '#2c2c2c' }}>
                      <i className="fas fa-images me-2"></i>
                      Imágenes
                    </h5>
                    <div className="d-flex flex-wrap gap-2">
                      {propiedadVer.imagenes.map((imagen, index) => (
                        <div key={index} className="position-relative">
                          <Image
                            src={ensureAbsoluteUrl(imagen.imagen)}
                            thumbnail
                            style={{ width: '200px', height: '200px', objectFit: 'cover' }}
                          />
                          {imagen.es_principal && (
                            <Badge bg="dark" className="position-absolute top-0 start-0 m-2">
                              Principal
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* Información Básica */}
              <Card className="mb-3 border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3" style={{ color: '#2c2c2c' }}>
                    <i className="fas fa-info-circle me-2"></i>
                    Información Básica
                  </h5>
                  <h4 className="mb-3">{propiedadVer.titulo}</h4>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{propiedadVer.descripcion}</p>
                  <Row>
                    <Col md={4} className="mb-3">
                      <p className="mb-1 text-muted small">Tipo:</p>
                      <p className="fw-bold mb-0 text-capitalize">{propiedadVer.tipo}</p>
                    </Col>
                    <Col md={4} className="mb-3">
                      <p className="mb-1 text-muted small">Operación:</p>
                      <p className="fw-bold mb-0 text-capitalize">{propiedadVer.operacion}</p>
                    </Col>
                    <Col md={4} className="mb-3">
                      <p className="mb-1 text-muted small">Agente a cargo:</p>
                      <p className="fw-bold mb-0">{propiedadVer.agente_nombre || 'Sin asignar'}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Precios */}
              <Card className="mb-3 border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3" style={{ color: '#2c2c2c' }}>
                    <i className="fas fa-dollar-sign me-2"></i>
                    Precios
                  </h5>
                  <Row>
                    {propiedadVer.precio_venta && (
                      <Col md={6} className="mb-3">
                        <p className="mb-1 text-muted small">Precio de Venta:</p>
                        <p className="fw-bold mb-0">
                          {propiedadVer.moneda} {formatNumber(Math.round(propiedadVer.precio_venta))}
                        </p>
                      </Col>
                    )}
                    {propiedadVer.precio_alquiler && (
                      <Col md={6} className="mb-3">
                        <p className="mb-1 text-muted small">Precio de Alquiler (Mensual):</p>
                        <p className="fw-bold mb-0">
                          {propiedadVer.moneda} {formatNumber(Math.round(propiedadVer.precio_alquiler))}
                        </p>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>

              {/* Características */}
              <Card className="mb-3 border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3" style={{ color: '#2c2c2c' }}>
                    <i className="fas fa-list me-2"></i>
                    Características
                  </h5>
                  <Row>
                    <Col md={3} className="mb-3">
                      <p className="mb-1 text-muted small">Superficie Total:</p>
                      <p className="fw-bold mb-0">{propiedadVer.superficie_total} m²</p>
                    </Col>
                    {propiedadVer.superficie_cubierta && (
                      <Col md={3} className="mb-3">
                        <p className="mb-1 text-muted small">Superficie Cubierta:</p>
                        <p className="fw-bold mb-0">{propiedadVer.superficie_cubierta} m²</p>
                      </Col>
                    )}
                    <Col md={2} className="mb-3">
                      <p className="mb-1 text-muted small">Dormitorios:</p>
                      <p className="fw-bold mb-0">{propiedadVer.dormitorios || 0}</p>
                    </Col>
                    <Col md={2} className="mb-3">
                      <p className="mb-1 text-muted small">Baños:</p>
                      <p className="fw-bold mb-0">{propiedadVer.banos || 0}</p>
                    </Col>
                    <Col md={2} className="mb-3">
                      <p className="mb-1 text-muted small">Cocheras:</p>
                      <p className="fw-bold mb-0">{propiedadVer.cocheras || 0}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Ubicación */}
              <Card className="mb-3 border-0 shadow-sm">
                <Card.Body>
                  <h5 className="mb-3" style={{ color: '#2c2c2c' }}>
                    <i className="fas fa-map-marker-alt me-2"></i>
                    Ubicación
                  </h5>
                  <Row>
                    <Col md={12} className="mb-3">
                      <p className="mb-1 text-muted small">Dirección:</p>
                      <p className="fw-bold mb-0">{propiedadVer.direccion || 'No especificada'}</p>
                    </Col>
                    <Col md={4} className="mb-3">
                      <p className="mb-1 text-muted small">Barrio:</p>
                      <p className="fw-bold mb-0">{propiedadVer.barrio || 'No especificado'}</p>
                    </Col>
                    <Col md={4} className="mb-3">
                      <p className="mb-1 text-muted small">Ciudad:</p>
                      <p className="fw-bold mb-0">{propiedadVer.ciudad || 'No especificada'}</p>
                    </Col>
                    <Col md={4} className="mb-3">
                      <p className="mb-1 text-muted small">Zona:</p>
                      <p className="fw-bold mb-0 text-capitalize">{propiedadVer.zona || 'No especificada'}</p>
                    </Col>
                    { (propiedadVer.latitud && propiedadVer.longitud) && (
                      <Col md={12} className="mt-3">
                        <div style={{ width: '100%', height: '350px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd' }}>
                          <iframe
                            title="mapa-propiedad"
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={`https://maps.google.com/maps?q=${propiedadVer.latitud},${propiedadVer.longitud}&z=15&output=embed`}
                            allowFullScreen
                          />
                        </div>
                      </Col>
                    )}
                  </Row>
                </Card.Body>
              </Card>

              {/* Características Principales */}
              { (propiedadVer.caracteristicas || (propiedadVer.caracteristicas_list && propiedadVer.caracteristicas_list.length > 0)) && (
                <Card className="border-0 shadow-sm">
                  <Card.Body>
                    <h5 className="mb-3" style={{ color: '#2c2c2c' }}>
                      <i className="fas fa-check-square me-2"></i>
                      Características Principales
                    </h5>
                    <ul className="mb-0">
                      {Array.isArray(propiedadVer.caracteristicas_list) && propiedadVer.caracteristicas_list.length > 0
                        ? propiedadVer.caracteristicas_list.map((c, idx) => <li key={idx}>{c}</li>)
                        : String(propiedadVer.caracteristicas || '')
                            .split('\n')
                            .filter(c => c.trim() !== '')
                            .map((c, idx) => <li key={idx}>{c}</li>)
                      }
                    </ul>
                  </Card.Body>
                </Card>
              )}

              {/* Destacada */}
              {propiedadVer.destacada && (
                <div className="mt-3">
                  <Badge bg="warning" className="text-dark">
                    <i className="fas fa-star me-2"></i>
                    Propiedad Destacada
                  </Badge>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0" style={{ backgroundColor: '#f8f9fa' }}>
          <Button variant="outline-secondary" onClick={() => setShowViewModal(false)}>
            Cerrar
          </Button>
          <Button 
            variant="dark" 
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
          {/* Indicador de progreso */}
          <div className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              {steps.map((step, index) => {
                // Para terrenos, el paso 4 (Características Principales) se considera completado automáticamente
                const isCompleted = currentPropertyType === 'terreno' && index === 4 ? 
                  currentStep >= 3 : index <= currentStep;
                
                return (
                  <div key={index} className="d-flex align-items-center">
                    <div 
                      className={`rounded-circle d-flex align-items-center justify-content-center ${
                        isCompleted ? 'bg-primary text-white' : 'bg-light text-muted'
                      }`}
                      style={{ width: '30px', height: '30px', fontSize: '14px' }}
                    >
                      {index + 1}
                    </div>
                    {index < steps.length - 1 && (
                      <div 
                        className={`mx-2 ${isCompleted && (currentPropertyType === 'terreno' && index === 3 ? currentStep >= 3 : index < currentStep) ? 'bg-primary' : 'bg-light'}`}
                        style={{ height: '2px', width: '40px' }}
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-center">
              <small className="text-muted">{steps[currentStep].title}</small>
            </div>
          </div>
        </Modal.Header>
        <Modal.Body>
          <Formik
            initialValues={{
              titulo: propiedadEditar?.titulo || '',
              descripcion: propiedadEditar?.descripcion || '',
              tipo: propiedadEditar?.tipo || '',
              operacion: propiedadEditar?.operacion || '',
              precio_venta: propiedadEditar?.precio_venta || '',
              precio_alquiler: propiedadEditar?.precio_alquiler || '',
              moneda: propiedadEditar?.moneda || 'USD',
              superficie_total: propiedadEditar?.superficie_total || '',
              superficie_cubierta: propiedadEditar?.superficie_cubierta || '',
              dormitorios: propiedadEditar?.dormitorios || 0,
              banos: propiedadEditar?.banos || 0,
              cocheras: propiedadEditar?.cocheras || 0,
              calle: propiedadEditar?.calle || '',
              numero_calle: propiedadEditar?.numero_calle || '',
              barrio: propiedadEditar?.barrio || '',
              ciudad: propiedadEditar?.ciudad || 'Salta',
              zona: propiedadEditar?.zona || '',
              latitud: propiedadEditar?.latitud || '',
              longitud: propiedadEditar?.longitud || '',
              caracteristicas_list: propiedadEditar?.caracteristicas_list || [],
              destacada: propiedadEditar?.destacada || false,
              agente_cargo: propiedadEditar?.agente_cargo || '',
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
              setTouched,
            }) => (
              <Form onSubmit={handleSubmit}>
                {/* Paso 0: Información Básica */}
                {currentStep === 0 && (
                  <>
                    <h5 className="mb-3" style={{ color: '#2c2c2c' }}>
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
                        onChange={(e) => {
                          handleChange(e);
                          setCurrentPropertyType(e.target.value);
                          if (e.target.value === 'terreno') {
                            setFieldValue('operacion', 'venta');
                          }
                        }}
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
                        name="agente_cargo"
                        value={values.agente_cargo}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        isInvalid={touched.agente_cargo && errors.agente_cargo}
                      >
                        <option value="">Seleccione un agente...</option>
                        {agentes.map(agente => (
                          <option key={agente.id} value={agente.id}>
                            {agente.full_name} ({agente.email})
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.agente_cargo}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
                  </>
                )}

                {/* Paso 1: Precios */}
                {currentStep === 1 && (
                  <>
                    <h5 className="mb-3" style={{ color: '#2c2c2c' }}>
                      <i className="fas fa-dollar-sign me-2"></i>
                      Precios
                    </h5>

                <Row>
                  {values.operacion === 'venta' && (
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Precio de Venta *</Form.Label>
                        <Form.Control
                          type="text"
                          name="precio_venta"
                          placeholder="0"
                          value={values.precio_venta ? formatNumber(values.precio_venta) : ''}
                          onChange={(e) => {
                            const value = unformatNumber(e.target.value);
                            if (value === '' || /^\d+$/.test(value)) {
                              setFieldValue('precio_venta', value);
                            }
                          }}
                          onBlur={handleBlur}
                          isInvalid={touched.precio_venta && errors.precio_venta}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.precio_venta}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  )}
                  {values.operacion === 'alquiler' && (
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>Precio de Alquiler (Mensual) *</Form.Label>
                        <Form.Control
                          type="text"
                          name="precio_alquiler"
                          placeholder="0"
                          value={values.precio_alquiler ? formatNumber(values.precio_alquiler) : ''}
                          onChange={(e) => {
                            const value = unformatNumber(e.target.value);
                            if (value === '' || /^\d+$/.test(value)) {
                              setFieldValue('precio_alquiler', value);
                            }
                          }}
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
                  </>
                )}

                {/* Paso 2: Características */}
                {currentStep === 2 && (
                  <>
                    <h5 className="mb-3" style={{ color: '#2c2c2c' }}>
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
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || parseFloat(value) >= 0) {
                            handleChange(e);
                          }
                        }}
                        onBlur={handleBlur}
                        isInvalid={touched.superficie_total && errors.superficie_total}
                        min="0"
                        step="0.01"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.superficie_total}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  {values.tipo !== 'terreno' && (
                    <Col md={3}>
                      <Form.Group className="mb-3">
                        <Form.Label>Superficie Cubierta (m²)</Form.Label>
                        <Form.Control
                          type="number"
                          name="superficie_cubierta"
                          value={values.superficie_cubierta}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || parseFloat(value) >= 0) {
                              handleChange(e);
                            }
                          }}
                          min="0"
                          step="0.01"
                        />
                      </Form.Group>
                    </Col>
                  )}
                  {values.tipo !== 'terreno' && (
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
                  )}
                  {values.tipo !== 'terreno' && (
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
                  )}
                  {values.tipo !== 'terreno' && (
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
                  )}
                    </Row>
                  </>
                )}

                {/* Paso 3: Ubicación */}
                {currentStep === 3 && (
                  <>
                    <h5 className="mb-3" style={{ color: '#2c2c2c' }}>
                      <i className="fas fa-map-marker-alt me-2"></i>
                      Ubicación
                    </h5>

                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Nombre de la Calle *</Form.Label>
                      <Form.Control
                        type="text"
                        name="calle"
                        placeholder="Ej: Avenida Belgrano"
                        value={values.calle}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]*$/.test(value)) {
                            setFieldValue('calle', value);
                          }
                        }}
                        onBlur={handleBlur}
                        isInvalid={touched.calle && errors.calle}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.calle}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Número *</Form.Label>
                      <Form.Control
                        type="text"
                        name="numero_calle"
                        placeholder="Ej: 1234"
                        value={values.numero_calle}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d+$/.test(value)) {
                            setFieldValue('numero_calle', value);
                          }
                        }}
                        onBlur={handleBlur}
                        isInvalid={touched.numero_calle && errors.numero_calle}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.numero_calle}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

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
                    initialAddress={values.calle && values.numero_calle ? `${values.calle} ${values.numero_calle}` : ''}
                    onLocationChange={({ lat, lng, address, barrio, ciudad }) => {
                      setFieldValue('latitud', lat);
                      setFieldValue('longitud', lng);
                      if (address) {
                        const parts = address.split(' ');
                        const numero = parts[parts.length - 1];
                        const calle = parts.slice(0, -1).join(' ');
                        if (/^\d+$/.test(numero)) {
                          setFieldValue('calle', calle);
                          setFieldValue('numero_calle', numero);
                        }
                      }
                      if (barrio) setFieldValue('barrio', barrio);
                      if (ciudad) setFieldValue('ciudad', ciudad);
                    }}
                  />
                  <Form.Text className="text-muted">
                    Busca la dirección y arrastra el marcador para ajustar la posición exacta.
                  </Form.Text>
                </Form.Group>
                  </>
                )}

                {/* Paso 4: Características Principales */}
                {currentStep === 4 && values.tipo !== 'terreno' && (
                  <>
                    <h5 className="mb-3" style={{ color: '#2c2c2c' }}>
                      <i className="fas fa-check-square me-2"></i>
                      Características Principales
                    </h5>

                    <Form.Group className="mb-3">
                      <Row>
                        {CARACTERISTICAS_OPTIONS.map((caracteristica, index) => (
                          <Col md={4} key={index}>
                            <Form.Check
                              type="checkbox"
                              id={`caracteristica-${index}`}
                              label={caracteristica}
                              checked={values.caracteristicas_list.includes(caracteristica)}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                if (isChecked) {
                                  setFieldValue('caracteristicas_list', [...values.caracteristicas_list, caracteristica]);
                                } else {
                                  setFieldValue('caracteristicas_list', values.caracteristicas_list.filter(c => c !== caracteristica));
                                }
                              }}
                            />
                          </Col>
                        ))}
                      </Row>
                    </Form.Group>
                  </>
                )}

                {/* Paso 5: Imágenes */}
                {currentStep === 5 && (
                  <>
                    <h5 className="mb-3" style={{ color: '#2c2c2c' }}>
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
                    ref={fileInputRef}
                  />
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
                            title="Remover imagen"
                          >
                            <i className="fas fa-times"></i>
                          </Button>
                          {index === 0 && (
                            <Badge bg="dark" className="position-absolute bottom-0 start-0 m-1">
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

                <div className="d-flex justify-content-between mt-4">
                  {/* Botón Anterior */}
                  {currentStep > 0 && (
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        let prevStepIndex = currentStep - 1;
                        
                        // Si estamos en paso 5 y el tipo es terreno, ir al paso 3 (saltando el paso 4)
                        if (currentStep === 5 && values.tipo === 'terreno') {
                          prevStepIndex = 3;
                        }
                        
                        setCurrentStep(Math.max(prevStepIndex, 0));
                      }}
                    >
                      <i className="fas fa-arrow-left me-2"></i>
                      Anterior
                    </Button>
                  )}

                  {/* Espacio vacío si no hay botón anterior */}
                  {currentStep === 0 && <div></div>}

                  {/* Botón Siguiente o Guardar */}
                  {currentStep < steps.length - 1 ? (
                    <Button
                      variant="primary"
                      onClick={() => {
                        // Validar campos del paso actual
                        const currentStepConfig = steps[currentStep];
                        const fieldsToValidate = typeof currentStepConfig.fields === 'function' 
                          ? currentStepConfig.fields(values) 
                          : currentStepConfig.fields;
                        const requiredFields = typeof currentStepConfig.required === 'function' 
                          ? currentStepConfig.required(values) 
                          : currentStepConfig.required;

                        // Verificar si hay errores en los campos requeridos del paso actual
                        let hasErrors = false;
                        for (const field of requiredFields) {
                          if (errors[field]) {
                            hasErrors = true;
                            break;
                          }
                        }

                        // Verificar si los campos requeridos están llenos
                        for (const field of requiredFields) {
                          if (!values[field] || values[field] === '') {
                            hasErrors = true;
                            break;
                          }
                        }

                        if (hasErrors) {
                          // Marcar como touched los campos del paso actual para mostrar errores
                          const touchedFields = {};
                          fieldsToValidate.forEach(field => {
                            touchedFields[field] = true;
                          });
                          setTouched(touchedFields);
                          toast.error('Por favor complete todos los campos requeridos');
                        } else {
                          // Avanzar al siguiente paso
                          let nextStepIndex = currentStep + 1;
                          
                          // Saltar el paso 4 (Características Principales) si es terreno
                          if (currentStep === 3 && values.tipo === 'terreno') {
                            nextStepIndex = 5; // Ir directamente al paso 5 (Imágenes)
                          }
                          
                          setCurrentStep(Math.min(nextStepIndex, steps.length - 1));
                        }
                      }}
                    >
                      Siguiente
                      <i className="fas fa-arrow-right ms-2"></i>
                    </Button>
                  ) : (
                    <div className="d-flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setShowModal(false);
                          setImagenesPrevias([]);
                          imagenesPreviasRef.current = [];
                          resetWizard();
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
                  )}
                </div>
                  </>
                )}
              </Form>
            )}
          </Formik>
        </Modal.Body>
      </Modal>

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDeleteModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setPropiedadEliminar(null);
        }}
        onConfirm={confirmarEliminar}
        propiedadTitulo={propiedadEliminar?.titulo || ''}
      />
    </div>
  );
};

export default PropiedadesPanel;
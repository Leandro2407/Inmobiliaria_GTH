import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import contratoService from '../../services/contratoService';
import clienteService from '../../services/clienteService';
import propiedadService from '../../services/propiedadService';

// Función para generar el PDF del contrato (copia la misma función de ContratoForm)
const generarPDFContrato = (contrato, cliente, propiedad) => {
  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const formatCurrency = (v) => {
    if (!v) return '$ 0,00';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(v);
  };

  const hoy = formatDate(new Date());
  const tipoLabel = contrato.tipo === 'alquiler' ? 'Alquiler' : 'Venta';
  const clienteNombre = cliente?.nombre_completo || `${cliente?.nombre || ''} ${cliente?.apellido || ''}`.trim() || '—';
  const propDireccion = propiedad?.direccion || '—';
  const propCiudad = propiedad?.ciudad || '—';
  const propTipo = (propiedad?.tipo || '').charAt(0).toUpperCase() + (propiedad?.tipo || '').slice(1);

  const fechasSection = contrato.tipo === 'alquiler' && contrato.fecha_inicio ? `
    <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;width:40%">Fecha de Inicio</td>
    <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600">${formatDate(contrato.fecha_inicio)}</td>
  </tr>
  ${contrato.fecha_fin ? `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Fecha de Fin</td>
      <td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600">${formatDate(contrato.fecha_fin)}</td>
    </tr>` : ''}
  ` : '';

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Contrato de ${tipoLabel} - ${clienteNombre}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@400;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Source Sans 3', sans-serif; color: #1a1a2e; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 3px solid #1a1a2e; }
    .logo-area h1 { font-family: 'Libre Baskerville', serif; font-size: 28px; color: #1a1a2e; }
    .logo-area p { color: #666; font-size: 14px; margin-top: 4px; }
    .doc-info { text-align: right; }
    .doc-info .doc-type { font-family: 'Libre Baskerville', serif; font-size: 18px; font-weight: 700; color: #1a1a2e; }
    .doc-info .doc-date { color: #666; font-size: 13px; margin-top: 4px; }
    .section { margin-bottom: 28px; }
    .section-title { font-family: 'Libre Baskerville', serif; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #1a1a2e; background: #f5f5f5; padding: 8px 12px; border-left: 4px solid #1a1a2e; margin-bottom: 16px; }
    table.data-table { width: 100%; border-collapse: collapse; }
    table.data-table td { padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; vertical-align: top; }
    table.data-table td:first-child { color: #666; width: 40%; }
    table.data-table td:last-child { font-weight: 600; }
    .monto-box { background: #1a1a2e; color: #fff; border-radius: 8px; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .monto-box .label { font-size: 13px; opacity: 0.8; }
    .monto-box .valor { font-family: 'Libre Baskerville', serif; font-size: 26px; font-weight: 700; }
    .comision-row { display: flex; gap: 16px; }
    .comision-item { flex: 1; background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 6px; padding: 14px 18px; }
    .comision-item .ci-label { font-size: 12px; color: #888; margin-bottom: 4px; }
    .comision-item .ci-value { font-size: 18px; font-weight: 700; color: #1a1a2e; }
    .descripcion-box { background: #f9f9f9; border-left: 3px solid #ccc; padding: 14px 18px; border-radius: 0 6px 6px 0; font-size: 14px; color: #444; line-height: 1.6; }
    .firmas { display: flex; gap: 48px; margin-top: 48px; padding-top: 32px; border-top: 2px solid #eee; }
    .firma-block { flex: 1; text-align: center; }
    .firma-linea { border-top: 1px solid #333; padding-top: 8px; margin-top: 56px; font-size: 13px; color: #444; }
    .estado-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #d4edda; color: #155724; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; text-align: center; font-size: 11px; color: #aaa; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-area">
      <h1>Inmobiliaria</h1>
      <p>Sistema de Gestión de Propiedades</p>
    </div>
    <div class="doc-info">
      <div class="doc-type">Contrato de ${tipoLabel}</div>
      <div class="doc-date">Fecha de emisión: ${hoy}</div>
      <div class="doc-date">Estado: <span class="estado-badge">${(contrato.estado || 'activo').charAt(0).toUpperCase() + (contrato.estado || 'activo').slice(1)}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Datos del Cliente</div>
    <table class="data-table">
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;width:40%">Nombre Completo</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600">${clienteNombre}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">DNI</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600">${cliente?.dni || '—'}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Email</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600">${cliente?.email || '—'}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Teléfono</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600">${cliente?.telefono || '—'}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Domicilio</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600">${cliente?.domicilio || '—'}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Datos de la Propiedad</div>
    <table class="data-table">
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;width:40%">Tipo de Propiedad</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600">${propTipo}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Dirección</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600">${propDireccion}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Ciudad</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600">${propCiudad}</td></tr>
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666">Barrio / Zona</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600">${propiedad?.barrio || '—'} / ${propiedad?.zona || '—'}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Condiciones del Contrato</div>
    <table class="data-table">
      <tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#666;width:40%">Tipo de Contrato</td><td style="padding:8px 0;border-bottom:1px solid #eee;font-weight:600">${tipoLabel}</td></tr>
      ${fechasSection}
    </table>
  </div>

  <div class="section">
    <div class="section-title">Valores Económicos</div>
    <div class="monto-box">
      <div><div class="label">Monto del Contrato</div></div>
      <div class="valor">${formatCurrency(contrato.monto)}</div>
    </div>
    <div class="comision-row">
      <div class="comision-item">
        <div class="ci-label">Porcentaje de Comisión</div>
        <div class="ci-value">${contrato.porcentaje_comision ? contrato.porcentaje_comision + '%' : '—'}</div>
      </div>
      <div class="comision-item">
        <div class="ci-label">Comisión Calculada</div>
        <div class="ci-value">${formatCurrency(contrato.comision)}</div>
      </div>
    </div>
  </div>

  ${contrato.descripcion ? `
  <div class="section">
    <div class="section-title">Descripción / Observaciones</div>
    <div class="descripcion-box">${contrato.descripcion}</div>
  </div>
  ` : ''}

  <div class="firmas">
    <div class="firma-block">
      <div class="firma-linea">Firma del Cliente<br/><strong>${clienteNombre}</strong></div>
    </div>
    <div class="firma-block">
      <div class="firma-linea">Firma del Agente<br/><strong>Agente Inmobiliario</strong></div>
    </div>
    <div class="firma-block">
      <div class="firma-linea">Sello de la Inmobiliaria</div>
    </div>
  </div>

  <div class="footer">
    Documento generado el ${hoy} · Sistema de Gestión Inmobiliaria
  </div>

  <script>
    window.onload = function() { 
      window.print(); 
    };
  </script>
</body>
</html>`;

  const ventanaImpresion = window.open('', '_blank');
  if (!ventanaImpresion) {
    toast.error('No se pudo abrir la ventana. Por favor, permite las ventanas emergentes (pop-ups) para este sitio.');
    return;
  }
  
  ventanaImpresion.document.write(htmlContent);
  ventanaImpresion.document.close();
  ventanaImpresion.focus();
};

const ContratoDetalle = ({ show, onHide, contratoId, onEdit }) => {
  const [contrato, setContrato] = useState(null);
  const [cliente, setCliente] = useState(null);
  const [propiedad, setPropiedad] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const cargarDetalle = async () => {
    if (!contratoId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Cargar contrato
      const contratoData = await contratoService.getById(contratoId);
      setContrato(contratoData);
      
      // Cargar cliente asociado
      if (contratoData.cliente) {
        const clienteData = await clienteService.getById(contratoData.cliente);
        setCliente(clienteData);
      }
      
      // Cargar propiedad asociada
      if (contratoData.propiedad) {
        const propiedadData = await propiedadService.getById(contratoData.propiedad);
        setPropiedad(propiedadData);
      }
    } catch (error) {
      console.error('Error al cargar detalles del contrato:', error);
      setError('No se pudieron cargar los detalles del contrato');
      toast.error('Error al cargar los detalles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show && contratoId) {
      cargarDetalle();
    }
  }, [show, contratoId]);

  const handleDescargarPDF = () => {
    if (!contrato || !cliente || !propiedad) {
      toast.error('Falta información para generar el PDF');
      return;
    }
    generarPDFContrato(contrato, cliente, propiedad);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatCurrency = (value) => {
    if (!value) return '$ 0,00';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
  };

  const getEstadoBadge = (estado) => {
    const estados = {
      activo: { bg: 'success', text: 'Activo' },
      pendiente: { bg: 'warning', text: 'Pendiente' },
      finalizado: { bg: 'info', text: 'Finalizado' },
      cancelado: { bg: 'danger', text: 'Cancelado' },
    };
    const config = estados[estado] || { bg: 'secondary', text: estado };
    return <Badge bg={config.bg}>{config.text}</Badge>;
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-file-contract me-2"></i>
          Detalle del Contrato
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Cargando detalles...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">{error}</Alert>
        ) : contrato ? (
          <>
            {/* Estado y tipo */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h5 className="mb-1">Contrato #{contrato.id}</h5>
                <p className="text-muted mb-0">
                  Creado: {formatDate(contrato.created_at)}
                </p>
              </div>
              <div className="text-end">
                <div className="mb-2">{getEstadoBadge(contrato.estado)}</div>
                <Badge bg={contrato.tipo === 'alquiler' ? 'info' : 'success'}>
                  {contrato.tipo === 'alquiler' ? 'Alquiler' : 'Venta'}
                </Badge>
              </div>
            </div>

            {/* Información del Cliente */}
            {cliente && (
              <div className="mb-4">
                <h6 className="text-primary mb-3">
                  <i className="fas fa-user me-2"></i>
                  Datos del Cliente
                </h6>
                <Row>
                  <Col md={6}>
                    <p className="mb-1 text-muted small">Nombre Completo:</p>
                    <p className="fw-bold">{cliente.nombre_completo}</p>
                  </Col>
                  <Col md={6}>
                    <p className="mb-1 text-muted small">DNI:</p>
                    <p className="fw-bold">{cliente.dni || '—'}</p>
                  </Col>
                  <Col md={6}>
                    <p className="mb-1 text-muted small">Email:</p>
                    <p className="fw-bold">{cliente.email || '—'}</p>
                  </Col>
                  <Col md={6}>
                    <p className="mb-1 text-muted small">Teléfono:</p>
                    <p className="fw-bold">{cliente.telefono || '—'}</p>
                  </Col>
                  <Col md={12}>
                    <p className="mb-1 text-muted small">Domicilio:</p>
                    <p className="fw-bold">{cliente.domicilio || '—'}</p>
                  </Col>
                </Row>
              </div>
            )}

            {/* Información de la Propiedad */}
            {propiedad && (
              <div className="mb-4">
                <h6 className="text-primary mb-3">
                  <i className="fas fa-building me-2"></i>
                  Datos de la Propiedad
                </h6>
                <Row>
                  <Col md={6}>
                    <p className="mb-1 text-muted small">Título:</p>
                    <p className="fw-bold">{propiedad.titulo}</p>
                  </Col>
                  <Col md={6}>
                    <p className="mb-1 text-muted small">Tipo:</p>
                    <p className="fw-bold text-capitalize">{propiedad.tipo}</p>
                  </Col>
                  <Col md={12}>
                    <p className="mb-1 text-muted small">Dirección:</p>
                    <p className="fw-bold">{propiedad.direccion}</p>
                  </Col>
                  <Col md={6}>
                    <p className="mb-1 text-muted small">Barrio:</p>
                    <p className="fw-bold">{propiedad.barrio}</p>
                  </Col>
                  <Col md={6}>
                    <p className="mb-1 text-muted small">Zona:</p>
                    <p className="fw-bold text-capitalize">{propiedad.zona}</p>
                  </Col>
                </Row>
              </div>
            )}

            {/* Condiciones del Contrato */}
            <div className="mb-4">
              <h6 className="text-primary mb-3">
                <i className="fas fa-file-signature me-2"></i>
                Condiciones del Contrato
              </h6>
              <Row>
                {contrato.tipo === 'alquiler' && (
                  <>
                    <Col md={6}>
                      <p className="mb-1 text-muted small">Fecha de Inicio:</p>
                      <p className="fw-bold">{formatDate(contrato.fecha_inicio)}</p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-1 text-muted small">Fecha de Fin:</p>
                      <p className="fw-bold">{formatDate(contrato.fecha_fin) || '—'}</p>
                    </Col>
                  </>
                )}
                <Col md={6}>
                  <p className="mb-1 text-muted small">Monto:</p>
                  <p className="fw-bold fs-5 text-success">{formatCurrency(contrato.monto)}</p>
                </Col>
                <Col md={6}>
                  <p className="mb-1 text-muted small">Comisión:</p>
                  <p className="fw-bold">{formatCurrency(contrato.comision)}</p>
                </Col>
                {contrato.porcentaje_comision && (
                  <Col md={12}>
                    <p className="mb-1 text-muted small">Porcentaje de Comisión:</p>
                    <p className="fw-bold">{contrato.porcentaje_comision}%</p>
                  </Col>
                )}
              </Row>
            </div>

            {/* Descripción */}
            {contrato.descripcion && (
              <div className="mb-3">
                <h6 className="text-primary mb-2">
                  <i className="fas fa-align-left me-2"></i>
                  Descripción
                </h6>
                <div className="p-3 bg-light rounded">
                  {contrato.descripcion}
                </div>
              </div>
            )}
          </>
        ) : (
          <Alert variant="warning">No se encontró el contrato</Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
        <Button
          variant="outline-dark"
          onClick={handleDescargarPDF}
          disabled={!contrato || !cliente || !propiedad || loading}
          title="Descargar contrato en PDF"
        >
          <i className="fas fa-file-pdf me-2"></i>
          Descargar PDF
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            onHide();
            if (onEdit && contrato) {
              onEdit(contrato);
            }
          }}
          disabled={!contrato || contrato.estado === 'finalizado' || contrato.estado === 'cancelado'}
        >
          <i className="fas fa-edit me-2"></i>
          Editar Contrato
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ContratoDetalle;
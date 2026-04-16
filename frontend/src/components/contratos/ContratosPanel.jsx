import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import { toast } from 'react-toastify';
import clienteService from '../../services/clienteService';
import SelectorClienteContratoModal from './SelectorClienteContratoModal';
import ContratoForm from './ContratoForm';
import ContratoList from './ContratoList';
import ContratoDetalle from './ContratoDetalle';

const ContratosPanel = ({ clienteId = null }) => {
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [showClienteSelector, setShowClienteSelector] = useState(false);
  const [showContratoForm, setShowContratoForm] = useState(false);
  const [showContratoDetalle, setShowContratoDetalle] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [contratoSeleccionado, setContratoSeleccionado] = useState(null);
  const [contratoParaEditar, setContratoParaEditar] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const cargarClientes = async (searchTerm = '') => {
    try {
      setLoadingClientes(true);
      const params = searchTerm ? { search: searchTerm } : {};
      const response = await clienteService.getAll(params);
      const clientesData = response.results || response;
      setClientes(clientesData);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      toast.error('Error al cargar la lista de clientes');
    } finally {
      setLoadingClientes(false);
    }
  };

  useEffect(() => {
    const cargarClienteEspecifico = async () => {
      if (clienteId) {
        try {
          const clienteData = await clienteService.getById(clienteId);
          setClienteSeleccionado(clienteData);
        } catch (error) {
          console.error('Error al cargar cliente específico:', error);
          toast.error('Error al cargar los datos del cliente');
        }
      }
    };

    cargarClienteEspecifico();
  }, [clienteId]);

  useEffect(() => {
    const cargarClienteDelContrato = async () => {
      if (contratoParaEditar && contratoParaEditar.cliente) {
        try {
          console.log('🔄 Cargando cliente del contrato para edición:', contratoParaEditar.cliente);
          const clienteData = await clienteService.getById(contratoParaEditar.cliente);
          console.log('✅ Cliente cargado para edición:', clienteData);
          setClienteSeleccionado(clienteData);
        } catch (error) {
          console.error('Error al cargar cliente del contrato:', error);
          toast.error('Error al cargar los datos del cliente del contrato');
        }
      }
    };

    if (showContratoForm && contratoParaEditar) {
      cargarClienteDelContrato();
    }
  }, [showContratoForm, contratoParaEditar]);

  const handleSeleccionarCliente = (cliente) => {
    console.log('✅ Cliente seleccionado:', cliente);
    setClienteSeleccionado(cliente);
    setShowClienteSelector(false);
    // Abrir el formulario de contrato (que a su vez abrirá el selector de propiedad)
    setShowContratoForm(true);
  };

  const handleNuevoContrato = () => {
    if (clienteId && clienteSeleccionado) {
      setShowContratoForm(true);
    } else {
      cargarClientes();
      setShowClienteSelector(true);
    }
  };

  const handleVerDetalle = (contratoId) => {
    setContratoSeleccionado(contratoId);
    setShowContratoDetalle(true);
  };

  const handleEditarContrato = (contrato) => {
    console.log('📝 Editando contrato:', contrato);
    setContratoParaEditar(contrato);
    setClienteSeleccionado(null);
    setShowContratoForm(true);
  };

  const handleSuccessContrato = () => {
    setRefreshTrigger(prev => prev + 1);
    setShowContratoForm(false);
    setShowContratoDetalle(false);
    setContratoParaEditar(null);
    if (!clienteId) {
      setClienteSeleccionado(null);
    }
  };

  const handleCloseModals = () => {
    setShowContratoForm(false);
    setShowContratoDetalle(false);
    setShowClienteSelector(false);
    setContratoSeleccionado(null);
    setContratoParaEditar(null);
    if (!clienteId) {
      setClienteSeleccionado(null);
    }
  };

  const getTituloPanel = () => {
    if (clienteId && clienteSeleccionado) {
      return `Contratos de ${clienteSeleccionado.nombre_completo}`;
    }
    return 'Gestión de Contratos';
  };

  const getSubtituloPanel = () => {
    if (clienteId && clienteSeleccionado) {
      return `Administra los contratos específicos de este cliente`;
    }
    return 'Administra los contratos de alquiler y venta de propiedades';
  };

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm border-0 bg-light">
            <Card.Body className="py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="flex-grow-1">
                  <h4 className="mb-1 fw-bold text-dark">{getTituloPanel()}</h4>
                  <p className="text-muted mb-0">{getSubtituloPanel()}</p>
                </div>
                <div className="d-flex gap-2">
                  <Button
                    variant="dark"
                    onClick={handleNuevoContrato}
                    className="d-flex align-items-center"
                  >
                    <i className="fas fa-plus me-2"></i>
                    Nuevo Contrato
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <ContratoList
                onVerDetalle={handleVerDetalle}
                onEditarContrato={handleEditarContrato}
                refreshTrigger={refreshTrigger}
                clienteId={clienteId}
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <SelectorClienteContratoModal
        show={showClienteSelector}
        onHide={handleCloseModals}
        clientes={clientes}
        onSeleccionarCliente={handleSeleccionarCliente}
        loading={loadingClientes}
        onActualizarClientes={() => cargarClientes()}
      />

      <ContratoForm
        show={showContratoForm}
        onHide={handleCloseModals}
        cliente={clienteSeleccionado}
        contrato={contratoParaEditar}
        onSuccess={handleSuccessContrato}
      />

      <ContratoDetalle
        show={showContratoDetalle}
        onHide={handleCloseModals}
        contratoId={contratoSeleccionado}
        onEdit={handleEditarContrato}
      />
    </div>
  );
};

export default ContratosPanel;
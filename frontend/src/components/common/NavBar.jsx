import React, { useState } from 'react';
import { Navbar as BSNavbar, Nav, Container, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { BACKEND_URL } from '../../services/api';
import { logout } from '../../store/slices/authSlice';
import AuthModal from '../auth/AuthModal';
import { toast } from 'react-toastify';

const Navbar = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success('Sesión cerrada exitosamente');
      navigate('/');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  const scrollToSection = (sectionId) => {
    // Primero navegar a home si no estamos allí
    if (window.location.pathname !== '/') {
      navigate('/');
      // Esperar a que cargue la página
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <BSNavbar bg="white" expand="lg" className="shadow-sm sticky-top">
        <Container>
          <BSNavbar.Brand 
            style={{ cursor: 'pointer' }} 
            onClick={() => navigate('/')}
            className="fw-bold"
          >
            <i className="fas fa-building me-2"></i>
            GTH Negocios Inmobiliarios
          </BSNavbar.Brand>

          <BSNavbar.Toggle aria-controls="navbarNav" />

          <BSNavbar.Collapse id="navbarNav">
            <Nav className="ms-auto align-items-center">
              <Nav.Link onClick={() => navigate('/')}>
                Inicio
              </Nav.Link>
              <Nav.Link onClick={() => scrollToSection('propiedades')}>
                Propiedades
              </Nav.Link>
              <Nav.Link onClick={() => scrollToSection('servicios')}>
                Servicios
              </Nav.Link>
              <Nav.Link onClick={() => scrollToSection('nosotros')}>
                Nosotros
              </Nav.Link>
              <Nav.Link onClick={() => scrollToSection('contacto')}>
                Contacto
              </Nav.Link>

              {isAuthenticated ? (
                <Dropdown align="end" className="ms-2">
                  <Dropdown.Toggle
                    variant="outline-dark"
                    id="dropdown-user"
                    className="d-flex align-items-center"
                  >
                    {user?.foto_perfil ? (
                      <img
                        src={user.foto_perfil.startsWith('http') ? user.foto_perfil : `${BACKEND_URL}${user.foto_perfil}`}
                        alt="Perfil"
                        className="rounded-circle me-2"
                        style={{ width: '30px', height: '30px', objectFit: 'cover' }}
                      />
                    ) : (
                      <i className="fas fa-user-circle me-2"></i>
                    )}
                    {user?.full_name || user?.username}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Header>
                      <div className="fw-bold">{user?.full_name}</div>
                      <small className="text-muted">{user?.email}</small>
                      <div>
                        <span className={`badge bg-${
                          user?.rol === 'administrador' ? 'danger' :
                          user?.rol === 'agente' ? 'primary' : 'secondary'
                        } mt-1`}>
                          {user?.rol === 'administrador' ? 'Administrador' :
                           user?.rol === 'agente' ? 'Agente' : 'Cliente'}
                        </span>
                      </div>
                    </Dropdown.Header>
                    <Dropdown.Divider />
                    
                    <Dropdown.Item onClick={() => navigate('/perfil')}>
                      <i className="fas fa-user me-2"></i>
                      Mi Perfil
                    </Dropdown.Item>
                    
                    {(user?.rol === 'administrador' || user?.rol === 'agente') && (
                      <>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={() => navigate('/admin')}>
                          <i className="fas fa-cog me-2"></i>
                          Panel de Administración
                        </Dropdown.Item>
                      </>
                    )}
                    
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout} className="text-danger">
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Cerrar Sesión
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                <Nav.Link
                  className="btn btn-outline-dark ms-2 px-3"
                  onClick={() => setShowAuthModal(true)}
                >
                  <i className="fas fa-user me-1"></i>
                  Ingresar
                </Nav.Link>
              )}
            </Nav>
          </BSNavbar.Collapse>
        </Container>
      </BSNavbar>

      <AuthModal show={showAuthModal} onHide={() => setShowAuthModal(false)} />
    </>
  );
};

export default Navbar;

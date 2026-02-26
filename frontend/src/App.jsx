import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import store from './store/store';
import authService from './services/authService';

// Components
import NavBar from './components/common/NavBar';
import Footer from './components/common/Footer';

// Pages
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetailPage from './pages/PropertyDetailPage';
import Contact from './pages/Contact';
import Nosotros from './pages/Nosotros';
import Dashboard from './pages/admin/Dashboard';
import NotFound from './pages/NotFound';
// --- ¡IMPORTACIÓN AÑADIDA! ---¿
// Asumo que tu archivo Perfil.jsx está en 'pages/' como los demás
import Perfil from './pages/Perfil'; 
import Tareas from './pages/admin/Tareas';
import SeguimientoClientesPanel from './pages/admin/SeguimientoClientesPanel';
import SeguimientoClienteDetalle from './pages/admin/SeguimientoClienteDetalle';


// Styles
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './styles/App.css';

// --- ProtectedRoute Component (MODIFICADO) ---
const ProtectedRoute = ({ children, requiredRole }) => {
  const isAuthenticated = authService.isAuthenticated();
  const userRole = authService.getUserRole();

  if (!isAuthenticated) {
    // Si no está logueado, va al inicio
    return <Navigate to="/" replace />;
  }

  // Si la ruta requiere un rol específico (ej: admin o agente)
  if (requiredRole && requiredRole.length > 0) {
    // Si el rol del usuario NO está en la lista de roles requeridos
    if (!requiredRole.includes(userRole)) {
      // --- ¡CORRECCIÓN 1! ---
      // Redirige al perfil, NO al dashboard.
      // Esto evita que los clientes queden atrapados en el dashboard.
      return <Navigate to="/perfil" replace />;
    }
  }

  // Si todo está bien (logueado y tiene el rol correcto, si se requiere)
  return children;
};

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App d-flex flex-column min-vh-100">
          <NavBar />
          
          <main className="flex-grow-1">
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/propiedades" element={<Properties />} />
              <Route path="/propiedades/:id" element={<PropertyDetailPage />} />
              <Route path="/contacto" element={<Contact />} />
              <Route path="/nosotros" element={<Nosotros />} />
              <Route path="/servicios" element={<Home />} />

              {/* --- RUTAS PROTEGIDAS (MODIFICADAS) --- */}

              {/* Ruta /perfil (Protegida para TODOS los usuarios logueados)
                --- ¡CORRECCIÓN 2! ---
                Renderiza el componente Perfil, no Dashboard.
              */}
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <Perfil />
                  </ProtectedRoute>
                }
              />
              
              {/* Ruta /dashboard (Protegida SOLO para Empleados)
                --- ¡CORRECCIÓN 3! ---
                Se agregó 'requiredRole' para que los clientes no puedan entrar.
              */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole={['agente', 'administrador']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Rutas /admin/* anidadas para que el Dashboard actúe como layout con sidebar */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute requiredRole={['agente', 'administrador']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              >
                {/* Rutas hijas que se renderizan dentro del Dashboard (en el Outlet correspondiente) */}
                <Route path="seguimiento-clientes" element={<SeguimientoClientesPanel />} />
                <Route path="seguimiento-clientes/:id" element={<SeguimientoClienteDetalle />} />
              </Route>

              <Route
                path="/tareas"
                element={
                  <ProtectedRoute requiredRole={['agente', 'administrador']}>
                    <Tareas />
                  </ProtectedRoute>
                }
              />

              {/* 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <Footer />

          {/* Toast Notifications */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
      </Router>
    </Provider>
  );
}

export default App;
import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient.js';

import Login from './Login.jsx';
import Books from './Books.jsx';
import Register from './Register.jsx';
import Home from './Home.jsx';
import Serch from './Serch.jsx';
import NotFound from './NotFound.jsx';
import Users from './Users.jsx';
import ProtectedRoute from '../components/ProtectedRoute.jsx'; // nuevo wrapper
import TipoGenero from './TipoGenero.jsx';

// Lista declarativa de rutas: fácil de ampliar
const routes = [
  { path: '/login', element: <Login />, public: true },
  { path: '/register', element: <Register />, public: true },
  { path: '/books', element: <Books />, public: false }, // si quieres protegerla, public: false
  { path: '/search', element: <Serch />, public: false },
  { path: '/home', element: <Home />, public: false },
  { path: '/tipoGenero', element: <TipoGenero />, public: false },
  { path: '/users', element: <Users />, public: false },
  // Añade aquí nuevas rutas: { path: '/profile', element: <Profile />, public: false }
];

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    // Listener solo para acciones puntuales (signed in / out) — no fuerces navegación en cada render
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // si se deslogueó y estaba en ruta protegida, mandarlo al login
        const path = window.location.pathname;
        const isPublic = routes.find(r => r.path === path)?.public ?? false;
        if (!isPublic) navigate('/login');
      }
      if (event === 'SIGNED_IN') {
        // si acaba de iniciar sesión y está en una ruta pública raíz, llevarlo al home
        const path = window.location.pathname;
        if (path === '/' || path === '/login' || path === '/register') navigate('/home');
      }
    });

    return () => listener?.subscription?.unsubscribe?.();
  }, [navigate]);

  return (
    <Routes>
      {routes.map((r) => {
        if (r.public) {
          return <Route key={r.path} path={r.path} element={r.element} />;
        }
        // rutas protegidas envueltas en ProtectedRoute
        return (
          <Route
            key={r.path}
            path={r.path}
            element={<ProtectedRoute>{r.element}</ProtectedRoute>}
          />
        );
      })}
      <Route path="*" element={<Login />} />
    </Routes>
  );
}

export default App;
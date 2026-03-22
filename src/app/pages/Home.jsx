import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { Delete } from "../../services/deleteinredis.js";
import { useNavigate } from "react-router-dom";

const ROL_LABELS = { 2: 'lector', 3: 'bibliotecario', 4: 'admin' }

export default function Home() {
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [confirmRedis, setConfirmRedis] = useState(false);
  const [deletingRedis, setDeletingRedis] = useState(false);
  const [rol, setRol] = useState(null);
  const [nombre, setNombre] = useState('');
  const [loadingRol, setLoadingRol] = useState(true);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Obtener rol al montar
  useEffect(() => {
    async function fetchRol() {
      try {
        const { data: sessionData } = await supabase.auth.getSession()
        const user = sessionData?.session?.user
        if (!user) return

        const { data: perfil, error } = await supabase
          .from('usuario')
          .select('nombre, roles')
          .eq('id', user.id)
          .single()

        if (error) throw error

        setRol(ROL_LABELS[perfil.roles] || 'lector')
        setNombre(perfil.nombre || user.email)
      } catch (err) {
        showToast(`No se pudo cargar el perfil: ${err.message}`, 'error')
        setRol('lector') // rol más restrictivo por defecto si falla
      } finally {
        setLoadingRol(false)
      }
    }
    fetchRol()
  }, [])

  async function handleDeleteRedis() {
    setConfirmRedis(false);
    setDeletingRedis(true);
    try {
      await Delete();
      showToast('Sesiones de Redis eliminadas correctamente.');
    } catch (err) {
      showToast(`Error al borrar Redis: ${err.message}`, 'error');
    } finally {
      setDeletingRedis(false);
    }
  }

  async function handleSignOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem('user_rol')
      localStorage.removeItem('user_nombre')
    } catch (err) {
      showToast(`Error al cerrar sesión: ${err.message}`, 'error');
    }
  }

  // Permisos por rol
  const esAdmin        = rol === 'admin'
  const esBibliotecario = rol === 'bibliotecario' || esAdmin
  const esLector       = rol === 'lector' || esBibliotecario

  // Definición de cards con control de acceso
  const cards = [
    {
      title: 'Catálogo de libros',
      desc: 'Visualiza el catálogo bibliográfico.',
      label: 'Ver catálogo',
      action: () => navigate('/books'),
      visible: true, // todos pueden ver
    },
    {
      title: 'Agregar géneros o tipos',
      desc: 'CRUD de géneros y tipos de material.',
      label: 'Agregar',
      action: () => navigate('/tipoGenero'),
      visible: esBibliotecario, // bibliotecario y admin
    },
    {
      title: 'Búsqueda / Dashboard',
      desc: 'Estadísticas y búsqueda con filtros.',
      label: 'Buscar',
      action: () => navigate('/search'),
      visible: true, // todos pueden ver
    },
    {
      title: 'Usuarios',
      desc: 'Administra cuentas y permisos.',
      label: 'Gestionar',
      action: () => navigate('/users'),
      visible: esAdmin, // solo admin
    },
    {
      title: 'Préstamos',
      desc: 'Revisa préstamos activos y devoluciones.',
      label: 'Ver préstamos',
      action: () => showToast('Módulo en construcción.', 'info'),
      visible: esBibliotecario, // bibliotecario y admin
    },
  ]

  const ROL_BADGE = {
    admin:         'bg-red-100 text-red-700',
    bibliotecario: 'bg-blue-100 text-blue-700',
    lector:        'bg-gray-100 text-gray-600',
  }

  return (
    <div className="min-h-screen app-bg flex items-start justify-center py-12 px-4">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold border ${
          toast.type === 'error' ? 'bg-red-50 border-red-300 text-red-700' :
          toast.type === 'info'  ? 'bg-blue-50 border-blue-300 text-blue-700' :
                                   'bg-emerald-50 border-emerald-300 text-emerald-700'
        }`}>
          <span>{toast.type === 'error' ? '✕' : toast.type === 'info' ? 'ℹ' : '✓'}</span>
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Modal confirmación Redis */}
      {confirmRedis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmRedis(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-emerald-900 mb-2">¿Borrar sesiones de Redis?</h2>
            <p className="text-sm text-gray-500 mb-5">Esto eliminará el caché de todos los usuarios. Deberán volver a autenticarse.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmRedis(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition">Cancelar</button>
              <button onClick={handleDeleteRedis} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition">Sí, borrar</button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl bg-white/95 rounded-2xl p-8 shadow-2xl border-l-4 border-emerald-500">
        <header className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-emerald-800">
                {loadingRol ? 'Cargando…' : `Hola, ${nombre}`}
              </h1>
              {rol && (
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${ROL_BADGE[rol]}`}>
                  {rol}
                </span>
              )}
            </div>
            <p className="text-emerald-700/90 mt-1 text-sm">Panel principal — Biblioteca Pro</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-emerald-500 text-white font-semibold shadow-md hover:opacity-95 transition"
          >
            Salir
          </button>
        </header>

        {loadingRol ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-28 rounded-lg bg-yellow-50 animate-pulse border border-yellow-200" />)}
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cards.filter(c => c.visible).map(card => (
              <div key={card.title} className="p-4 rounded-lg bg-yellow-50/90 border border-yellow-200">
                <h3 className="font-bold text-emerald-800">{card.title}</h3>
                <p className="text-sm text-emerald-700/80 mt-2">{card.desc}</p>
                <div className="mt-4">
                  <button
                    onClick={card.action}
                    className="text-sm px-3 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:brightness-105"
                  >
                    {card.label}
                  </button>
                </div>
              </div>
            ))}

            {/* Borrar Redis — solo admin */}
            {esAdmin && (
              <div className="p-4 rounded-lg bg-yellow-50/90 border border-yellow-200">
                <h3 className="font-bold text-emerald-800">Caché de sesiones</h3>
                <p className="text-sm text-emerald-700/80 mt-2">Limpia las sesiones almacenadas en Redis.</p>
                <div className="mt-4">
                  <button
                    onClick={() => setConfirmRedis(true)}
                    disabled={deletingRedis}
                    className="text-sm px-3 py-2 bg-red-500 text-white rounded-md shadow-sm hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {deletingRedis ? 'Borrando…' : 'Borrar sesiones Redis'}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
import { supabase } from "../../services/supabaseClient";
import { Delete } from "../../services/deleteinredis.js";
import { useNavigate } from "react-router-dom";

export default function Home() { 
  const navigate = useNavigate();

  return (
    <div className="min-h-screen app-bg flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-4xl bg-white/95 rounded-2xl p-8 shadow-2xl border-l-4 border-emerald-500">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-emerald-800">Bienvenido a Biblioteca Pro</h1>
            <p className="text-emerald-700/90 mt-1 text-sm">Panel principal — administra libros y usuarios</p>
          </div>
          <div>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-emerald-500 text-white font-semibold shadow-md hover:opacity-95 transition"
            >
              Salir
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-yellow-50/90 border border-yellow-200">
            <h3 className="font-bold text-emerald-800">Libros</h3>
            <p className="text-sm text-emerald-700/80 mt-2">Gestiona el catálogo, préstamos y devoluciones.</p>
            <div className="mt-4">
              {/* Navegar a la página CRUD de libros */}
              <button
                onClick={() => navigate('/books')}
                className="text-sm px-3 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:brightness-105"
              >
                Ver catálogo
              </button>

              <a href="/books">Librito</a>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-yellow-50/90 border border-yellow-200">
            <h3 className="font-bold text-emerald-800">Usuarios</h3>
            <p className="text-sm text-emerald-700/80 mt-2">Administra cuentas y permisos.</p>
            <div className="mt-4">
              <button className="text-sm px-3 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:brightness-105">Usuarios</button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-yellow-50/90 border border-yellow-200">
            <h3 className="font-bold text-emerald-800">Préstamos</h3>
            <p className="text-sm text-emerald-700/80 mt-2">Revisa préstamos activos y devoluciones.</p>
            <div className="mt-4">
              <button className="text-sm px-3 py-2 bg-emerald-600 text-white rounded-md shadow-sm hover:brightness-105">Ver préstamos</button>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-yellow-50/90 border border-yellow-200">
            <div className="mt-4">
              <button
              onClick={async () => { const mondongo = await Delete()}}
              className="text-sm px-3 py-2 bg-red-500 text-white rounded-md shadow-sm hover:brightness-105">Borrar usuarios de redis</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
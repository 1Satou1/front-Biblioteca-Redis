import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../../services/supabaseClient.js'

const ROL_LABELS = { 2: 'lector', 3: 'bibliotecario', 4: 'admin' }

export default function Books() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [form, setForm] = useState({ id: "", title: "", author: "", year: "", id_tipo: "", id_genero: "" });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [rol, setRol] = useState(null);
  const [loadingRol, setLoadingRol] = useState(true);

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
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
          .select('roles')
          .eq('id', user.id)
          .single()
        if (error) throw error
        setRol(ROL_LABELS[perfil.roles] || 'lector')
      } catch (err) {
        console.warn('No se pudo obtener el rol:', err.message)
        setRol('lector') // más restrictivo por defecto
      } finally {
        setLoadingRol(false)
      }
    }
    fetchRol()
  }, [])

  // Permisos
  const puedeEditar  = rol === 'bibliotecario' || rol === 'admin'
  const puedeEliminar = rol === 'admin'

  function mapRowToBook(row, tiposMap = {}, genMap = {}) {
    return {
      id: row.id,
      title: row.titulo ?? row.title ?? "Sin título",
      author: row.autor ?? row.author ?? "Sin autor",
      year: row.aniodepublicacion != null ? String(row.aniodepublicacion) : "",
      id_tipo: row.id_tipo ?? null,
      tipo_label: tiposMap[String(row.id_tipo)] ?? null,
      id_genero: row.id_genero ?? null,
      genero_label: genMap[String(row.id_genero)] ?? null
    }
  }

  function validateForm() {
    const e = {};
    if (!form.title?.trim()) e.title = "El título es obligatorio.";
    if (!form.author?.trim()) e.author = "El autor es obligatorio.";
    if (!form.year?.trim()) e.year = "El año es obligatorio.";
    else if (!Number.isInteger(Number(form.year)) || Number(form.year) <= 0) e.year = "Debe ser un número entero positivo.";
    if (!form.id_tipo) e.id_tipo = "El tipo es obligatorio.";
    if (!form.id_genero) e.id_genero = "El género es obligatorio.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  useEffect(() => { fetchBooks() }, []);

  async function fetchBooks() {
    setLoading(true);
    try {
      const [{ data: tiposData, error: errTipo }, { data: generosData, error: errGen }] = await Promise.all([
        supabase.from('tipomaterial').select('id, tipo'),
        supabase.from('material_genero').select('id_genero, clasificacion'),
      ])
      if (errTipo) throw errTipo;
      if (errGen) throw errGen;
      setTipos(tiposData ?? []);
      setGeneros(generosData ?? []);
      const tiposMap = Object.fromEntries((tiposData ?? []).map(t => [t.id, t.tipo]))
      const genMap = Object.fromEntries((generosData ?? []).map(g => [g.id_genero, g.clasificacion]))
      const { data, error } = await supabase.from('materialbibliografico').select('*').order('id', { ascending: false });
      if (error) throw error;
      setBooks((data ?? []).map(r => mapRowToBook(r, tiposMap, genMap)));
    } catch (err) {
      showToast(`Error cargando catálogo: ${err.message}`, 'error')
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!puedeEditar) { showToast('No tienes permiso para agregar libros.', 'error'); return }
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('materialbibliografico')
        .insert([{ titulo: form.title, autor: form.author, aniodepublicacion: Number(form.year), id_tipo: Number(form.id_tipo), id_genero: Number(form.id_genero) }])
        .select();
      if (error) throw error;
      const tiposMap = Object.fromEntries(tipos.map(t => [String(t.id), t.tipo]))
      const genMap = Object.fromEntries(generos.map(g => [String(g.id_genero), g.clasificacion]))
      const inserted = (data || []).map(r => mapRowToBook(r, tiposMap, genMap))[0];
      if (inserted) setBooks(prev => [inserted, ...prev]);
      setForm({ id: "", title: "", author: "", year: "", id_tipo: "", id_genero: "" });
      showToast('Libro agregado correctamente.')
    } catch (err) {
      showToast(`Error al crear: ${err.message}`, 'error')
    } finally {
      setLoading(false);
    }
  }

  function startEdit(book) {
    if (!puedeEditar) { showToast('No tienes permiso para editar libros.', 'error'); return }
    setEditing(true);
    setForm({ id: book.id, title: book.title, author: book.author, year: book.year ?? "", id_tipo: book.id_tipo ?? "", id_genero: book.id_genero ?? "" });
    setErrors({});
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!puedeEditar) { showToast('No tienes permiso para editar libros.', 'error'); return }
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('materialbibliografico')
        .update({ titulo: form.title, autor: form.author, aniodepublicacion: Number(form.year), id_tipo: Number(form.id_tipo), id_genero: Number(form.id_genero) })
        .eq('id', form.id).select();
      if (error) throw error;
      const tiposMap = Object.fromEntries(tipos.map(t => [String(t.id), t.tipo]))
      const genMap = Object.fromEntries(generos.map(g => [String(g.id_genero), g.clasificacion]))
      const updated = (data || []).map(r => mapRowToBook(r, tiposMap, genMap))[0];
      if (updated) setBooks(prev => prev.map(b => b.id === form.id ? updated : b));
      setEditing(false);
      setForm({ id: "", title: "", author: "", year: "", id_tipo: "", id_genero: "" });
      showToast('Libro actualizado correctamente.')
    } catch (err) {
      showToast(`Error al actualizar: ${err.message}`, 'error')
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!puedeEliminar) { showToast('No tienes permiso para eliminar libros.', 'error'); return }
    const id = confirmDelete
    setConfirmDelete(null)
    setLoading(true);
    try {
      const { error } = await supabase.from('materialbibliografico').delete().eq('id', id);
      if (error) throw error;
      setBooks(prev => prev.filter(b => b.id !== id));
      showToast('Libro eliminado.')
    } catch (err) {
      showToast(`Error al eliminar: ${err.message}`, 'error')
    } finally {
      setLoading(false);
    }
  }

  if (loadingRol) return (
    <div className="min-h-screen app-bg flex items-center justify-center">
      <div className="space-y-3 w-full max-w-4xl px-4">
        {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/50 animate-pulse" />)}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen app-bg flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-4xl bg-white/95 rounded-2xl p-8 shadow-2xl border-l-4 border-emerald-500">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold border ${
            toast.type === 'error' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
          }`}>
            <span>{toast.type === 'error' ? '✕' : '✓'}</span>
            <span>{toast.msg}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Modal borrar */}
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmDelete(null)}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-emerald-900 mb-2">¿Eliminar este libro?</h2>
              <p className="text-sm text-gray-500 mb-5">Esta acción es permanente y no se puede deshacer.</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition">Cancelar</button>
                <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition">Sí, eliminar</button>
              </div>
            </div>
          </div>
        )}

        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-emerald-800">Catálogo de Libros</h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-emerald-700/90 text-sm">Gestión del material bibliográfico</p>
              {rol && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  rol === 'admin'         ? 'bg-red-100 text-red-700' :
                  rol === 'bibliotecario' ? 'bg-blue-100 text-blue-700' :
                                           'bg-gray-100 text-gray-600'
                }`}>{rol}</span>
              )}
            </div>
          </div>
          <button onClick={() => navigate('/home')} className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-emerald-500 text-white font-semibold shadow-md hover:opacity-95 transition">
            Volver
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Formulario — solo bibliotecario y admin */}
          {puedeEditar ? (
            <form onSubmit={editing ? handleUpdate : handleCreate} className="p-4 rounded-lg bg-yellow-50/90 border border-yellow-200">
              <h3 className="font-bold text-emerald-800 mb-2">{editing ? 'Editar libro' : 'Agregar libro'}</h3>

              <label className="block text-sm text-emerald-800">Título</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className={`w-full mt-2 px-3 py-2 rounded-md bg-white border ${errors.title ? 'border-red-400' : ''}`} />
              {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}

              <label className="block text-sm text-emerald-800 mt-3">Autor</label>
              <input value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                className={`w-full mt-2 px-3 py-2 rounded-md bg-white border ${errors.author ? 'border-red-400' : ''}`} />
              {errors.author && <p className="text-xs text-red-600 mt-1">{errors.author}</p>}

              <label className="block text-sm text-emerald-800 mt-3">Año</label>
              <input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value.replace(/\D/g, '') }))}
                inputMode="numeric"
                className={`w-full mt-2 px-3 py-2 rounded-md bg-white border ${errors.year ? 'border-red-400' : ''}`} />
              {errors.year && <p className="text-xs text-red-600 mt-1">{errors.year}</p>}

              <label className="block text-sm text-emerald-800 mt-3">Tipo</label>
              <select value={form.id_tipo ?? ""} onChange={e => setForm(f => ({ ...f, id_tipo: e.target.value }))}
                className={`w-full mt-2 px-3 py-2 rounded-md bg-white border ${errors.id_tipo ? 'border-red-400' : ''}`}>
                <option value="">-- Seleccionar tipo --</option>
                {tipos.map(t => <option key={t.id} value={t.id}>{t.tipo}</option>)}
              </select>
              {errors.id_tipo && <p className="text-xs text-red-600 mt-1">{errors.id_tipo}</p>}

              <label className="block text-sm text-emerald-800 mt-3">Género</label>
              <select value={form.id_genero ?? ""} onChange={e => setForm(f => ({ ...f, id_genero: e.target.value }))}
                className={`w-full mt-2 px-3 py-2 rounded-md bg-white border ${errors.id_genero ? 'border-red-400' : ''}`}>
                <option value="">-- Seleccionar género --</option>
                {generos.map(g => <option key={g.id_genero} value={g.id_genero}>{g.clasificacion}</option>)}
              </select>
              {errors.id_genero && <p className="text-xs text-red-600 mt-1">{errors.id_genero}</p>}

              <div className="flex items-center gap-3 mt-4">
                <button type="submit" disabled={loading}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? (editing ? 'Actualizando…' : 'Creando…') : (editing ? 'Actualizar' : 'Crear')}
                </button>
                {editing && (
                  <button type="button"
                    onClick={() => { setEditing(false); setForm({ id: "", title: "", author: "", year: "", id_tipo: "", id_genero: "" }); setErrors({}) }}
                    className="px-3 py-2 rounded-md bg-gray-200 text-gray-700">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          ) : (
            // Lector: panel informativo en lugar del formulario
            <div className="p-4 rounded-lg bg-yellow-50/90 border border-yellow-200 flex flex-col items-center justify-center text-center gap-2">
              <span className="text-3xl">📚</span>
              <p className="font-semibold text-emerald-800">Modo lectura</p>
              <p className="text-sm text-gray-500">Tu rol de <strong>lector</strong> solo permite visualizar el catálogo.</p>
            </div>
          )}

          {/* Lista */}
          <div className="p-4 rounded-lg bg-yellow-50/90 border border-yellow-200">
            <h3 className="font-bold text-emerald-800 mb-2">Lista de libros</h3>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-14 rounded-md bg-yellow-100 animate-pulse" />)}
              </div>
            ) : books.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No hay libros registrados todavía.</p>
            ) : (
              <ul className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {books.map(book => (
                  <li key={book.id} className="flex items-center justify-between bg-white p-3 rounded-md shadow-sm">
                    <div>
                      <div className="font-semibold text-emerald-800">{book.title}</div>
                      <div className="text-sm text-emerald-700">
                        {book.author} — {book.year}
                        {(book.tipo_label || book.genero_label) && (
                          <div className="text-xs text-gray-500">
                            {[book.tipo_label, book.genero_label].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {/* Editar: bibliotecario y admin */}
                      {puedeEditar && (
                        <button onClick={() => startEdit(book)} className="text-sm px-3 py-1 bg-amber-300 text-emerald-800 rounded-md">Editar</button>
                      )}
                      {/* Borrar: solo admin */}
                      {puedeEliminar && (
                        <button onClick={() => setConfirmDelete(book.id)} className="text-sm px-3 py-1 bg-red-500 text-white rounded-md">Borrar</button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
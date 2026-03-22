import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../../services/supabaseClient.js'

const ROL_LABELS = { 2: 'lector', 3: 'bibliotecario', 4: 'admin' }
const ROL_BADGE  = {
  admin:         'bg-red-100 text-red-700',
  bibliotecario: 'bg-blue-100 text-blue-700',
  lector:        'bg-gray-100 text-gray-600',
}

export default function Usuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [rolActual, setRolActual] = useState(null);
  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({ nombre: '', apellido: '', cc: '', roles: 2, nuevaPassword: '' });
  const [editErrors, setEditErrors] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    async function verificarAdmin() {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData?.session?.user
      if (!user) { navigate('/home'); return }
      const { data: perfil } = await supabase.from('usuario').select('roles').eq('id', user.id).single()
      const rol = ROL_LABELS[perfil?.roles]
      setRolActual(rol)
      if (rol !== 'admin') navigate('/home')
      else fetchUsuarios()
    }
    verificarAdmin()
  }, [])

  async function fetchUsuarios() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .rpc('get_usuarios_con_email')
      if (error) throw error
      setUsuarios(data ?? [])
    } catch (err) {
      showToast(`Error cargando usuarios: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  function startEdit(u) {
    setEditando(u.id)
    setEditForm({ nombre: u.nombre || '', apellido: u.apellido || '', cc: u.cc || '', roles: u.roles ?? 2, nuevaPassword: '' })
    setEditErrors({})
  }

  function validateEdit() {
    const e = {}
    if (!editForm.nombre.trim()) e.nombre = 'Obligatorio.'
    if (!editForm.apellido.trim()) e.apellido = 'Obligatorio.'
    if (!editForm.cc.trim()) e.cc = 'Obligatorio.'
    if (editForm.nuevaPassword && editForm.nuevaPassword.length < 6) e.nuevaPassword = 'Mínimo 6 caracteres.'
    setEditErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleGuardarEdit(e) {
    e.preventDefault()
    if (!validateEdit()) return
    setSavingEdit(true)
    try {
      const { error: errUsuario } = await supabase
        .from('usuario')
        .update({ nombre: editForm.nombre, apellido: editForm.apellido, cc: editForm.cc, roles: Number(editForm.roles) })
        .eq('id', editando)
      if (errUsuario) throw errUsuario

      if (editForm.nuevaPassword) {
        const { data: sessionData } = await supabase.auth.getSession()
        const userActual = sessionData?.session?.user
        if (userActual?.id === editando) {
          const { error: errPass } = await supabase.auth.updateUser({ password: editForm.nuevaPassword })
          if (errPass) throw errPass
        } else {
          showToast('Perfil actualizado. La contraseña solo se puede cambiar desde el backend con Admin API.', 'info')
        }
      }

      setUsuarios(prev => prev.map(u =>
        u.id === editando
          ? { ...u, nombre: editForm.nombre, apellido: editForm.apellido, cc: editForm.cc, roles: Number(editForm.roles) }
          : u
      ))
      setEditando(null)
      showToast('Usuario actualizado correctamente.')
    } catch (err) {
      showToast(`Error al actualizar: ${err.message}`, 'error')
    } finally {
      setSavingEdit(false)
    }
  }

  async function handleEliminar() {
    const id = confirmDelete
    setConfirmDelete(null)
    try {
      const { error } = await supabase.from('usuario').delete().eq('id', id)
      if (error) throw error
      setUsuarios(prev => prev.filter(u => u.id !== id))
      showToast('Usuario eliminado.')
    } catch (err) {
      showToast(`Error al eliminar: ${err.message}`, 'error')
    }
  }

  if (rolActual === null) return (
    <div className="min-h-screen app-bg flex items-center justify-center">
      <div className="space-y-3 w-full max-w-4xl px-4">
        {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/50 animate-pulse" />)}
      </div>
    </div>
  )

  const inputCls = (err) =>
    `w-full px-3 py-2 rounded-md bg-white border text-sm ${err ? 'border-red-400' : 'border-gray-200'}`

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

      {/* Modal eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-emerald-900 mb-2">¿Eliminar este usuario?</h2>
            <p className="text-sm text-gray-500 mb-5">Se eliminará el perfil de la tabla usuario. La cuenta en Supabase Auth permanece.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition">Cancelar</button>
              <button onClick={handleEliminar} className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl bg-white/95 rounded-2xl p-8 shadow-2xl border-l-4 border-emerald-500">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-emerald-800">Gestión de Usuarios</h1>
            <p className="text-emerald-700/90 mt-1 text-sm">Solo accesible para administradores</p>
          </div>
          <button onClick={() => navigate('/home')} className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-emerald-500 text-white font-semibold shadow-md hover:opacity-95 transition text-sm">
            Volver
          </button>
        </header>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-16 rounded-xl bg-yellow-50 animate-pulse border border-yellow-200" />)}
          </div>
        ) : usuarios.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No hay usuarios registrados.</p>
        ) : (
          <ul className="space-y-3">
            {usuarios.map(u => (
              <li key={u.id} className="bg-yellow-50/90 border border-yellow-200 rounded-xl overflow-hidden">

                <div className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-emerald-800">
                        {u.nombre || '—'} {u.apellido || ''}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ROL_BADGE[ROL_LABELS[u.roles]] || 'bg-gray-100 text-gray-600'}`}>
                        {ROL_LABELS[u.roles] || 'sin rol'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-0.5 flex flex-wrap gap-3">
                      {u.email && <span>{u.email}</span>}
                      {u.cc && <span>CC: {u.cc}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => editando === u.id ? setEditando(null) : startEdit(u)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-semibold hover:bg-blue-200 transition"
                    >
                      {editando === u.id ? 'Cerrar' : 'Editar'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(u.id)}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded-md text-sm font-semibold hover:bg-red-200 transition"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                {editando === u.id && (
                  <form onSubmit={handleGuardarEdit}
                    className="border-t border-yellow-200 bg-white p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <h4 className="font-semibold text-emerald-800 md:col-span-2 text-sm">Editar usuario</h4>

                    <div>
                      <label className="block text-xs text-emerald-800 mb-1">Nombre</label>
                      <input value={editForm.nombre}
                        onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                        className={inputCls(editErrors.nombre)} />
                      {editErrors.nombre && <p className="text-xs text-red-600 mt-1">{editErrors.nombre}</p>}
                    </div>

                    <div>
                      <label className="block text-xs text-emerald-800 mb-1">Apellido</label>
                      <input value={editForm.apellido}
                        onChange={e => setEditForm(f => ({ ...f, apellido: e.target.value }))}
                        className={inputCls(editErrors.apellido)} />
                      {editErrors.apellido && <p className="text-xs text-red-600 mt-1">{editErrors.apellido}</p>}
                    </div>

                    <div>
                      <label className="block text-xs text-emerald-800 mb-1">CC</label>
                      <input value={editForm.cc}
                        onChange={e => setEditForm(f => ({ ...f, cc: e.target.value.replace(/\D/g, '') }))}
                        inputMode="numeric"
                        className={inputCls(editErrors.cc)} />
                      {editErrors.cc && <p className="text-xs text-red-600 mt-1">{editErrors.cc}</p>}
                    </div>

                    <div>
                      <label className="block text-xs text-emerald-800 mb-1">Rol</label>
                      <select value={editForm.roles}
                        onChange={e => setEditForm(f => ({ ...f, roles: Number(e.target.value) }))}
                        className={inputCls(false)}>
                        <option value={2}>Lector</option>
                        <option value={3}>Bibliotecario</option>
                        <option value={4}>Admin</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs text-emerald-800 mb-1">
                        Nueva contraseña <span className="text-gray-400">(dejar vacío para no cambiar)</span>
                      </label>
                      <input type="password" value={editForm.nuevaPassword}
                        onChange={e => setEditForm(f => ({ ...f, nuevaPassword: e.target.value }))}
                        placeholder="Mínimo 6 caracteres"
                        className={inputCls(editErrors.nuevaPassword)} />
                      {editErrors.nuevaPassword && <p className="text-xs text-red-600 mt-1">{editErrors.nuevaPassword}</p>}
                      <p className="text-xs text-gray-400 mt-1">
                        El cambio de contraseña aplica solo si es tu propio usuario.
                      </p>
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-2">
                      <button type="button" onClick={() => setEditando(null)}
                        className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition">
                        Cancelar
                      </button>
                      <button type="submit" disabled={savingEdit}
                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed">
                        {savingEdit ? 'Guardando…' : 'Guardar cambios'}
                      </button>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
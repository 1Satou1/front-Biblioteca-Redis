import logo_jic from "../styles/img/logo_jic.png";
import { useState } from "react";
import { supabase } from '../../services/supabaseClient.js'

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [nombre, setNombre] = useState("")
  const [apellido, setApellido] = useState("")
  const [cc, setCc] = useState("")
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState({})

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  function validate() {
    const e = {}
    if (!nombre.trim()) e.nombre = 'El nombre es obligatorio.'
    if (!apellido.trim()) e.apellido = 'El apellido es obligatorio.'
    if (!cc.trim()) e.cc = 'La cédula es obligatoria.'
    else if (!/^\d+$/.test(cc.trim())) e.cc = 'La cédula solo debe contener números.'
    if (!email.trim()) e.email = 'El correo es obligatorio.'
    if (!password.trim()) e.password = 'La contraseña es obligatoria.'
    else if (password.length < 6) e.password = 'Mínimo 6 caracteres.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/login` }
      })
      if (error) throw error

      if (data?.user) {
        const { error: errPerfil } = await supabase.from('usuario').insert({
          id: data.user.id,
          nombre,
          apellido,
          cc,
          roles: 2
        })
        if (errPerfil) console.warn('No se pudo crear perfil:', errPerfil.message)
      }

      setDone(true)
      showToast('Cuenta creada. Revisa tu correo para confirmarla.')
    } catch (err) {
      showToast(err.message || 'Error al crear la cuenta.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (campo) =>
    `mt-2 w-full px-3 py-2 rounded-lg bg-yellow-50 border ${errors[campo] ? 'border-red-400' : 'border-transparent'
    } focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition disabled:opacity-60`

  return (
    <div className="min-h-screen app-bg flex items-center justify-center px-4">

      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold border ${toast.type === 'error' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
          }`}>
          <span>{toast.type === 'error' ? '✕' : '✓'}</span>
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="w-full max-w-md bg-white/95 rounded-2xl p-8 shadow-2xl border-l-4 border-emerald-500">
        <img src={logo_jic} alt="logo_jic.png" className="w-20 h-20 rounded-lg mx-auto shadow-md" />
        <h1 className="text-center text-2xl font-extrabold text-emerald-800 mt-4">Crear cuenta</h1>
        <p className="text-center text-sm text-emerald-700/90 mb-6">Regístrate para acceder a Biblioteca Pro</p>

        {done ? (
          <div className="text-center py-4">
            <p className="text-emerald-700 font-semibold mb-4">
              ✓ Revisa tu correo <strong>{email}</strong> y confirma tu cuenta.
            </p>
            <a href="/login" className="text-sm font-semibold text-emerald-800 underline">Ir al inicio de sesión</a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-emerald-800">Nombre</label>
                <input
                  type="text" value={nombre} disabled={loading}
                  onChange={e => { setNombre(e.target.value); setErrors(p => ({ ...p, nombre: '' })) }}
                  placeholder="Juan"
                  className={inputClass('nombre')}
                />
                {errors.nombre && <p className="text-xs text-red-600 mt-1">{errors.nombre}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-emerald-800">Apellido</label>
                <input
                  type="text" value={apellido} disabled={loading}
                  onChange={e => { setApellido(e.target.value); setErrors(p => ({ ...p, apellido: '' })) }}
                  placeholder="Pérez"
                  className={inputClass('apellido')}
                />
                {errors.apellido && <p className="text-xs text-red-600 mt-1">{errors.apellido}</p>}
              </div>
            </div>

            {/* CC */}
            <div>
              <label className="block text-sm font-medium text-emerald-800">Cédula (CC)</label>
              <input
                type="text" inputMode="numeric" value={cc} disabled={loading}
                onChange={e => { setCc(e.target.value.replace(/\D/g, '')); setErrors(p => ({ ...p, cc: '' })) }}
                placeholder="Ej. 1234567890"
                className={inputClass('cc')}
              />
              {errors.cc && <p className="text-xs text-red-600 mt-1">{errors.cc}</p>}
            </div>

            {/* Correo */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-emerald-800">Correo</label>
              <input
                id="email" type="email" value={email} disabled={loading}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
                placeholder="email@elpoli.edu.co"
                className={inputClass('email')}
              />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-emerald-800">Contraseña</label>
              <input
                id="password" type="password" value={password} disabled={loading}
                onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: '' })) }}
                placeholder="Mínimo 6 caracteres"
                className={inputClass('password')}
              />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between pt-1">
              <a href="/login" className="text-sm text-emerald-700 hover:underline">Ya tengo cuenta</a>
              <button
                type="submit" disabled={loading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-emerald-500 text-white font-semibold shadow-md hover:opacity-95 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Creando…' : 'Crear cuenta'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
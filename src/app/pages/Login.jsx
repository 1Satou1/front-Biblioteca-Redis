import logo_jic from "../styles/img/logo_jic.png";
import { useState } from "react";
import { supabase } from '../../services/supabaseClient.js'
import { login } from '../../services/enviaralback.js'

// Mapa de roles: debe coincidir con los ids en tu tabla roles de Supabase
const ROL_LABELS = { 4: 'admin', 3: 'bibliotecario', 2: 'lector' }

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      // 1. Autenticar en Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const token = data?.session?.access_token ?? null

      // 2. Obtener rol del usuario desde tabla usuario
      const { data: perfil, error: errPerfil } = await supabase
        .from('usuario')
        .select('nombre, apellido, roles')
        .eq('id', data.user.id)
        .single()

      if (errPerfil) {
        console.warn('No se pudo obtener el perfil:', errPerfil.message)
      }

      // 3. Guardar rol en localStorage para usarlo en el resto de la app
      if (perfil) {
        const rolLabel = ROL_LABELS[perfil.roles] || 'lector'
        localStorage.setItem('user_rol', rolLabel)
        localStorage.setItem('user_nombre', perfil.nombre || email)
      }

      // 4. Enviar al backend para caché Redis
      try {
        await login({ email, password, token })
      } catch (err) {
        console.warn('Backend login error (no crítico):', err.message)
      }

      showToast('¡Bienvenido!')
    } catch (err) {
      showToast(err.message || 'Credenciales incorrectas. Intenta de nuevo.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center app-bg px-4">

      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold border ${
          toast.type === 'error' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
        }`}>
          <span>{toast.type === 'error' ? '✕' : '✓'}</span>
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100">✕</button>
        </div>
      )}

      <div className="w-full max-w-md bg-white/95 rounded-2xl p-8 shadow-2xl border-l-4 border-emerald-500">
        <img src={logo_jic} alt="logo_jic" className="w-20 h-20 rounded-lg mx-auto shadow-md" />
        <h1 className="text-center text-2xl font-extrabold text-emerald-800 mt-4">Biblioteca Pro</h1>
        <p className="text-center text-sm text-emerald-700/90 mb-6">Sistema de gestión de biblioteca</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-emerald-800">Correo</label>
            <input
              id="email" type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@elpoli.edu.co"
              disabled={loading}
              className="mt-2 w-full px-3 py-2 rounded-lg bg-yellow-50 border border-transparent focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-emerald-800">Contraseña</label>
            <input
              id="password" type="password" required
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="mt-2 w-full px-3 py-2 rounded-lg bg-yellow-50 border border-transparent focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition disabled:opacity-60"
            />
          </div>

          <button
            type="submit" disabled={loading || !email || !password}
            className="w-full py-2 mt-2 rounded-lg bg-gradient-to-r from-yellow-400 to-emerald-500 text-white font-bold shadow-lg hover:scale-[.998] transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <span className="text-sm text-emerald-700 mr-2">¿No tienes cuenta?</span>
          <a href="/register" className="inline-block text-sm font-semibold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-md hover:bg-emerald-200 transition">
            Crear cuenta
          </a>
        </div>
      </div>
    </div>
  )
}
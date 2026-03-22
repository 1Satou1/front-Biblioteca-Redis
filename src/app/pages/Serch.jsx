import { useEffect, useState } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { useNavigate } from 'react-router-dom'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function Serch() {
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingSync, setLoadingSync] = useState(false)
  const [chartData, setChartData] = useState(null)
  const [chartOptions] = useState({
    responsive: true,
    plugins: { legend: { position: 'right' }, tooltip: { enabled: true } }
  })
  const [aggregates, setAggregates] = useState([])

  useEffect(() => {
    // al entrar a la página: sincronizar y cargar agregados
    async function load() {
      setLoadingSync(true)
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

await fetch(`${API_URL}/biblioteca/sync-aggregates`, { method: 'POST' })
const resp = await fetch(`${API_URL}/biblioteca/aggregates`)
        const docs = await resp.json()
        setAggregates(docs || [])
      } catch (err) {
        console.error('sync/load aggregates error', err)
      } finally {
        setLoadingSync(false)
      }
    }
    load()
  }, [])

  function generateColors(n) {
    const palette = [
      '#16a34a', '#ef4444', '#f59e0b', '#2563eb', '#8b5cf6',
      '#e11d48', '#06b6d4', '#f97316', '#10b981', '#6366f1',
      '#7c3aed', '#0ea5a0', '#f43f5e'
    ]
    return Array.from({ length: n }, (_, i) => palette[i % palette.length])
  }

  // Construye chartData a partir del documento de agregados
  function buildChartFromAggregate(doc) {
    if (!doc || !doc.tipos || !doc.cantidades_de_cada_tipo) return null
    // mantener orden de keys en tipos
    const keys = Object.keys(doc.tipos)
    const labels = keys.map(k => doc.tipos[k])
    const values = keys.map(k => doc.cantidades_de_cada_tipo[k] || 0)
    if (labels.length === 0 || values.length === 0) return null
    return {
      labels,
      datasets: [{ label: 'Cantidad', data: values, backgroundColor: generateColors(labels.length), hoverOffset: 8 }]
    }
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!filterType) {
      alert('Selecciona un filtro')
      return
    }
    setLoading(true)
    setChartData(null)
    try {
      // encontrar documento por nombre (nombre en backend: 'tipo','genero','autor','año')
      const doc = aggregates.find(d => d.nombre === (filterType === 'año' ? 'año' : filterType))
      const cd = buildChartFromAggregate(doc)
      if (!cd) {
        alert('No hay datos para ese filtro')
        setChartData(null)
      } else {
        setChartData(cd)
      }
    } catch (err) {
      console.error('build chart error', err)
      setChartData(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen app-bg flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-4xl bg-white/95 rounded-2xl p-8 shadow-2xl">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold text-emerald-800 mb-6">DashBoard</h1>
          <button
            onClick={() => navigate('/home')}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-emerald-500 text-white font-semibold shadow-md hover:opacity-95 transition"
          >
            Volver
          </button>
        </header>
        <form onSubmit={handleSearch} className="p-6 rounded-lg bg-yellow-50/90 border border-yellow-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-emerald-800 mb-2">Filtrar por (agregados)</label>
              <select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setChartData(null); }}
                className="w-full px-3 py-2 rounded-md bg-white border border-emerald-300"
              >
                <option value="">-- Selecciona un filtro --</option>
                <option value="tipo">Tipo de Material</option>
                <option value="genero">Género</option>
                <option value="autor">Autor</option>
                <option value="año">Año de Publicación</option>
              </select>
            </div>

            <div />
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading || loadingSync}
                className="w-full px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Generando...' : (loadingSync ? 'Sincronizando...' : 'Generar')}
              </button>

            </div>
          </div>
        </form>

        <div className="p-6 rounded-lg bg-yellow-50/90 border border-yellow-200">
          <h3 className="font-bold text-emerald-800 mb-4">Resultado Gráfico Cuantitativo</h3>

          {chartData ? (
            <div className="max-w-md mx-auto">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="text-sm text-emerald-700">
              {loadingSync ? 'Sincronizando datos desde el servidor...' : 'Aplica un filtro y pulsa "Generar" para ver la gráfica.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
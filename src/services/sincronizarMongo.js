const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function syncData(datos) {
  const response = await fetch(`${API_URL}/biblioteca/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  })
  if (!response.ok) {
    const error = await response.text()
    throw new Error(error)
  }
  return await response.json()
}
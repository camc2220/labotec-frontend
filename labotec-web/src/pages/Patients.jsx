import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import Table from '../components/Table'
import { useAuth } from '../context/AuthContext'

export default function Patients() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    if (user?.role !== 'admin') return
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/patients', { params: { q, page: 1, pageSize: 20, sortDir: 'asc' } })
      setItems(res.data.items ?? res.data.Items ?? [])
    } catch (err) {
      console.error(err)
      setError('No pudimos cargar la lista de pacientes. Intenta nuevamente más tarde.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData()
    } else {
      setLoading(false)
    }
  }, [user?.role])

  const columns = [
    { key: 'fullName', header: 'Nombre' },
    { key: 'documentId', header: 'Documento' },
    { key: 'birthDate', header: 'Nacimiento' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Teléfono' },
  ]
  if (user?.role !== 'admin') {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Pacientes</h2>
        <p className="text-sm text-gray-600">Esta sección está disponible únicamente para personal administrativo.</p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Pacientes</h2>
        <div className="flex gap-2">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar..." className="border rounded-lg px-3 py-2 text-sm" />
          <button onClick={fetchData} className="bg-sky-600 text-white rounded-lg px-3 py-2 text-sm">Buscar</button>
        </div>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? <div>Cargando...</div> : items.length > 0 ? <Table columns={columns} data={items} /> : <div className="text-sm text-gray-500">No encontramos pacientes para tu búsqueda.</div>}
    </section>
  )
}

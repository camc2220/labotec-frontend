import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import Table from '../components/Table'
export default function Patients() {
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/patients', { params: { q, page:1, pageSize:20, sortDir:'asc' } })
      setItems(res.data.items ?? res.data.Items ?? [])
    } finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [])
  const columns = [
    { key: 'fullName', header: 'Nombre' },
    { key: 'documentId', header: 'Documento' },
    { key: 'birthDate', header: 'Nacimiento' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Teléfono' },
  ]
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Pacientes</h2>
        <div className="flex gap-2">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar..." className="border rounded-lg px-3 py-2 text-sm"/>
          <button onClick={fetchData} className="bg-sky-600 text-white rounded-lg px-3 py-2 text-sm">Buscar</button>
        </div>
      </div>
      {loading ? <div>Cargando...</div> : <Table columns={columns} data={items} />}
    </section>
  )
}

import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import Table from '../components/Table'
export default function Appointments() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/appointments', { params: { page:1, pageSize:20, sortDir:'asc' } })
      setItems(res.data.items ?? res.data.Items ?? [])
    } finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [])
  const columns = [
    { key: 'patientName', header: 'Paciente' },
    { key: 'scheduledAt', header: 'Fecha/Hora' },
    { key: 'type', header: 'Tipo' },
    { key: 'status', header: 'Estado' },
    { key: 'notes', header: 'Notas' },
  ]
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Citas</h2>
      {loading ? <div>Cargando...</div> : <Table columns={columns} data={items} />}
    </section>
  )
}

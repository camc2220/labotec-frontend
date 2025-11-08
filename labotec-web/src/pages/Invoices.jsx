import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import Table from '../components/Table'
export default function Invoices() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/invoices', { params: { page:1, pageSize:20, sortDir:'asc' } })
      setItems(res.data.items ?? res.data.Items ?? [])
    } finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [])
  const columns = [
    { key: 'patientName', header: 'Paciente' },
    { key: 'number', header: 'Factura' },
    { key: 'amount', header: 'Monto' },
    { key: 'issuedAt', header: 'Fecha' },
    { key: 'paid', header: 'Pagada', render: r => r.paid ? 'Sí' : 'No' },
  ]
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Facturas</h2>
      {loading ? <div>Cargando...</div> : <Table columns={columns} data={items} />}
    </section>
  )
}

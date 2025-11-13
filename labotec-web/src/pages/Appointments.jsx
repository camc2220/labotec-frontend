import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import Table from '../components/Table'
import { useAuth } from '../context/AuthContext'

export default function Appointments() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const isPatient = user?.role === 'patient'
  const endpoint = isPatient ? '/api/patients/me/appointments' : '/api/appointments'

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const res = await api.get(endpoint, { params: { page: 1, pageSize: 20, sortDir: isPatient ? 'asc' : 'desc' } })
      setItems(res.data.items ?? res.data.Items ?? [])
    } catch (err) {
      console.error(err)
      setError('No pudimos cargar las citas. Intenta nuevamente más tarde.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) fetchData()
  }, [endpoint, user])

  const columns = [
    ...(isPatient ? [] : [{ key: 'patientName', header: 'Paciente' }]),
    { key: 'scheduledAt', header: 'Fecha/Hora' },
    { key: 'type', header: 'Tipo' },
    { key: 'status', header: 'Estado' },
    { key: 'notes', header: 'Notas' },
  ]
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{isPatient ? 'Mis citas' : 'Citas'}</h2>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? (
        <div>Cargando...</div>
      ) : items.length > 0 ? (
        <Table columns={columns} data={items} />
      ) : (
        <div className="text-sm text-gray-500">{isPatient ? 'Aún no tienes citas programadas.' : 'No hay citas registradas.'}</div>
      )}
    </section>
  )
}

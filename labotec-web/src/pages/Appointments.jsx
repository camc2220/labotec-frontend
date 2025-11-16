import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { resolveEntityId } from '../lib/entity'
import { useAuth } from '../context/AuthContext'

export default function Appointments() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    patientId: '',
    scheduledAt: '',
    type: '',
    status: '',
    notes: '',
  })

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

  const openForm = item => {
    if (item) {
      setFormData({
        patientId: item.patientId ?? '',
        scheduledAt: item.scheduledAt ? item.scheduledAt.slice(0, 16) : '',
        type: item.type ?? '',
        status: item.status ?? '',
        notes: item.notes ?? '',
      })
      setEditingItem(item)
    } else {
      setFormData({ patientId: '', scheduledAt: '', type: '', status: '', notes: '' })
      setEditingItem(null)
    }
    setFormError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setFormError('')
    setEditingItem(null)
  }

  const handleFormSubmit = async e => {
    e.preventDefault()
    if (isPatient) return
    setSaving(true)
    setFormError('')
    try {
      const payload = { ...formData, scheduledAt: formData.scheduledAt }
      if (editingItem) {
        await api.put(`/api/appointments/${resolveEntityId(editingItem)}`, payload)
      } else {
        await api.post('/api/appointments', payload)
      }
      closeForm()
      fetchData()
    } catch (err) {
      console.error(err)
      setFormError('No pudimos guardar la cita. Revisa los datos e intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async item => {
    if (isPatient) return
    const id = resolveEntityId(item)
    if (!id) return
    if (!window.confirm('¿Eliminar esta cita?')) return
    try {
      await api.delete(`/api/appointments/${id}`)
      fetchData()
    } catch (err) {
      console.error(err)
      setError('No pudimos eliminar la cita.')
    }
  }

  const columns = [
    ...(isPatient ? [] : [{ key: 'patientName', header: 'Paciente' }]),
    { key: 'scheduledAt', header: 'Fecha/Hora' },
    { key: 'type', header: 'Tipo' },
    { key: 'status', header: 'Estado' },
    { key: 'notes', header: 'Notas' },
    ...(!isPatient
      ? [
        {
          key: 'actions',
          header: 'Acciones',
          render: row => (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => openForm(row)} className="text-xs text-sky-700 hover:underline">Editar</button>
              <button onClick={() => handleDelete(row)} className="text-xs text-red-600 hover:underline">Eliminar</button>
            </div>
          ),
        },
      ]
      : []),
  ]
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">{isPatient ? 'Mis citas' : 'Citas'}</h2>
        {!isPatient && (
          <button onClick={() => openForm(null)} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white">Agregar cita</button>
        )}
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? (
        <div>Cargando...</div>
      ) : items.length > 0 ? (
        <Table columns={columns} data={items} />
      ) : (
        <div className="text-sm text-gray-500">{isPatient ? 'Aún no tienes citas programadas.' : 'No hay citas registradas.'}</div>
      )}
      {showForm && !isPatient && (
        <Modal title={editingItem ? 'Editar cita' : 'Agregar cita'} onClose={closeForm}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">ID del paciente</label>
              <input
                value={formData.patientId}
                onChange={e => setFormData({ ...formData, patientId: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fecha y hora</label>
              <input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={e => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Tipo</label>
                <input
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Estado</label>
                <input
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Notas</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                rows={3}
              />
            </div>
            {formError && <div className="text-sm text-red-600">{formError}</div>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeForm} className="rounded-lg border px-3 py-2 text-sm">Cancelar</button>
              <button type="submit" className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  )
}

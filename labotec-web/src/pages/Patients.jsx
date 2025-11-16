import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { resolveEntityId } from '../lib/entity'
import { useAuth } from '../context/AuthContext'

export default function Patients() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    documentId: '',
    birthDate: '',
    email: '',
    phone: '',
  })

  const resetForm = () => {
    setFormData({ fullName: '', documentId: '', birthDate: '', email: '', phone: '' })
    setFormError('')
    setEditingItem(null)
  }

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

  const openForm = item => {
    if (item) {
      setFormData({
        fullName: item.fullName ?? '',
        documentId: item.documentId ?? '',
        birthDate: item.birthDate ? item.birthDate.slice(0, 10) : '',
        email: item.email ?? '',
        phone: item.phone ?? '',
      })
      setEditingItem(item)
    } else {
      resetForm()
    }
    setShowForm(true)
  }

  const closeForm = () => {
    resetForm()
    setShowForm(false)
  }

  const handleFormSubmit = async e => {
    e.preventDefault()
    if (user?.role !== 'admin') return
    setFormError('')
    setSaving(true)
    try {
      const payload = { ...formData, role: 'patient' }
      if (editingItem) {
        await api.put(`/api/patients/${resolveEntityId(editingItem)}`, payload)
      } else {
        await api.post('/api/patients', payload)
      }
      closeForm()
      fetchData()
    } catch (err) {
      console.error(err)
      setFormError('No pudimos guardar la información del paciente. Revisa los datos e intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async item => {
    if (user?.role !== 'admin') return
    const id = resolveEntityId(item)
    if (!id) return
    if (!window.confirm('¿Seguro que deseas eliminar este paciente?')) return
    setError('')
    try {
      await api.delete(`/api/patients/${id}`)
      fetchData()
    } catch (err) {
      console.error(err)
      setError('No pudimos eliminar el paciente. Intenta nuevamente más tarde.')
    }
  }

  const columns = [
    { key: 'fullName', header: 'Nombre' },
    { key: 'documentId', header: 'Documento' },
    { key: 'birthDate', header: 'Nacimiento' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Teléfono' },
    ...(user?.role === 'admin'
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
        <div className="flex flex-wrap gap-2">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar..." className="border rounded-lg px-3 py-2 text-sm" />
          <button onClick={fetchData} className="bg-sky-600 text-white rounded-lg px-3 py-2 text-sm">Buscar</button>
          <button onClick={() => openForm(null)} className="bg-emerald-600 text-white rounded-lg px-3 py-2 text-sm">Agregar paciente</button>
        </div>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {loading ? <div>Cargando...</div> : items.length > 0 ? <Table columns={columns} data={items} /> : <div className="text-sm text-gray-500">No encontramos pacientes para tu búsqueda.</div>}
      {showForm && (
        <Modal title={editingItem ? 'Editar paciente' : 'Agregar paciente'} onClose={closeForm}>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Nombre completo</label>
              <input
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Documento</label>
              <input
                value={formData.documentId}
                onChange={e => setFormData({ ...formData, documentId: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Teléfono</label>
                <input
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Correo</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
            </div>
            <p className="text-xs text-gray-500">El rol del paciente se asignará automáticamente como <strong>paciente</strong>.</p>
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

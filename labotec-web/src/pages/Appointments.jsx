import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { useAuth } from '../context/AuthContext'

// Helper para convertir ISO string a formato input datetime-local (yyyy-MM-ddThh:mm)
const toInputDate = (isoString) => {
  if (!isoString) return ''
  return isoString.slice(0, 16)
}

export default function Appointments() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Estado del formulario
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

  // Detectar si es solo paciente
  const isPatient = user?.isPaciente && !user?.isAdmin && !user?.isRecepcion

  const fetchData = async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      // Backend devuelve { items: [...], totalCount: ... }
      const res = await api.get('/api/appointments', {
        params: {
          page: 1,
          pageSize: 50,
          sortDir: 'desc',
          // Si es paciente, el backend ya filtra por User.GetPatientId(), 
          // pero si es admin, podemos filtrar opcionalmente.
        },
      })
      
      const data = res.data
      setItems(data.items || [])
    } catch (err) {
      console.error(err)
      setError('No pudimos cargar las citas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const openForm = (item) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        patientId: item.patientId,
        scheduledAt: toInputDate(item.scheduledAt),
        type: item.type,
        status: item.status,
        notes: item.notes || '',
      })
    } else {
      setEditingItem(null)
      setFormData({
        patientId: '',
        scheduledAt: '',
        type: 'Laboratorio',
        status: 'Scheduled',
        notes: '',
      })
    }
    setFormError('')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingItem(null)
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')

    try {
      if (editingItem) {
        // Update (PUT)
        await api.put(`/api/appointments/${editingItem.id}`, {
          scheduledAt: formData.scheduledAt,
          type: formData.type,
          status: formData.status,
          notes: formData.notes
        })
      } else {
        // Create (POST)
        // Si es admin, usa el patientId del form. Si es paciente, el backend ignora esto y usa el token.
        await api.post('/api/appointments', {
          patientId: formData.patientId || user.patientId, // Fallback
          scheduledAt: formData.scheduledAt,
          type: formData.type,
          notes: formData.notes
        })
      }
      closeForm()
      fetchData()
    } catch (err) {
      console.error(err)
      setFormError('Error al guardar. Verifique los datos.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!window.confirm('¿Eliminar cita?')) return
    try {
      await api.delete(`/api/appointments/${item.id}`)
      fetchData()
    } catch (err) {
      alert('Error al eliminar')
    }
  }

  const columns = [
    // Solo mostrar columna Paciente si NO es paciente
    ...(!isPatient ? [{ key: 'patientName', header: 'Paciente' }] : []),
    { 
      key: 'scheduledAt', 
      header: 'Fecha',
      render: (row) => new Date(row.scheduledAt).toLocaleString() 
    },
    { key: 'type', header: 'Tipo' },
    { key: 'status', header: 'Estado' },
    { key: 'notes', header: 'Notas' },
    ...(!isPatient ? [{
      key: 'actions',
      header: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => openForm(row)} className="text-blue-600 text-xs hover:underline">Editar</button>
          <button onClick={() => handleDelete(row)} className="text-red-600 text-xs hover:underline">Eliminar</button>
        </div>
      )
    }] : [])
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Citas</h2>
        {/* Paciente NO puede crear citas en este panel administrativo, admin sí */}
        {!isPatient && (
          <button onClick={() => openForm(null)} className="bg-emerald-600 text-white px-3 py-2 rounded text-sm">
            Nueva Cita
          </button>
        )}
      </div>

      {error && <p className="text-red-600">{error}</p>}
      
      {loading ? <p>Cargando...</p> : (
        <Table columns={columns} data={items} rowKey="id" />
      )}

      {showForm && (
        <Modal title={editingItem ? "Editar Cita" : "Nueva Cita"} onClose={closeForm}>
          <form onSubmit={handleFormSubmit} className="space-y-3">
            {!isPatient && (
              <div>
                <label className="block text-xs font-bold">ID Paciente</label>
                <input 
                  className="w-full border p-2 rounded" 
                  value={formData.patientId}
                  onChange={e => setFormData({...formData, patientId: e.target.value})}
                  disabled={!!editingItem} // No cambiar paciente al editar
                  placeholder="GUID del paciente"
                  required
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold">Fecha</label>
              <input 
                type="datetime-local"
                className="w-full border p-2 rounded"
                value={formData.scheduledAt}
                onChange={e => setFormData({...formData, scheduledAt: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold">Tipo</label>
                <input 
                  className="w-full border p-2 rounded"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold">Estado</label>
                <select 
                  className="w-full border p-2 rounded"
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Scheduled">Programada</option>
                  <option value="Completed">Completada</option>
                  <option value="Canceled">Cancelada</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold">Notas</label>
              <textarea 
                className="w-full border p-2 rounded"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            {formError && <p className="text-red-600 text-xs">{formError}</p>}

            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={closeForm} className="px-3 py-2 border rounded">Cancelar</button>
              <button type="submit" disabled={saving} className="px-3 py-2 bg-blue-600 text-white rounded">
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
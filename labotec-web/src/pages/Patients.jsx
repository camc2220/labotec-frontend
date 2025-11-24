import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { resolveEntityId } from '../lib/entity'
import { useAuth } from '../context/AuthContext'

function extractItems(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (Array.isArray(raw.items)) return raw.items
  if (Array.isArray(raw.Items)) return raw.Items
  if (Array.isArray(raw.results)) return raw.results
  return []
}

function normalizePatient(raw) {
  if (!raw || typeof raw !== 'object') return raw
  return {
    ...raw,
    fullName:
      raw.fullName ??
      raw.FullName ??
      raw.name ??
      raw.Name ??
      '',
    documentId:
      raw.documentId ??
      raw.DocumentId ??
      raw.document ??
      raw.Document ??
      raw.documento ??
      raw.Documento ??
      '',
    birthDate:
      raw.birthDate ??
      raw.BirthDate ??
      raw.birth_date ??
      raw.fechaNacimiento ??
      raw.FechaNacimiento ??
      '',
    email: raw.email ?? raw.Email ?? '',
    phone:
      raw.phone ??
      raw.Phone ??
      raw.telefono ??
      raw.Telefono ??
      '',
  }
}

function formatBirthDate(value) {
  if (!value) return ''
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return String(value)
    return date.toLocaleDateString('es-DO', { dateStyle: 'medium' })
  } catch {
    return String(value)
  }
}

function toInputDate(value) {
  if (!value) return ''
  try {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10)
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

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

  const canManagePatients = user?.isAdmin || user?.isRecepcion

  const resetForm = () => {
    setFormData({
      fullName: '',
      documentId: '',
      birthDate: '',
      email: '',
      phone: '',
    })
    setFormError('')
    setEditingItem(null)
  }

  const fetchData = async () => {
    if (!canManagePatients) return
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/patients', {
        params: { q, page: 1, pageSize: 20, sortDir: 'asc' },
      })
      const list = extractItems(res.data ?? {})
      setItems(list.map(normalizePatient))
    } catch (err) {
      console.error(err)
      setError(
        'No pudimos cargar la lista de pacientes. Intenta nuevamente más tarde.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canManagePatients) {
      fetchData()
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManagePatients])

  const openForm = (item) => {
    if (item) {
      const normalized = normalizePatient(item)
      setFormData({
        fullName: normalized.fullName ?? '',
        documentId: normalized.documentId ?? '',
        birthDate: toInputDate(
          normalized.birthDate ??
            item.birthDate ??
            item.BirthDate ??
            item.dateOfBirth ??
            item.DateOfBirth
        ),
        email: normalized.email ?? '',
        phone: normalized.phone ?? '',
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

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    if (!canManagePatients) return
    setFormError('')
    setSaving(true)
    try {
      const payload = { ...formData }
      if (editingItem) {
        await api.put(`/api/patients/${resolveEntityId(editingItem)}`, payload)
      } else {
        await api.post('/api/patients', payload)
      }
      closeForm()
      fetchData()
    } catch (err) {
      console.error(err)
      setFormError(
        'No pudimos guardar la información del paciente. Revisa los datos e intenta nuevamente.'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (item) => {
    if (!canManagePatients) return
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
    {
      key: 'fullName',
      header: 'Nombre',
      render: (row) =>
        row.fullName ??
        row.FullName ??
        row.name ??
        row.Name ??
        '',
    },
    {
      key: 'documentId',
      header: 'Documento',
      render: (row) =>
        row.documentId ??
        row.DocumentId ??
        row.document ??
        row.Document ??
        '',
    },
    {
      key: 'birthDate',
      header: 'Nacimiento',
      render: (row) =>
        formatBirthDate(
          row.birthDate ??
            row.BirthDate ??
            row.birth_date ??
            row.dateOfBirth ??
            row.DateOfBirth
        ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (row) => row.email ?? row.Email ?? '',
    },
    {
      key: 'phone',
      header: 'Teléfono',
      render: (row) =>
        row.phone ??
        row.Phone ??
        row.telefono ??
        row.Telefono ??
        '',
    },
    ...(canManagePatients
      ? [
          {
            key: 'actions',
            header: 'Acciones',
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => openForm(row)}
                  className="text-xs text-sky-700 hover:underline"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(row)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            ),
          },
        ]
      : []),
  ]

  if (!canManagePatients) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Pacientes</h2>
        <p className="text-sm text-gray-600">
          Esta sección está disponible únicamente para personal administrativo
          (Administrador y Recepción).
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Pacientes</h2>
        <div className="flex flex-wrap gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar..."
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={fetchData}
            className="bg-sky-600 text-white rounded-lg px-3 py-2 text-sm"
          >
            Buscar
          </button>
          <button
            type="button"
            onClick={() => openForm(null)}
            className="bg-emerald-600 text-white rounded-lg px-3 py-2 text-sm"
          >
            Agregar paciente
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {loading ? (
        <div>Cargando...</div>
      ) : items.length > 0 ? (
        <Table columns={columns} data={items} />
      ) : (
        <div className="text-sm text-gray-500">
          No encontramos pacientes para tu búsqueda.
        </div>
      )}

      {showForm && (
        <Modal
          title={editingItem ? 'Editar paciente' : 'Agregar paciente'}
          onClose={closeForm}
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Nombre completo
              </label>
              <input
                value={formData.fullName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, fullName: e.target.value }))
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Documento
              </label>
              <input
                value={formData.documentId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    documentId: e.target.value,
                  }))
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      birthDate: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Teléfono
                </label>
                <input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Correo
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full rounded-lg border px-3 py-2 text-sm"
                required
              />
            </div>
            <p className="text-xs text-gray-500">
              El rol del paciente se administra desde el módulo de usuarios.
            </p>
            {formError && (
              <div className="text-sm text-red-600">{formError}</div>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-sky-600 px-3 py-2 text-sm text-white"
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  )
}

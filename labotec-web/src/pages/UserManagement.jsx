import React, { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import Table from '../components/Table'
import { useAuth } from '../context/AuthContext'
import { resolveEntityId } from '../lib/entity'

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrador' },
  { value: 'patient', label: 'Paciente' },
]

export default function UserManagement() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [updatingMap, setUpdatingMap] = useState({})

  const normalizeUsers = data => {
    if (!data) return []
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.items)) return data.items
    if (Array.isArray(data?.Users)) return data.Users
    if (Array.isArray(data?.results)) return data.results
    return []
  }

  const fetchUsers = async () => {
    if (!isAdmin) return
    setLoading(true)
    setError('')
    setSuccessMessage('')
    try {
      const res = await api.get('/api/users')
      setItems(normalizeUsers(res.data))
    } catch (err) {
      console.error(err)
      setError('No pudimos cargar los usuarios registrados. Intenta nuevamente más tarde.')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    } else {
      setLoading(false)
    }
  }, [isAdmin])

  const updateLocalRole = (entityId, newRole) => {
    setItems(prev => prev.map(item => (resolveEntityId(item) === entityId ? { ...item, role: newRole } : item)))
  }

  const handleRoleChange = async (target, newRole) => {
    if (!isAdmin) return
    const entityId = resolveEntityId(target)
    if (!entityId || target.role === newRole) return

    setError('')
    setSuccessMessage('')
    setUpdatingMap(prev => ({ ...prev, [entityId]: true }))
    const previousRole = target.role
    updateLocalRole(entityId, newRole)

    try {
      await api.put(`/api/users/${entityId}`, { role: newRole })
      setSuccessMessage('El rol del usuario se actualizó correctamente.')
    } catch (err) {
      console.error(err)
      updateLocalRole(entityId, previousRole)
      setError('No pudimos actualizar el rol. Intenta nuevamente más tarde.')
    } finally {
      setUpdatingMap(prev => {
        const copy = { ...prev }
        delete copy[entityId]
        return copy
      })
    }
  }

  const columns = useMemo(() => {
    if (!isAdmin) return []
    return [
      { key: 'name', header: 'Nombre' },
      { key: 'email', header: 'Correo electrónico' },
      {
        key: 'role',
        header: 'Rol actual',
        render: row => (
          <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-1 text-xs text-sky-700">
            {row.role === 'admin' ? 'Administrador' : 'Paciente'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Cambiar rol',
        render: row => {
          const entityId = resolveEntityId(row)
          const isUpdating = !!updatingMap[entityId]
          return (
            <select
              className="border rounded-lg px-2 py-1 text-sm"
              value={row.role}
              disabled={isUpdating}
              onChange={e => handleRoleChange(row, e.target.value)}
            >
              {ROLE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )
        },
      },
    ]
  }, [isAdmin, updatingMap])

  if (!isAdmin) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Gestión de usuarios</h2>
        <p className="text-sm text-gray-600">Esta sección está disponible únicamente para administradores.</p>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gestión de usuarios</h2>
        <button onClick={fetchUsers} className="bg-sky-600 text-white rounded-lg px-3 py-2 text-sm" disabled={loading}>
          Actualizar lista
        </button>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      {successMessage && <div className="text-sm text-emerald-600">{successMessage}</div>}
      {loading ? (
        <div>Cargando usuarios...</div>
      ) : items.length > 0 ? (
        <Table columns={columns} data={items} />
      ) : (
        <div className="text-sm text-gray-500">Aún no hay usuarios registrados.</div>
      )}
    </section>
  )
}

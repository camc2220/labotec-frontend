import React, { useEffect, useMemo, useState } from 'react'
import api from '../lib/api'
import Table from '../components/Table'
import { useAuth } from '../context/AuthContext'

// Opciones para el select de roles
const ROLE_OPTIONS = [
  { value: 'Admin', label: 'Administrador' },
  { value: 'Recepcion', label: 'Recepción' },
  { value: 'Facturacion', label: 'Facturación' },
  { value: 'Paciente', label: 'Paciente' },
]

export default function UserManagement() {
  const { user } = useAuth()
  const isAdmin = user?.isAdmin
  
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  // Mapa para deshabilitar filas mientras se guardan
  const [updatingMap, setUpdatingMap] = useState({})

  const fetchUsers = async () => {
    if (!isAdmin) return
    setLoading(true)
    setError('')
    try {
      // El endpoint /api/users devuelve un array directo: [ { id, userName... }, ... ]
      const res = await api.get('/api/users')
      setItems(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error(err)
      setError('Error al cargar usuarios.')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const handleRoleChange = async (userId, newRole) => {
    if (!userId) return
    setError('')
    setSuccessMessage('')
    
    // Marcar como actualizando
    setUpdatingMap(prev => ({ ...prev, [userId]: true }))

    try {
      // El backend espera: { roles: ["NuevoRol"] }
      // Nota: El DTO UserUpdateDto tiene una propiedad 'Roles' (lista)
      await api.put(`/api/users/${userId}`, { 
        roles: [newRole] 
      })
      
      setSuccessMessage('Rol actualizado correctamente.')
      fetchUsers() // Recargar lista
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Error al actualizar el rol.')
    } finally {
      setUpdatingMap(prev => {
        const copy = { ...prev }
        delete copy[userId]
        return copy
      })
    }
  }

  // Definición de columnas
  const columns = useMemo(() => {
    if (!isAdmin) return []
    return [
      { key: 'userName', header: 'Usuario' },
      { key: 'email', header: 'Email' },
      {
        key: 'roles',
        header: 'Roles',
        render: (row) => {
          // El backend devuelve 'roles' como array de strings
          const rolesStr = row.roles?.join(', ') || 'Sin rol'
          return (
            <span className="inline-flex items-center rounded-full bg-sky-50 px-2 py-1 text-xs text-sky-700 font-medium">
              {rolesStr}
            </span>
          )
        },
      },
      {
        key: 'actions',
        header: 'Cambiar Rol',
        render: (row) => {
          const isUpdating = !!updatingMap[row.id]
          // Tomamos el primer rol como valor actual para el select
          const currentRole = row.roles?.[0] || ''

          return (
            <select
              className="border rounded px-2 py-1 text-sm bg-white"
              value={currentRole}
              disabled={isUpdating}
              onChange={(e) => handleRoleChange(row.id, e.target.value)}
            >
              <option value="">Seleccionar...</option>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )
        },
      },
    ]
  }, [isAdmin, updatingMap])

  if (!isAdmin) {
    return <div className="p-4">Acceso denegado.</div>
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gestión de Usuarios</h2>
        <button
          onClick={fetchUsers}
          className="bg-sky-600 text-white rounded-lg px-3 py-2 text-sm hover:bg-sky-700 transition"
          disabled={loading}
        >
          Refrescar
        </button>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
      {successMessage && <div className="text-sm text-emerald-600 bg-emerald-50 p-2 rounded">{successMessage}</div>}

      {loading ? (
        <div className="text-gray-500">Cargando...</div>
      ) : (
        <Table
          columns={columns}
          data={items}
          rowKey="id" 
        />
      )}
    </section>
  )
}
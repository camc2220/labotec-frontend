import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import api from '../lib/api'

const STORAGE_KEY = 'auth:user'
const TOKEN_KEY = 'token'

const AuthContext = createContext(null)

function base64UrlDecode(input) {
  if (!input) return null
  try {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '='
    )
    return atob(padded)
  } catch {
    return null
  }
}

function parseJwt(token) {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const payload = base64UrlDecode(parts[1])
  if (!payload) return null

  try {
    return JSON.parse(payload)
  } catch {
    return null
  }
}

function buildUserFromToken(token) {
  const payload = parseJwt(token)
  if (!payload) return null

  // El backend envía claims estándar
  // role puede venir como string o array.
  let rawRoles = payload.role || payload.roles || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || []
  
  if (typeof rawRoles === 'string') {
    rawRoles = [rawRoles]
  }

  const normalizedRoles = Array.isArray(rawRoles) ? rawRoles : []
  const lowerRoles = normalizedRoles.map(r => String(r).toLowerCase())
  const lowerSet = new Set(lowerRoles)

  // Nombre de usuario suele venir en 'unique_name' o 'sub'
  const userName = payload.unique_name || payload.sub || 'Usuario'
  const email = payload.email || null
  
  // IMPORTANTE: El backend ahora envía "patientId" (minúscula)
  const patientId = payload.patientId || payload.PatientId || null

  const isAdmin = lowerSet.has('admin')
  const isRecepcion = lowerSet.has('recepcion')
  const isFacturacion = lowerSet.has('facturacion')
  const isPaciente = lowerSet.has('paciente') || lowerSet.has('patient')

  return {
    id: payload.sub || null,
    userName,
    name: userName, // Alias para compatibilidad
    email,
    roles: normalizedRoles, // Array original
    isAdmin,
    isRecepcion,
    isFacturacion,
    isPaciente,
    patientId: patientId,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }

    const parsedUser = buildUserFromToken(token)
    if (parsedUser) {
      setUser(parsedUser)
    } else {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(STORAGE_KEY)
    }
    setLoading(false)
  }, [])

  const login = async (userName, password) => {
    // El endpoint devuelve { token: "..." }
    const res = await api.post('/api/auth/login', { userName, password })
    const token = res.data?.token

    if (!token) {
      throw new Error('El servidor no devolvió un token.')
    }

    localStorage.setItem(TOKEN_KEY, token)
    const parsedUser = buildUserFromToken(token)
    
    if (!parsedUser) {
      localStorage.removeItem(TOKEN_KEY)
      throw new Error('Token inválido.')
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedUser))
    setUser(parsedUser)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    window.location.href = '/login'
  }

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      loading,
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
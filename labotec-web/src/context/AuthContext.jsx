import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../lib/api'
const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { const t = localStorage.getItem('token'); if (t) setUser({ name:'admin' }); setLoading(false) }, [])
  const login = async (userName, password) => {
    const res = await api.post('/api/auth/login', { userName, password })
    if (res.data?.token) { localStorage.setItem('token', res.data.token); setUser({ name: userName }) }
  }
  const logout = () => { localStorage.removeItem('token'); setUser(null) }
  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
}
export function useAuth(){ return useContext(AuthContext) }

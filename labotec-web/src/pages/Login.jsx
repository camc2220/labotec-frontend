import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function Login() {
  const [userName, setUserName] = useState('admin')
  const [password, setPassword] = useState('Admin#2025!')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()
  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(userName, password)
      navigate('/app', { replace: true })
    }
    catch { setError('Credenciales inválidas o API no disponible') }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white shadow rounded-xl p-6">
        <h1 className="text-lg font-semibold mb-1 text-gray-800">Iniciar sesión</h1>
        <p className="text-sm text-gray-500 mb-6">Usa tus credenciales de LABOTEC</p>
        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Usuario</label>
            <input value={userName} onChange={e=>setUserName(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-sky-200"/>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-sky-200"/>
          </div>
          <button type="submit" className="w-full bg-sky-600 text-white rounded-lg py-2 text-sm hover:bg-sky-700">Entrar</button>
        </form>
      </div>
    </div>
  )
}

import React from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function Layout() {
  const { logout } = useAuth()
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold text-sky-600">LABOTEC</Link>
          <nav className="flex gap-4 text-sm">
            <NavLink to="/patients" className={({isActive}) => isActive ? 'text-sky-600' : 'text-gray-700'}>Pacientes</NavLink>
            <NavLink to="/appointments" className={({isActive}) => isActive ? 'text-sky-600' : 'text-gray-700'}>Citas</NavLink>
            <NavLink to="/results" className={({isActive}) => isActive ? 'text-sky-600' : 'text-gray-700'}>Resultados</NavLink>
            <NavLink to="/invoices" className={({isActive}) => isActive ? 'text-sky-600' : 'text-gray-700'}>Facturas</NavLink>
          </nav>
          <button onClick={logout} className="text-sm text-gray-600 hover:text-red-600">Salir</button>
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t py-3 text-center text-xs text-gray-500 bg-white">
        © {new Date().getFullYear()} LABOTEC
      </footer>
    </div>
  )
}

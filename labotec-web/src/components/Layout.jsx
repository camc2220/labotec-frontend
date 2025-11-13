import React, { useMemo } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()

  const navigation = useMemo(() => {
    if (user?.role === 'admin') {
      return [
        { to: '/app/patients', label: 'Pacientes' },
        { to: '/app/appointments', label: 'Citas' },
        { to: '/app/results', label: 'Resultados' },
        { to: '/app/invoices', label: 'Facturas' },
      ]
    }
    return [
      { to: '/app/dashboard', label: 'Inicio' },
      { to: '/app/appointments', label: 'Mis citas' },
      { to: '/app/results', label: 'Mis resultados' },
      { to: '/app/invoices', label: 'Mis facturas' },
    ]
  }, [user?.role])

  if (!user) return null
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="font-semibold text-sky-600">LABOTEC</Link>
          <nav className="flex gap-4 text-sm">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => isActive ? 'text-sky-600' : 'text-gray-700'}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-right">
            <div className="text-xs text-gray-500 leading-tight">
              <p className="font-semibold text-gray-700">{user.name}</p>
              <p className="capitalize">{user.role === 'admin' ? 'Administrador' : 'Paciente'}</p>
            </div>
            <button onClick={logout} className="text-sm text-gray-600 hover:text-red-600">Salir</button>
          </div>
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

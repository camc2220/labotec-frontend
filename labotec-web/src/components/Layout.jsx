import React, { useMemo } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()

  const navigation = useMemo(() => {
    if (!user) return []

    const items = []

    // Admin ve todo
    if (user.isAdmin) {
      items.push(
        { to: '/app/users', label: 'Usuarios' },
        { to: '/app/patients', label: 'Pacientes' },
        { to: '/app/appointments', label: 'Citas' },
        { to: '/app/results', label: 'Resultados' },
        { to: '/app/invoices', label: 'Facturas' },
      )
      return items
    }

    // Recepción: gestiona pacientes, citas y resultados
    if (user.isRecepcion) {
      items.push(
        { to: '/app/patients', label: 'Pacientes' },
        { to: '/app/appointments', label: 'Citas' },
        { to: '/app/results', label: 'Resultados' },
      )
    }

    // Facturación: se centra en facturas (y opcionalmente pacientes)
    if (user.isFacturacion) {
      items.push(
        { to: '/app/invoices', label: 'Facturas' },
      )
    }

    const isStaff = user.isRecepcion || user.isFacturacion

    // Paciente “puro”: solo su dashboard y sus cosas
    if (!isStaff && user.isPaciente) {
      items.push(
        { to: '/app/dashboard', label: 'Inicio' },
        { to: '/app/appointments', label: 'Mis citas' },
        { to: '/app/results', label: 'Mis resultados' },
        { to: '/app/invoices', label: 'Mis facturas' },
      )
    }

    // Fallback: si por alguna razón no se armó nada
    if (items.length === 0) {
      items.push({ to: '/app/dashboard', label: 'Inicio' })
    }

    // Quitar duplicados por ruta
    const unique = []
    const seen = new Set()
    for (const item of items) {
      if (!seen.has(item.to)) {
        seen.add(item.to)
        unique.push(item)
      }
    }

    return unique
  }, [user])

  const displayRole = useMemo(() => {
    if (!user) return ''
    if (user.isAdmin) return 'Administrador'

    const parts = []
    if (user.isRecepcion) parts.push('Recepción')
    if (user.isFacturacion) parts.push('Facturación')
    if (user.isPaciente && parts.length === 0) parts.push('Paciente')

    if (parts.length === 0 && user.roles?.length) {
      return user.roles.join(', ')
    }

    return parts.join(' y ') || 'Usuario'
  }, [user])

  if (!user) return null

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="font-semibold text-sky-600 tracking-tight">
            LABOTEC
          </Link>

          <nav className="flex flex-wrap gap-4 text-sm">
            {navigation.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `transition ${
                    isActive
                      ? 'text-sky-600 font-semibold'
                      : 'text-gray-700 hover:text-sky-600'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-right">
            <div className="text-xs text-gray-500 leading-tight">
              <p className="font-semibold text-gray-700">
                {user.name || user.userName || 'Usuario'}
              </p>
              <p>{displayRole}</p>
            </div>
            <button
              onClick={logout}
              className="text-sm text-gray-600 hover:text-red-600 transition"
            >
              Salir
            </button>
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

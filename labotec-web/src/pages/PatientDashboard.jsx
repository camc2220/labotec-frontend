import React, { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

function formatDate(value, { includeTime = true, ...options } = {}) {
  if (!value) return 'Sin información'
  try {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('es-ES', {
      dateStyle: 'long',
      ...(includeTime ? { timeStyle: 'short' } : {}),
      ...options,
    })
  } catch {
    return value
  }
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState({ nextAppointment: null, recentResult: null, pendingInvoices: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSummary = async () => {
      // Si no es paciente, no cargamos nada específico de dashboard personal
      if (!user || !user.isPaciente) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        // CORRECCIÓN IMPORTANTE:
        // Usamos las rutas estándar. El backend filtra por el ID del usuario automáticamente gracias al Token.
        const [appointmentsRes, resultsRes, invoicesRes] = await Promise.all([
          // Próxima cita: orden ascendente, desde hoy
          api.get('/api/appointments', { 
            params: { 
              page: 1, 
              pageSize: 1, 
              sortDir: 'asc',
              from: new Date().toISOString(), // Solo citas futuras
              status: 'Scheduled'
            } 
          }),
          // Último resultado: orden descendente
          api.get('/api/results', { 
            params: { 
              page: 1, 
              pageSize: 1, 
              sortDir: 'desc' 
            } 
          }),
          // Facturas pendientes: filtro paid=false
          api.get('/api/invoices', { 
            params: { 
              paid: false,
              page: 1, 
              pageSize: 100 // Para contar cuántas hay
            } 
          }),
        ])

        const appointments = appointmentsRes.data?.items || []
        const results = resultsRes.data?.items || []
        const invoices = invoicesRes.data?.items || []

        setSummary({
          nextAppointment: appointments[0] ?? null,
          recentResult: results[0] ?? null,
          pendingInvoices: invoices.length,
        })
      } catch (err) {
        console.error(err)
        setError('No pudimos cargar tu información personal. Intenta nuevamente más tarde.')
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [user])

  const cards = useMemo(() => {
    if (!user?.isPaciente) return []

    return [
      {
        title: 'Próxima cita',
        description: summary.nextAppointment
          ? `${formatDate(summary.nextAppointment.scheduledAt)} · ${summary.nextAppointment.type || 'Consulta'}`
          : 'Aún no tienes citas futuras programadas.',
        action: { to: '/app/appointments', label: 'Ver mis citas' },
        bgColor: 'bg-white',
        iconColor: 'bg-sky-100 text-sky-600'
      },
      {
        title: 'Último resultado',
        description: summary.recentResult
          ? `${summary.recentResult.testName || 'Estudio'} · ${formatDate(summary.recentResult.releasedAt, { includeTime: false })}`
          : 'No hay resultados recientes disponibles.',
        action: { to: '/app/results', label: 'Ver mis resultados' },
        bgColor: 'bg-white',
        iconColor: 'bg-emerald-100 text-emerald-600'
      },
      {
        title: 'Facturas pendientes',
        description: summary.pendingInvoices > 0
          ? `Tienes ${summary.pendingInvoices} factura${summary.pendingInvoices > 1 ? 's' : ''} por pagar.`
          : 'Estás al día con tus pagos. ¡Gracias!',
        action: { to: '/app/invoices', label: 'Administrar facturas' },
        bgColor: 'bg-white',
        iconColor: 'bg-amber-100 text-amber-600'
      },
    ]
  }, [summary, user])

  // Si entra un admin o recepción aquí por error, mostramos mensaje genérico
  if (user && !user.isPaciente) {
    return (
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Panel Administrativo</h2>
        <p className="text-sm text-gray-600">
          Bienvenido, {user.userName}. Selecciona una opción del menú superior para gestionar el laboratorio.
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-600 text-white p-8 shadow-lg">
        <p className="text-sm font-medium opacity-90">Bienvenido de nuevo</p>
        <h2 className="text-3xl font-bold mt-1">{user?.name || user?.userName}</h2>
        <p className="mt-3 text-sm text-sky-100 max-w-xl leading-relaxed">
          Desde tu panel personal puedes consultar tus resultados de laboratorio, gestionar tus próximas citas y revisar tu estado de cuenta de forma segura.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500 animate-pulse">Cargando tu información...</div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {cards.map((card) => (
            <article 
              key={card.title} 
              className={`${card.bgColor} rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow`}
            >
              <div>
                <div className={`w-10 h-10 rounded-lg ${card.iconColor} flex items-center justify-center mb-4 font-bold text-lg`}>
                  {card.title[0]}
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{card.title}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{card.description}</p>
              </div>
              <Link 
                to={card.action.to} 
                className="mt-6 inline-flex items-center text-sm font-semibold text-sky-600 hover:text-sky-700 hover:underline"
              >
                {card.action.label} →
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
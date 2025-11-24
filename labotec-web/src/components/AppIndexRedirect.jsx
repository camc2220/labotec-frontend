import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AppIndexRedirect() {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  let target = '/app/dashboard'

  if (user.isAdmin) {
    target = '/app/users'
  } else if (user.isRecepcion) {
    target = '/app/appointments'
  } else if (user.isFacturacion) {
    target = '/app/invoices'
  } else if (user.isPaciente) {
    target = '/app/dashboard'
  }

  return <Navigate to={target} replace />
}

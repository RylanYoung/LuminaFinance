import { Navigate } from 'react-router-dom'
import { getSession } from '../auth/session'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const session = getSession()
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

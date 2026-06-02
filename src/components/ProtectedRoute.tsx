import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  isAdmin?: boolean
}

export default function ProtectedRoute({ children, isAdmin }: ProtectedRouteProps) {
  if (isAdmin) {
    const token = localStorage.getItem('adminToken')
    if (!token) {
      return <Navigate to="/admin/login" replace />
    }
  }

  return <>{children}</>
}

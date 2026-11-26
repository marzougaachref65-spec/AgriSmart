import { Outlet } from 'react-router-dom'
import AccessDenied from '../pages/auth/AccessDenied'
import { useAuth } from '../hooks/useAuth'

export default function RoleBasedRoute({ roles }) {
  const { user } = useAuth()

  if (!user || !roles.includes(user.role)) {
    return <AccessDenied />
  }

  return <Outlet />
}

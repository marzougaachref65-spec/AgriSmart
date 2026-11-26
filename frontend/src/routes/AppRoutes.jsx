import { Navigate, Route, Routes } from 'react-router-dom'
import Spinner from '../components/common/Spinner'
import AppLayout from '../components/layout/AppLayout'
import { useAuth } from '../hooks/useAuth'
import Animals from '../pages/animals/Animals'
import Cultures from '../pages/cultures/Cultures'
import Login from '../pages/auth/Login'
import NotFound from '../pages/auth/NotFound'
import Dashboard from '../pages/dashboard/Dashboard'
import Notifications from '../pages/notifications/Notifications'
import Employes from '../pages/employes/Employes'
import Finances from '../pages/finances/Finances'
import Rapports from '../pages/rapports/Rapports'
import Stocks from '../pages/stocks/Stocks'
import Taches from '../pages/taches/Taches'
import Veterinaire from '../pages/veterinaire/Veterinaire'
import { ROLES_ENCADREMENT } from '../utils/constants'
import ProtectedRoute from './ProtectedRoute'
import RoleBasedRoute from './RoleBasedRoute'

function LoginRoute() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return <Spinner label="Vérification de votre session..." />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Login />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />

      <Route path="/" element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Modules accessibles à tous les rôles authentifiés */}
          <Route path="animaux" element={<Animals />} />
          <Route path="cultures" element={<Cultures />} />
          <Route path="stocks" element={<Stocks />} />
          <Route path="taches" element={<Taches />} />
          <Route path="notifications" element={<Notifications />} />

          {/* Modules réservés à ADMIN et MANAGER (contrôle frontend + backend) */}
          <Route element={<RoleBasedRoute roles={ROLES_ENCADREMENT} />}>
            <Route path="veterinaire" element={<Veterinaire />} />
            <Route path="finances" element={<Finances />} />
            <Route path="employes" element={<Employes />} />
            <Route path="rapports" element={<Rapports />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

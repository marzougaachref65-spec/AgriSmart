import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Header from './Header'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [menuOuvert, setMenuOuvert] = useState(false)

  useEffect(() => {
    setMenuOuvert(false)
  }, [pathname])

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        role={user?.role}
        open={menuOuvert}
        onClose={() => setMenuOuvert(false)}
      />

      <div className="flex min-h-screen flex-col lg:pl-72">
        <Header onMenuClick={() => setMenuOuvert(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

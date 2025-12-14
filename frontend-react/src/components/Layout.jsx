import { Outlet, Link, useLocation } from 'react-router-dom'
import { Mail, MessageSquare, Mic, Settings, LogOut, Accessibility, Volume2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Layout = () => {
  const location = useLocation()
  const { logout } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Mail },
    { name: 'Composer', href: '/composer', icon: MessageSquare },
    { name: 'Agent Vocal', href: '/agent', icon: Mic },
    { name: 'Accessibilité', href: '/accessibility', icon: Accessibility },
    { name: 'Transcription', href: '/voice-transcription', icon: Volume2 },
    { name: 'Paramètres', href: '/settings', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex h-16 items-center px-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">IAPosteManager</h1>
        </div>
        
        <nav className="mt-6 px-3">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 mb-1 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-4 left-3 right-3">
          <button
            onClick={logout}
            className="flex w-full items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 hover:text-gray-900"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { servicesAPI } from '../../api/services'
import { createWebSocket } from '../../api/websocket'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const wsRef = useRef(null)

  const handleLogout = () => {
    logout()
    navigate('/auth/login')
  }

  const isActive = (path) => location.pathname.startsWith(path)

  // Task 6: Fetch pending request count and subscribe to WebSocket updates
  useEffect(() => {
    if (user?.role === 'mechanic') {
      fetchPendingCount()
      connectMechanicWS()
      return () => wsRef.current?.close()
    }
  }, [user])

  const fetchPendingCount = async () => {
    try {
      const res = await servicesAPI.getPendingCount()
      setPendingCount(res.data.count || 0)
    } catch (err) {
      // Silently fail — badge just won't show
    }
  }

  const connectMechanicWS = () => {
    wsRef.current = createWebSocket('ws/requests/', {
      new_request: () => {
        setPendingCount(prev => prev + 1)
      },
      pending_count_update: (data) => {
        setPendingCount(data.count || 0)
      },
    })
  }

  const userLinks = [
    { path: '/user/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/user/new-request', label: 'Get Help', icon: '🆘' },
    { path: '/user/history', label: 'History', icon: '📋' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ]

  const mechanicLinks = [
    { path: '/mechanic/dashboard', label: 'Dashboard', icon: '🏠' },
    { path: '/mechanic/requests', label: 'Requests', icon: '📡', badge: pendingCount },
    { path: '/mechanic/history', label: 'History', icon: '📋' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ]

  const links = user?.role === 'mechanic' ? mechanicLinks : userLinks

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <span className="text-white text-lg">🔧</span>
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">Moving</span>
              <span className="text-lg font-bold text-primary-500 tracking-tight">Garage</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          {user && (
            <div className="hidden md:flex items-center gap-1">
              {links.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="mr-1.5">{link.icon}</span>
                  {link.label}
                  {/* Badge */}
                  {link.badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                      {link.badge > 99 ? '99+' : link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Right section */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/profile" className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {(user.first_name || user.username)[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-slate-800 leading-tight">
                      {user.first_name || user.username}
                    </div>
                    <div className="text-xs text-slate-500 capitalize">{user.role}</div>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-ghost btn-sm text-slate-500 hover:text-red-500"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth/login" className="btn-ghost btn-sm">Log In</Link>
                <Link to="/auth/register" className="btn-primary btn-sm">Sign Up</Link>
              </div>
            )}

            {/* Mobile menu button */}
            {user && (
              <button
                className="md:hidden btn-ghost p-2"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Nav */}
        {user && mobileOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-border animate-slide-down">
            {links.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className={`relative block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
                {/* Mobile badge */}
                {link.badge > 0 && (
                  <span className="ml-2 inline-flex min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full items-center justify-center">
                    {link.badge > 99 ? '99+' : link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}

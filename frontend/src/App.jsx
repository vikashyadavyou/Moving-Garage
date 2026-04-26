import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Layout
import Navbar from './components/layout/Navbar'

// Auth Pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Shared Pages
import Profile from './pages/Profile'

// User Pages
import UserDashboard from './pages/user/UserDashboard'
import NewRequest from './pages/user/NewRequest'
import TrackMechanic from './pages/user/TrackMechanic'
import UserHistory from './pages/user/UserHistory'

// Mechanic Pages
import MechanicDashboard from './pages/mechanic/MechanicDashboard'
import IncomingRequests from './pages/mechanic/IncomingRequests'
import ActiveJob from './pages/mechanic/ActiveJob'
import MechanicHistory from './pages/mechanic/MechanicHistory'

// Landing
import LandingPage from './pages/LandingPage'

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner-lg border-primary-500"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Routes>
          {/* Public */}
          <Route path="/" element={
            user ? (
              user.role === 'mechanic' 
                ? <Navigate to="/mechanic/dashboard" replace /> 
                : <Navigate to="/user/dashboard" replace />
            ) : <LandingPage />
          } />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/register" element={<Register />} />

          {/* Shared */}
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['user', 'mechanic']}><Profile /></ProtectedRoute>
          } />

          {/* User Routes */}
          <Route path="/user/dashboard" element={
            <ProtectedRoute allowedRoles={['user']}><UserDashboard /></ProtectedRoute>
          } />
          <Route path="/user/new-request" element={
            <ProtectedRoute allowedRoles={['user']}><NewRequest /></ProtectedRoute>
          } />
          <Route path="/user/track/:id" element={
            <ProtectedRoute allowedRoles={['user']}><TrackMechanic /></ProtectedRoute>
          } />
          <Route path="/user/history" element={
            <ProtectedRoute allowedRoles={['user']}><UserHistory /></ProtectedRoute>
          } />

          {/* Mechanic Routes */}
          <Route path="/mechanic/dashboard" element={
            <ProtectedRoute allowedRoles={['mechanic']}><MechanicDashboard /></ProtectedRoute>
          } />
          <Route path="/mechanic/requests" element={
            <ProtectedRoute allowedRoles={['mechanic']}><IncomingRequests /></ProtectedRoute>
          } />
          <Route path="/mechanic/job/:id" element={
            <ProtectedRoute allowedRoles={['mechanic']}><ActiveJob /></ProtectedRoute>
          } />
          <Route path="/mechanic/history" element={
            <ProtectedRoute allowedRoles={['mechanic']}><MechanicHistory /></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

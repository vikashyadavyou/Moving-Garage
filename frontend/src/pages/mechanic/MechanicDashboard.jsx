import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { authAPI } from '../../api/auth'
import { servicesAPI } from '../../api/services'
import { formatCurrency } from '../../utils/formatters'

export default function MechanicDashboard() {
  const { user } = useAuth()
  const [isAvailable, setIsAvailable] = useState(false)
  const [stats, setStats] = useState({ total_jobs_completed: 0, rating: '5.00' })
  const [activeJobs, setActiveJobs] = useState([])
  const [toggling, setToggling] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, jobsRes] = await Promise.all([
        authAPI.getMechanicStats(),
        servicesAPI.getRequests({ status: 'mine' }),
      ])
      setStats(statsRes.data)
      setIsAvailable(statsRes.data.is_available)
      const jobs = jobsRes.data.results || jobsRes.data || []
      setActiveJobs(jobs.filter(j => !['completed', 'cancelled'].includes(j.status)))
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleAvailability = async () => {
    setToggling(true)
    try {
      const res = await authAPI.updateAvailability({ is_available: !isAvailable })
      setIsAvailable(res.data.is_available)

      // Also update location when going online
      if (!isAvailable && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          authAPI.updateLocation({
            latitude: pos.coords.latitude.toFixed(7),
            longitude: pos.coords.longitude.toFixed(7),
          })
        })
      }
    } catch (err) {
      console.error('Failed to toggle availability:', err)
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="spinner-lg border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">
            Mechanic Dashboard 🔧
          </h1>
          <p className="page-subtitle">
            Welcome back, {user?.first_name || user?.username}
          </p>
        </div>

        {/* Availability Toggle */}
        <button
          onClick={toggleAvailability}
          disabled={toggling}
          className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-semibold text-sm transition-all shadow-md ${
            isAvailable
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          <div className={`w-3 h-3 rounded-full ${isAvailable ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></div>
          {toggling ? (
            <span className="spinner border-current"></span>
          ) : (
            isAvailable ? '🟢 Online' : '⚫ Offline'
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="stat-card">
          <div className="stat-value text-primary-600">{stats.total_jobs_completed}</div>
          <div className="stat-label">Jobs Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-amber-500">⭐ {stats.rating}</div>
          <div className="stat-label">Rating</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-emerald-600">{activeJobs.length}</div>
          <div className="stat-label">Active Jobs</div>
        </div>
        <div className="stat-card">
          <div className={`stat-value ${isAvailable ? 'text-emerald-600' : 'text-slate-400'}`}>
            {isAvailable ? '🟢' : '⚫'}
          </div>
          <div className="stat-label">{isAvailable ? 'Online' : 'Offline'}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <Link to="/mechanic/requests" className="card-interactive flex items-center gap-4 group">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            📡
          </div>
          <div>
            <div className="font-semibold text-slate-900">Incoming Requests</div>
            <div className="text-sm text-slate-500">View and accept new jobs</div>
          </div>
          <span className="ml-auto text-slate-400">→</span>
        </Link>
        <Link to="/mechanic/history" className="card-interactive flex items-center gap-4 group">
          <div className="w-14 h-14 bg-gradient-to-br from-accent-100 to-accent-200 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            📋
          </div>
          <div>
            <div className="font-semibold text-slate-900">Job History</div>
            <div className="text-sm text-slate-500">View past completed jobs</div>
          </div>
          <span className="ml-auto text-slate-400">→</span>
        </Link>
      </div>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">🔴 Active Jobs</h2>
          <div className="space-y-3">
            {activeJobs.map(job => (
              <Link
                key={job.id}
                to={`/mechanic/job/${job.id}`}
                className="card-interactive flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center text-2xl">
                  {job.reported_issue_detail?.icon || '🔧'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900">
                    {job.reported_issue_detail?.name}
                  </div>
                  <div className="text-sm text-slate-500">
                    {job.vehicle_make} {job.vehicle_model} • SR-{job.id}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary-600">{formatCurrency(job.total_cost)}</div>
                  <div className="text-xs text-slate-500 capitalize">{job.status.replace('_', ' ')}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!isAvailable && (
        <div className="mt-10 p-8 bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl text-center">
          <div className="text-4xl mb-4">💤</div>
          <h3 className="text-lg font-semibold text-slate-700">You're offline</h3>
          <p className="text-sm text-slate-500 mt-1">Go online to start receiving breakdown requests.</p>
        </div>
      )}
    </div>
  )
}

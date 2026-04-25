import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { servicesAPI } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import { STATUS_LABELS } from '../../utils/constants'
import { formatCurrency, formatDateTime, getStatusBadgeClass, formatRelativeTime } from '../../utils/formatters'

export default function UserDashboard() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequests()
  }, [])

  const loadRequests = async () => {
    try {
      const res = await servicesAPI.getRequests()
      setRequests(res.data.results || res.data || [])
    } catch (err) {
      console.error('Failed to load requests:', err)
    } finally {
      setLoading(false)
    }
  }

  const activeRequests = requests.filter(r => !['completed', 'cancelled'].includes(r.status))
  const recentCompleted = requests.filter(r => r.status === 'completed').slice(0, 3)

  return (
    <div className="page-container">
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">
            Welcome, {user?.first_name || user?.username} 👋
          </h1>
          <p className="page-subtitle">Need roadside assistance? We've got you covered.</p>
        </div>
        <Link to="/user/new-request" className="btn-primary btn-lg shadow-lg">
          🆘 Request Help
        </Link>
      </div>

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">🔴 Active Requests</h2>
          <div className="space-y-4">
            {activeRequests.map(req => (
              <Link
                key={req.id}
                to={`/user/track/${req.id}`}
                className="card-interactive flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {req.reported_issue_detail?.icon || '🔧'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">
                      {req.reported_issue_detail?.name || 'Service Request'}
                    </div>
                    <div className="text-sm text-slate-500">
                      {req.vehicle_make} {req.vehicle_model} • SR-{req.id}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  <span className={getStatusBadgeClass(req.status)}>
                    {STATUS_LABELS[req.status]}
                  </span>
                  {req.total_cost && (
                    <span className="text-lg font-bold text-primary-600">
                      {formatCurrency(req.total_cost)}
                    </span>
                  )}
                  <span className="text-sm text-slate-400">
                    {formatRelativeTime(req.created_at)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick Stats */}
      <section className="mb-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-value text-primary-600">{requests.length}</div>
            <div className="stat-label">Total Requests</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-emerald-600">
              {requests.filter(r => r.status === 'completed').length}
            </div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-amber-600">{activeRequests.length}</div>
            <div className="stat-label">Active</div>
          </div>
          <div className="stat-card">
            <div className="stat-value text-slate-600">
              {requests.filter(r => r.status === 'completed').length > 0
                ? formatCurrency(
                    requests
                      .filter(r => r.status === 'completed')
                      .reduce((sum, r) => sum + parseFloat(r.total_cost || 0), 0) /
                    requests.filter(r => r.status === 'completed').length
                  )
                : '₹0'}
            </div>
            <div className="stat-label">Avg. Cost</div>
          </div>
        </div>
      </section>

      {/* Recent Completed */}
      {recentCompleted.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent Completions</h2>
            <Link to="/user/history" className="text-sm text-primary-600 font-medium hover:text-primary-700">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentCompleted.map(req => (
              <div key={req.id} className="card">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{req.reported_issue_detail?.icon || '🔧'}</span>
                  <div>
                    <div className="font-medium text-slate-900 text-sm">
                      {req.reported_issue_detail?.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDateTime(req.completed_at)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="badge-success">Completed ✓</span>
                  <span className="font-bold text-slate-900">{formatCurrency(req.total_cost)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {!loading && requests.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-6">🏍️</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Requests Yet</h3>
          <p className="text-slate-500 mb-8">
            Hopefully you won't need us, but if you do, we're here!
          </p>
          <Link to="/user/new-request" className="btn-primary btn-lg">
            🆘 Request Help Now
          </Link>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <div className="spinner-lg border-primary-500"></div>
        </div>
      )}
    </div>
  )
}

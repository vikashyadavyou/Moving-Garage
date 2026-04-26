import { useState, useEffect } from 'react'
import { servicesAPI } from '../../api/services'
import { STATUS_LABELS } from '../../utils/constants'
import { formatCurrency, formatDateTime, getStatusBadgeClass } from '../../utils/formatters'
import BackButton from '../../components/BackButton'

export default function UserHistory() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const res = await servicesAPI.getRequests()
      const all = res.data.results || res.data || []
      setRequests(all.filter(r => ['completed', 'cancelled'].includes(r.status)))
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setLoading(false)
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
    <div className="page-container max-w-4xl">
      <BackButton />

      <div className="page-header">
        <h1 className="page-title">📋 Request History</h1>
        <p className="page-subtitle">All your past service requests</p>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-slate-900">No history yet</h3>
          <p className="text-slate-500">Your completed and cancelled requests will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {req.reported_issue_detail?.icon || '🔧'}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">
                    {req.reported_issue_detail?.name}
                    {req.issue_was_overridden && (
                      <span className="text-xs text-slate-400 ml-2">
                        → {req.actual_issue_detail?.name}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">
                    {req.vehicle_make} {req.vehicle_model} • SR-{req.id}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {formatDateTime(req.completed_at || req.cancelled_at || req.created_at)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={getStatusBadgeClass(req.status)}>
                  {STATUS_LABELS[req.status]}
                </span>
                <span className="font-bold text-slate-900 text-lg">
                  {formatCurrency(req.total_cost)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

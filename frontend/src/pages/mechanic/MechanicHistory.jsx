import { useState, useEffect } from 'react'
import { servicesAPI } from '../../api/services'
import { STATUS_LABELS } from '../../utils/constants'
import { formatCurrency, formatDateTime, getStatusBadgeClass } from '../../utils/formatters'
import BackButton from '../../components/BackButton'

export default function MechanicHistory() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      const res = await servicesAPI.getRequests({ status: 'mine' })
      const all = res.data.results || res.data || []
      setJobs(all.filter(j => ['completed', 'cancelled'].includes(j.status)))
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalEarnings = jobs
    .filter(j => j.status === 'completed')
    .reduce((sum, j) => sum + parseFloat(j.total_cost || 0), 0)

  if (loading) {
    return <div className="flex justify-center py-32"><div className="spinner-lg border-primary-500"></div></div>
  }

  return (
    <div className="page-container max-w-4xl">
      <BackButton />

      <div className="page-header">
        <h1 className="page-title">📋 Job History</h1>
        <p className="page-subtitle">Your completed jobs and earnings</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="stat-card">
          <div className="stat-value text-emerald-600">
            {formatCurrency(totalEarnings)}
          </div>
          <div className="stat-label">Total Earnings</div>
        </div>
        <div className="stat-card">
          <div className="stat-value text-primary-600">
            {jobs.filter(j => j.status === 'completed').length}
          </div>
          <div className="stat-label">Jobs Completed</div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-slate-900">No history yet</h3>
          <p className="text-slate-500">Completed jobs will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map(job => (
            <div key={job.id} className="card flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {job.reported_issue_detail?.icon || '🔧'}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-slate-900 truncate">
                    {job.reported_issue_detail?.name}
                  </div>
                  <div className="text-sm text-slate-500">
                    {job.vehicle_make} {job.vehicle_model} • {job.user?.first_name || job.user?.username}
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatDateTime(job.completed_at || job.created_at)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={getStatusBadgeClass(job.status)}>
                  {STATUS_LABELS[job.status]}
                </span>
                <span className="font-bold text-lg text-slate-900">
                  {formatCurrency(job.total_cost)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

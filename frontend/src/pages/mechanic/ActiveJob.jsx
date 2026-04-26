import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { servicesAPI } from '../../api/services'
import { createWebSocket } from '../../api/websocket'
import { STATUS_LABELS } from '../../utils/constants'
import { formatCurrency, formatDistance, getStatusBadgeClass } from '../../utils/formatters'
import BackButton from '../../components/BackButton'
import LiveMap from '../../components/LiveMap'

export default function ActiveJob() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showDiagModal, setShowDiagModal] = useState(false)
  const [issues, setIssues] = useState([])
  const [diagForm, setDiagForm] = useState({ actual_issue_ids: [], notes: '' })
  const wsRef = useRef(null)

  useEffect(() => {
    loadData()
    connectWebSocket()
    return () => wsRef.current?.close()
  }, [id])

  const connectWebSocket = () => {
    wsRef.current = createWebSocket(`ws/request/${id}/`, {
      status_update: (data) => {
        setRequest(prev => ({ ...prev, ...data.request, status: data.status }))
      },
      cash_payment_pending: (data) => {
        setRequest(prev => ({ ...prev, ...data.request, status: 'pending_cash' }))
      },
      request_completed: (data) => {
        setRequest(prev => ({ ...prev, ...data.request, status: 'completed' }))
      },
      payment_requested: (data) => {
        setRequest(prev => ({ ...prev, ...data.request, status: 'pending_payment' }))
      },
    })
  }

  const loadData = async () => {
    try {
      const [reqRes, issuesRes] = await Promise.all([
        servicesAPI.getRequestDetail(id),
        servicesAPI.getIssues(),
      ])
      setRequest(reqRes.data)
      setIssues(issuesRes.data || [])
    } catch (err) {
      console.error('Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (newStatus) => {
    setUpdating(true)
    try {
      const res = await servicesAPI.updateStatus(id, { status: newStatus })
      setRequest(res.data)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.')
    } finally {
      setUpdating(false)
    }
  }

  const toggleDiagIssue = (issueId) => {
    setDiagForm(f => {
      const ids = f.actual_issue_ids.includes(issueId)
        ? f.actual_issue_ids.filter(id => id !== issueId)
        : [...f.actual_issue_ids, issueId]
      return { ...f, actual_issue_ids: ids }
    })
  }

  const handleDiagnose = async () => {
    if (diagForm.actual_issue_ids.length === 0) {
      alert('Please select at least one actual issue.')
      return
    }
    setUpdating(true)
    try {
      const res = await servicesAPI.diagnoseOverride(id, {
        actual_issue_ids: diagForm.actual_issue_ids,
        notes: diagForm.notes,
      })
      setRequest(res.data.request)
      setShowDiagModal(false)
      setDiagForm({ actual_issue_ids: [], notes: '' })
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.actual_issue_ids?.[0] || 'Failed to update diagnosis.')
    } finally {
      setUpdating(false)
    }
  }

  const handleComplete = async () => {
    if (!confirm('Mark this job as completed?')) return
    setUpdating(true)
    try {
      const res = await servicesAPI.completeRequest(id)
      setRequest(res.data.request)
    } catch (err) {
      alert(err.response?.data?.error || 'Cannot complete yet.')
    } finally {
      setUpdating(false)
    }
  }

  const handleConfirmCash = async () => {
    if (!confirm('Confirm you have received the exact cash amount from the user?')) return
    setUpdating(true)
    try {
      const res = await servicesAPI.confirmCash(id)
      setRequest(res.data.request)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to confirm cash payment.')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-32"><div className="spinner-lg border-primary-500"></div></div>
  }

  if (!request) {
    return <div className="page-container text-center py-20"><p className="text-slate-500">Job not found.</p></div>
  }

  const statusFlow = {
    accepted: { next: 'en_route', label: '🏍️ Start Navigation', color: 'btn-primary' },
    en_route: { next: 'arrived', label: '📍 I Have Arrived', color: 'btn-primary' },
    arrived: { next: 'in_progress', label: '🔧 Start Repair', color: 'btn-accent' },
  }

  const nextAction = statusFlow[request.status]

  const reportedIssues = request.reported_issues_detail || []
  const actualIssues = request.actual_issues_detail || []
  const displayIssues = reportedIssues.length > 0 ? reportedIssues : (request.reported_issue_detail ? [request.reported_issue_detail] : [])
  const displayActualIssues = actualIssues.length > 0 ? actualIssues : (request.actual_issue_detail ? [request.actual_issue_detail] : [])

  // Get IDs of currently reported issues to exclude from diagnosis modal
  const reportedIssueIds = displayIssues.map(i => i.id)

  return (
    <div className="page-container max-w-3xl">
      <BackButton />

      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Active Job</h1>
            <p className="page-subtitle">SR-{request.id} • {request.vehicle_make} {request.vehicle_model}</p>
          </div>
          <span className={getStatusBadgeClass(request.status) + ' text-sm px-4 py-1.5'}>
            {STATUS_LABELS[request.status]}
          </span>
        </div>
      </div>

      {/* User Info */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">👤 Customer</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-accent-300 to-accent-500 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
            {(request.user?.first_name || request.user?.username || 'U')[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-900">
              {request.user?.first_name} {request.user?.last_name || request.user?.username}
            </div>
            <div className="text-sm text-slate-500">{request.user?.phone || 'No phone'}</div>
            {request.user_address && (
              <div className="text-sm text-slate-400">📍 {request.user_address}</div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Map */}
      {request.user_latitude && request.user_longitude && !['completed', 'cancelled'].includes(request.status) && (
        <div className="card mb-6 p-0 overflow-hidden">
          <LiveMap
            userLocation={{ lat: parseFloat(request.user_latitude), lng: parseFloat(request.user_longitude) }}
            style={{ height: 250 }}
          />
        </div>
      )}

      {/* Issue Details — Multi-issue */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">⚡ Issue Details</h2>
        <div className="space-y-2">
          {displayIssues.map(issue => (
            <div key={issue.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
              <span className="text-2xl">{issue.icon}</span>
              <div className="flex-1">
                <div className="font-semibold text-slate-900">
                  {issue.name}
                  {request.issue_was_overridden && (
                    <span className="badge-warning ml-2">Overridden</span>
                  )}
                </div>
              </div>
              <span className="font-medium text-primary-600">{formatCurrency(issue.fixed_cost)}</span>
            </div>
          ))}
        </div>

        {request.issue_was_overridden && displayActualIssues.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="text-xs text-emerald-600 font-medium">→ Actual issues diagnosed:</div>
            {displayActualIssues.map(issue => (
              <div key={issue.id} className="flex items-center gap-4 p-3 bg-emerald-50 rounded-xl">
                <span className="text-2xl">{issue.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900">{issue.name}</div>
                </div>
                <span className="font-medium text-emerald-600">{formatCurrency(issue.fixed_cost)}</span>
              </div>
            ))}
          </div>
        )}

        {request.status === 'quote_pending' && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            ⏳ Waiting for user to approve the updated quote...
          </div>
        )}
      </div>

      {/* Earnings */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-3">💰 Earnings</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Issue Cost</span>
            <span className="font-medium">{formatCurrency(request.issue_cost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Distance ({formatDistance(request.distance_km)})</span>
            <span className="font-medium">{formatCurrency(request.distance_cost)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between">
            <span className="font-bold text-slate-900">Total</span>
            <span className="font-bold text-primary-600 text-xl">{formatCurrency(request.total_cost)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {/* Status progression */}
        {nextAction && (
          <button
            onClick={() => updateStatus(nextAction.next)}
            disabled={updating}
            className={`${nextAction.color} btn-lg w-full shadow-lg`}
          >
            {updating ? <span className="spinner border-white"></span> : nextAction.label}
          </button>
        )}

        {/* Diagnostic Override — available when arrived or accepted */}
        {['arrived', 'accepted', 'in_progress'].includes(request.status) && (
          <button
            onClick={() => setShowDiagModal(true)}
            className="btn-secondary btn-lg w-full"
          >
            🔍 Change Diagnosis
          </button>
        )}

        {/* Request Payment — replaces old "Mark as Completed" */}
        {request.status === 'in_progress' && (
          <button
            onClick={() => {
              if (!confirm('Request payment from the customer? This will send a bill to the user for payment.')) return
              updateStatus('pending_payment')
            }}
            disabled={updating}
            className="btn-primary btn-lg w-full bg-emerald-500 hover:bg-emerald-600 shadow-lg"
          >
            {updating ? <span className="spinner border-white"></span> : '💳 Request Payment'}
          </button>
        )}

        {/* Pending Payment — Waiting for user to pay */}
        {request.status === 'pending_payment' && (
          <div className="p-6 bg-blue-50 rounded-2xl border border-blue-200">
            <h3 className="text-lg font-bold text-blue-700 mb-2">💳 Payment Requested</h3>
            <p className="text-sm text-blue-800 mb-2">
              Waiting for the user to pay <strong>{formatCurrency(request.total_cost)}</strong>.
            </p>
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              Awaiting payment confirmation...
            </div>
          </div>
        )}

        {/* Pending Cash Collection */}
        {request.status === 'pending_cash' && (
          <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200">
            <h3 className="text-lg font-bold text-amber-700 mb-2">💵 Cash Payment</h3>
            <p className="text-sm text-amber-800 mb-4">
              The user has opted to pay in cash. Please collect <strong>{formatCurrency(request.total_cost)}</strong> from the user.
            </p>
            <button
              onClick={handleConfirmCash}
              disabled={updating}
              className="btn-primary btn-lg w-full shadow-lg"
            >
              {updating ? <span className="spinner border-white"></span> : `✅ Confirm ${formatCurrency(request.total_cost)} Cash Received`}
            </button>
          </div>
        )}

        {request.status === 'completed' && (
          <div className="p-6 bg-emerald-50 rounded-2xl text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-lg font-bold text-emerald-700">Job Completed!</h3>
            <p className="text-sm text-emerald-600 mt-1">
              Earnings: {formatCurrency(request.total_cost)}
            </p>
            <button onClick={() => navigate('/mechanic/dashboard')} className="btn-primary mt-4">
              Back to Dashboard
            </button>
          </div>
        )}
      </div>

      {/* Diagnostic Override Modal — Multi-issue with checkboxes */}
      {showDiagModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-2">🔍 Update Diagnosis</h3>
            <p className="text-sm text-slate-500 mb-6">
              Select the actual issue(s) found after inspection. This will recalculate the cost and notify the user for approval.
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {issues.map(issue => {
                const isChecked = diagForm.actual_issue_ids.includes(issue.id)
                return (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => toggleDiagIssue(issue.id)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      isChecked
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-border hover:border-primary-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                      isChecked ? 'bg-primary-500 border-primary-500' : 'border-slate-300'
                    }`}>
                      {isChecked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-xl">{issue.icon}</span>
                    <span className="text-sm font-medium text-slate-800 flex-1">{issue.name}</span>
                    <span className="font-bold text-primary-600">{formatCurrency(issue.fixed_cost)}</span>
                  </button>
                )
              })}
            </div>

            {diagForm.actual_issue_ids.length > 0 && (
              <div className="p-3 bg-primary-50 rounded-xl mb-4 text-sm">
                <div className="flex justify-between font-semibold">
                  <span>New Issue Cost</span>
                  <span className="text-primary-600">
                    {formatCurrency(
                      issues
                        .filter(i => diagForm.actual_issue_ids.includes(i.id))
                        .reduce((sum, i) => sum + parseFloat(i.fixed_cost), 0)
                    )}
                  </span>
                </div>
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Notes (optional)</label>
              <textarea
                className="input h-20 resize-none"
                placeholder="Describe what you found..."
                value={diagForm.notes}
                onChange={(e) => setDiagForm(f => ({ ...f, notes: e.target.value }))}
              ></textarea>
            </div>

            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowDiagModal(false)} className="btn-ghost flex-1">Cancel</button>
              <button onClick={handleDiagnose} disabled={updating} className="btn-primary flex-1">
                {updating ? <span className="spinner border-white"></span> : 'Update & Notify User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

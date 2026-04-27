import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { servicesAPI } from '../../api/services'
import { paymentsAPI } from '../../api/payments'
import { createWebSocket } from '../../api/websocket'
import { STATUS_LABELS } from '../../utils/constants'
import { formatCurrency, formatDistance, getStatusBadgeClass } from '../../utils/formatters'
import BackButton from '../../components/BackButton'
import LiveMap from '../../components/LiveMap'

const STATUS_STEPS = ['pending', 'accepted', 'en_route', 'arrived', 'in_progress', 'pending_payment', 'completed']

export default function TrackMechanic() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showQuoteModal, setShowQuoteModal] = useState(false)
  const [approving, setApproving] = useState(false)
  const [payingMethod, setPayingMethod] = useState(null)
  const [mechanicGps, setMechanicGps] = useState(null)
  const wsRef = useRef(null)

  useEffect(() => {
    loadRequest()
    connectWebSocket()
    return () => wsRef.current?.close()
  }, [id])

  const loadRequest = async () => {
    try {
      const res = await servicesAPI.getRequestDetail(id)
      setRequest(res.data)
      if (res.data.status === 'quote_pending') {
        setShowQuoteModal(true)
      }
    } catch (err) {
      console.error('Failed to load request:', err)
    } finally {
      setLoading(false)
    }
  }

  const connectWebSocket = () => {
    wsRef.current = createWebSocket(`ws/request/${id}/`, {
      status_update: (data) => {
        setRequest(prev => ({ ...prev, ...data.request, status: data.status }))
      },
      quote_update: (data) => {
        setRequest(prev => ({ ...prev, ...data.request }))
        setShowQuoteModal(true)
      },
      quote_approved: () => {
        setShowQuoteModal(false)
        loadRequest()
      },
      payment_requested: (data) => {
        setRequest(prev => ({ ...prev, ...data.request, status: 'pending_payment' }))
      },
      cash_payment_pending: (data) => {
        setRequest(prev => ({ ...prev, ...data.request, status: 'pending_cash' }))
      },
      request_completed: (data) => {
        setRequest(prev => ({ ...prev, ...data.request, status: 'completed' }))
      },
      mechanic_location: (data) => {
        if (data.latitude && data.longitude) {
          setMechanicGps({ lat: data.latitude, lng: data.longitude })
        }
        if (data.eta_minutes) {
          setRequest(prev => ({ ...prev, estimated_arrival_minutes: data.eta_minutes }))
        }
      },
    })
  }

  const handleApproveQuote = async () => {
    setApproving(true)
    try {
      const res = await servicesAPI.approveQuote(id)
      setRequest(res.data.request)
      setShowQuoteModal(false)
    } catch (err) {
      console.error('Failed to approve quote:', err)
    } finally {
      setApproving(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this request?')) return
    try {
      await servicesAPI.cancelRequest(id)
      navigate('/user/dashboard')
    } catch (err) {
      alert(err.response?.data?.error || 'Cannot cancel at this stage.')
    }
  }

  const handlePayment = async (method) => {
    setPayingMethod(method)
    try {
      const res = await paymentsAPI.createOrder({ service_request_id: id, payment_method: method })
      if (method === 'CASH') {
        setRequest(prev => ({ ...prev, status: 'pending_cash', payment_method: 'CASH' }))
        return
      }
      // Mock payment success for demo
      const verifyRes = await paymentsAPI.verifyPayment({
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_order_id: res.data.order_id,
        razorpay_signature: `sig_mock_${Date.now()}`,
      })
      // Online payment verified → backend marks job as completed
      setRequest(prev => ({ ...prev, status: 'completed', payment_status: 'paid' }))
    } catch (err) {
      alert('Payment failed. Please try again.')
    } finally {
      setPayingMethod(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="spinner-lg border-primary-500"></div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="page-container text-center py-20">
        <p className="text-slate-500">Request not found.</p>
      </div>
    )
  }

  const currentStepIndex = STATUS_STEPS.indexOf(request.status)
  const reportedIssues = request.reported_issues_detail || []
  const actualIssues = request.actual_issues_detail || []
  // Fallback to legacy single issue
  const displayIssues = reportedIssues.length > 0 ? reportedIssues : (request.reported_issue_detail ? [request.reported_issue_detail] : [])
  const displayActualIssues = actualIssues.length > 0 ? actualIssues : (request.actual_issue_detail ? [request.actual_issue_detail] : [])

  return (
    <div className="page-container max-w-3xl">
      <BackButton />

      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Track Request</h1>
            <p className="page-subtitle">SR-{request.id} • {request.vehicle_make} {request.vehicle_model}</p>
          </div>
          <span className={getStatusBadgeClass(request.status) + ' text-sm px-4 py-1.5'}>
            {STATUS_LABELS[request.status]}
          </span>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Progress</h2>
        <div className="flex items-center justify-between mb-2">
          {STATUS_STEPS.map((step, i) => {
            const isCompleted = i < currentStepIndex
            const isCurrent = i === currentStepIndex
            return (
              <div key={step} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-all duration-500 ${
                  isCompleted ? 'bg-emerald-500 text-white' :
                  isCurrent ? 'bg-primary-500 text-white shadow-lg shadow-primary-200 animate-pulse' :
                  'bg-slate-200 text-slate-400'
                }`}>
                  {isCompleted ? '✓' : i + 1}
                </div>
                <span className={`text-xs text-center leading-tight ${
                  isCurrent ? 'font-semibold text-primary-700' :
                  isCompleted ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {STATUS_LABELS[step]?.split(' ').slice(0, 2).join(' ')}
                </span>
              </div>
            )
          })}
        </div>
        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full transition-all duration-1000"
            style={{ width: `${Math.max((currentStepIndex / (STATUS_STEPS.length - 1)) * 100, 5)}%` }}
          ></div>
        </div>
      </div>

      {/* ETA Card */}
      {request.status === 'en_route' && request.estimated_arrival_minutes && (
        <div className="card mb-6 bg-gradient-to-r from-primary-500 to-primary-700 text-white animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-primary-200">Estimated Arrival</div>
              <div className="text-4xl font-bold mt-1">{request.estimated_arrival_minutes} min</div>
            </div>
            <div className="text-6xl animate-bounce-gentle">🏍️</div>
          </div>
        </div>
      )}

      {/* Live Map */}
      {request.user_latitude && request.user_longitude && ['accepted', 'en_route', 'arrived', 'in_progress'].includes(request.status) && (
        <div className="card mb-6 p-0 overflow-hidden">
          <LiveMap
            userLocation={{ lat: parseFloat(request.user_latitude), lng: parseFloat(request.user_longitude) }}
            mechanicLocation={mechanicGps}
            style={{ height: 280 }}
          />
        </div>
      )}

      {/* Cost Breakdown — Multi-issue */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">💰 Cost Breakdown</h2>
        <div className="space-y-3 text-sm">
          {/* Show reported issues */}
          {displayIssues.map(issue => (
            <div key={issue.id} className="flex justify-between items-center">
              <span className="text-slate-600 flex items-center gap-2">
                <span className="text-lg">{issue.icon}</span>
                {request.issue_was_overridden ? (
                  <span className="line-through text-slate-400">{issue.name}</span>
                ) : (
                  issue.name
                )}
              </span>
              {!request.issue_was_overridden && (
                <span className="font-semibold">{formatCurrency(issue.fixed_cost)}</span>
              )}
            </div>
          ))}

          {/* Show actual issues if overridden */}
          {request.issue_was_overridden && displayActualIssues.length > 0 && (
            <>
              <div className="text-xs text-primary-500 font-medium pt-1">→ Actual issues found:</div>
              {displayActualIssues.map(issue => (
                <div key={issue.id} className="flex justify-between items-center">
                  <span className="text-emerald-700 flex items-center gap-2">
                    <span className="text-lg">{issue.icon}</span>
                    {issue.name}
                  </span>
                  <span className="font-semibold">{formatCurrency(issue.fixed_cost)}</span>
                </div>
              ))}
            </>
          )}

          <div className="flex justify-between">
            <span className="text-slate-600">
              Travel Fee ({request.distance_km ? formatDistance(request.distance_km) : '—'} × ₹15/km)
            </span>
            <span className="font-semibold">{formatCurrency(request.distance_cost)}</span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between items-center">
            <span className="font-bold text-slate-900 text-base">Total</span>
            <span className="font-bold text-primary-600 text-2xl">{formatCurrency(request.total_cost)}</span>
          </div>
        </div>
      </div>

      {/* Mechanic Info */}
      {request.mechanic && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">🔧 Your Mechanic</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold">
              {(request.mechanic.first_name || request.mechanic.username)[0].toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-slate-900">
                {request.mechanic.first_name} {request.mechanic.last_name || request.mechanic.username}
              </div>
              <div className="text-sm text-slate-500">⭐ Verified Mechanic</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        {/* Payment UI — shown when mechanic requests payment */}
        {request.status === 'pending_payment' && request.payment_status !== 'paid' && (
          <div className="w-full">
            <div className="p-5 bg-gradient-to-br from-blue-50 to-primary-50 rounded-2xl border border-blue-200 mb-4">
              <h3 className="text-lg font-bold text-slate-900 mb-1">💳 Payment Required</h3>
              <p className="text-sm text-slate-600 mb-4">
                The mechanic has completed the repair. Please pay <strong className="text-primary-600">{formatCurrency(request.total_cost)}</strong> to close this request.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handlePayment('ONLINE')}
                  disabled={!!payingMethod}
                  className="btn-accent btn-lg flex-1 shadow-lg"
                >
                  {payingMethod === 'ONLINE' ? <span className="spinner border-white"></span> : '💳 Pay Online'}
                </button>
                <button
                  onClick={() => handlePayment('CASH')}
                  disabled={!!payingMethod}
                  className="btn-primary btn-lg flex-1 shadow-lg"
                >
                  {payingMethod === 'CASH' ? <span className="spinner border-white"></span> : '💵 Pay with Cash'}
                </button>
              </div>
            </div>
          </div>
        )}
        {request.status === 'pending_cash' && (
           <div className="w-full p-4 bg-amber-50 rounded-xl text-center text-amber-700 shadow-sm border border-amber-200">
              <div className="font-semibold mb-1">⏳ Waiting for Cash Confirmation</div>
              <div className="text-sm">Please pay <span className="font-bold">{formatCurrency(request.total_cost)}</span> in cash to the mechanic.</div>
           </div>
        )}
        {request.payment_status === 'paid' && (
           <div className="w-full p-4 bg-emerald-50 rounded-xl text-center text-emerald-700 shadow-sm border border-emerald-200 flex flex-col justify-center items-center">
              <div className="font-semibold mb-2">✅ Payment Successful!</div>
              <button onClick={() => navigate('/user/dashboard')} className="btn-primary text-sm px-6">Back to Dashboard</button>
           </div>
        )}
        {request.status === 'completed' && request.payment_status !== 'paid' && (
           <div className="w-full p-4 bg-emerald-50 rounded-xl text-center text-emerald-700 shadow-sm border border-emerald-200 flex flex-col justify-center items-center">
              <div className="text-4xl mb-2">🎉</div>
              <div className="font-semibold mb-2">Service Completed!</div>
              <button onClick={() => navigate('/user/dashboard')} className="btn-primary text-sm px-6">Back to Dashboard</button>
           </div>
        )}
        {/* Cancel button — hidden during payment stages */}
        {!['completed', 'cancelled', 'pending_cash', 'pending_payment'].includes(request.status) && request.payment_status !== 'paid' && (
          <button onClick={handleCancel} className="btn-danger flex-1">
            Cancel Request
          </button>
        )}
      </div>

      {/* Quote Approval Modal — Enhanced for multi-issue */}
      {showQuoteModal && request.status === 'quote_pending' && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Updated Diagnosis</h3>
              <p className="text-slate-500 mt-2 text-sm">
                The mechanic has updated the issue(s) after inspection.
              </p>
            </div>

            <div className="space-y-3 mb-6">
              {/* Original Issues */}
              <div className="p-3 bg-red-50 rounded-xl">
                <div className="text-xs text-red-500 font-medium mb-1">Original Issue(s)</div>
                {displayIssues.map(issue => (
                  <div key={issue.id} className="font-semibold text-slate-900 flex items-center gap-2 mt-1">
                    <span>{issue.icon}</span>
                    {issue.name}
                    <span className="ml-auto text-sm">{formatCurrency(issue.fixed_cost)}</span>
                  </div>
                ))}
              </div>

              <div className="text-center text-slate-400">↓</div>

              {/* Actual Issues */}
              <div className="p-3 bg-emerald-50 rounded-xl">
                <div className="text-xs text-emerald-500 font-medium mb-1">Actual Issue(s) Found</div>
                {displayActualIssues.map(issue => (
                  <div key={issue.id} className="font-semibold text-slate-900 flex items-center gap-2 mt-1">
                    <span>{issue.icon}</span>
                    {issue.name}
                    <span className="ml-auto text-sm">{formatCurrency(issue.fixed_cost)}</span>
                  </div>
                ))}
              </div>
            </div>

            {request.override_notes && (
              <div className="p-3 bg-slate-50 rounded-xl mb-6 text-sm text-slate-600">
                <strong>Note:</strong> {request.override_notes}
              </div>
            )}

            <div className="p-4 bg-primary-50 rounded-xl mb-6">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900">New Total</span>
                <span className="text-2xl font-bold text-primary-600">{formatCurrency(request.total_cost)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleCancel} className="btn-ghost flex-1">
                Decline
              </button>
              <button onClick={handleApproveQuote} disabled={approving} className="btn-primary flex-1">
                {approving ? <span className="spinner border-white"></span> : '✅ Approve New Quote'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

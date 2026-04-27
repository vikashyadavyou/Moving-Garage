import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { servicesAPI } from '../../api/services'
import { createWebSocket } from '../../api/websocket'
import { formatCurrency, formatDistance, formatRelativeTime } from '../../utils/formatters'
import BackButton from '../../components/BackButton'
import { useNotification } from '../../context/NotificationContext'

export default function IncomingRequests() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(null)
  const wsRef = useRef(null)
  const { showNotification } = useNotification()

  useEffect(() => {
    loadRequests()
    connectWebSocket()
    return () => wsRef.current?.close()
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

  const connectWebSocket = () => {
    wsRef.current = createWebSocket('ws/requests/', {
      new_request: (data) => {
        setRequests(prev => [data.request, ...prev])
        // NotificationContext will ALSO show the toast, 
        // we just need to ensure the list updates.
      },
    })
  }

  const handleAccept = async (id) => {
    setAccepting(id)
    try {
      await servicesAPI.acceptRequest(id)
      navigate(`/mechanic/job/${id}`)
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to accept request.')
    } finally {
      setAccepting(null)
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
        <h1 className="page-title">📡 Incoming Requests</h1>
        <p className="page-subtitle">
          {requests.length} pending {requests.length === 1 ? 'request' : 'requests'} near you
        </p>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-6 px-4 py-2 bg-primary-50 rounded-xl w-fit">
        <div className="status-dot-online"></div>
        <span className="text-sm font-medium text-primary-700">Live — Auto-updating</span>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 animate-bounce-gentle">📡</div>
          <h3 className="text-lg font-semibold text-slate-900">No requests right now</h3>
          <p className="text-slate-500 mt-1">New breakdown requests will appear here in real-time.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="card animate-slide-up hover:shadow-card-hover transition-shadow">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Issue + Vehicle */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-accent-100 to-accent-200 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">
                    {req.reported_issue_detail?.icon || '🔧'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 text-lg">
                      {req.reported_issue_detail?.name}
                    </div>
                    <div className="text-sm text-slate-500 mt-0.5">
                      🏍️ {req.vehicle_make} {req.vehicle_model}
                      {req.vehicle_year ? ` (${req.vehicle_year})` : ''}
                    </div>
                    <div className="text-sm text-slate-500 mt-0.5">
                      👤 {req.user?.first_name || req.user?.username}
                    </div>
                    {req.user_address && (
                      <div className="text-sm text-slate-400 mt-0.5">
                        📍 {req.user_address}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 mt-1">
                      {formatRelativeTime(req.created_at)}
                    </div>
                  </div>
                </div>

                {/* Pricing + Action */}
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3">
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Est. Earning</div>
                    <div className="text-2xl font-bold text-primary-600">
                      {formatCurrency(req.total_cost - (req.distance_cost || 0))}
                  </div>
                    <div className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded inline-block mt-1">
                        Route calculated on acceptance
                    </div>
                  </div>
                  <button
                    onClick={() => handleAccept(req.id)}
                    disabled={accepting === req.id}
                    className="btn-primary shadow-lg"
                  >
                    {accepting === req.id ? (
                      <span className="spinner border-white"></span>
                    ) : (
                      '✅ Accept Job'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { servicesAPI } from '../../api/services'
import { VEHICLE_MAKES } from '../../utils/constants'
import { formatCurrency } from '../../utils/formatters'

export default function NewRequest() {
  const navigate = useNavigate()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetchingLocation, setFetchingLocation] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState(null)

  const [form, setForm] = useState({
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: '',
    reported_issue: '',
    user_latitude: '',
    user_longitude: '',
    user_address: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    loadIssues()
    fetchLocation()
  }, [])

  const loadIssues = async () => {
    try {
      const res = await servicesAPI.getIssues()
      setIssues(res.data || [])
    } catch (err) {
      console.error('Failed to load issues:', err)
    }
  }

  const fetchLocation = () => {
    if (!navigator.geolocation) return
    setFetchingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({
          ...f,
          user_latitude: pos.coords.latitude.toFixed(7),
          user_longitude: pos.coords.longitude.toFixed(7),
        }))
        setFetchingLocation(false)
      },
      () => {
        // Fallback: Delhi coordinates
        setForm(f => ({
          ...f,
          user_latitude: '28.6139391',
          user_longitude: '77.2090212',
        }))
        setFetchingLocation(false)
      }
    )
  }

  const handleIssueSelect = (issue) => {
    setSelectedIssue(issue)
    setForm(f => ({ ...f, reported_issue: issue.id }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.reported_issue) {
      setError('Please select an issue type.')
      return
    }
    if (!form.user_latitude || !form.user_longitude) {
      setError('Location is required. Please allow GPS access.')
      return
    }

    setError('')
    setLoading(true)
    try {
      const res = await servicesAPI.createRequest({
        ...form,
        vehicle_year: form.vehicle_year ? parseInt(form.vehicle_year) : null,
      })
      const requestData = res.data
      navigate(`/user/track/${requestData.id}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-container max-w-3xl">
      <div className="page-header">
        <h1 className="page-title">🆘 Request Help</h1>
        <p className="page-subtitle">Tell us about your vehicle and the issue</p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl animate-fade-in">
            {error}
          </div>
        )}

        {/* Vehicle Details */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">🏍️ Vehicle Details</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="input-group">
              <label htmlFor="vehicle-make" className="input-label">Make / Brand</label>
              <select
                id="vehicle-make"
                className="select"
                value={form.vehicle_make}
                onChange={(e) => setForm({ ...form, vehicle_make: e.target.value })}
                required
              >
                <option value="">Select make</option>
                {VEHICLE_MAKES.map(make => (
                  <option key={make} value={make}>{make}</option>
                ))}
              </select>
            </div>
            <div className="input-group">
              <label htmlFor="vehicle-model" className="input-label">Model</label>
              <input
                id="vehicle-model"
                className="input"
                placeholder="e.g., Activa 6G"
                value={form.vehicle_model}
                onChange={(e) => setForm({ ...form, vehicle_model: e.target.value })}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="vehicle-year" className="input-label">Year (optional)</label>
              <input
                id="vehicle-year"
                type="number"
                className="input"
                placeholder="2023"
                min="1990"
                max="2030"
                value={form.vehicle_year}
                onChange={(e) => setForm({ ...form, vehicle_year: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Issue Selection */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">⚡ What's the Issue?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {issues.map(issue => (
              <button
                key={issue.id}
                type="button"
                onClick={() => handleIssueSelect(issue)}
                className={`p-4 rounded-xl border-2 text-left transition-all group ${
                  selectedIssue?.id === issue.id
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-border hover:border-primary-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    {issue.icon}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 text-sm leading-tight">
                      {issue.name}
                    </div>
                    <div className="text-lg font-bold text-primary-600 mt-1">
                      {formatCurrency(issue.fixed_cost)}
                    </div>
                    {issue.description && (
                      <div className="text-xs text-slate-500 mt-1">{issue.description}</div>
                    )}
                  </div>
                  {selectedIssue?.id === issue.id && (
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">📍 Your Location</h2>
          
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-3 h-3 rounded-full ${form.user_latitude ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
            <span className="text-sm text-slate-600">
              {fetchingLocation
                ? 'Detecting your location...'
                : form.user_latitude
                  ? `GPS: ${parseFloat(form.user_latitude).toFixed(4)}, ${parseFloat(form.user_longitude).toFixed(4)}`
                  : 'Location not detected'}
            </span>
            <button type="button" onClick={fetchLocation} className="btn-ghost btn-sm ml-auto">
              🔄 Refresh
            </button>
          </div>

          <div className="input-group mb-0">
            <label htmlFor="user-address" className="input-label">Address / Landmark (optional)</label>
            <input
              id="user-address"
              className="input"
              placeholder="e.g., Near City Mall, MG Road"
              value={form.user_address}
              onChange={(e) => setForm({ ...form, user_address: e.target.value })}
            />
          </div>
        </div>

        {/* Cost Estimate */}
        {selectedIssue && (
          <div className="card mb-6 bg-gradient-to-br from-primary-50 to-white border-primary-200 animate-slide-up">
            <h3 className="font-semibold text-slate-900 mb-3">💰 Estimated Cost</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">{selectedIssue.name}</span>
                <span className="font-medium">{formatCurrency(selectedIssue.fixed_cost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Travel Fee (₹15/km)</span>
                <span className="text-slate-500 italic">Calculated after mechanic accepts</span>
              </div>
              <div className="border-t border-primary-200 pt-2 flex justify-between">
                <span className="font-semibold text-slate-900">Issue Cost</span>
                <span className="font-bold text-primary-600 text-lg">
                  {formatCurrency(selectedIssue.fixed_cost)}+
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !form.reported_issue}
          className="btn-primary btn-lg w-full shadow-lg"
        >
          {loading ? (
            <span className="spinner border-white"></span>
          ) : (
            '📡 Broadcast for Help'
          )}
        </button>
      </form>
    </div>
  )
}

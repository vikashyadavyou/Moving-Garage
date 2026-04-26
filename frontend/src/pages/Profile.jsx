import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../api/auth'
import BackButton from '../components/BackButton'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    avatar: '',
  })

  const [mechForm, setMechForm] = useState({
    bio: '',
    experience_years: 0,
    specializations: [],
  })

  const [specInput, setSpecInput] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const res = await authAPI.getProfile()
      const data = res.data
      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        email: data.email || '',
        phone: data.phone || '',
        avatar: data.avatar || '',
      })
      if (data.mechanic_profile) {
        setMechForm({
          bio: data.mechanic_profile.bio || '',
          experience_years: data.mechanic_profile.experience_years || 0,
          specializations: data.mechanic_profile.specializations || [],
        })
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
      setError('Failed to load profile data.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = { ...form }
      if (user?.role === 'mechanic') {
        payload.mechanic_profile = mechForm
      }
      const res = await authAPI.updateProfile(payload)
      updateUser(res.data)
      setSuccess('Profile updated successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save profile.')
    } finally {
      setSaving(false)
    }
  }

  const addSpecialization = () => {
    const val = specInput.trim()
    if (val && !mechForm.specializations.includes(val)) {
      setMechForm(f => ({
        ...f,
        specializations: [...f.specializations, val],
      }))
      setSpecInput('')
    }
  }

  const removeSpecialization = (spec) => {
    setMechForm(f => ({
      ...f,
      specializations: f.specializations.filter(s => s !== spec),
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="spinner-lg border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="page-container max-w-2xl">
      <BackButton />

      <div className="page-header">
        <h1 className="page-title">👤 My Profile</h1>
        <p className="page-subtitle">
          {user?.role === 'mechanic' ? 'Mechanic' : 'User'} account settings
        </p>
      </div>

      <form onSubmit={handleSave}>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl animate-fade-in">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl animate-fade-in">
            ✅ {success}
          </div>
        )}

        {/* Avatar Preview */}
        <div className="card mb-6">
          <div className="flex items-center gap-5 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0">
              {form.avatar ? (
                <img
                  src={form.avatar}
                  alt="Avatar"
                  className="w-full h-full rounded-2xl object-cover"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ) : (
                (form.first_name || user?.username || 'U')[0].toUpperCase()
              )}
            </div>
            <div>
              <div className="font-semibold text-slate-900 text-lg">
                {form.first_name || user?.username} {form.last_name}
              </div>
              <div className="text-sm text-slate-500 capitalize">{user?.role}</div>
              <div className="text-xs text-slate-400">@{user?.username}</div>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">📋 Personal Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="input-group">
              <label htmlFor="profile-first-name" className="input-label">First Name</label>
              <input
                id="profile-first-name"
                className="input"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder="First Name"
              />
            </div>
            <div className="input-group">
              <label htmlFor="profile-last-name" className="input-label">Last Name</label>
              <input
                id="profile-last-name"
                className="input"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder="Last Name"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="profile-email" className="input-label">Email</label>
            <input
              id="profile-email"
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>

          <div className="input-group">
            <label htmlFor="profile-phone" className="input-label">Phone</label>
            <input
              id="profile-phone"
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 XXXX XXXX XX"
            />
          </div>

          <div className="input-group mb-0">
            <label htmlFor="profile-avatar" className="input-label">Avatar URL</label>
            <input
              id="profile-avatar"
              className="input"
              value={form.avatar}
              onChange={(e) => setForm({ ...form, avatar: e.target.value })}
              placeholder="https://example.com/photo.jpg"
            />
          </div>
        </div>

        {/* Mechanic-specific */}
        {user?.role === 'mechanic' && (
          <div className="card mb-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">🔧 Mechanic Details</h2>

            <div className="input-group">
              <label htmlFor="profile-bio" className="input-label">Bio</label>
              <textarea
                id="profile-bio"
                className="input h-24 resize-none"
                value={mechForm.bio}
                onChange={(e) => setMechForm({ ...mechForm, bio: e.target.value })}
                placeholder="Tell customers about your skills and experience..."
              ></textarea>
            </div>

            <div className="input-group">
              <label htmlFor="profile-exp" className="input-label">Years of Experience</label>
              <input
                id="profile-exp"
                type="number"
                min="0"
                max="50"
                className="input w-32"
                value={mechForm.experience_years}
                onChange={(e) => setMechForm({ ...mechForm, experience_years: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="input-group mb-0">
              <label className="input-label">Specializations</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {mechForm.specializations.map((spec, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium"
                  >
                    {spec}
                    <button
                      type="button"
                      onClick={() => removeSpecialization(spec)}
                      className="ml-1 text-primary-400 hover:text-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  id="profile-spec-input"
                  className="input flex-1"
                  value={specInput}
                  onChange={(e) => setSpecInput(e.target.value)}
                  placeholder="e.g., Honda, Spark Plugs, Tires"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSpecialization() } }}
                />
                <button
                  type="button"
                  onClick={addSpecialization}
                  className="btn-secondary btn-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary btn-lg w-full shadow-lg"
          id="save-profile-btn"
        >
          {saving ? (
            <span className="spinner border-white"></span>
          ) : (
            '💾 Save Changes'
          )}
        </button>
      </form>
    </div>
  )
}

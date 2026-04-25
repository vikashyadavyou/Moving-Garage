import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultRole = searchParams.get('role') || 'user'

  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    password: '',
    password_confirm: '',
    role: defaultRole,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.password_confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const user = await register(form)
      navigate(user.role === 'mechanic' ? '/mechanic/dashboard' : '/user/dashboard')
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const messages = Object.entries(data)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join('\n')
        setError(messages)
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">{form.role === 'mechanic' ? '🔧' : '🏍️'}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
          <p className="text-slate-500 mt-1">Join Moving Garage today</p>
        </div>

        <div className="card p-8">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl whitespace-pre-line animate-fade-in">
                {error}
              </div>
            )}

            {/* Role Toggle */}
            <div className="input-group">
              <label className="input-label">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'user', label: '🏍️ Commuter', desc: 'Need help' },
                  { value: 'mechanic', label: '🔧 Mechanic', desc: 'Provide help' },
                ].map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: role.value })}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      form.role === role.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-border hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div className="text-lg mb-1">{role.label}</div>
                    <div className="text-xs text-slate-500">{role.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label htmlFor="reg-first-name" className="input-label">First Name</label>
                <input id="reg-first-name" className="input" placeholder="John" value={form.first_name} onChange={update('first_name')} required />
              </div>
              <div className="input-group">
                <label htmlFor="reg-last-name" className="input-label">Last Name</label>
                <input id="reg-last-name" className="input" placeholder="Doe" value={form.last_name} onChange={update('last_name')} required />
              </div>
            </div>

            <div className="input-group">
              <label htmlFor="reg-username" className="input-label">Username</label>
              <input id="reg-username" className="input" placeholder="johndoe" value={form.username} onChange={update('username')} required />
            </div>

            <div className="input-group">
              <label htmlFor="reg-email" className="input-label">Email</label>
              <input id="reg-email" type="email" className="input" placeholder="john@example.com" value={form.email} onChange={update('email')} required />
            </div>

            <div className="input-group">
              <label htmlFor="reg-phone" className="input-label">Phone Number</label>
              <input id="reg-phone" type="tel" className="input" placeholder="+91 98765 43210" value={form.phone} onChange={update('phone')} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="input-group">
                <label htmlFor="reg-password" className="input-label">Password</label>
                <input id="reg-password" type="password" className="input" placeholder="Min 8 chars" value={form.password} onChange={update('password')} required minLength={8} />
              </div>
              <div className="input-group">
                <label htmlFor="reg-confirm" className="input-label">Confirm</label>
                <input id="reg-confirm" type="password" className="input" placeholder="Repeat" value={form.password_confirm} onChange={update('password_confirm')} required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <span className="spinner border-white"></span> : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-primary-600 font-semibold hover:text-primary-700">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

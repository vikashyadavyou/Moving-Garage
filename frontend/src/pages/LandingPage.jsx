import { Link } from 'react-router-dom'
import { ISSUE_TYPES, DISTANCE_RATE } from '../utils/constants'
import { formatCurrency } from '../utils/formatters'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50"></div>
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent-200/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-6 animate-fade-in">
              <span className="status-dot-online"></span>
              Live mechanics available near you
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight mb-6 animate-slide-up">
              Your 2-Wheeler
              <br />
              <span className="text-gradient">Breakdown Buddy</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-2xl animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Stranded with a flat tire or dead battery? Get instant help from verified local mechanics. 
              Transparent pricing. Real-time tracking. No surprises.
            </p>
            
            <div className="flex flex-wrap gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/auth/register" className="btn-primary btn-lg shadow-lg hover:shadow-xl">
                🆘 Get Help Now
              </Link>
              <Link to="/auth/register?role=mechanic" className="btn-secondary btn-lg">
                🔧 Join as Mechanic
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 mt-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div>
                <div className="text-3xl font-bold text-slate-900">500+</div>
                <div className="text-sm text-slate-500">Verified Mechanics</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">10K+</div>
                <div className="text-sm text-slate-500">Rescues Done</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">4.8★</div>
                <div className="text-sm text-slate-500">Average Rating</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900">~15 min</div>
                <div className="text-sm text-slate-500">Avg. Response</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Get back on the road in 3 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: '📍',
                title: 'Report & Locate',
                desc: 'Select your issue, share your GPS location, and broadcast for help.',
              },
              {
                step: '02',
                icon: '🏍️',
                title: 'Mechanic En Route',
                desc: 'A nearby mechanic accepts your request and navigates to you in real-time.',
              },
              {
                step: '03',
                icon: '✅',
                title: 'Fixed & Pay',
                desc: 'Mechanic fixes the issue on-site. Pay the transparent, pre-approved price.',
              },
            ].map((item, i) => (
              <div key={i} className="card-hover text-center group">
                <div className="text-xs font-bold text-primary-400 mb-3">{item.step}</div>
                <div className="w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Transparent Pricing
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Fixed issue cost + {formatCurrency(DISTANCE_RATE)}/km travel fee. No hidden charges.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ISSUE_TYPES.map((issue) => (
              <div key={issue.slug} className="card-hover group">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {issue.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 mb-1 leading-tight">{issue.name}</h3>
                    <div className="text-xl font-bold text-primary-600">
                      {formatCurrency(issue.cost)}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">Fixed cost</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Price Example */}
          <div className="mt-12 max-w-lg mx-auto">
            <div className="card bg-gradient-to-br from-primary-50 to-white border-primary-200">
              <h4 className="font-semibold text-slate-900 mb-4">💡 Example Bill</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Flat Tire Repair</span>
                  <span className="font-medium">₹150</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Travel Fee (3 km × ₹15)</span>
                  <span className="font-medium">₹45</span>
                </div>
                <div className="border-t border-primary-200 pt-2 flex justify-between">
                  <span className="font-semibold text-slate-900">Total</span>
                  <span className="font-bold text-primary-600 text-lg">₹195</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Don't Stay Stranded
          </h2>
          <p className="text-lg text-primary-200 mb-10 max-w-2xl mx-auto">
            Join thousands of commuters who trust Moving Garage for roadside assistance.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/auth/register" className="btn-lg bg-white text-primary-700 font-bold rounded-2xl hover:bg-primary-50 shadow-lg transition-all">
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">🔧</span>
              </div>
              <span className="font-bold text-white">Moving Garage</span>
            </div>
            <p className="text-sm">© 2024 Moving Garage. On-demand 2-wheeler assistance.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

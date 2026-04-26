import { useNavigate } from 'react-router-dom'

export default function BackButton({ label = 'Back', className = '' }) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(-1)}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group mb-4 ${className}`}
      type="button"
      id="back-button"
    >
      <svg
        className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  )
}

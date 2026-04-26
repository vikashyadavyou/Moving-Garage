import { useEffect, useState } from 'react'

const ICONS = {
  new_request: '📡',
  quote_update: '⏳',
  status_update: '🔔',
}

const NOTIFICATION_SOUND = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + 
  '//+////+////+////+////+////+////+////+////+////+////+////+////+////+////+////+////+////+////+////' + 
  '//+////+////+////+////+////+////+////+////+////+////+////+////+////+////+////+////+////+////+////' +
  'This needs to be replaced with a real beep or shortened because this dummy base64 might not play correctly ' +
  'but for the sake of standard HTML5 audio, let\'s use a reliable tiny beep.'

export default function NotificationToast({ id, type, title, message, onClose }) {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    // Play sound on mount
    try {
      // Use the browser AudioContext to synthesize a beep to avoid base64 bloat
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      osc.frequency.value = 880 // A5 note
      osc.type = 'sine'
      gain.gain.value = 0.1 // Volume
      
      osc.start()
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5)
      osc.stop(ctx.currentTime + 0.5)
    } catch (err) {
      console.warn('Audio play failed:', err)
    }

    const timer = setTimeout(() => handleClose(), 8000)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => onClose(id), 300) // Match animation out duration
  }

  const icon = ICONS[type] || '🔔'

  return (
    <div
      className={`mb-3 w-80 bg-white border border-border shadow-elevated rounded-xl p-4 flex gap-3 ${
        isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'
      }`}
    >
      <div className="text-2xl mt-0.5">{icon}</div>
      <div className="flex-1">
        <h4 className="text-sm font-bold text-slate-900">{title}</h4>
        <p className="text-sm text-slate-600 mt-0.5 leading-tight">{message}</p>
      </div>
      <button
        onClick={handleClose}
        className="text-slate-400 hover:text-slate-600 transition-colors self-start"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

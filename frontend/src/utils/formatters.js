/**
 * Format currency in INR
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format distance in km
 */
export function formatDistance(km) {
  return `${parseFloat(km).toFixed(1)} km`
}

/**
 * Format date/time
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format relative time (e.g., "5 min ago")
 */
export function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

/**
 * Get status badge class
 */
export function getStatusBadgeClass(status) {
  const map = {
    pending: 'badge-warning',
    accepted: 'badge-primary',
    en_route: 'badge-primary',
    arrived: 'badge-success',
    diagnosed: 'badge-warning',
    quote_pending: 'badge-warning',
    in_progress: 'badge-primary',
    completed: 'badge-success',
    cancelled: 'badge-danger',
  }
  return map[status] || 'badge-neutral'
}

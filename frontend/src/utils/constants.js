// Issue types with their pricing and icons (reference — actual data fetched from API)
export const ISSUE_TYPES = [
  { slug: 'flat-tire', name: 'Flat Tire / Puncture Repair', cost: 150, icon: '🔧' },
  { slug: 'dead-battery', name: 'Dead Battery / Jump Start', cost: 200, icon: '🔋' },
  { slug: 'clutch-brake-cable', name: 'Broken Clutch / Brake Cable', cost: 250, icon: '⚙️' },
  { slug: 'spark-plug', name: 'Spark Plug Issue', cost: 120, icon: '⚡' },
  { slug: 'engine-overheating', name: 'Engine Overheating / Oil Issue', cost: 300, icon: '🌡️' },
  { slug: 'pushing-to-garage', name: 'Pushing to Garage', cost: 25, icon: '🏍️' },
  { slug: 'unknown-issue', name: 'Unknown Issue (Diagnostic Fee)', cost: 25, icon: '🔍' },
  { slug: 'broken-drive-chain', name: 'Broken Drive Chain', cost: 150, icon: '⛓️' },
  { slug: 'headlight-taillight', name: 'Headlight/Taillight Bulb Replacement', cost: 80, icon: '💡' },
  { slug: 'engine-oil-leak', name: 'Engine Oil Leak', cost: 200, icon: '🛢️' },
]

export const STATUS_LABELS = {
  pending: 'Searching for Mechanic',
  accepted: 'Mechanic Assigned',
  en_route: 'Mechanic En Route',
  arrived: 'Mechanic Arrived',
  diagnosed: 'Diagnosed',
  quote_pending: 'Pending User Approval',
  in_progress: 'Repair In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  pending_cash: 'Pending Cash Collection',
}

export const STATUS_COLORS = {
  pending: 'warning',
  accepted: 'primary',
  en_route: 'primary',
  arrived: 'success',
  diagnosed: 'warning',
  quote_pending: 'warning',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'danger',
  pending_cash: 'warning',
}

export const DISTANCE_RATE = 15 // ₹15 per km

export const VEHICLE_MAKES = [
  'Honda', 'Hero', 'Bajaj', 'TVS', 'Royal Enfield', 'Yamaha',
  'Suzuki', 'KTM', 'Aprilia', 'Kawasaki', 'Harley-Davidson',
  'Ola Electric', 'Ather', 'Other',
]

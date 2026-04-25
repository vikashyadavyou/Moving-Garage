// Issue types with their pricing and icons
export const ISSUE_TYPES = [
  { slug: 'flat-tire', name: 'Flat Tire / Puncture Repair', cost: 150, icon: '🔧' },
  { slug: 'dead-battery', name: 'Dead Battery / Jump Start', cost: 200, icon: '🔋' },
  { slug: 'clutch-brake-cable', name: 'Broken Clutch / Brake Cable', cost: 250, icon: '⚙️' },
  { slug: 'spark-plug', name: 'Spark Plug Issue', cost: 120, icon: '⚡' },
  { slug: 'engine-overheating', name: 'Engine Overheating / Oil Issue', cost: 300, icon: '🌡️' },
  { slug: 'towing', name: 'Towing to Garage', cost: 500, icon: '🚛' },
  { slug: 'unknown-issue', name: "Unknown Issue (Diagnostic)", cost: 100, icon: '🔍' },
]

export const STATUS_LABELS = {
  pending: 'Searching for Mechanic',
  accepted: 'Mechanic Assigned',
  en_route: 'Mechanic En Route',
  arrived: 'Mechanic Arrived',
  diagnosed: 'Diagnosed',
  quote_pending: 'New Quote Pending',
  in_progress: 'Repair In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
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
}

export const DISTANCE_RATE = 15 // ₹15 per km

export const VEHICLE_MAKES = [
  'Honda', 'Hero', 'Bajaj', 'TVS', 'Royal Enfield', 'Yamaha',
  'Suzuki', 'KTM', 'Aprilia', 'Kawasaki', 'Harley-Davidson',
  'Ola Electric', 'Ather', 'Other',
]

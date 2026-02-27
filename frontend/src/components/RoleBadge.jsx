const map = {
  BAT:  'badge-bat',
  BOWL: 'badge-bowl',
  ALL:  'badge-all',
  WK:   'badge-wk',
}

export default function RoleBadge({ role }) {
  return (
    <span className={map[role] || 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600'}>
      {role}
    </span>
  )
}

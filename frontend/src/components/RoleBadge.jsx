const map = {
  BAT:  'badge-bat',
  BOWL: 'badge-bowl',
  ALL:  'badge-all',
  WK:   'badge-wk',
}

export default function RoleBadge({ role }) {
  return <span className={map[role] || 'badge bg-neutral-700 text-neutral-300'}>{role}</span>
}

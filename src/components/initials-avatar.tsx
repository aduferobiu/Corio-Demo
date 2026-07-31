import { cn } from '#/lib/utils'

// Bright, saturated colors chosen so white initials stay readable on every
// one of them — no pastels/light tones that wash out at avatar sizes.
const AVATAR_COLORS = [
  '#2970FF',
  '#7C3AED',
  '#DB2777',
  '#EA580C',
  '#059669',
  '#DC2626',
  '#0891B2',
  '#4F46E5',
  '#B45309',
  '#16A34A',
]

function hashString(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getAvatarColor(name: string) {
  return AVATAR_COLORS[hashString(name.trim().toLowerCase()) % AVATAR_COLORS.length]
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Deterministic per-name color so the same person always gets the same
// avatar color across the app, instead of a flat neutral tone that's hard
// to distinguish at a glance.
export function InitialsAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-full font-medium text-white', className)}
      style={{ backgroundColor: getAvatarColor(name) }}
    >
      {getInitials(name)}
    </div>
  )
}

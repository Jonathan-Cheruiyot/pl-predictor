import { getTeamColor } from '../teams'

interface Props {
  team: string
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

const dotSize = { xs: 'w-2 h-2', sm: 'w-2.5 h-2.5', md: 'w-3 h-3' }
const textSize = { xs: 'text-xs', sm: 'text-sm', md: 'text-base' }

export default function TeamBadge({ team, size = 'sm', className = '' }: Props) {
  const { primary } = getTeamColor(team)
  return (
    <span className={`inline-flex items-center gap-2 ${textSize[size]} ${className}`}>
      <span
        className={`${dotSize[size]} rounded-full flex-shrink-0`}
        style={{ backgroundColor: primary }}
      />
      {team}
    </span>
  )
}

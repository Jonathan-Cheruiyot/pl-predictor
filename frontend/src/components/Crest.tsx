import { useEffect, useState } from 'react'
import { getCrestUrl } from '../crests'
import { getTeamColor } from '../teams'

export function useCrest(teamName: string): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    getCrestUrl(teamName).then(setUrl)
  }, [teamName])
  return url
}

interface Props {
  team: string
  /** Size in Tailwind 4-unit steps: size={10} → 40px */
  size?: number
  className?: string
}

export default function Crest({ team, size = 10, className = '' }: Props) {
  const url = useCrest(team)
  const { primary } = getTeamColor(team)
  const px = size * 4

  if (!url) {
    return (
      <div
        className={`rounded-full flex-shrink-0 ${className}`}
        style={{ width: px, height: px, backgroundColor: primary, opacity: 0.25 }}
      />
    )
  }
  return (
    <img
      src={url}
      alt={team}
      style={{ width: px, height: px }}
      className={`object-contain flex-shrink-0 ${className}`}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
    />
  )
}

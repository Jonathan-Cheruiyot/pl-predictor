import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { api, type SquadPlayer, type StandingEntry } from '../api'

const POSITION_ORDER: Record<string, number> = {
  Goalkeeper: 0,
  'Centre-Back': 1,
  'Right-Back': 1,
  'Left-Back': 1,
  Defender: 1,
  Midfielder: 2,
  'Defensive Midfield': 2,
  'Central Midfield': 2,
  'Attacking Midfield': 2,
  'Right Winger': 3,
  'Left Winger': 3,
  Forward: 3,
  'Centre-Forward': 3,
}

function positionOrder(pos: string): number {
  return POSITION_ORDER[pos] ?? 2
}

function groupByPosition(players: SquadPlayer[]): [string, SquadPlayer[]][] {
  const groups: Record<string, SquadPlayer[]> = {}
  for (const p of players) {
    const key = p.position || 'Unknown'
    if (!groups[key]) groups[key] = []
    groups[key].push(p)
  }
  return Object.entries(groups).sort(
    ([a], [b]) => positionOrder(a) - positionOrder(b)
  )
}

export default function TeamPage() {
  const { teamShort } = useParams<{ teamShort: string }>()
  const location = useLocation()
  const row = location.state as StandingEntry | null

  const [squad, setSquad] = useState<SquadPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!teamShort) return
    api.getSquad(teamShort)
      .then(setSquad)
      .catch(() => setError('Could not load squad.'))
      .finally(() => setLoading(false))
  }, [teamShort])

  const grouped = groupByPosition(squad)

  return (
    <div>
      {/* Back */}
      <Link
        to="/league"
        className="text-[11px] text-[#6B3F7E] hover:text-[#9ca3af] transition-colors"
      >
        ← League table
      </Link>

      {/* Team header */}
      <div className="mt-6 flex items-center gap-5">
        {row?.crest_url && (
          <img
            src={row.crest_url}
            alt={teamShort}
            className="w-14 h-14 object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{row?.team_name ?? teamShort}</h1>
          {row && (
            <p className="text-xs text-[#6B3F7E] mt-0.5">
              {row.position}{row.position === 1 ? 'st' : row.position === 2 ? 'nd' : row.position === 3 ? 'rd' : 'th'} place
              {' · '}{row.points} pts
              {' · '}{row.played} played
            </p>
          )}
        </div>
      </div>

      {/* Squad */}
      <div className="mt-10">
        <h2 className="text-[10px] uppercase tracking-widest text-[#6B3F7E] font-medium mb-5">
          Squad
        </h2>

        {loading && <p className="text-[#6B3F7E] text-sm">Loading squad…</p>}
        {error && <p className="text-[#E90052]/80 text-sm">{error}</p>}

        {!loading && !error && squad.length === 0 && (
          <p className="text-[#6b7280] text-sm">No squad data available.</p>
        )}

        {!loading && !error && grouped.map(([position, players]) => (
          <div key={position} className="mb-6">
            <p className="text-[10px] uppercase tracking-widest text-[#5c2e6b] font-medium mb-2">
              {position}
            </p>
            <div className="space-y-0 divide-y divide-white/[0.04]">
              {players.map((p) => (
                <div key={p.name} className="flex items-center gap-4 py-2.5">
                  <span className="text-xs text-[#6B3F7E] tabular-nums w-5 text-right flex-shrink-0">
                    {p.number || '—'}
                  </span>
                  <span className="text-sm text-white/80 flex-1">{p.name}</span>
                  <span className="text-xs text-[#6B3F7E]">{p.nationality}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-[10px] text-[#5c2e6b]">
        Squad data: TheSportsDB
      </p>
    </div>
  )
}

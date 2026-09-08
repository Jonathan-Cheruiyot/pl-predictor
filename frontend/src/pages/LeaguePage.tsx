import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type StandingEntry } from '../api'

// Zone colors — UCL / Europa / relegation
function zoneColor(pos: number): string {
  if (pos <= 4) return '#04F5FF'   // Champions League — cyan
  if (pos <= 6) return '#E90052'   // Europa — pink
  if (pos >= 18) return '#ff4444'  // Relegation — red
  return '#6B3F7E'                 // Mid-table — muted
}

function zoneDot(pos: number) {
  if (pos > 6 && pos < 18) return null
  return (
    <span
      className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] rounded-full"
      style={{ backgroundColor: zoneColor(pos), height: pos <= 6 ? '100%' : '60%' }}
    />
  )
}

// ---------------------------------------------------------------------------
// Top 4 — large, prominent treatment
// ---------------------------------------------------------------------------

function TopRow({ row }: { row: StandingEntry }) {
  const navigate = useNavigate()
  const color = zoneColor(row.position)

  return (
    <div
      onClick={() => navigate(`/team/${encodeURIComponent(row.team_short)}`, { state: row })}
      className="relative pl-4 cursor-pointer group"
    >
      {zoneDot(row.position)}
      <div className="flex items-center gap-4 py-4 border-b border-white/[0.06]
                      group-hover:border-white/[0.15] transition-colors">
        <span className="text-xs tabular-nums w-4 flex-shrink-0" style={{ color }}>{row.position}</span>
        <img
          src={row.crest_url}
          alt={row.team_short}
          className="w-9 h-9 object-contain flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-white text-base leading-tight">{row.team_short}</p>
          <p className="text-[11px] text-[#9D79BC] mt-0.5">
            {row.won}W · {row.drawn}D · {row.lost}L
          </p>
        </div>
        <div className="flex items-center gap-6 flex-shrink-0 text-right">
          <div className="hidden sm:block">
            <p className="text-[10px] text-[#6B3F7E] uppercase tracking-widest">GD</p>
            <p className={`text-sm font-medium tabular-nums ${row.goal_difference > 0 ? 'text-[#00FF85]' : row.goal_difference < 0 ? 'text-[#E90052]' : 'text-[#9D79BC]'}`}>
              {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#6B3F7E] uppercase tracking-widest">Pts</p>
            <p className="text-xl font-bold tabular-nums">{row.points}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Positions 5–17 — compact
// ---------------------------------------------------------------------------

function CompactRow({ row }: { row: StandingEntry }) {
  const navigate = useNavigate()
  const color = zoneColor(row.position)

  return (
    <div
      onClick={() => navigate(`/team/${encodeURIComponent(row.team_short)}`, { state: row })}
      className="relative pl-4 cursor-pointer group"
    >
      {zoneDot(row.position)}
      <div className="flex items-center gap-3 py-2.5 border-b border-white/[0.04]
                      group-hover:border-white/[0.12] transition-colors">
        <span className="text-[11px] tabular-nums w-4 flex-shrink-0" style={{ color }}>{row.position}</span>
        <img
          src={row.crest_url}
          alt={row.team_short}
          className="w-5 h-5 object-contain flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <span className="flex-1 min-w-0 text-sm text-white/80 font-medium truncate">{row.team_short}</span>
        <div className="flex items-center gap-5 flex-shrink-0 text-right text-sm tabular-nums">
          <span className="text-[#6B3F7E] w-6">{row.played}</span>
          <span className="w-6">{row.won}</span>
          <span className="text-[#9D79BC] w-6">{row.drawn}</span>
          <span className="text-[#9D79BC] w-6">{row.lost}</span>
          <span className={`w-8 text-xs ${row.goal_difference > 0 ? 'text-[#00FF85]' : row.goal_difference < 0 ? 'text-[#E90052]' : 'text-[#9D79BC]'}`}>
            {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
          </span>
          <span className="font-bold w-6">{row.points}</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LeaguePage() {
  const [standings, setStandings] = useState<StandingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getStandings()
      .then(setStandings)
      .catch(() => setError('Could not load standings — is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-[#6B3F7E] text-sm">Loading standings…</p>
  if (error) return <p className="text-[#E90052]/80 text-sm">{error}</p>

  const leader = standings[0]
  const top4 = standings.slice(0, 4)
  const rest = standings.slice(4)

  return (
    <div>
      {/* ------------------------------------------------------------------ */}
      {/* Hero — deliberately oversized, left-anchored, asymmetric            */}
      {/* ------------------------------------------------------------------ */}
      {leader && (
        <div className="mb-12 -mx-4 px-4 pt-2 pb-8 border-b border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-widest text-[#6B3F7E] font-medium mb-6">
            Premier League · {leader.played} matches played
          </p>
          {/* Asymmetric: text block flush left, large crest hangs right */}
          <div className="flex items-end justify-between gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-[#04F5FF] font-medium mb-3">
                Leading the table
              </p>
              {/* The one dramatically oversized element */}
              <h1 className="text-6xl sm:text-7xl font-bold leading-none tracking-tight text-white">
                {leader.team_short}
              </h1>
              <div className="flex items-center gap-4 mt-4">
                <span className="text-3xl font-bold text-white tabular-nums">{leader.points}</span>
                <span className="text-[#6B3F7E] text-sm">points</span>
                <span className="text-[#5c2e6b]">·</span>
                <span className="text-[#9D79BC] text-sm">{leader.won}W {leader.drawn}D {leader.lost}L</span>
              </div>
            </div>
            {/* Large crest — right side, deliberately oversized */}
            <img
              src={leader.crest_url}
              alt={leader.team_short}
              className="w-20 h-20 sm:w-28 sm:h-28 object-contain flex-shrink-0 opacity-90"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Table — pushed slightly right (ml-6) for asymmetric rhythm          */}
      {/* ------------------------------------------------------------------ */}
      <div className="ml-0 sm:ml-6">

        {/* Top 4 — UCL spots, prominent */}
        <div className="mb-1">
          <p className="text-[10px] uppercase tracking-widest text-[#04F5FF] font-medium mb-3 flex items-center gap-2">
            <span className="w-[2px] h-3 bg-[#04F5FF] rounded-full inline-block" />
            Champions League
          </p>
          {top4.map(row => <TopRow key={row.team_id} row={row} />)}
        </div>

        {/* Rest — compact, with Europa/relegation zone markers */}
        {rest.length > 0 && (
          <div className="mt-4">
            {/* Compact table header */}
            <div className="pl-4 flex items-center gap-3 pb-2 border-b border-white/[0.08]">
              <span className="w-4" />
              <span className="w-5" />
              <span className="flex-1" />
              <div className="flex items-center gap-5 text-[10px] uppercase tracking-widest text-[#6B3F7E] font-medium text-right">
                <span className="w-6">P</span>
                <span className="w-6">W</span>
                <span className="w-6">D</span>
                <span className="w-6">L</span>
                <span className="w-8">GD</span>
                <span className="w-6">Pts</span>
              </div>
            </div>

            {/* Europa label before pos 5 */}
            {rest[0]?.position === 5 && (
              <p className="text-[10px] uppercase tracking-widest text-[#E90052] font-medium mt-3 mb-2 pl-4 flex items-center gap-2">
                <span className="w-[2px] h-3 bg-[#E90052] rounded-full inline-block" />
                Europa League
              </p>
            )}

            {rest.map((row, i) => {
              const showRelegation = row.position === 18 && i > 0
              return (
                <div key={row.team_id}>
                  {showRelegation && (
                    <p className="text-[10px] uppercase tracking-widest text-[#ff4444]/70 font-medium mt-3 mb-2 pl-4 flex items-center gap-2">
                      <span className="w-[2px] h-3 bg-[#ff4444] rounded-full inline-block opacity-70" />
                      Relegation
                    </p>
                  )}
                  {/* Europa label ends after pos 6 */}
                  {row.position === 7 && (
                    <div className="border-t border-white/[0.04] mt-0 mb-0" />
                  )}
                  <CompactRow row={row} />
                </div>
              )
            })}
          </div>
        )}

        <p className="mt-6 text-[10px] text-[#5c2e6b]">
          Data: football-data.org · Click any team to view squad
        </p>
      </div>
    </div>
  )
}

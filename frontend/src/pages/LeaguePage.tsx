import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type StandingEntry } from '../api'

function GDCell({ gd }: { gd: number }) {
  const color = gd > 0 ? 'text-green-400' : gd < 0 ? 'text-red-400' : 'text-[#6b7280]'
  return <span className={color}>{gd > 0 ? `+${gd}` : gd}</span>
}

export default function LeaguePage() {
  const [standings, setStandings] = useState<StandingEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.getStandings()
      .then(setStandings)
      .catch(() => setError('Could not load standings — is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-[#4b5563] text-sm">Loading standings…</p>
  if (error) return <p className="text-red-400/80 text-sm">{error}</p>

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Premier League</h1>
      <p className="text-xs text-[#4b5563] mb-8">
        {standings[0]?.played != null
          ? `${standings[0].played} matches played · Click a team to view squad`
          : 'Click a team to view squad'}
      </p>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-widest text-[#4b5563] font-medium border-b border-white/[0.08]">
            <th className="pb-3 w-7">#</th>
            <th className="pb-3">Team</th>
            <th className="pb-3 text-right pr-3 w-8">P</th>
            <th className="pb-3 text-right pr-3 w-8">W</th>
            <th className="pb-3 text-right pr-3 w-8">D</th>
            <th className="pb-3 text-right pr-3 w-8">L</th>
            <th className="pb-3 text-right pr-3 w-10">GD</th>
            <th className="pb-3 text-right w-10">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((row) => (
            <tr
              key={row.team_id}
              onClick={() => navigate(`/team/${encodeURIComponent(row.team_short)}`, { state: row })}
              className="border-b border-white/[0.06] text-[#d1d5db] hover:text-white hover:bg-white/[0.03] cursor-pointer transition-colors"
            >
              <td className="py-3 text-[#4b5563] text-xs">{row.position}</td>
              <td className="py-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={row.crest_url}
                    alt={row.team_short}
                    className="w-5 h-5 object-contain flex-shrink-0"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <span className="font-medium">{row.team_short}</span>
                </div>
              </td>
              <td className="py-3 text-right pr-3 text-[#6b7280] tabular-nums">{row.played}</td>
              <td className="py-3 text-right pr-3 tabular-nums">{row.won}</td>
              <td className="py-3 text-right pr-3 text-[#6b7280] tabular-nums">{row.drawn}</td>
              <td className="py-3 text-right pr-3 text-[#6b7280] tabular-nums">{row.lost}</td>
              <td className="py-3 text-right pr-3 tabular-nums text-xs">
                <GDCell gd={row.goal_difference} />
              </td>
              <td className="py-3 text-right font-bold tabular-nums">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-6 text-[10px] text-[#374151]">
        Data: football-data.org
      </p>
    </div>
  )
}

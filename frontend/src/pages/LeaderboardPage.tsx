import { useEffect, useState } from 'react'
import { api, USERNAME, type LeaderboardEntry } from '../api'

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getLeaderboard()
      .then(setEntries)
      .catch(() => setError('Could not load leaderboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-[#4b5563] text-sm">Loading…</p>
  if (error) return <p className="text-red-400/80 text-sm">{error}</p>

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">Leaderboard</h1>
      <p className="text-xs text-[#4b5563] mb-8">Season standings — you vs the model</p>

      {!entries.length ? (
        <p className="text-[#6b7280] text-sm">
          No scored matches yet. Submit predictions and record results to see standings.
        </p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-[#4b5563] font-medium border-b border-white/[0.08]">
              <th className="pb-3 pr-4">Player</th>
              <th className="pb-3 text-right pr-4">Pts</th>
              <th className="pb-3 text-right pr-4">Model</th>
              <th className="pb-3 text-right pr-4">Played</th>
              <th className="pb-3 text-right">vs Model</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e, i) => {
              const delta = e.total_user_score - e.total_model_score
              const isYou = e.username === USERNAME
              return (
                <tr
                  key={e.username}
                  className={`border-b border-white/[0.06] ${isYou ? 'text-white' : 'text-[#d1d5db]'}`}
                >
                  <td className="py-4 pr-4">
                    <span className="font-medium">{e.username}</span>
                    {isYou && (
                      <span className="ml-2 text-[10px] text-green-400 uppercase tracking-wide font-medium">
                        you
                      </span>
                    )}
                    {i === 0 && entries.length > 1 && !isYou && (
                      <span className="ml-2 text-[10px] text-[#4b5563]">leading</span>
                    )}
                  </td>
                  <td className="py-4 pr-4 text-right font-mono font-bold">{e.total_user_score}</td>
                  <td className="py-4 pr-4 text-right font-mono text-[#6b7280]">{e.total_model_score}</td>
                  <td className="py-4 pr-4 text-right text-[#6b7280]">{e.matches_played}</td>
                  <td className={`py-4 text-right font-semibold tabular-nums ${
                    delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-[#4b5563]'
                  }`}>
                    {delta > 0 ? '+' : ''}{delta}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      <div className="mt-10 pt-6 border-t border-white/[0.06]">
        <h2 className="text-[10px] uppercase tracking-widest text-[#4b5563] font-medium mb-2">Scoring</h2>
        <ul className="text-xs text-[#6b7280] space-y-1">
          <li><span className="text-white font-medium">3 pts</span> — exact scoreline</li>
          <li><span className="text-white font-medium">2 pts</span> — correct result (win/draw/loss)</li>
          <li><span className="text-white font-medium">0 pts</span> — wrong result</li>
        </ul>
      </div>
    </div>
  )
}

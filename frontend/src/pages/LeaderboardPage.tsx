import { useEffect, useState } from 'react'
import { api, USERNAME, type LeaderboardEntry, type ScoreHistoryEntry } from '../api'

// ---------------------------------------------------------------------------
// Cumulative line chart — pure SVG, no library
// ---------------------------------------------------------------------------

function CumulativeChart({ history }: { history: ScoreHistoryEntry[] }) {
  if (history.length === 0) return null

  const W = 600
  const H = 120
  const PAD = { top: 12, right: 16, bottom: 20, left: 28 }

  // Build cumulative series
  let userCum = 0
  let modelCum = 0
  const points = history.map((h, i) => {
    userCum += h.user_score
    modelCum += h.model_score
    return { i, user: userCum, model: modelCum }
  })

  const maxPts = Math.max(...points.map(p => Math.max(p.user, p.model)), 1)
  const n = points.length

  function xOf(i: number) {
    return PAD.left + (i / Math.max(n - 1, 1)) * (W - PAD.left - PAD.right)
  }
  function yOf(v: number) {
    return PAD.top + (1 - v / maxPts) * (H - PAD.top - PAD.bottom)
  }

  function toPath(pts: { x: number; y: number }[]) {
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  }

  const userPath = toPath(points.map(p => ({ x: xOf(p.i), y: yOf(p.user) })))
  const modelPath = toPath(points.map(p => ({ x: xOf(p.i), y: yOf(p.model) })))

  // Y axis ticks
  const ticks = [0, Math.round(maxPts / 2), maxPts]

  return (
    <div className="mt-10">
      <p className="text-[10px] uppercase tracking-widest text-[#04F5FF] font-medium mb-3">
        Season so far — {n} {n === 1 ? 'match' : 'matches'}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 120 }}
        aria-hidden="true"
      >
        {/* Y axis ticks */}
        {ticks.map(t => (
          <g key={t}>
            <line
              x1={PAD.left} y1={yOf(t)}
              x2={W - PAD.right} y2={yOf(t)}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1"
            />
            <text
              x={PAD.left - 6} y={yOf(t) + 4}
              textAnchor="end" fontSize="9"
              fill="#9D79BC"
            >
              {t}
            </text>
          </g>
        ))}

        {/* X axis match labels */}
        {points.map((p, i) => (
          i % Math.max(1, Math.floor(n / 5)) === 0 && (
            <text
              key={i}
              x={xOf(i)} y={H - 4}
              textAnchor="middle" fontSize="9"
              fill="#9D79BC"
            >
              {i + 1}
            </text>
          )
        ))}

        {/* Model line */}
        <path d={modelPath} fill="none" stroke="#9D79BC" strokeWidth="1.5" strokeDasharray="4 3" />

        {/* User line */}
        <path d={userPath} fill="none" stroke="#00FF85" strokeWidth="2" />

        {/* Dots at end */}
        {points.length > 0 && (() => {
          const last = points[points.length - 1]
          return (
            <>
              <circle cx={xOf(last.i)} cy={yOf(last.user)} r="3" fill="#00FF85" />
              <circle cx={xOf(last.i)} cy={yOf(last.model)} r="3" fill="#9D79BC" />
            </>
          )
        })()}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <span className="w-4 h-[2px] bg-[#00FF85] inline-block rounded" />
          <span className="text-[11px] text-[#9D79BC]">You</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-[2px] bg-[#9D79BC] inline-block rounded" style={{ backgroundImage: 'repeating-linear-gradient(to right, #9D79BC 0, #9D79BC 4px, transparent 4px, transparent 7px)' }} />
          <span className="text-[11px] text-[#9D79BC]">Model</span>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [history, setHistory] = useState<ScoreHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.getLeaderboard(),
      api.getScoreHistory(USERNAME),
    ])
      .then(([lb, hist]) => { setEntries(lb); setHistory(hist) })
      .catch(() => setError('Could not load leaderboard'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-[#6B3F7E] text-sm">Loading…</p>
  if (error) return <p className="text-[#E90052]/80 text-sm">{error}</p>

  // Find your entry and the model aggregate
  const myEntry = entries.find(e => e.username === USERNAME)
  const userPts = myEntry?.total_user_score ?? 0
  const modelPts = myEntry?.total_model_score ?? 0
  const played = myEntry?.matches_played ?? 0

  const userAhead = userPts > modelPts
  const modelAhead = modelPts > userPts

  return (
    <div>
      {/* ------------------------------------------------------------------ */}
      {/* Head-to-head scoreboard — the dominant element                       */}
      {/* ------------------------------------------------------------------ */}
      {!entries.length ? (
        <>
          <h1 className="text-xl font-semibold mb-1">Leaderboard</h1>
          <p className="text-[#9D79BC] text-sm mt-4">
            No scored matches yet. Submit predictions and record results to see standings.
          </p>
        </>
      ) : (
        <>
          <p className="text-[10px] uppercase tracking-widest text-[#04F5FF] font-medium mb-10">
            Season · {played} {played === 1 ? 'match' : 'matches'} played
          </p>

          {/* Scoreboard: You — pts — pts — Model */}
          <div className="flex items-end justify-between gap-4 pb-10 border-b border-white/[0.06]">

            {/* You */}
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-widest text-[#6B3F7E] font-medium mb-3">
                You
              </p>
              <p className={`text-7xl sm:text-8xl font-bold tabular-nums leading-none tracking-tight ${
                userAhead ? 'text-[#00FF85]' : 'text-white'
              }`}>
                {userPts}
              </p>
              {userAhead && (
                <p className="text-[11px] text-[#00FF85] uppercase tracking-widest font-semibold mt-2">
                  Leading ↑
                </p>
              )}
            </div>

            {/* Separator */}
            <div className="flex-shrink-0 self-center pb-3">
              <span className="text-3xl text-[#5c2e6b] font-light select-none">—</span>
            </div>

            {/* Model */}
            <div className="flex-1 text-right">
              <p className="text-[10px] uppercase tracking-widest text-[#6B3F7E] font-medium mb-3">
                Model
              </p>
              <p className={`text-7xl sm:text-8xl font-bold tabular-nums leading-none tracking-tight ${
                modelAhead ? 'text-[#00FF85]' : 'text-[#9D79BC]'
              }`}>
                {modelPts}
              </p>
              {modelAhead && (
                <p className="text-[11px] text-[#00FF85] uppercase tracking-widest font-semibold mt-2">
                  Leading ↑
                </p>
              )}
            </div>

          </div>

          {/* Avg pts per match */}
          {played > 0 && (
            <div className="flex items-center gap-8 mt-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#9D79BC] font-medium">Your avg</p>
                <p className="text-lg font-bold tabular-nums mt-0.5">
                  {(userPts / played).toFixed(2)}
                  <span className="text-xs text-[#9D79BC] font-normal ml-1">pts/match</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-[#9D79BC] font-medium">Model avg</p>
                <p className="text-lg font-bold tabular-nums text-[#9D79BC] mt-0.5">
                  {(modelPts / played).toFixed(2)}
                  <span className="text-xs font-normal ml-1">pts/match</span>
                </p>
              </div>
            </div>
          )}

          {/* Multi-user table (shows when there are other players too) */}
          {entries.length > 1 && (
            <div className="mt-10">
              <p className="text-[10px] uppercase tracking-widest text-[#6B3F7E] font-medium mb-3 border-b border-white/[0.06] pb-3">
                All players
              </p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-widest text-[#6B3F7E] font-medium">
                    <th className="pb-2 pr-4">Player</th>
                    <th className="pb-2 text-right pr-4">Pts</th>
                    <th className="pb-2 text-right pr-4">Model</th>
                    <th className="pb-2 text-right">Δ</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => {
                    const delta = e.total_user_score - e.total_model_score
                    const isYou = e.username === USERNAME
                    return (
                      <tr key={e.username} className={`border-b border-white/[0.04] ${isYou ? 'text-white' : 'text-white/60'}`}>
                        <td className="py-3 pr-4">
                          <span className="font-medium">{e.username}</span>
                          {isYou && <span className="ml-2 text-[10px] text-[#04F5FF] uppercase tracking-wide font-medium">you</span>}
                        </td>
                        <td className="py-3 pr-4 text-right font-bold tabular-nums">{e.total_user_score}</td>
                        <td className="py-3 pr-4 text-right tabular-nums text-[#9D79BC]">{e.total_model_score}</td>
                        <td className={`py-3 text-right font-semibold tabular-nums text-sm ${delta > 0 ? 'text-[#00FF85]' : delta < 0 ? 'text-[#E90052]' : 'text-[#6B3F7E]'}`}>
                          {delta > 0 ? '+' : ''}{delta}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Cumulative chart */}
          <CumulativeChart history={history} />
        </>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Scoring reference — secondary, de-emphasised                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="mt-14 pt-6 border-t border-white/[0.04]">
        <p className="text-[10px] uppercase tracking-widest text-[#6B3F7E] font-medium mb-2">Scoring</p>
        <ul className="text-xs text-[#6B3F7E] space-y-1">
          <li><span className="text-[#9D79BC] font-medium">3 pts</span> — exact scoreline</li>
          <li><span className="text-[#9D79BC] font-medium">2 pts</span> — correct result (win/draw/loss)</li>
          <li><span className="text-[#9D79BC] font-medium">0 pts</span> — wrong result</li>
        </ul>
      </div>
    </div>
  )
}

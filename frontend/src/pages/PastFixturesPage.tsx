import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, USERNAME, type Fixture, type ScoreHistoryEntry } from '../api'
import Crest from '../components/Crest'

function formatDate(iso: string): string {
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ---------------------------------------------------------------------------
// Past fixture row — result + points earned
// ---------------------------------------------------------------------------

function PastRow({
  fixture,
  scoreEntry,
}: {
  fixture: Fixture
  scoreEntry: ScoreHistoryEntry | undefined
}) {
  const pts = scoreEntry?.user_score
  const modelPts = scoreEntry?.model_score

  return (
    <Link to={`/fixtures/${fixture.id}`} className="block group">
      <div className="flex items-center gap-3 py-3.5 border-b border-white/[0.04]
                      group-hover:border-white/[0.12] transition-colors">
        {/* Home crest + name */}
        <Crest team={fixture.home_team} size={7} />
        <span className="text-sm font-medium text-[#9D79BC] truncate w-[18%]">
          {fixture.home_team}
        </span>

        {/* Score */}
        <span className="flex items-center gap-1.5 flex-shrink-0 tabular-nums font-bold text-sm">
          {fixture.actual_home}
          <span className="text-[#5c2e6b] font-light">—</span>
          {fixture.actual_away}
        </span>

        {/* Away name + crest */}
        <span className="text-sm font-medium text-[#9D79BC] truncate w-[18%] text-right">
          {fixture.away_team}
        </span>
        <Crest team={fixture.away_team} size={7} />

        {/* Points + CTA */}
        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
          {pts !== undefined && (
            <span className={`text-[11px] font-semibold tabular-nums ${
              pts > modelPts! ? 'text-[#00FF85]' : pts === modelPts ? 'text-[#9D79BC]' : 'text-[#E90052]'
            }`}>
              {pts}pts
            </span>
          )}
          <span className="text-[11px] text-[#04F5FF]">
            {fixture.gameweek != null ? `GW${fixture.gameweek}` : formatDate(fixture.kickoff_time)}
          </span>
          <span className="text-[11px] font-semibold text-[#9D79BC]
                           opacity-0 group-hover:opacity-100 transition-opacity">
            →
          </span>
        </div>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PastFixturesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      api.getFixtures('completed'),
      api.getScoreHistory(USERNAME),
    ])
      .then(([fx, hist]) => {
        setFixtures(fx.slice().reverse()) // most recent first
        setScoreHistory(hist)
      })
      .catch(() => setError('Could not load past fixtures — is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-[#6B3F7E] text-sm">Loading past fixtures…</p>
  if (error) return <p className="text-[#E90052]/80 text-sm">{error}</p>

  // Index scores by fixture_id
  const scoreByFixture = new Map(scoreHistory.map(s => [s.fixture_id, s]))

  // Group by gameweek
  const byGW = new Map<number | null, Fixture[]>()
  for (const f of fixtures) {
    const key = f.gameweek ?? null
    if (!byGW.has(key)) byGW.set(key, [])
    byGW.get(key)!.push(f)
  }

  // Sort gameweeks descending
  const sortedGWs = [...byGW.keys()].sort((a, b) => {
    if (a === null && b === null) return 0
    if (a === null) return 1
    if (b === null) return -1
    return b - a
  })

  if (!fixtures.length) {
    return (
      <div>
        <Link to="/" className="text-[11px] text-[#6B3F7E] hover:text-[#9D79BC] transition-colors">
          ← Back to fixtures
        </Link>
        <p className="mt-8 text-[#9D79BC] text-sm">No completed fixtures yet.</p>
      </div>
    )
  }

  return (
    <div>
      <Link to="/" className="text-[11px] text-[#6B3F7E] hover:text-[#9D79BC] transition-colors">
        ← Back to fixtures
      </Link>

      <p className="mt-6 text-[10px] uppercase tracking-widest text-[#04F5FF] font-medium mb-8">
        Past fixtures — {fixtures.length} {fixtures.length === 1 ? 'match' : 'matches'}
      </p>

      {sortedGWs.map(gw => (
        <section key={gw ?? 'no-gw'} className="mb-8">
          {gw !== null && (
            <p className="text-[10px] uppercase tracking-widest text-[#9D79BC] font-medium
                           border-b border-white/[0.06] pb-2 mb-0">
              Gameweek {gw}
            </p>
          )}
          {byGW.get(gw)!.map(f => (
            <PastRow key={f.id} fixture={f} scoreEntry={scoreByFixture.get(f.id)} />
          ))}
        </section>
      ))}
    </div>
  )
}

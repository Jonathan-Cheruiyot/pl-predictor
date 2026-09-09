import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Fixture } from '../api'
import Crest from '../components/Crest'

function formatDate(iso: string): string {
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatTime(iso: string): string {
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z')
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

// ---------------------------------------------------------------------------
// Hero — the single nearest upcoming fixture
// ---------------------------------------------------------------------------

function HeroFixture({ fixture }: { fixture: Fixture }) {
  return (
    <Link to={`/fixtures/${fixture.id}`} className="block group">
      <div className="pb-10 border-b border-white/[0.06] group-hover:border-white/[0.15] transition-colors">
        {/* Label + metadata */}
        <div className="flex items-center gap-3 mb-8">
          <p className="text-[10px] uppercase tracking-widest text-[#E90052] font-semibold">
            Next up
          </p>
          <span className="text-[#5c2e6b]">·</span>
          <p className="text-[10px] uppercase tracking-widest text-[#04F5FF] font-medium">
            {fixture.gameweek != null ? `GW${fixture.gameweek} · ` : ''}
            {formatDate(fixture.kickoff_time)} · {formatTime(fixture.kickoff_time)}
          </p>
        </div>

        {/* Three-column: home | vs | away */}
        <div className="flex items-center justify-between gap-4">

          {/* Home */}
          <div className="flex flex-col items-center gap-4 flex-1">
            <Crest team={fixture.home_team} size={16} />
            <span className="text-sm font-semibold text-white text-center leading-tight">
              {fixture.home_team}
            </span>
          </div>

          {/* VS — centre column, clearly between the two teams */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <span className="text-4xl font-light text-[#5c2e6b] leading-none select-none">vs</span>
            <span className="text-[10px] uppercase tracking-widest text-[#E90052] font-semibold
                             opacity-0 group-hover:opacity-100 transition-opacity">
              Predict →
            </span>
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-4 flex-1">
            <Crest team={fixture.away_team} size={16} />
            <span className="text-sm font-semibold text-white text-center leading-tight">
              {fixture.away_team}
            </span>
          </div>

        </div>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Compact upcoming row — matches below the hero
// ---------------------------------------------------------------------------

function UpcomingRow({ fixture }: { fixture: Fixture }) {
  return (
    <Link to={`/fixtures/${fixture.id}`} className="block group">
      <div className="flex items-center gap-3 py-4 border-b border-white/[0.04]
                      group-hover:border-white/[0.12] transition-colors">
        {/* Home team — flex-1, left-aligned */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Crest team={fixture.home_team} size={7} />
          <span className="text-sm font-medium text-white truncate">{fixture.home_team}</span>
        </div>

        {/* VS — center */}
        <span className="text-[#04F5FF]/60 text-xs flex-shrink-0 font-medium">vs</span>

        {/* Away team — flex-1, right-aligned */}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-sm font-medium text-white/70 truncate">{fixture.away_team}</span>
          <Crest team={fixture.away_team} size={7} />
        </div>

        {/* Metadata + CTA */}
        <div className="flex items-center gap-3 flex-shrink-0 ml-1">
          <span className="text-[11px] text-[#04F5FF]">
            {fixture.gameweek != null ? `GW${fixture.gameweek} · ` : ''}
            {formatTime(fixture.kickoff_time)}
          </span>
          <span className="text-[11px] font-semibold text-[#E90052]
                           opacity-0 group-hover:opacity-100 transition-opacity">
            →
          </span>
        </div>
      </div>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Completed fixture row — compact single-line, same scale as upcoming rows
// ---------------------------------------------------------------------------

function CompletedRow({ fixture }: { fixture: Fixture }) {
  return (
    <Link to={`/fixtures/${fixture.id}`} className="block group">
      <div className="flex items-center gap-3 py-3.5 border-b border-white/[0.04]
                      group-hover:border-white/[0.12] transition-colors">
        {/* Home crest + name */}
        <Crest team={fixture.home_team} size={7} />
        <span className="text-sm font-medium text-[#9D79BC] truncate w-[22%]">
          {fixture.home_team}
        </span>

        {/* Score — compact, not dominant */}
        <span className="flex items-center gap-1.5 flex-shrink-0 tabular-nums font-bold text-sm">
          {fixture.actual_home}
          <span className="text-[#5c2e6b] font-light">—</span>
          {fixture.actual_away}
        </span>

        {/* Away name + crest */}
        <span className="text-sm font-medium text-[#9D79BC] truncate w-[22%] text-right">
          {fixture.away_team}
        </span>
        <Crest team={fixture.away_team} size={7} />

        {/* Metadata + hover CTA */}
        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
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

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [visibleGWCount, setVisibleGWCount] = useState(1)

  useEffect(() => {
    api.getFixtures()
      .then(setFixtures)
      .catch(() => setError('Could not load fixtures — is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-[#6B3F7E] text-sm">Loading fixtures…</p>
  if (error) return <p className="text-[#E90052]/80 text-sm">{error}</p>

  const upcoming = fixtures.filter(f => f.status === 'upcoming')
  const completed = fixtures.filter(f => f.status === 'completed')

  if (!fixtures.length) {
    return (
      <div>
        <p className="text-xl font-semibold mb-2">No fixtures scheduled</p>
        <p className="text-[#9D79BC] text-sm">Check back soon for upcoming Premier League fixtures.</p>
      </div>
    )
  }

  // Group upcoming by gameweek (null gameweek goes last)
  const gwMap = new Map<number | null, Fixture[]>()
  for (const f of upcoming) {
    const key = f.gameweek ?? null
    if (!gwMap.has(key)) gwMap.set(key, [])
    gwMap.get(key)!.push(f)
  }

  // Sort gameweeks ascending: numbered first, null last
  const sortedGWs = [...gwMap.keys()].sort((a, b) => {
    if (a === null && b === null) return 0
    if (a === null) return 1
    if (b === null) return -1
    return a - b
  })

  const visibleGWs = sortedGWs.slice(0, visibleGWCount)
  const hasMore = visibleGWCount < sortedGWs.length

  return (
    <div>
      {/* ------------------------------------------------------------------ */}
      {/* Upcoming — gameweek sections with progressive load-more             */}
      {/* ------------------------------------------------------------------ */}
      {upcoming.length > 0 && (
        <div className="mb-14">
          {visibleGWs.map((gw, gwIndex) => {
            const gwFixtures = gwMap.get(gw)!
            const [heroFixture, ...restFixtures] = gwFixtures
            const isFirstGW = gwIndex === 0
            const gwLabel = gw != null ? `Gameweek ${gw}` : 'Upcoming'

            return (
              <section key={gw ?? 'no-gw'} className={gwIndex > 0 ? 'mt-10' : ''}>
                <p className="text-[10px] uppercase tracking-widest text-[#04F5FF] font-medium
                               border-b border-white/[0.06] pb-3 mb-0">
                  {gwLabel} · {gwFixtures.length} {gwFixtures.length === 1 ? 'match' : 'matches'}
                </p>

                {isFirstGW ? (
                  <>
                    {/* Hero — only for the very first fixture of the current GW */}
                    <div className="mt-8 mb-6">
                      <HeroFixture fixture={heroFixture} />
                    </div>
                    {restFixtures.length > 0 && (
                      <div className="sm:ml-6">
                        {restFixtures.map(f => <UpcomingRow key={f.id} fixture={f} />)}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="sm:ml-6 mt-2">
                    {gwFixtures.map(f => <UpcomingRow key={f.id} fixture={f} />)}
                  </div>
                )}
              </section>
            )
          })}

          {/* Load more / end state */}
          <div className="mt-8 flex justify-center">
            {hasMore ? (
              <button
                onClick={() => setVisibleGWCount(c => c + 1)}
                className="text-sm text-[#9D79BC] hover:text-white border border-white/10
                           hover:border-white/30 rounded-full px-6 py-2 transition-colors"
              >
                Load Gameweek {sortedGWs[visibleGWCount] ?? 'next'} →
              </button>
            ) : sortedGWs.length > 1 ? (
              <p className="text-[11px] text-[#6B3F7E]">No more fixtures scheduled</p>
            ) : null}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Results                                                              */}
      {/* ------------------------------------------------------------------ */}
      {completed.length > 0 && (
        <section>
          <p className="text-[10px] uppercase tracking-widest text-[#04F5FF] font-medium
                         border-b border-white/[0.06] pb-3 mb-0">
            Results — {completed.length} {completed.length === 1 ? 'match' : 'matches'}
          </p>
          <div className="mt-2">
            {completed.map(f => <CompletedRow key={f.id} fixture={f} />)}
          </div>
        </section>
      )}
    </div>
  )
}

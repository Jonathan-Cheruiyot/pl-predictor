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
          <p className="text-[10px] uppercase tracking-widest text-[#6B3F7E] font-medium">
            {fixture.gameweek != null ? `GW${fixture.gameweek} · ` : ''}
            {formatDate(fixture.kickoff_time)} · {formatTime(fixture.kickoff_time)}
          </p>
        </div>

        {/* Asymmetric: home crest large left, score/away right */}
        <div className="flex items-center gap-6">
          {/* Home — deliberately larger, left-anchored */}
          <div className="flex flex-col items-center gap-4 flex-shrink-0">
            <Crest team={fixture.home_team} size={20} />
            <span className="text-base font-bold text-white text-center leading-tight max-w-[120px]">
              {fixture.home_team}
            </span>
          </div>

          {/* Right column: vs + away — slightly compressed, offset right */}
          <div className="flex-1 flex flex-col gap-6 pl-4">
            <span className="text-5xl font-light text-[#5c2e6b] leading-none select-none">vs</span>
            <div className="flex flex-col items-start gap-3">
              <Crest team={fixture.away_team} size={14} />
              <span className="text-sm font-semibold text-white/70 leading-tight">
                {fixture.away_team}
              </span>
            </div>
          </div>

          {/* CTA — right edge */}
          <div className="flex-shrink-0 self-end pb-1">
            <span className="text-[11px] uppercase tracking-widest text-[#E90052] font-semibold
                             opacity-0 group-hover:opacity-100 transition-opacity">
              Predict →
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
      <div className="flex items-center gap-4 py-4 border-b border-white/[0.04]
                      group-hover:border-white/[0.12] transition-colors">
        {/* Left: crests + teams */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Crest team={fixture.home_team} size={7} />
          <span className="text-sm font-medium text-white truncate">{fixture.home_team}</span>
          <span className="text-[#5c2e6b] text-xs flex-shrink-0">vs</span>
          <Crest team={fixture.away_team} size={7} />
          <span className="text-sm font-medium text-white/70 truncate">{fixture.away_team}</span>
        </div>

        {/* Right: metadata + CTA */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="text-[11px] text-[#6B3F7E]">
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
// Completed fixture row
// ---------------------------------------------------------------------------

function CompletedCard({ fixture }: { fixture: Fixture }) {
  return (
    <Link to={`/fixtures/${fixture.id}`} className="block group">
      <div className="py-6 border-b border-white/[0.06] transition-colors group-hover:border-white/[0.15]">
        {/* Metadata row */}
        <div className="flex items-center gap-2 mb-4 text-[10px] uppercase tracking-widest text-[#6B3F7E] font-medium">
          {fixture.gameweek != null && <span>GW{fixture.gameweek}</span>}
          {fixture.gameweek != null && <span>·</span>}
          <span>{formatDate(fixture.kickoff_time)}</span>
          <span>·</span>
          <span className="text-[#5c2e6b]">Full time</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Home */}
          <div className="flex flex-col items-center gap-2 w-[38%]">
            <Crest team={fixture.home_team} size={11} />
            <span className="text-xs font-medium text-[#9D79BC] text-center leading-tight">
              {fixture.home_team}
            </span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold tabular-nums leading-none">{fixture.actual_home}</span>
              <span className="text-lg text-[#5c2e6b] font-light select-none">—</span>
              <span className="text-3xl font-bold tabular-nums leading-none">{fixture.actual_away}</span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[#9D79BC]
                             opacity-0 group-hover:opacity-100 transition-opacity font-medium mt-0.5">
              Review →
            </span>
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-2 w-[38%]">
            <Crest team={fixture.away_team} size={11} />
            <span className="text-xs font-medium text-[#9D79BC] text-center leading-tight">
              {fixture.away_team}
            </span>
          </div>
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
        <p className="text-xl font-semibold mb-2">No fixtures yet</p>
        <p className="text-[#9D79BC] text-sm">
          Run{' '}
          <code className="text-white/70 bg-white/5 px-1.5 py-0.5 rounded text-xs">python seed.py</code>
          {' '}in the backend directory to add some.
        </p>
      </div>
    )
  }

  const [heroFixture, ...restUpcoming] = upcoming

  return (
    <div>
      {/* ------------------------------------------------------------------ */}
      {/* Upcoming — hero + compact list                                       */}
      {/* ------------------------------------------------------------------ */}
      {upcoming.length > 0 && (
        <section className="mb-14">
          <p className="text-[10px] uppercase tracking-widest text-[#6B3F7E] font-medium
                         border-b border-white/[0.06] pb-3 mb-0">
            Upcoming — {upcoming.length} {upcoming.length === 1 ? 'match' : 'matches'}
          </p>

          {/* Hero */}
          <div className="mt-8 mb-6">
            <HeroFixture fixture={heroFixture} />
          </div>

          {/* Rest — compact, pushed slightly right for asymmetric rhythm */}
          {restUpcoming.length > 0 && (
            <div className="sm:ml-6">
              {restUpcoming.map(f => <UpcomingRow key={f.id} fixture={f} />)}
            </div>
          )}
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Results                                                              */}
      {/* ------------------------------------------------------------------ */}
      {completed.length > 0 && (
        <section>
          <p className="text-[10px] uppercase tracking-widest text-[#6B3F7E] font-medium
                         border-b border-white/[0.06] pb-3 mb-0">
            Results — {completed.length} {completed.length === 1 ? 'match' : 'matches'}
          </p>
          <div className="mt-2">
            {completed.map(f => <CompletedCard key={f.id} fixture={f} />)}
          </div>
        </section>
      )}
    </div>
  )
}

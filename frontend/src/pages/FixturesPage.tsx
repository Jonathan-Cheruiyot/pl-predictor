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
// Upcoming fixture card
// ---------------------------------------------------------------------------

function UpcomingCard({ fixture }: { fixture: Fixture }) {
  return (
    <Link
      to={`/fixtures/${fixture.id}`}
      className="block group"
    >
      <div className="py-7 border-b border-white/[0.06] transition-colors group-hover:border-white/[0.12]">
        {/* Metadata row */}
        <div className="flex items-center gap-2 mb-5 text-[10px] uppercase tracking-widest text-[#4b5563] font-medium">
          {fixture.gameweek != null && <span>GW{fixture.gameweek}</span>}
          {fixture.gameweek != null && <span>·</span>}
          <span>{formatDate(fixture.kickoff_time)}</span>
          <span>·</span>
          <span>{formatTime(fixture.kickoff_time)}</span>
        </div>

        {/* Match layout: home · vs · away */}
        <div className="flex items-center justify-between gap-4">

          {/* Home */}
          <div className="flex flex-col items-center gap-3 w-[38%]">
            <Crest team={fixture.home_team} size={13} />
            <span className="text-sm font-semibold text-white text-center leading-tight">
              {fixture.home_team}
            </span>
          </div>

          {/* Center */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <span className="text-2xl font-light text-[#374151] select-none">vs</span>
            <span className="text-[10px] uppercase tracking-widest text-green-400 font-semibold
                             opacity-0 group-hover:opacity-100 transition-opacity">
              Predict →
            </span>
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-3 w-[38%]">
            <Crest team={fixture.away_team} size={13} />
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
// Completed fixture card
// ---------------------------------------------------------------------------

function CompletedCard({ fixture }: { fixture: Fixture }) {
  return (
    <Link
      to={`/fixtures/${fixture.id}`}
      className="block group"
    >
      <div className="py-7 border-b border-white/[0.06] transition-colors group-hover:border-white/[0.12]">
        {/* Metadata row */}
        <div className="flex items-center gap-2 mb-5 text-[10px] uppercase tracking-widest text-[#4b5563] font-medium">
          {fixture.gameweek != null && <span>GW{fixture.gameweek}</span>}
          {fixture.gameweek != null && <span>·</span>}
          <span>{formatDate(fixture.kickoff_time)}</span>
          <span>·</span>
          <span className="text-[#374151]">Full time</span>
        </div>

        {/* Match layout: home · score · away */}
        <div className="flex items-center justify-between gap-4">

          {/* Home */}
          <div className="flex flex-col items-center gap-3 w-[38%]">
            <Crest team={fixture.home_team} size={13} />
            <span className="text-sm font-medium text-[#9ca3af] text-center leading-tight">
              {fixture.home_team}
            </span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold tabular-nums leading-none">
                {fixture.actual_home}
              </span>
              <span className="text-xl text-[#374151] font-light select-none">—</span>
              <span className="text-4xl font-bold tabular-nums leading-none">
                {fixture.actual_away}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[#374151]
                             opacity-0 group-hover:opacity-100 transition-opacity font-medium mt-1">
              Review →
            </span>
          </div>

          {/* Away */}
          <div className="flex flex-col items-center gap-3 w-[38%]">
            <Crest team={fixture.away_team} size={13} />
            <span className="text-sm font-medium text-[#9ca3af] text-center leading-tight">
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

  if (loading) return <p className="text-[#4b5563] text-sm">Loading fixtures…</p>
  if (error) return <p className="text-red-400/80 text-sm">{error}</p>

  const upcoming = fixtures.filter(f => f.status === 'upcoming')
  const completed = fixtures.filter(f => f.status === 'completed')

  if (!fixtures.length) {
    return (
      <div>
        <p className="text-xl font-semibold mb-2">No fixtures yet</p>
        <p className="text-[#6b7280] text-sm">
          Run{' '}
          <code className="text-[#a0a0a0] bg-white/5 px-1.5 py-0.5 rounded text-xs">
            python seed.py
          </code>{' '}
          in the backend directory to add some.
        </p>
      </div>
    )
  }

  return (
    <div>
      {upcoming.length > 0 && (
        <section>
          <p className="text-[10px] uppercase tracking-widest text-[#4b5563] font-medium mb-1 border-b border-white/[0.06] pb-3">
            Upcoming — {upcoming.length} {upcoming.length === 1 ? 'match' : 'matches'}
          </p>
          {upcoming.map(f => <UpcomingCard key={f.id} fixture={f} />)}
        </section>
      )}

      {completed.length > 0 && (
        <section className={upcoming.length > 0 ? 'mt-14' : ''}>
          <p className="text-[10px] uppercase tracking-widest text-[#4b5563] font-medium mb-1 border-b border-white/[0.06] pb-3">
            Results — {completed.length} {completed.length === 1 ? 'match' : 'matches'}
          </p>
          {completed.map(f => <CompletedCard key={f.id} fixture={f} />)}
        </section>
      )}
    </div>
  )
}

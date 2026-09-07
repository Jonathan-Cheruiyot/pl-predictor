import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Fixture } from '../api'
import TeamBadge from '../components/TeamBadge'

function formatKickoff(iso: string): string {
  // DB stores naive UTC — append Z so browsers parse correctly
  const d = new Date(iso.endsWith('Z') ? iso : iso + 'Z')
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }) + ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function FixtureRow({ fixture }: { fixture: Fixture }) {
  const isCompleted = fixture.status === 'completed'

  return (
    <li className="group py-5 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        {fixture.gameweek != null && (
          <p className="text-[10px] uppercase tracking-widest text-[#4b5563] mb-1.5 font-medium">
            GW{fixture.gameweek}
          </p>
        )}
        <div className="flex items-center gap-3 flex-wrap">
          <TeamBadge team={fixture.home_team} size="sm" className="font-medium" />
          <span className="text-[#4b5563] text-xs">vs</span>
          <TeamBadge team={fixture.away_team} size="sm" className="font-medium" />
        </div>
        <p className="text-[11px] text-[#4b5563] mt-1.5">{formatKickoff(fixture.kickoff_time)}</p>
      </div>

      {isCompleted ? (
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="font-mono font-bold text-sm tabular-nums">
            {fixture.actual_home} — {fixture.actual_away}
          </span>
          <Link
            to={`/fixtures/${fixture.id}`}
            className="text-[11px] text-[#6b7280] hover:text-white border border-white/10 hover:border-white/25 rounded-md px-3 py-1.5 transition-colors"
          >
            Review
          </Link>
        </div>
      ) : (
        <Link
          to={`/fixtures/${fixture.id}`}
          className="flex-shrink-0 text-[11px] font-medium text-green-400 hover:text-green-300 border border-green-400/30 hover:border-green-400/60 rounded-md px-3 py-1.5 transition-all"
        >
          Predict →
        </Link>
      )}
    </li>
  )
}

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

  if (loading) {
    return <p className="text-[#4b5563] text-sm">Loading fixtures…</p>
  }
  if (error) {
    return <p className="text-red-400/80 text-sm">{error}</p>
  }

  const upcoming = fixtures.filter(f => f.status === 'upcoming')
  const completed = fixtures.filter(f => f.status === 'completed')

  if (!fixtures.length) {
    return (
      <div>
        <h1 className="text-xl font-semibold mb-2">No fixtures yet</h1>
        <p className="text-[#6b7280] text-sm">
          Run <code className="text-[#a0a0a0] bg-white/5 px-1.5 py-0.5 rounded text-xs">python seed.py</code> in the backend directory to add some.
        </p>
      </div>
    )
  }

  return (
    <div>
      {upcoming.length > 0 && (
        <section>
          <h2 className="text-[10px] uppercase tracking-widest text-[#4b5563] font-medium mb-1">
            Upcoming
          </h2>
          <ul className="divide-y divide-white/[0.06]">
            {upcoming.map(f => <FixtureRow key={f.id} fixture={f} />)}
          </ul>
        </section>
      )}

      {completed.length > 0 && (
        <section className={upcoming.length > 0 ? 'mt-10' : ''}>
          <h2 className="text-[10px] uppercase tracking-widest text-[#4b5563] font-medium mb-1">
            Completed
          </h2>
          <ul className="divide-y divide-white/[0.06]">
            {completed.map(f => <FixtureRow key={f.id} fixture={f} />)}
          </ul>
        </section>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, USERNAME, type Fixture, type LeaderboardEntry, type ModelPrediction, type UserPrediction } from '../api'
import { getTeamColor } from '../teams'
import Crest from '../components/Crest'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Phase =
  | { type: 'loading' }
  | { type: 'form'; fixture: Fixture }
  | { type: 'submitting'; fixture: Fixture }
  | { type: 'reveal'; fixture: Fixture; userPred: UserPrediction; modelPred: ModelPrediction | null; seasonTotals: LeaderboardEntry | null }
  | { type: 'error'; message: string }

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Spinner() {
  return (
    <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-green-400 rounded-full animate-spin" />
  )
}


function MatchHeader({ fixture }: { fixture: Fixture }) {
  const kickoff = new Date(
    fixture.kickoff_time.endsWith('Z') ? fixture.kickoff_time : fixture.kickoff_time + 'Z'
  )
  const dateStr = kickoff.toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
  const timeStr = kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="mb-10">
      <Link to="/" className="text-[11px] text-[#4b5563] hover:text-[#9ca3af] transition-colors">
        ← Back to fixtures
      </Link>
      <div className="mt-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-[#4b5563] font-medium">
        {fixture.gameweek != null && <span>GW{fixture.gameweek}</span>}
        {fixture.gameweek != null && <span>·</span>}
        <span>{dateStr}</span>
        <span>·</span>
        <span>{timeStr}</span>
        {fixture.status === 'completed' && (
          <>
            <span>·</span>
            <span className="text-[#6b7280]">Full time</span>
          </>
        )}
      </div>
      <h1 className="mt-3 flex items-center gap-3 text-xl font-semibold tracking-tight">
        <Crest team={fixture.home_team} size={6} />
        <span>{fixture.home_team}</span>
        <span className="text-[#4b5563] font-normal text-lg">vs</span>
        <Crest team={fixture.away_team} size={6} />
        <span>{fixture.away_team}</span>
      </h1>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Score stepper (prediction form)
// ---------------------------------------------------------------------------

interface StepperProps {
  team: string
  value: number
  onChange: (v: number) => void
}

function ScoreStepper({ team, value, onChange }: StepperProps) {
  const btnClass =
    'w-9 h-9 rounded-full border border-white/15 hover:border-white/40 text-[#9ca3af] hover:text-white transition-all flex items-center justify-center text-lg leading-none select-none'

  return (
    <div className="flex flex-col items-center gap-3">
      <Crest team={team} size={12} />
      <span className="text-[11px] text-[#6b7280] font-medium text-center max-w-[80px] truncate">
        {team}
      </span>
      <div className="flex items-center gap-4 mt-1">
        <button
          className={btnClass}
          onClick={() => onChange(Math.max(0, value - 1))}
          aria-label={`Decrease ${team} goals`}
        >
          −
        </button>
        <span className="text-7xl font-bold tabular-nums w-20 text-center leading-none">
          {value}
        </span>
        <button
          className={btnClass}
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${team} goals`}
        >
          +
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Prediction form
// ---------------------------------------------------------------------------

interface FormProps {
  fixture: Fixture
  onSubmit: (home: number, away: number) => void
}

function PredictionForm({ fixture, onSubmit }: FormProps) {
  const [home, setHome] = useState(0)
  const [away, setAway] = useState(0)

  return (
    <div>
      <p className="text-xs text-[#4b5563] mb-10">
        Playing as{' '}
        <span className="text-[#9ca3af] font-medium">{USERNAME}</span>
      </p>

      <div className="flex items-center justify-center gap-6">
        <ScoreStepper team={fixture.home_team} value={home} onChange={setHome} />
        <span className="text-3xl text-[#4b5563] mb-2 font-light select-none">—</span>
        <ScoreStepper team={fixture.away_team} value={away} onChange={setAway} />
      </div>

      <div className="mt-12 flex justify-center">
        <button
          onClick={() => onSubmit(home, away)}
          className="px-8 py-3 rounded-full bg-green-500 hover:bg-green-400 text-black text-sm font-semibold transition-colors"
        >
          Lock in prediction
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Model reveal panel
// ---------------------------------------------------------------------------

/** Crest · score · crest layout — Immortals-inspired, for prediction cards */
function PredictionScore({
  homeTeam, awayTeam, homeGoals, awayGoals,
}: {
  homeTeam: string; awayTeam: string; homeGoals: number; awayGoals: number
}) {
  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Crests row */}
      <div className="flex items-center justify-between w-full px-1">
        <div className="flex flex-col items-center gap-2">
          <Crest team={homeTeam} size={9} />
          <span className="text-[10px] text-[#6b7280] text-center leading-tight max-w-[60px] truncate">
            {homeTeam}
          </span>
        </div>

        {/* Score */}
        <div className="flex items-center gap-1.5">
          <span className="text-4xl font-bold tabular-nums leading-none">{homeGoals}</span>
          <span className="text-xl text-[#374151] font-light select-none">—</span>
          <span className="text-4xl font-bold tabular-nums leading-none">{awayGoals}</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Crest team={awayTeam} size={9} />
          <span className="text-[10px] text-[#6b7280] text-center leading-tight max-w-[60px] truncate">
            {awayTeam}
          </span>
        </div>
      </div>
    </div>
  )
}

function WinBar({ p_home_win, p_draw, p_away_win, homeTeam, awayTeam }: {
  p_home_win: number
  p_draw: number
  p_away_win: number
  homeTeam: string
  awayTeam: string
}) {
  const { primary: homeColor } = getTeamColor(homeTeam)
  const { primary: awayColor } = getTeamColor(awayTeam)
  const fmt = (n: number) => `${Math.round(n * 100)}%`

  return (
    <div className="mt-4">
      <div className="flex rounded-full overflow-hidden h-1.5 gap-px">
        <div style={{ width: fmt(p_home_win), backgroundColor: homeColor }} />
        <div style={{ width: fmt(p_draw), backgroundColor: '#4b5563' }} />
        <div style={{ width: fmt(p_away_win), backgroundColor: awayColor }} />
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-[#4b5563]">
        <span>{fmt(p_home_win)}</span>
        <span>Draw {fmt(p_draw)}</span>
        <span>{fmt(p_away_win)}</span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Full time score — Immortals-inspired: dominant score, no card, breathing room
// ---------------------------------------------------------------------------

function FullTimeScore({ fixture }: { fixture: Fixture }) {
  return (
    <div className="mt-10 mb-2 px-1">
      <p className="text-[10px] uppercase tracking-widest text-[#4b5563] mb-8 font-medium text-center">
        Full time
      </p>
      <div className="flex items-center justify-between gap-4">

        {/* Home team — crest above, name below */}
        <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
          <Crest team={fixture.home_team} size={14} />
          <span className="text-sm font-medium text-[#d1d5db] text-center leading-tight">
            {fixture.home_team}
          </span>
        </div>

        {/* Score — dominant */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-8xl font-bold tabular-nums leading-none tracking-tight">
            {fixture.actual_home}
          </span>
          <span className="text-3xl text-[#374151] font-light select-none">—</span>
          <span className="text-8xl font-bold tabular-nums leading-none tracking-tight">
            {fixture.actual_away}
          </span>
        </div>

        {/* Away team */}
        <div className="flex flex-col items-center gap-3 flex-1 min-w-0">
          <Crest team={fixture.away_team} size={14} />
          <span className="text-sm font-medium text-[#d1d5db] text-center leading-tight">
            {fixture.away_team}
          </span>
        </div>

      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Season totals
// ---------------------------------------------------------------------------

function SeasonTotals({ totals }: { totals: LeaderboardEntry }) {
  const userAhead = totals.total_user_score > totals.total_model_score
  const modelAhead = totals.total_model_score > totals.total_user_score

  return (
    <div className="mt-5 p-5 bg-[#141414] border border-white/[0.08] rounded-xl">
      <p className="text-[10px] uppercase tracking-widest text-[#4b5563] mb-4 font-medium">
        Season — {totals.matches_played} {totals.matches_played === 1 ? 'match' : 'matches'}
      </p>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-center">
          <p className="text-[10px] uppercase tracking-widest text-[#4b5563] mb-1.5">You</p>
          <p className={`text-3xl font-bold tabular-nums ${userAhead ? 'text-green-400' : 'text-white'}`}>
            {totals.total_user_score}
          </p>
          {userAhead && <p className="text-[10px] text-green-400 mt-1">leading</p>}
        </div>
        <div className="text-[#4b5563] text-sm font-light select-none">vs</div>
        <div className="flex-1 text-center">
          <p className="text-[10px] uppercase tracking-widest text-[#4b5563] mb-1.5">Model</p>
          <p className={`text-3xl font-bold tabular-nums ${modelAhead ? 'text-green-400' : 'text-[#6b7280]'}`}>
            {totals.total_model_score}
          </p>
          {modelAhead && <p className="text-[10px] text-green-400 mt-1">leading</p>}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

interface RevealProps {
  fixture: Fixture
  userPred: UserPrediction
  modelPred: ModelPrediction | null
  seasonTotals: LeaderboardEntry | null
}

function RevealPanel({ fixture, userPred, modelPred, seasonTotals }: RevealProps) {
  const [flipped, setFlipped] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // Brief pause so the user can register their own prediction before the model flips
    timerRef.current = setTimeout(() => setFlipped(true), 700)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const isCompleted = fixture.status === 'completed'

  return (
    <div>
      <div className="grid grid-cols-2 gap-4" style={{ perspective: '1200px' }}>
        {/* ---- Your prediction ---- */}
        <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-[#4b5563] mb-5 font-medium">
            Your call
          </p>
          <PredictionScore
            homeTeam={fixture.home_team}
            awayTeam={fixture.away_team}
            homeGoals={userPred.predicted_home}
            awayGoals={userPred.predicted_away}
          />
        </div>

        {/* ---- Model prediction (flip card) ---- */}
        <div className="relative" style={{ minHeight: '160px' }}>
          <div className={`flip-card-inner h-full ${flipped ? 'flipped' : ''}`}>
            {/* Front face — shown before flip */}
            <div className="flip-card-face bg-[#141414] border border-white/[0.08] p-5 flex flex-col items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white/10 border-t-green-400 rounded-full animate-spin" />
              <p className="text-[10px] uppercase tracking-widest text-[#4b5563] font-medium">
                Model
              </p>
            </div>

            {/* Back face — revealed after flip */}
            <div className="flip-card-face flip-card-back bg-[#141414] border border-green-400/25 p-5">
              <p className="text-[10px] uppercase tracking-widest text-green-400 mb-5 font-medium">
                The model
              </p>
              {modelPred ? (
                <>
                  <PredictionScore
                    homeTeam={fixture.home_team}
                    awayTeam={fixture.away_team}
                    homeGoals={modelPred.predicted_home}
                    awayGoals={modelPred.predicted_away}
                  />
                  <WinBar
                    p_home_win={modelPred.p_home_win}
                    p_draw={modelPred.p_draw}
                    p_away_win={modelPred.p_away_win}
                    homeTeam={fixture.home_team}
                    awayTeam={fixture.away_team}
                  />
                </>
              ) : (
                <p className="text-xs text-[#6b7280]">Unavailable</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actual result (completed matches) */}
      {isCompleted && fixture.actual_home != null && (
        <FullTimeScore fixture={fixture} />
      )}

      {!isCompleted && (
        <p className="mt-5 text-xs text-[#4b5563] text-center">
          Result will appear here once the match is played.
        </p>
      )}

      {isCompleted && seasonTotals && <SeasonTotals totals={seasonTotals} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function PredictionPage() {
  const { id } = useParams<{ id: string }>()
  const [phase, setPhase] = useState<Phase>({ type: 'loading' })

  useEffect(() => {
    if (!id) return
    const fixtureId = parseInt(id)

    Promise.all([
      api.getFixture(fixtureId),
      api.getUserPrediction(fixtureId),
    ])
      .then(async ([fixture, userPred]) => {
        if (userPred) {
          const [modelPred, leaderboard] = await Promise.all([
            api.getModelPrediction(fixtureId),
            fixture.status === 'completed' ? api.getLeaderboard() : Promise.resolve([]),
          ])
          const seasonTotals = leaderboard.find(e => e.username === USERNAME) ?? null
          setPhase({ type: 'reveal', fixture, userPred, modelPred, seasonTotals })
        } else {
          setPhase({ type: 'form', fixture })
        }
      })
      .catch(err => setPhase({ type: 'error', message: err.message ?? 'Failed to load fixture' }))
  }, [id])

  async function handleSubmit(home: number, away: number) {
    if (phase.type !== 'form') return
    const { fixture } = phase
    setPhase({ type: 'submitting', fixture })

    try {
      const userPred = await api.submitPrediction(parseInt(id!), home, away)
      const modelPred = await api.getModelPrediction(parseInt(id!))
      setPhase({ type: 'reveal', fixture, userPred, modelPred, seasonTotals: null })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed'
      setPhase({ type: 'error', message: msg })
    }
  }

  if (phase.type === 'error') {
    return (
      <div>
        <Link to="/" className="text-[11px] text-[#4b5563] hover:text-[#9ca3af] transition-colors">
          ← Back
        </Link>
        <p className="mt-6 text-red-400/80 text-sm">{phase.message}</p>
      </div>
    )
  }

  if (phase.type === 'loading') {
    return <p className="text-[#4b5563] text-sm">Loading…</p>
  }

  if (phase.type === 'submitting') {
    return (
      <div>
        <MatchHeader fixture={phase.fixture} />
        <div className="flex items-center justify-center gap-3 py-16 text-[#6b7280] text-sm">
          <Spinner />
          Locking in your prediction…
        </div>
      </div>
    )
  }

  const fixture = phase.fixture

  return (
    <div>
      <MatchHeader fixture={fixture} />
      {phase.type === 'form' && (
        <PredictionForm fixture={fixture} onSubmit={handleSubmit} />
      )}
      {phase.type === 'reveal' && (
        <RevealPanel
          fixture={fixture}
          userPred={phase.userPred}
          modelPred={phase.modelPred}
          seasonTotals={phase.seasonTotals}
        />
      )}
    </div>
  )
}

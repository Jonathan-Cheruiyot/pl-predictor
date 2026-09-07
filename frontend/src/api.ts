const API_URL = '/api'

export const USERNAME = 'jonathan'

export interface Fixture {
  id: number
  home_team: string
  away_team: string
  kickoff_time: string
  gameweek: number | null
  status: 'upcoming' | 'completed'
  actual_home: number | null
  actual_away: number | null
}

export interface ModelPrediction {
  fixture_id: number
  predicted_home: number
  predicted_away: number
  p_home_win: number
  p_draw: number
  p_away_win: number
}

export interface UserPrediction {
  id: number
  fixture_id: number
  username: string
  predicted_home: number
  predicted_away: number
  submitted_at: string
}

export interface LeaderboardEntry {
  username: string
  total_user_score: number
  total_model_score: number
  matches_played: number
}

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${API_URL}${path}`)
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
  return r.json()
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }))
    throw new Error(err.detail ?? r.statusText)
  }
  return r.json()
}

export interface StandingEntry {
  position: number
  team_id: number
  team_name: string
  team_short: string
  crest_url: string
  played: number
  won: number
  drawn: number
  lost: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
}

export interface SquadPlayer {
  name: string
  number: string
  position: string
  nationality: string
}

export const api = {
  getFixtures: (status?: string): Promise<Fixture[]> =>
    get(`/fixtures${status ? `?status=${status}` : ''}`),

  getFixture: (id: number): Promise<Fixture> =>
    get(`/fixtures/${id}`),

  submitPrediction: (fixtureId: number, home: number, away: number): Promise<UserPrediction> =>
    post(`/fixtures/${fixtureId}/user-prediction`, {
      username: USERNAME,
      predicted_home: home,
      predicted_away: away,
    }),

  getUserPrediction: async (fixtureId: number): Promise<UserPrediction | null> => {
    const r = await fetch(`${API_URL}/fixtures/${fixtureId}/user-prediction/${USERNAME}`)
    if (r.status === 404) return null
    if (!r.ok) throw new Error(r.statusText)
    return r.json()
  },

  getModelPrediction: async (fixtureId: number): Promise<ModelPrediction | null> => {
    const r = await fetch(`${API_URL}/fixtures/${fixtureId}/model-prediction?username=${USERNAME}`)
    if (r.status === 403) return null
    if (!r.ok) throw new Error(r.statusText)
    return r.json()
  },

  getLeaderboard: (): Promise<LeaderboardEntry[]> =>
    get('/leaderboard'),

  getStandings: (): Promise<StandingEntry[]> =>
    get('/league/standings'),

  getSquad: (teamShort: string): Promise<SquadPlayer[]> =>
    get(`/league/team/${encodeURIComponent(teamShort)}/squad`),
}

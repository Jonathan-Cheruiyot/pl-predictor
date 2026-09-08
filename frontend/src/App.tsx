import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import FixturesPage from './pages/FixturesPage'
import PredictionPage from './pages/PredictionPage'
import LeaderboardPage from './pages/LeaderboardPage'
import LeaguePage from './pages/LeaguePage'
import TeamPage from './pages/TeamPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#38003C] text-white font-sans antialiased">
        <Nav />
        <main className="mx-auto max-w-2xl px-4 py-10">
          <Routes>
            <Route path="/" element={<FixturesPage />} />
            <Route path="/fixtures/:id" element={<PredictionPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/league" element={<LeaguePage />} />
            <Route path="/team/:teamShort" element={<TeamPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

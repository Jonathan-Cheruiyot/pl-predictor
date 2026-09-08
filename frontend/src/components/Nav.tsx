import { Link, useLocation } from 'react-router-dom'

export default function Nav() {
  const { pathname } = useLocation()

  const linkClass = (path: string) =>
    `text-sm transition-colors ${
      pathname === path || pathname.startsWith(path + '/')
        ? 'text-[#04F5FF]'
        : 'text-[#9D79BC] hover:text-white'
    }`

  return (
    <header className="border-b border-white/[0.08] px-4">
      <div className="mx-auto max-w-2xl flex items-center justify-between h-14">
        <Link to="/" className="font-semibold tracking-tight text-white text-sm">
          PL Predictor
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/" className={linkClass('/')}>Fixtures</Link>
          <Link to="/league" className={linkClass('/league')}>Table</Link>
          <Link to="/leaderboard" className={linkClass('/leaderboard')}>Leaderboard</Link>
        </nav>
      </div>
    </header>
  )
}

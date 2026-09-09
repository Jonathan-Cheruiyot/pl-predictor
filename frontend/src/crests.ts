/**
 * Resolves team crest URLs from football-data.org via the backend.
 * Fetches once, caches for the lifetime of the page session.
 *
 * Our CSV team names don't always match football-data short names exactly,
 * so we try: exact → manual overrides → token overlap fallback.
 */

// Manual overrides for known mismatches between our CSV names and fd.org short names
const OVERRIDES: Record<string, string> = {
  'Brighton':       'Brighton Hove',
  "Nott'm Forest":  'Nottingham',
  'Nottm Forest':   'Nottingham',
  'Leeds':          'Leeds United',
  'Ipswich':        'Ipswich Town',
  'West Brom':      'West Bromwich',
}

let _cache: Promise<Record<string, string>> | null = null

function fetchCrests(): Promise<Record<string, string>> {
  if (!_cache) {
    _cache = fetch('/api/league/crests')
      .then(r => r.ok ? r.json() : {})
      .catch(() => ({}))
  }
  return _cache
}

// Pre-warm on module load
fetchCrests()

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(a.toLowerCase().split(/\s+/))
  const tb = new Set(b.toLowerCase().split(/\s+/))
  let count = 0
  for (const t of ta) if (tb.has(t)) count++
  return count
}

export async function getCrestUrl(csvName: string): Promise<string | null> {
  const crests = await fetchCrests()
  if (!Object.keys(crests).length) return null

  // 1. Exact match
  if (crests[csvName]) return crests[csvName]

  // 2. Manual override
  const overridden = OVERRIDES[csvName]
  if (overridden && crests[overridden]) return crests[overridden]

  // 3. Token overlap — pick the short name with the most words in common
  let best: string | null = null
  let bestScore = 0
  for (const shortName of Object.keys(crests)) {
    const score = tokenOverlap(csvName, shortName)
    if (score > bestScore) { bestScore = score; best = shortName }
  }
  return bestScore > 0 && best ? crests[best] : null
}

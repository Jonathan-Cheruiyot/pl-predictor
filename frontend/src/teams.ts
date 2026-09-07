// Primary and secondary colors for PL teams (football-data.co.uk name format)
const TEAM_COLORS: Record<string, { primary: string; secondary: string }> = {
  Arsenal:          { primary: '#EF0107', secondary: '#063672' },
  'Aston Villa':    { primary: '#670E36', secondary: '#95BFE5' },
  Brentford:        { primary: '#E30613', secondary: '#FFFFFF' },
  Brighton:         { primary: '#0057B8', secondary: '#FFCD00' },
  Bournemouth:      { primary: '#DA291C', secondary: '#231F20' },
  Burnley:          { primary: '#6C1D45', secondary: '#99D6EA' },
  Chelsea:          { primary: '#034694', secondary: '#DBA111' },
  'Crystal Palace': { primary: '#1B458F', secondary: '#C4122E' },
  Everton:          { primary: '#003399', secondary: '#FFFFFF' },
  Fulham:           { primary: '#CC0000', secondary: '#000000' },
  Ipswich:          { primary: '#0000FF', secondary: '#FFFFFF' },
  Leeds:            { primary: '#1D428A', secondary: '#FFCD00' },
  Leicester:        { primary: '#003090', secondary: '#FDBE11' },
  Liverpool:        { primary: '#C8102E', secondary: '#F6EB61' },
  Luton:            { primary: '#F78F1E', secondary: '#003882' },
  'Man City':       { primary: '#6CABDD', secondary: '#1C2C5B' },
  'Man United':     { primary: '#DA291C', secondary: '#FBE122' },
  Middlesbrough:    { primary: '#E03A3E', secondary: '#FFFFFF' },
  Newcastle:        { primary: '#241F20', secondary: '#FFFFFF' },
  'Nottm Forest':   { primary: '#DD0000', secondary: '#FFFFFF' },
  'Sheffield United': { primary: '#EC2227', secondary: '#FFFFFF' },
  Southampton:      { primary: '#D71920', secondary: '#FFFFFF' },
  Sunderland:       { primary: '#EB172B', secondary: '#231F20' },
  Tottenham:        { primary: '#132257', secondary: '#FFFFFF' },
  Watford:          { primary: '#FBEE23', secondary: '#110736' },
  'West Ham':       { primary: '#7A263A', secondary: '#1BB1E7' },
  Wolves:           { primary: '#FDB913', secondary: '#231F20' },
}

export function getTeamColor(team: string): { primary: string; secondary: string } {
  return TEAM_COLORS[team] ?? { primary: '#6b7280', secondary: '#ffffff' }
}

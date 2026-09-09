"""
Maps football-data.org shortName values to the team names used in the
training CSV files (football-data.co.uk naming convention).

Only entries that actually differ need to be listed here.
"""

FD_TO_MODEL: dict[str, str] = {
    # Nottingham Forest — CSVs use "Nott'm Forest" (with apostrophe)
    "Nott'm Forest":  "Nott'm Forest",  # already correct, harmless
    "Nottm Forest":   "Nott'm Forest",  # common alternate without apostrophe
    "Nottingham":     "Nott'm Forest",  # fd.org shortName

    # Ipswich — fd.org uses "Ipswich Town", CSVs use "Ipswich"
    "Ipswich Town":   "Ipswich",

    # Brighton — fd.org sometimes uses "Brighton Hove"
    "Brighton Hove":  "Brighton",
    "Brighton & Hove Albion": "Brighton",

    # Spurs — fd.org uses "Spurs", CSVs use "Tottenham"
    "Spurs":          "Tottenham",

    # Leeds — fd.org sometimes adds "United"
    "Leeds United":   "Leeds",

    # Sheffield — CSVs use "Sheffield United"
    "Sheffield Utd":  "Sheffield United",

    # Luton — fd.org uses "Luton Town"
    "Luton Town":     "Luton",

    # West Brom — fd.org uses "West Bromwich"
    "West Bromwich":  "West Brom",

    # Leicester — fd.org sometimes uses "Leicester City"
    "Leicester City": "Leicester",

    # Newcastle — fd.org sometimes uses "Newcastle United"
    "Newcastle United": "Newcastle",

    # Wolves — fd.org sometimes uses full name
    "Wolverhampton":  "Wolves",
    "Wolverhampton Wanderers": "Wolves",

    # Norwich — fd.org uses "Norwich City"
    "Norwich City":   "Norwich",

    # Swansea — fd.org uses "Swansea City"
    "Swansea City":   "Swansea",

    # Stoke — fd.org uses "Stoke City"
    "Stoke City":     "Stoke",

    # Cardiff — fd.org uses "Cardiff City"
    "Cardiff City":   "Cardiff",

    # Hull — fd.org uses "Hull City" (not in training data, alias is a no-op
    # but listed so it passes through cleanly to the unknown-team fallback)
    "Hull City":      "Hull",

    # Coventry — fd.org uses "Coventry City"
    "Coventry City":  "Coventry",

    # Middlesbrough — sometimes "Middlesbrough"
    "Middlesbrough":  "Middlesbrough",
}


def resolve(name: str) -> str:
    """Return the model's canonical team name for a given fd.org shortName."""
    return FD_TO_MODEL.get(name, name)

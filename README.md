# Film Log

A logbook for film photography — records what you set on the camera for every
frame, then compares it against the developed scan so the settings start to
make sense.

Live at https://mickydoit.github.io/film-log

## Cameras

- **Olympus XA** (1979) — aperture-priority rangefinder. You set aperture, focus
  and the backlight switch; the camera picks the shutter and never tells you,
  so the app estimates it from EV maths.
- **Pentax 17** (2024) — half-frame, programmed. You set the mode dial, focus
  zone and exposure compensation; the camera picks aperture and shutter.

Cameras are declared in `src/cameras/`. Adding one is a single new file.

## Running it

    cp .env.example .env.local     # fill in the values
    npm install
    npm run dev

## Tests

    npm test

## Deploying

Push to `main`. GitHub Actions builds and publishes to Pages. The build needs
three repo secrets: `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `VITE_PASSCODE_HASH`.

**Note:** if `VITE_PASSCODE_HASH` is empty, the passcode gate lets anyone
through — the app is currently ungated in that state. Set a real hash before
relying on the passcode to keep the log private.

## Data

Supabase project `ahecfusgkzzjpbxgvjmh`, tables `film_rolls` and `film_shots`,
private storage bucket `film-scans`. The Groq API key lives only as a secret on
the `film-critique` Edge Function and never reaches the browser.

**Note:** `GROQ_API_KEY` is not set yet. Until it is added in Supabase under
Project Settings → Edge Functions → Secrets, the critique button reports
`GROQ_API_KEY is not configured` and everything else works normally.

## Status

The log, scans and roll summary work. Outstanding before this is properly live:

- `GROQ_API_KEY` secret, for the AI critique (above)
- `VITE_PASSCODE_HASH`, without which the app is ungated (above)
- The deploy workflow needs a GitHub token carrying the `workflow` scope
  before it can be pushed: `gh auth refresh -h github.com -s workflow`

## API budget

The critique runs on Groq's free tier: 8,000 tokens a minute and 1,000
requests a day. One critique costs about 2,800 tokens, so roughly two a
minute is the ceiling.

The Edge Function is publicly callable, so the budget is enforced in the
database (`film_critique_take_slot`) rather than in the browser, where a
caller could bypass it. Defaults are 100 critiques a day and 25 seconds
between them; a refused request never reaches Groq, so it costs nothing.
Both are overridable without a redeploy via the `CRITIQUE_DAILY_LIMIT` and
`CRITIQUE_MIN_SECONDS` Edge Function secrets.

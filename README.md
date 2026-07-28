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

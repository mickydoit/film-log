# Film Log — Design

**Date:** 2026-07-27
**Status:** Approved
**Repo:** `mickydoit/film-log` → https://mickydoit.github.io/film-log

## Purpose

A personal logbook for film photography, built to teach camera settings rather than
merely record them. The user shoots an Olympus XA and a Pentax 17 and wants to
understand how the settings on each affect the result. Learning happens by comparing
the settings logged at the moment of the shot against the developed scan weeks later.

Success looks like: after two or three rolls, the user can predict what a given
aperture or zone-focus setting will produce, without consulting the app.

## Core design principle

**Each camera is a declarative spec file, not bespoke UI.**

The Olympus XA and Pentax 17 share almost no controls. The XA has an aperture ring
and no shutter control; the Pentax has a mode dial and no aperture control. Rather
than writing conditional UI per camera, each camera is described as data and a
generic renderer draws its controls.

Two consequences fall out of this, both intentional:

1. Adding a third camera is one new file, no UI changes.
2. The app can only ever offer settings the camera actually has. The user learns each
   camera's real logic because the interface refuses to lie about it.

## Camera specifications (researched, verified)

### Olympus XA (1979)

| Property | Value |
|---|---|
| Type | Rangefinder, aperture-priority AE |
| Lens | F.Zuiko 35mm f/2.8, 6 elements / 5 groups |
| Aperture | f/2.8 – f/22 (user-set) |
| Shutter | 10s – 1/500, **camera-selected** |
| Film speed | ASA 25 – 800 |
| Focus | Rangefinder patch, 0.9m – ∞; 3m marked orange (hyperfocal reference) |
| Exposure comp | Backlight switch, +1.5 EV, on/off only |
| Other | Self-timer; optional A11/A16 flash |

**User-set controls:** aperture, focus distance, backlight switch, (self-timer).
**Camera decides:** shutter speed — and never displays it. This is the core learning
gap the app fills.

### Pentax 17 (2024, Ricoh)

| Property | Value |
|---|---|
| Type | Half-frame 35mm compact, programmed AE |
| Lens | HD Pentax 25mm f/3.5 (≈37mm equivalent) |
| Aperture | f/3.5 – f/16, **camera-selected** |
| Shutter | 4s – 1/350, **camera-selected** (except Bulb) |
| Film speed | 50, 100, 125, 160, 200, 400, 800, 1600, 3200 (manual dial) |
| Exposure comp | ±2 EV dial |
| Frames | Half-frame: a 36-exposure roll yields 72 frames |

**Zone focus — six zones (official Ricoh naming and ranges):**

| Zone | Range |
|---|---|
| Macro | 0.24 – 0.26 m |
| Tabletop | 0.47 – 0.54 m |
| Extremely close | 1.0 – 1.4 m |
| Close | 1.4 – 2.2 m |
| Medium | 2.1 – 5.3 m |
| Far | 5.1 m – ∞ |

**Mode dial — seven positions:** Full Auto, Standard, Slow-speed,
Max-aperture-priority ("Bokeh"), Bulb, Daylight sync, Slow-speed sync.

**User-set controls:** mode, focus zone, exposure compensation, ISO dial, flash.
**Camera decides:** aperture and shutter.

### Logged control values (explicit, to remove ambiguity)

**Olympus XA** — the aperture ring is physically continuous, not detented. The app
offers whole stops only, since finer precision cannot be set reliably by hand:

- `aperture`: f/2.8, f/4, f/5.6, f/8, f/11, f/16, f/22
- `focus`: 0.9m, 1.2m, 1.5m, 2m, 3m (hyperfocal), 5m, 10m, ∞
- `backlight`: on / off
- Self-timer is **not** logged in v1 — it has no bearing on the image.
- ISO is a roll-level property (`iso_set`), not a per-shot control.

**Pentax 17**

- `mode`: the seven dial positions listed above
- `zone`: the six zones listed above
- `expcomp`: −2, −1.5, −1, −0.5, 0, +0.5, +1, +1.5, +2
- `flash`: on / off
- ISO is a roll-level property (`iso_set`), not a per-shot control.

## Architecture

Static single-page app on GitHub Pages, with Supabase for data, storage and one
Edge Function. No server to run.

```
┌─ GitHub Pages (static) ──────────────┐
│  Vite + React + TypeScript           │
│  camera specs compiled in            │
└───────────┬──────────────────────────┘
            │ supabase-js (anon key)
┌───────────▼──────────────────────────┐
│  Supabase  ahecfusgkzzjpbxgvjmh      │
│   film_rolls / film_shots  (Postgres)│
│   film-scans               (Storage) │
│   film-critique         (Edge Func.) │
└───────────┬──────────────────────────┘
            │ GROQ_API_KEY (server secret)
┌───────────▼──────────────────────────┐
│  Groq  qwen/qwen3.6-27b  (vision)    │
└──────────────────────────────────────┘
```

**Stack:** Vite + React + TypeScript, deployed via GitHub Actions to Pages.
Chosen over single-file vanilla JS because camera-driven dynamic forms are
component work, and over an offline-first build because the sync complexity isn't
justified until dead zones actually prove to be a problem.

**Supabase project:** reuses the existing `ahecfusgkzzjpbxgvjmh` project, which
already hosts the World Cup Draft, household budget, fitness tracker and
memory-brain apps. All new tables are `film_`-prefixed and all new policies are
scoped to those tables only — no existing table's security is touched.

## Data model

### `film_rolls`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `camera_id` | text | `'olympus-xa'` \| `'pentax-17'` |
| `film_stock` | text | e.g. "Kodak Gold 200" |
| `box_iso` | int | what the film actually is |
| `iso_set` | int | what was dialled on the camera |
| `exposures` | int | 24 or 36 |
| `frame_capacity` | int | derived; doubled for half-frame cameras |
| `status` | text | `shooting` \| `finished` \| `developing` \| `scanned` |
| `loaded_at` | timestamptz | |
| `finished_at` | timestamptz | nullable |
| `lab` | text | nullable |
| `dev_notes` | text | nullable |

`box_iso` and `iso_set` are separate columns on purpose. When they differ, the film
has been pushed or pulled, which is one of the more confusing concepts in film
photography. The app states it explicitly: *"Gold 200 shot at 400 — pushed 1 stop,
tell the lab."*

### `film_shots`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid pk | |
| `roll_id` | uuid fk → film_rolls | |
| `frame_number` | int | auto-increments, user-editable |
| `settings` | jsonb | validated against the camera's spec |
| `light` | text | see light conditions below |
| `shot_at` | timestamptz | automatic |
| `subject` | text | optional, one line |
| `scan_path` | text | storage path, nullable |
| `ai_critique` | jsonb | cached, nullable |
| `my_notes` | text | user's own verdict after seeing the scan |

Unique constraint on `(roll_id, frame_number)`.

`settings` is JSONB rather than a column per setting because the two cameras share
no controls. A rigid schema would demand a migration per new camera; JSONB validated
against the spec file gives equivalent safety without that cost.

Example values:
```json
{ "aperture": "f/8", "focus": "3m", "backlight": false }        // XA
{ "mode": "Standard", "zone": "Medium", "expcomp": -0.5 }       // Pentax 17
```

**Light conditions** (a fixed six, chosen to map onto EV values):
`bright-sun`, `hazy-sun`, `overcast`, `open-shade`, `indoors`, `night`.

### Camera specs are *not* a table

They are TypeScript files in `src/cameras/`. They describe hardware, not user data,
so they belong in version control. Only `camera_id` is persisted.

### Storage

Private bucket `film-scans`, path `{roll_id}/{frame_number}.jpg`, read via signed
URLs. Images downscaled to ~1500px on the client before upload.

## Authentication

A shared passcode gates the UI, remembered per device.

**Known limitation, accepted deliberately.** The Supabase anon key ships in the
static page, so the passcode hides the interface but does not stop a determined
person from querying the `film_*` tables directly. Mitigations in place: the scans
bucket is private and served only via signed URLs, and new RLS policies are scoped
to `film_*` tables so nothing pre-existing is exposed. Upgrading to Supabase email
magic-link auth later requires no schema change.

## Shutter speed estimator (Olympus XA)

The XA never reveals which shutter speed it chose, which removes the feedback the
photographer most needs. The app reconstructs it arithmetically — no AI involved:

```
EV100 by light:  bright-sun 15 | hazy-sun 14 | overcast 13
                 open-shade 11 | indoors 8   | night 5

EV_scene = EV100 + log2(ISO / 100)
t        = N² / 2^EV_scene            (N = f-number)
```

The result is snapped to the nearest real shutter speed, clamped to the XA's
10s–1/500 range, and flagged when the scene falls outside what the camera can
handle. Below 1/30 it raises a camera-shake warning.

Displayed live while logging: *"f/2.8, overcast, ISO 400 → roughly 1/125."*
Presented as an estimate, because scene reflectance varies and the XA's meter is
centre-weighted.

## AI critique

**Flow:** drag scan onto a frame → downscale → upload to `film-scans` → call
`film-critique` Edge Function → cache the JSON result on `film_shots.ai_critique`.
Cached, so reopening a frame costs nothing.

**Edge Function `film-critique`** holds `GROQ_API_KEY` as a Supabase secret, so the
key never reaches the browser. The Groq model ID is an environment variable
(default `qwen/qwen3.6-27b`), making a model swap a config change rather than an
app redeploy.

**Prompt context** — the model receives the full shooting situation, not just the
image:

```
Camera: Olympus XA (aperture-priority; camera picks shutter 10s–1/500)
Film:   Kodak Gold 200, shot at ISO 400 (pushed 1 stop)
User set: f/2.8, focus 0.9m, backlight compensation OFF
Estimated shutter: 1/60
Light: overcast, 16:15
```

**Response shape** — structured JSON so the UI renders it as sections:

```json
{
  "exposure":     { "verdict": "...", "confidence": "low|medium|high", "explanation": "..." },
  "focus":        { "verdict": "...", "confidence": "...", "explanation": "..." },
  "motion":       { "verdict": "...", "confidence": "...", "explanation": "..." },
  "depth_of_field": { "verdict": "...", "confidence": "...", "explanation": "..." },
  "overall": "...",
  "next_time": ["...", "..."]
}
```

Every observation must name the specific control the user set and what to change.
"Slightly soft" is useless; *"focus set to 0.9m but the subject reads as ~2m away —
the rangefinder patch wasn't aligned; at f/2.8 there's no margin, f/8 would have
covered the error"* is a lesson.

**Stated limitations** (surfaced in the UI, not hidden):

1. Labs auto-correct brightness during scanning, so exposure cannot be measured
   precisely from a scan. The model reports confidence rather than asserting stops,
   and reads symptoms (grain, muddy shadows) rather than claiming measurements.
2. Focus and motion assessment on a downscaled JPEG catches obvious misses, not
   subtle ones.

Reliably useful for: depth of field, composition, motion blur, whether the zone
choice matched subject distance, and patterns across a whole roll.

## Half-frame scan handling

The Pentax 17 produces 72 frames per 36-exposure roll, and labs almost always scan
half-frames in pairs — two images side by side in one file. So 36 files arrive for
72 logged shots.

**Resolution:** on upload to a half-frame roll, the app splits each image down the
middle on a canvas and assigns the halves to consecutive frame numbers, with a
manual override toggle for labs that deliver singles. The user drags in the whole
folder and the app does the rest.

## Screens

1. **Passcode** — one field, remembered per device.
2. **Shelf** (home) — both cameras as cards showing what's loaded
   (*"Pentax 17 — Gold 200 @ 400 — frame 23/72"*), each with a large
   **Log a shot** button. The landing screen.
3. **Load a roll** — camera, film stock, box ISO, ISO dialled, exposures. Shows
   derived frame count and a push/pull warning when the ISOs differ.
4. **Log a shot** — the only screen that must be fast. Controls rendered from the
   camera spec as large tappable rows, not dropdowns. Frame number auto-increments
   but stays editable. Light condition as six icons. Subject optional. Timestamp
   silent.
   - **Settings persist from the previous shot.** A typical log is two taps: open,
     save. Only what actually changed gets touched. Re-entering aperture every frame
     would kill the habit within a week.
   - Pentax screen shows the selected zone's distance range beneath it
     (*"Close — 1.4 to 2.2m"*), teaching the ranges during use.
   - XA screen marks 3m as hyperfocal and shows the live shutter estimate.
5. **Roll view** — frame grid, greyed until scanned, thumbnails after. Drop target
   for a folder of scans. Roll status progresses shooting → finished → developing →
   scanned.
6. **Frame detail** — scan, then the settings used, then the AI critique, then the
   user's own notes. The juxtaposition is the learning.

Plus a **roll summary** on scanned rolls: aperture and zone distribution, how often
exposure compensation was used. Discovering that 80% of a roll was shot at one
setting is itself instructive.

## Module boundaries

| Module | Responsibility | Depends on |
|---|---|---|
| `src/cameras/` | Camera spec data + types | nothing |
| `src/lib/exposure.ts` | EV maths, shutter estimation | camera specs |
| `src/lib/supabase.ts` | Client, queries, storage helpers | supabase-js |
| `src/lib/halfFrame.ts` | Canvas image splitting | nothing |
| `src/components/controls/` | Generic control renderers by spec type | camera specs |
| `src/screens/` | The six screens | all of the above |
| `supabase/functions/film-critique/` | Groq proxy, prompt, JSON validation | Groq API |

`exposure.ts` and `halfFrame.ts` are pure functions with no I/O, so they are
directly unit-testable — which matters, since the exposure maths is the part most
likely to be quietly wrong.

## Testing

- **Unit (Vitest):** EV/shutter calculations against known Sunny 16 values; frame
  capacity derivation; half-frame splitting geometry; settings validation against
  camera specs.
- **Integration:** Edge Function returns well-formed JSON for a known image;
  malformed Groq responses degrade gracefully rather than crashing the frame view.
- **Manual:** log a shot on a phone one-handed. If it takes more than two taps for
  an unchanged setup, the design has failed.

## Error handling

- **Offline while logging** — the immediate risk, since shooting happens outdoors.
  Failed writes are queued in localStorage and retried on reconnect; the UI shows an
  unsynced badge rather than an error, and never blocks logging.
- **Groq failure or timeout** — the frame still displays its scan and settings; the
  critique section shows a retry button. A critique is never required for the app to
  work.
- **Upload failure** — retry with backoff; the frame keeps its logged settings
  regardless.
- **Passcode** — wrong entry simply re-prompts.

## Out of scope for v1

- Offline-first sync architecture (simple retry queue only)
- Multi-user or sharing
- EXIF writing / export to Lightroom
- GPS location capture (explicitly declined)
- Per-frame coaching before the shot

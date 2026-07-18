# Changelog

Ephemeris, Field Instrument FI-117. Versions are marked in the file itself
(`<!-- Ephemeris :: ephemeris.html :: vX.Y.Z -->`) and in the About station.

## v1.6.0

A softer design language, and the looks made reachable.

- **The look control moved into the header.** Light and High Contrast existed
  before this release but were buried three taps down in Record, Settings,
  which is the same as not existing. One control now cycles: follow the device,
  Blush light, Ember dark, High Contrast.
- **A new record follows the device** rather than opening dark, including a
  system request for more contrast. The unlock screen follows it too, since a
  preference cannot be read before the record is open. Your choice is stored
  inside the sealed record, so the device learns nothing from it.
- **The wordmark is set in a soft script**, falling back through Palatino to a
  serif, with a drawn flourish beneath it. A single file that cannot reach the
  network cannot carry a font, so this uses what the device already has.
- **A new icon**: a crescent inside a ring of eight days, in blush and gold.
- Softer shapes throughout. Rounded cards with a low shadow, pill buttons and
  chips, circular calendar days, italic serif headings, hairline rules that
  fade at both ends, and a gradient tick under each eyebrow.
- High Contrast keeps its flatness on purpose. That theme is for reading, not
  for taste.

## v1.5.4

- Clearing the device is offered from three places now: the unlock screen, the
  Record station, and the Safety station. Reaching it should never be the hard
  part. Doing it by accident still is: every route shows the same warning, the
  same offer of a sealed copy first, and asks for a second deliberate press.

## v1.5.3

Fixes a way to get stuck that should never have shipped.

- After a wipe passphrase was used, there was no way back to the setup screen.
  The device still held a file, so the app booted straight to unlock, and if no
  second passphrase had been chosen, the surviving volume was sealed under a
  random key nobody holds. The app was bricked on that device. A forgotten
  passphrase, or a record from a version this one cannot read, left the same
  dead end.
- The unlock screen now offers **Start a new record**, behind a warning, with
  the offer to save a sealed copy first. A sealed copy costs nothing to keep and
  is the only thing that can rescue a passphrase remembered later.
- The message about an unreadable older record now points at that route instead
  of describing one that no longer exists.

## v1.5.2

Palette. No change to how anything works.

- Two warm pastel themes replace the cold ones. **Ember**, a warm dusk, is the
  default. **Blush** is its daylight counterpart. High Contrast is untouched,
  because that theme exists for readability rather than for taste.
- Surfaces and marks are soft. The ink and the accents sit deep enough that
  every pairing clears WCAG AA, which is the constraint pastels fight hardest.
- Control edges now use their own `--edge`, held to 3 to 1 against the surface
  behind them, so inputs and buttons keep a visible boundary while decorative
  hairlines stay quiet.
- Colours that had been written into the stylesheet by hand, white on a
  bleeding day and near black on a chosen button, are theme variables now, so a
  new palette cannot leave unreadable text behind.
- `dev/check-contrast.mjs` reads the palettes out of the file and fails the
  release if any pairing drops below the line. It caught two on its first run.
- Fixed a test that failed roughly one run in three for no real reason: it
  searched base64 for short words like "mood", and base64 spells things by
  chance. It now looks for plaintext markers and for any long run of readable
  text inside a sealed volume.

## v1.5.1

Cleanup pass. No new capability.

- One dispatch table for drawing stations, replacing two near identical
  branch chains that had already drifted apart by one line.
- Signals has its own day picker and no longer sends you to the Log first.
- Saving with no day picked writes to today rather than refusing. The fallback
  sets the day without repopulating the sheet, so nothing typed is lost.
- Removed a compression helper that was never called.
- Repository laid out for release: harness under `test/`, the Argon2id
  verification under `dev/`, and `dev/check.sh` as the single gate to run
  before tagging.

## v1.5.0

- Paper log printed at true size. Millimetre layout, one square per day, a
  100 mm calibration bar to catch a printer that scaled the page, Letter or A4,
  optional name, optional notes, optional blank rows to carry on by hand.
- Importers that sniff the file: JSON walked for anything carrying a date and a
  flow (which is what Clue and Flo both hand out), tables with a column mapping
  step and a preview, and Apple Health exports read for menstrual flow only.
  Cycle starts are derived from bleeding days, since neither vendor records
  them. Everything imported is marked recalled and never overwrites a recorded
  day.

## v1.4.0

- Argon2id and BLAKE2b written out in the file, no library and no WASM, checked
  against published vectors by the self test and against an independent
  implementation by `dev/verify-argon2.mjs`.
- One key derivation per unlock, using a shared file salt and a per volume
  verifier. Passphrase strength meter. Increasing delay after failed attempts.
- Quick marks, backfill from memory weighted lower, editable symptom list,
  drag to paint a run of days on the calendar.
- Bayesian prediction with a normal prior, recency weighting, and a band rather
  than a date. Trend detection. Where today sits in the distribution.
- Safety station: the second record advances on its own so it does not read as
  abandoned, an optional wipe passphrase that reports what a wrong passphrase
  reports, and an optional erase if untouched timer.
- Fixed: `getRandomValues` refuses more than 65,536 bytes per call, so the wipe
  would have thrown instead of erasing anything.
- Fixed: the erase if untouched path destroyed the volume and then left the
  session unlocked.
- Changed: spotting in the days before a period no longer suppresses the start
  of the new cycle. Only light flow or heavier counts when deciding whether a
  bleeding day opens a cycle.
- Drops compatibility with v1.0 records. Export a plain copy and import it.

## v1.0.0

First build. Two padded equal size AES-256-GCM volumes, PBKDF2, second
passphrase opening a separate seeded record, the cycle dial, the day sheet,
temperature and mucus and LH charting, cycle table computed at read time,
sealed and plain and paper copies, archive rather than delete.

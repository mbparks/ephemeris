# Releasing

The whole workflow, in order. It exists so that a release is boring.

1. Work on `ephemeris.html` directly. There is no build step and there never
   will be: what ships is what you edited.
2. Bump both the marker on line 2 and `const VER`. `dev/check.sh` fails if they
   disagree, which is the failure mode that actually happens.
3. Add the change to `CHANGELOG.md` while you still remember why.
4. `cd test && npm install` once per machine.
5. `./dev/check.sh`. It parses the script, confirms the version markers agree,
   confirms the file carries no network primitives and no remote assets and
   still forbids connections in its content policy, checks house style, and
   runs both test layers.
6. If anything touched BLAKE2b, Argon2id, or the key derivation, also run
   `cd test && npm run verify-argon2`. That one is slow and is not part of the
   gate, because it needs an outside implementation to compare against and
   nothing in the shipped file depends on it.
7. Open `ephemeris.html` from disk in a real browser, create a record, lock it,
   unlock it. jsdom does not catch layout, printing, or a browser refusing
   storage to a page opened from `file://`.
8. Print the paper log and measure the calibration bar with an actual ruler.
9. Tag `vX.Y.Z`.

## What must stay true

- One file. No dependencies, no build, no network, runs from `file://`.
- Nothing readable reaches storage.
- Every release keeps a browser runnable self test that passes.
- Days are archived, never destroyed, except where the Safety station says
  plainly that it destroys things.

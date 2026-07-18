# EPHEMERIS

**Field Instrument FI-117 :: v1.7.0**

A private cycle record that runs from the file itself. No account, no server, no company, no network. One HTML file on your own device.

An ephemeris is a table of predicted positions worked out from earlier observation. Never certain, always improving with the record behind it. That is what this instrument is: it records what you observed, and it does arithmetic on your own history without pretending to know more than the record supports.

---

## Quick start

1. Save `ephemeris.html` somewhere on your device.
2. Open it in a browser. Double click works. There is no server to run and nothing to install.
3. Choose a passphrase. Four unrelated words beats any clever short one.
4. Optionally choose a second passphrase. See **The second record** below before you decide.
5. Mark today with the quick bar at the top and you are recording.

To keep it on a phone home screen, save the file and open it from the browser's file list. There is no app store version and there never will be, because that would mean a vendor.

---

## What it does

### Dial
Every cycle drawn as a ring, oldest at the centre, all rings on one fixed angular scale. Irregular cycles show as arcs that walk around the dial rather than as a number that hides them. The next start is drawn as a shaded band, never as a confident line, because a single date would be a lie about how much the record actually supports.

Below the dial: where today sits in the distribution. Not a red counter of days late, but a plain statement such as *today is day 31, about 78 in 100 cycles like yours would have started by now*.

### Log
A month calendar and a day sheet. Flow on a five point scale, symptoms on a four point scale, medication, tests, and a note. Hold and drag across the calendar to mark a run of days at once. The quick bar handles the common case in one tap: **started today**, **bleeding today**, **it stopped**.

Anything written in a hurry can be taken back. The quick bar, painting a run of days, filling in from memory, and bringing a record in all offer a single step of undo in the message that confirms them, and undoing restores exactly what was there before. A mark corrected by hand works too: pick the day, set bleeding to none, save. Cycle starts, the dial, the predictions and the trends are all worked out fresh from the days each time you open the app, so correcting a day corrects everything derived from it.

**Fill in earlier cycles** seeds history from memory. Anything entered that way is marked as recalled, drawn with a dotted edge, weighted lower in the arithmetic, and labelled as such in the cycle table. Memory is not observation and the instrument does not pretend otherwise.

**Symptoms tracked** is editable. The five defaults are a starting set, not a claim about what matters to you. Removing one keeps what you already recorded under it.

### Signals
Waking temperature charted across the current cycle with a three over six coverline, cervical mucus, and LH results. These describe what already happened. **This is not a contraceptive method.** The instrument will never output a safe day and no version of it ever will.

### Table
Cycles are computed when you open the app and stored nowhere. Length, bleeding days, peak flow, and whether each cycle was recorded or recalled.

**What has been changing** states observations with numbers attached: lengths drifting, bleeding days climbing, variability opening or settling, cycles outside 21 to 35 days. Phrased for a conversation with a clinician. Never a diagnosis.

### Record
Sealed copies, plain copies, a printed paper log for a clinic visit, the symptom list, settings, the self test, and archived days.

### Safety
Measures that destroy things. Read that page before touching anything on it.

---

## How your record is protected

| Against | What stops it |
|---|---|
| An app vendor reading or selling it | There is no vendor. The file is yours and runs from disk |
| Trackers and analytics inside the app | The page forbids every outbound connection. There is nothing to intercept |
| Cloud backup of your phone | What sits in storage is ciphertext. A backup carries an unreadable blob |
| Legal process against a company | There is no company and no account to subpoena |
| Someone picking up your unlocked phone | Auto lock on idle, on leaving the screen, and on Escape |
| Someone making you unlock it | A second passphrase opens a separate, ordinary looking record |
| Guessing your passphrase offline | Argon2id, memory hard, with a delay after repeated attempts |

Technically: two padded, equal size volumes sealed with AES-256-GCM. The passphrase goes through Argon2id (default 64 MiB, two passes), and the result is split by HKDF-SHA256 into an encryption key, a wipe key, and a verifier. Both volumes share the file salt, so a single derivation is enough to tell which volume a passphrase belongs to, which is what makes a memory hard function affordable on a phone.

Both volumes are padded to the same size in fixed steps, so the file never reveals how much is written in either one. A file with a second passphrase and a file without are the same shape on disk, and so is a file with a wipe passphrase.

### The second record

If you set a second passphrase, it opens a separate record seeded with ordinary looking history. If you are ever made to unlock this app, that is the one you can open.

Both volumes exist either way. If you do not choose a second passphrase, the second volume is still created, still seeded, and sealed under a random key that nobody holds. There is nothing on disk that distinguishes the two cases.

A record that has not been written to in months is itself a tell, so the main record carries the second record's key and quietly advances it whenever you open the main one. That means the main record knows the second one exists. Anyone who has already opened the main record has everything anyway, so the trade is worth it.

---

## The Safety station

These settings can permanently erase your record. They exist for someone who expects a device to be taken. They sit behind an acknowledgement screen for a reason.

**Wipe passphrase.** A third passphrase that destroys the main record the moment it is entered, then reports exactly what a wrong passphrase reports. Nothing on screen shows what happened. Enter your second passphrase afterwards to show an ordinary record. Off by default.

**Clearing the device.** Offered from the unlock screen, from the Record station, and from here. It removes both records and returns you to a blank setup screen: for handing a device on, for starting again, or for after a wipe, when the device still holds a file that opens nothing. Every route warns you first and offers to save a sealed copy, which is the only thing that can rescue a passphrase you remember later.

**Erase if untouched.** If the main record is not opened within the chosen number of days, it erases itself the next time it is opened. The limit stated honestly: a web page cannot run while nobody opens it, so this defeats a device that is taken and returned, not a device that is taken and imaged.

Keep a sealed copy somewhere else before you turn any of this on. There is no recovery of any kind.

---

## What it cannot do

- It cannot protect you from a device that is already compromised. Anything watching the screen or the keyboard sees what you see.
- The second passphrase answers a demand to unlock. **It does not defeat a forensic examination of the raw storage.** An examiner who images the device sees two volumes and can say that a second passphrase may exist.
- Neither the wipe passphrase nor the untouched timer defeats forensic examination either. Overwriting a value in browser storage does not scrub the flash underneath it. Deleted data can survive below the level any web page can reach.
- If you forget your passphrase the record is gone. There is no recovery, no reset link, and no support address that can help.
- Predictions are arithmetic on your own history. They are not medical advice, not a diagnosis, and not birth control.
- Screenshots, backups you make yourself, and plain copies you export are outside its control.

---

## Predictions, honestly

Cycle length is estimated with a normal prior updated by your recorded cycles. Recent cycles count for more, halving in weight roughly every six cycles back. Recalled cycles count for less. The stated range covers about four times in five.

With one cycle recorded, the estimate leans heavily on the prior and the band is wide. That is correct behaviour, not a defect. It narrows as the record grows. The instrument would rather show an honest wide band than a confident wrong date.

A cycle starts on a day of light flow or heavier with no light or heavier flow in the three days before it. Spotting alone never opens a cycle, and spotting in the days before a period does not stop one from opening.

---

## Copies

**Sealed copy** holds both volumes and stays unreadable without the passphrase. This is the safe backup, and the safe way to move to a new phone.

**Plain copy** is a CSV that anything can read, including whatever backs up your downloads folder. It exists because a record you cannot get out of an app is a trap, and because paper and spreadsheets are sometimes what a clinic needs. Once it leaves the app it is out of reach.

**Bring a record in** reads an export from another tracker. It sniffs the file rather than assuming a schema:

- **JSON**, which is what both Clue and Flo hand out. The importer walks the structure looking for anything that carries a date and something that reads as a flow, so it survives the shape changing between vendors and between versions. Clue sends a password protected zip, so unzip it first and choose the file inside.
- **A plain table**, from this app or anywhere else. If the columns cannot be guessed you pick them yourself, and you see how many days were read and the first few of them before anything is written.
- **An Apple Health export**, from which only menstrual flow records are read. Nothing else in that file is touched.

Neither Clue nor Flo records where a cycle started, so starts are derived here from the bleeding days themselves, the same way they are for anything you record directly. Everything brought in is marked as recalled and weighted lower, and an import never overwrites a day already in your record.

**Paper log** prints a clinic sheet at true size. The cycle chart is laid out in millimetres, one square per day, so a clinician can measure it, and a 100 mm calibration bar on the page shows whether the printer scaled it. Letter or A4. Nothing on the sheet identifies you unless you type a name into it, day notes are left off unless you ask for them, and you can add blank rows to carry on with by hand. Paper cannot be reached from anywhere else.

---

## Self test

Record station, **Run self test**. 60 checks covering the hand written cryptography against published test vectors, the sealing and padding, the wipe, date arithmetic across month ends and leap days, cycle detection, prediction behaviour at one cycle and at twelve, trend detection, the passphrase meter, the importers against Clue shaped, Flo shaped, tabular and Apple Health input, the paper log measurements, and a check that nothing readable ever reaches storage.

A browser harness of 101 further checks covers setup, unlock under each passphrase, the attempt delay, the wipe, the untouched timer, and the second record being carried forward.

---

## Repository

```
ephemeris.html      what ships. one file, no dependencies, no build
README.md           this
CHANGELOG.md        what changed and why
RELEASING.md        the release procedure, so it stays boring
LICENSE             GPL-3.0
test/harness.mjs    runs the app under jsdom, then runs its own self test
dev/verify-argon2.mjs  proves the hand written crypto against an outside one
dev/check-contrast.mjs  fails the release if a palette drops below WCAG AA
dev/check.sh        the single gate to run before tagging
```

Nothing under `test/` or `dev/` ships. The shipped file has no dependencies at
all, and `dev/check.sh` fails the release if that ever stops being true.

## Conventions

The wordmark is set in whatever soft script face the device already has, falling back through Palatino to a serif, since a single file that cannot reach the network cannot carry a font with it. Headings are italic serif, edges are rounded, calendar days are circles, and the icon is a crescent inside a ring of days, drawn in SVG in the file.

Single file. Runs from `file://`. No build step, no dependencies, no third party code. BLAKE2b and Argon2id are written out in the file and checked against published vectors by the self test. Sealing uses the browser's own Web Crypto. Three looks, changed from an icon in the header rather than buried in settings: **Blush**, light and warm; **Ember**, a warm dusk; and **High Contrast**. A new record follows whatever the device asks for, including a system request for more contrast, until you choose for yourself. Every text and control pairing in all three clears WCAG AA, and control edges are held to a 3 to 1 boundary against their surface. Your choice lives inside the sealed record, so the device learns nothing about you from it. Days are archived rather than destroyed.

**No backwards compatibility with v1.0.** A v1.0 record cannot be opened here. Export a plain copy from v1.0 and bring it in.

If the browser refuses storage to a page opened from disk, the app says so and keeps everything in memory for that session. Save a sealed copy before closing the tab.

---

## Not on the roadmap

Worth stating so it stays decided. No accounts, no cloud sync, no server side anything. No sharing with a partner, which is a frequent request and a frequent vector for control. No notifications carrying content. No analytics or crash reporting, not even self hosted. No fertility algorithm that outputs a safe day.

---

## Roadmap

**v1.6** sealed copy to a second device over an encrypted peer to peer channel.

**v2.0** optional encryption of the file itself so it does not announce what it is, a cover application that opens as something dull, and a security review by someone who is not the author. Nothing in the Safety station should be recommended to anyone whose safety depends on it until that review happens.

---

## License

GPL-3.0

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program. If not, see https://www.gnu.org/licenses/.

---

Green Shoe Garage. Make. Hack. Learn. Share. Repeat.

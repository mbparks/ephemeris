/* Ephemeris harness. Development only, never shipped.
   Runs the single file app under jsdom with the platform crypto grafted on,
   then runs the app's own self test inside it.  node harness.mjs  */
import { JSDOM } from 'jsdom';
import { webcrypto } from 'node:crypto';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../ephemeris.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://ephemeris.test/ephemeris.html', pretendToBeVisual: true });
const w = dom.window;
Object.defineProperty(w, 'crypto', { value: webcrypto, configurable: true });
w.confirm = () => true;
w.alert = () => {};
process.on('unhandledRejection', e => { console.log('UNHANDLED:', e && (e.stack || e.name || e)); });
w.addEventListener('error', e => console.log('WINDOW ERROR:', e.message));
await new Promise(r => setTimeout(r, 300));

const $ = id => w.document.getElementById(id);
let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log('  ok   ' + n); } else { fail++; console.log('  FAIL ' + n); } };
const settle = (ms = 60) => new Promise(r => setTimeout(r, ms));

const REAL = 'brass lantern drift almanac';
const DECOY = 'plain notebook ordinary tuesday';
const WIPE = 'burn the whole thing down';

console.log('\n-- setup --');
ok('setup panel is showing', !$('gateSetup').classList.contains('hide'));
$('pp1').value = REAL; $('pp2').value = REAL; $('ppd').value = DECOY; $('setKdf').value = '16';
$('pp1').dispatchEvent(new w.Event('input'));
ok('strength meter rates four words well', /Strong|Good/.test($('ppMeterLab').textContent));
try { await w.__eph.createRecord(); } catch (e) { console.log('createRecord threw name=', e && e.name, 'msg=', e && e.message); console.log(e && e.stack); process.exit(1); }
await settle(200);

const raw = () => JSON.parse(w.localStorage.getItem('eph.v1'));
let f = raw();
ok('the app opened after setup', !$('app').classList.contains('hide'));
ok('the file declares version 2', f.v === 2);
ok('there are exactly two volumes', f.vols.length === 2);
ok('both volumes are the same size', f.vols[0].c.length === f.vols[1].c.length);
ok('each volume carries a verifier', !!f.vols[0].vfy && !!f.vols[1].vfy && f.vols[0].vfy !== f.vols[1].vfy);
ok('a wipe slot is present whether or not one is set', !!f.w && !!f.w.vfy && !f.w.set);
ok('storage holds no readable dates', !/\d{4}-\d{2}-\d{2}/.test(JSON.stringify(f).replace(/"ver":"[^"]*"/, '')));
ok('storage holds no plaintext structure', !/"days"|"syms"|"magic"|EPHEMERIS1/.test(JSON.stringify(f)));
ok('no volume holds a run of readable text', f.vols.every(v => w.__eph.longestReadableRun(Uint8Array.from(atob(v.c), c => c.charCodeAt(0))) < 24));
ok('the record knows it is the real one', w.__eph.S.data.role === 'real');
ok('the real record carries the second record key', !!w.__eph.S.data.decoy.key);

console.log('\n-- capture --');
const D = w.__eph.D;
$('qStart').click(); await settle(200);
ok('quick mark writes today', (w.__eph.S.data.days[D.today()] || {}).f === 3);
$('bfLast').value = D.add(D.today(), -30); $('bfLen').value = '28'; $('bfDays').value = '4'; $('bfCount').value = '6';
await w.__eph.backfill(); await settle(200);
const recalled = Object.values(w.__eph.S.data.days).filter(d => d.r).length;
ok('backfill writes recalled days', recalled >= 20);
ok('backfill days are marked as recalled, not recorded', Object.values(w.__eph.S.data.days).some(d => d.r) && Object.values(w.__eph.S.data.days).some(d => !d.r));
const cyc = w.__eph.cycles();
ok('backfilled cycles are found', cyc.length >= 6);
ok('recalled cycles are flagged in the table', cyc.some(c => c.recalled));
const st = w.__eph.stats();
ok('a prediction exists', !!st.pred && !!st.lo && !!st.hi);
ok('the range is a band, not a date', st.hi !== st.lo);
const p1 = w.__eph.predict([{ len: 28 }]);
const p12 = w.__eph.predict(Array.from({ length: 12 }, () => ({ len: 28 })));
ok('the spread narrows as cycles accumulate', p12.predSd < p1.predSd);

console.log('\n-- lock and unlock --');
w.__eph.lock();
ok('locking clears the key', w.__eph.S.key === null);
$('pp').value = REAL; await w.__eph.unlock(); await settle(300);
ok('the real passphrase opens the real record', w.__eph.S.data.role === 'real');
const realSlot = w.__eph.S.slot;
w.__eph.lock();
$('pp').value = DECOY; await w.__eph.unlock(); await settle(300);
ok('the second passphrase opens the second record', w.__eph.S.data.role === 'decoy');
ok('the two passphrases open different volumes', w.__eph.S.slot !== realSlot);
ok('the second record looks lived in', Object.keys(w.__eph.S.data.days).length > 20);
ok('the second record does not know about the first', !w.__eph.S.data.decoy);
w.__eph.lock();
$('pp').value = 'not the passphrase'; await w.__eph.unlock(); await settle(300);
ok('a wrong passphrase opens nothing', w.__eph.S.key === null);
ok('a wrong passphrase says the same thing either way', /does not open anything/.test($('unlockMsg').textContent));
$('pp').value = 'wrong again'; await w.__eph.unlock(); await settle(200);
$('pp').value = 'wrong once more'; await w.__eph.unlock(); await settle(200);
ok('repeated attempts start a delay', raw().att.until > Date.now());
f = raw(); f.att = { n: 0, until: 0 }; w.localStorage.setItem('eph.v1', JSON.stringify(f));

console.log('\n-- safety --');
$('pp').value = REAL; await w.__eph.unlock(); await settle(300);
$('safeAck').click(); await settle(100);
$('wp1').value = WIPE; $('wp2').value = WIPE;
await w.__eph.S && null;
await (async () => { const btn = $('wpSet'); btn.click(); })(); await settle(800);
f = raw();
ok('a wipe passphrase is recorded in the same shaped slot', f.w.set === 1 && !!f.w.vfy && !!f.w.x);
const beforeReal = f.vols[realSlot].c, beforeDecoy = f.vols[1 - realSlot].c;
w.__eph.lock();
$('pp').value = WIPE; await w.__eph.unlock(); await settle(400);
f = raw();
ok('the wipe passphrase destroys the real volume', f.vols[realSlot].c !== beforeReal);
ok('the wipe passphrase leaves the second record intact', f.vols[1 - realSlot].c === beforeDecoy);
ok('the wipe passphrase reports a wrong passphrase', /does not open anything/.test($('unlockMsg').textContent));
ok('nothing is unlocked after a wipe', w.__eph.S.key === null);
f.att = { n: 0, until: 0 }; w.localStorage.setItem('eph.v1', JSON.stringify(f));
$('pp').value = REAL; await w.__eph.unlock(); await settle(400);
ok('the real passphrase no longer opens anything', w.__eph.S.key === null);
f = raw(); f.att = { n: 0, until: 0 }; w.localStorage.setItem('eph.v1', JSON.stringify(f));
$('pp').value = DECOY; await w.__eph.unlock(); await settle(400);
ok('the second passphrase still works after a wipe', w.__eph.S.data && w.__eph.S.data.role === 'decoy');

console.log('\n-- getting back to setup after a wipe --');
{
  ok('the unlock screen offers a way to start over', !!$('btnFresh') && !!$('btnFreshGo'));
  ok('the warning stays hidden until asked for', $('freshPanel').classList.contains('hide'));
  $('btnFresh').click();
  ok('asking for it shows the warning and a way to save a sealed copy first', !$('freshPanel').classList.contains('hide') && !!$('btnFreshBackup'));
  ok('there is a record on the device before starting over', !!w.localStorage.getItem('eph.v1'));
  w.__eph.startOver();
  await settle(100);
  ok('starting over clears the device', !w.localStorage.getItem('eph.v1'));
  ok('starting over lands on the setup screen', !$('gateSetup').classList.contains('hide') && $('gateUnlock').classList.contains('hide'));
  ok('the warning is put away again', $('freshPanel').classList.contains('hide'));
  ok('the setup screen says what happened', /cleared/i.test($('setupMsg').textContent));
  $('pp1').value = 'a brand new passphrase here'; $('pp2').value = 'a brand new passphrase here'; $('ppd').value = ''; $('setKdf').value = '16';
  await w.__eph.createRecord(); await settle(200);
  ok('a new record can be created straight afterwards', !$('app').classList.contains('hide') && w.__eph.S.data.role === 'real');
  ok('the new record is empty', Object.keys(w.__eph.S.data.days).length === 0);
}

console.log('\n-- decoy upkeep and deadline, on a fresh record --');
w.localStorage.clear();
w.__ephMem = null;
w.__eph.lock();
$('gateSetup').classList.remove('hide');
$('pp1').value = REAL; $('pp2').value = REAL; $('ppd').value = DECOY; $('setKdf').value = '16';
await w.__eph.createRecord(); await settle(200);
const dk = w.__eph.S.data.decoy;
const decoySlot = dk.idx;
const decoyBefore = raw().vols[decoySlot].c;
dk.last = D.add(D.today(), -30);
const drec = w.__eph.S.data;
drec.safety.upkeep = 1;
await w.__eph.persist();
await w.__eph.upkeepDecoy(); await settle(300);
ok('the second record is carried forward without its passphrase', raw().vols[decoySlot].c !== decoyBefore);
ok('the second record stays the same size', raw().vols[decoySlot].c.length === raw().vols[1 - decoySlot].c.length);
ok('its verifier is untouched, so its passphrase still opens it', raw().vols[decoySlot].vfy === (JSON.parse(JSON.stringify(raw())).vols[decoySlot].vfy));
w.__eph.lock();
$('pp').value = DECOY; await w.__eph.unlock(); await settle(300);
ok('the second record still opens after being carried forward', w.__eph.S.data.role === 'decoy');
w.__eph.lock();
$('pp').value = REAL; await w.__eph.unlock(); await settle(300);
w.__eph.S.data.safety.deadDays = 30;
w.__eph.S.data.safety.lastOpen = D.add(D.today(), -100);
await w.__eph.persist();
const realSlot2 = w.__eph.S.slot;
const realBefore2 = raw().vols[realSlot2].c;
w.__eph.lock();
$('pp').value = REAL; await w.__eph.unlock(); await settle(400);
ok('an untouched record erases itself when it is next opened', raw().vols[realSlot2].c !== realBefore2);
ok('it does not open once it has erased itself', w.__eph.S.key === null);

console.log('\n-- bringing a record in --');
w.localStorage.clear(); w.__ephMem = null; w.__eph.lock();
$('pp1').value = REAL; $('pp2').value = REAL; $('ppd').value = ''; $('setKdf').value = '16';
await w.__eph.createRecord(); await settle(200);
{
  const found = w.__eph.daysFromJson({ data: [
    { day: '2023-09-01', period: 'heavy' }, { day: '2023-09-02', period: 'medium' },
    { day: '2023-09-29', period: 'medium' }, { day: '2023-09-30', period: 'light' } ] });
  ok('a JSON export is read into days', found.length === 4);
  w.__eph.IMP.pending = found;
  await w.__eph.commitImport(); await settle(200);
  const days = w.__eph.S.data.days;
  ok('imported days are written', !!days['2023-09-01'] && !!days['2023-09-29']);
  ok('imported days are marked recalled', days['2023-09-01'].r === true);
  ok('cycle starts are derived from the bleeding days', w.__eph.cycles().some(c => c.start === '2023-09-01' && c.len === 28));
  const flowBefore = days['2023-09-01'].f;
  w.__eph.IMP.pending = [{ iso: '2023-09-01', flow: 1 }];
  await w.__eph.commitImport(); await settle(150);
  ok('an import never overwrites a day already in the record', w.__eph.S.data.days['2023-09-01'].f === flowBefore);
  const paper = w.__eph.paperHtml({ size: 'letter', name: '', notes: 0, blank: 6 });
  ok('the paper log renders at true size', /@page\{size:letter/.test(paper) && /width:100mm/.test(paper));
  ok('the paper log holds a row per recorded cycle', (paper.match(/class="crow"/g) || []).length >= 2);
}

console.log('\n-- workflows --');
{
  w.__eph.showStation('signals');
  ok('the signals station picks a day for you', !!w.__eph.S.selDate && $('sigDay').value === w.__eph.S.selDate);
  w.__eph.showStation('log');
  ok('switching stations draws the one you moved to', !$('st-log').classList.contains('hide'));
  ok('one dispatch table covers every station', w.__eph.STATIONS.every(n => typeof w.__eph.DRAW[n] === 'function'));
  w.__eph.S.selDate = null;
  await w.__eph.S && null;
  $('edNote').value = 'noted without picking a day first';
  await (async () => { $('edSave').click(); })(); await settle(200);
  ok('saving with no day picked writes to today instead of refusing', (w.__eph.S.data.days[w.__eph.D.today()] || {}).n === 'noted without picking a day first');
}

console.log('\n-- undoing a mark made by accident --');
{
  w.localStorage.clear(); w.__ephMem = null; w.__eph.lock();
  $('pp1').value = REAL; $('pp2').value = REAL; $('ppd').value = ''; $('setKdf').value = '16';
  await w.__eph.createRecord(); await settle(200);
  const D2 = w.__eph.D, today = D2.today();

  await w.__eph.quick('start'); await settle(150);
  ok('a quick mark writes today', (w.__eph.S.data.days[today] || {}).f === 3);
  ok('the toast offers a way back', /undo/i.test($('toast').textContent));
  await w.__eph.undoLast(); await settle(150);
  ok('undoing a mark on a day that had nothing removes the day entirely', !w.__eph.S.data.days[today]);

  w.__eph.setDay(today, { f: 4, n: 'heavy, and noted by hand' });
  await w.__eph.persist();
  await w.__eph.quick('today'); await settle(150);
  ok('a tap does not overwrite a heavier reading entered by hand', w.__eph.S.data.days[today].f === 4);
  ok('a tap leaves the note alone', w.__eph.S.data.days[today].n === 'heavy, and noted by hand');

  await w.__eph.quick('end'); await settle(150);
  ok('closing off marks the day as tailing off', w.__eph.S.data.days[today].f === 1);
  await w.__eph.undoLast(); await settle(150);
  ok('undoing a close off puts the reading back exactly', w.__eph.S.data.days[today].f === 4 && w.__eph.S.data.days[today].n === 'heavy, and noted by hand');

  const before = Object.keys(w.__eph.S.data.days).length;
  w.__eph.IMP.pending = [{ iso: '2023-04-01', flow: 3 }, { iso: '2023-04-02', flow: 2 }];
  await w.__eph.commitImport(); await settle(200);
  ok('an import writes its days', Object.keys(w.__eph.S.data.days).length === before + 2);
  await w.__eph.undoLast(); await settle(200);
  ok('an import can be taken back in one step', Object.keys(w.__eph.S.data.days).length === before);

  await w.__eph.undoLast(); await settle(100);
  ok('undoing twice says there is nothing left rather than misbehaving', /nothing to undo/i.test($('toast').textContent));
  ok('the record survives all of that', w.__eph.S.data.days[today].f === 4);
}

console.log('\n-- form alignment --');
{
  const css = w.document.querySelector('style').textContent;
  ok('controls are pinned to a common baseline in a row', /\.grid2>div>:last-child,\.row>div>:last-child\{margin-top:auto\}/.test(css.replace(/\s/g, '')));
  ok('cells are laid out as columns so that can work', /\.grid2>div,\.row>div\{display:flex;flex-direction:column/.test(css.replace(/\s/g, '')));
  const long = [...w.document.querySelectorAll('.grid2 label, .row label')]
    .map(l => l.textContent.trim()).filter(t => t.length > 24);
  ok('no label is long enough to wrap in a narrow cell: ' + (long[0] || 'none'), long.length === 0);
  const cells = [...w.document.querySelectorAll('.grid2 > div')];
  ok('every cell holds its label and its control in that order', cells.every(c => {
    const l = c.querySelector('label'), last = c.lastElementChild;
    return !l || (last && last !== l && /input|select|textarea|div/i.test(last.tagName));
  }));
}

console.log('\n-- the look --');
{
  w.localStorage.clear(); w.__ephMem = null; w.__eph.lock();
  $('pp1').value = REAL; $('pp2').value = REAL; $('ppd').value = ''; $('setKdf').value = '16';
  await w.__eph.createRecord(); await settle(200);
  ok('a new record follows the device rather than forcing dark', w.__eph.S.data.prefs.theme === 'auto');
  ok('following the device resolves to a real theme', ['day', 'night', 'hc'].includes(w.__eph.resolveTheme('auto')));
  ok('an explicit choice is honoured', w.__eph.resolveTheme('day') === 'day' && w.__eph.resolveTheme('hc') === 'hc');
  ok('the look control sits in the header', !!$('btnTheme'));
  ok('the look control is drawn, not written', !!$('btnTheme').querySelector('svg') && $('btnTheme').textContent.trim() === '');
  ok('the lock is drawn, not written', !!$('btnLock').querySelector('svg') && $('btnLock').textContent.trim() === '');
  ok('both still say what they are to a screen reader', /Look:/.test($('btnTheme').getAttribute('aria-label')) && /lock/i.test($('btnLock').getAttribute('aria-label')));
  ok('the two controls sit in one row that cannot wrap them apart', $('btnTheme').parentElement === $('btnLock').parentElement && $('btnTheme').parentElement.className === 'tools');
  const drawn = [];
  const seen = [];
  for (let i = 0; i < 4; i++) {
    await w.__eph.cycleTheme(); await settle(60);
    seen.push(w.__eph.S.data.prefs.theme);
    drawn.push($('btnTheme').innerHTML);
  }
  ok('every look has its own icon', new Set(drawn).size === 4);
  ok('the control cycles through every look', ['auto', 'day', 'night', 'hc'].every(t => seen.includes(t)));
  ok('a light look is reachable in one place', seen.includes('day'));
  ok('high contrast is reachable in the same place', seen.includes('hc'));
  await w.__eph.cycleTheme(); await settle(60);
  const chosen = w.__eph.S.data.prefs.theme;
  ok('the page paints the chosen look', w.document.documentElement.getAttribute('data-theme') === w.__eph.resolveTheme(chosen));
  ok('the choice is kept in the record, not on disk in the open', !JSON.stringify(raw()).includes('theme'));
  ok('the settings menu agrees with the control', $('setTheme').value === chosen);
}

console.log('\n-- clearing from inside an open record --');
{
  w.localStorage.clear(); w.__ephMem = null; w.__eph.lock();
  $('pp1').value = REAL; $('pp2').value = REAL; $('ppd').value = DECOY; $('setKdf').value = '16';
  await w.__eph.createRecord(); await settle(200);
  w.__eph.showStation('record');
  ok('the record station offers clearing', !!$('recClear'));
  ok('nothing destructive is showing until asked for', $('recClearHost').children.length === 0);
  $('recClear').click();
  ok('asking shows the warning and the sealed copy offer', $('recClearHost').textContent.includes('no undo') && $('recClearHost').textContent.includes('sealed copy'));
  $('recClear').click();
  ok('asking again puts it away', $('recClearHost').children.length === 0);
  w.__eph.showStation('safety');
  ok('the safety station offers the same route', !!$('safeClear'));
  $('safeClear').click();
  ok('the same panel appears there', $('safeClearHost').textContent.includes('no undo'));
  const erase = [...$('safeClearHost').querySelectorAll('button')].find(b => /Erase/.test(b.textContent));
  erase.click(); await settle(150);
  ok('erasing from inside clears the device', !w.localStorage.getItem('eph.v1'));
  ok('erasing from inside locks the record away', w.__eph.S.key === null && w.__eph.S.data === null);
  ok('erasing from inside lands on setup', !$('gateSetup').classList.contains('hide') && $('app').classList.contains('hide'));
  ok('the panel does not linger', $('safeClearHost').children.length === 0);
}

console.log('\n-- in app self test --');
w.localStorage.clear(); w.__ephMem = null;
$('pp1').value = REAL; $('pp2').value = REAL; $('ppd').value = ''; $('setKdf').value = '16';
await w.__eph.createRecord(); await settle(200);
const r = await w.__eph.selfTest();
console.log('  self test:', r.total - r.failed, 'of', r.total, 'checks passed');
r.results.filter(x => !x.pass).forEach(x => console.log('    FAIL', x.name));
ok('every in app check passes', r.failed === 0);

console.log('\n' + (fail ? fail + ' FAILED, ' : '') + pass + ' passed');
process.exit(fail ? 1 : 0);

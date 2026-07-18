/* Proves the hand written Argon2id and BLAKE2b in ephemeris.html against an
   independent implementation. Development only: hash-wasm is a test oracle and
   never ships. Run from test/:  npm run verify-argon2  */
import { JSDOM } from 'jsdom';
import { webcrypto } from 'node:crypto';
import fs from 'node:fs';
import { blake2b as refBlake, argon2id as refArgon } from 'hash-wasm';

const html = fs.readFileSync(new URL('../ephemeris.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', url: 'https://ephemeris.test/ephemeris.html' });
const w = dom.window;
Object.defineProperty(w, 'crypto', { value: webcrypto, configurable: true });
await new Promise(r => setTimeout(r, 200));

const enc = s => new TextEncoder().encode(s);
const hex = b => Buffer.from(b).toString('hex');
let fail = 0;
const check = (name, mine, ref) => {
  const good = mine === ref;
  if (!good) fail++;
  console.log((good ? 'ok   ' : 'FAIL ') + name);
  if (!good) { console.log('  in file  ' + mine); console.log('  reference ' + ref); }
};

for (const [text, len] of [['', 64], ['abc', 64], ['abc', 32], ['x'.repeat(200), 48]]) {
  check(`blake2b ${len} bytes of ${JSON.stringify(text.slice(0, 8))}`,
    hex(w.__eph.blake2b(enc(text), len)), await refBlake(text, len * 8));
}

const cases = [
  { pw: 'password', salt: 'somesalt16bytes', t: 2, m: 64, p: 1, len: 32 },
  { pw: 'p', salt: '0123456789abcdef', t: 1, m: 32, p: 1, len: 16 },
  { pw: 'correct horse battery staple', salt: 'ephemeris-test16', t: 3, m: 128, p: 1, len: 32 },
  { pw: 'p', salt: 'saltsaltsaltsalt', t: 2, m: 2048, p: 2, len: 32 },
  { pw: 'p', salt: 'saltsaltsaltsalt', t: 3, m: 4096, p: 4, len: 32 },
  { pw: 'benchmark', salt: '0123456789abcdef', t: 2, m: 65536, p: 1, len: 32 }
];
for (const c of cases) {
  const t0 = Date.now();
  const mine = hex(w.__eph.argon2id(enc(c.pw), enc(c.salt), { t: c.t, m: c.m, p: c.p, dkLen: c.len }));
  const ms = Date.now() - t0;
  const ref = await refArgon({ password: c.pw, salt: enc(c.salt), parallelism: c.p, iterations: c.t, memorySize: c.m, hashLength: c.len, outputType: 'hex' });
  check(`argon2id t=${c.t} m=${c.m}KiB p=${c.p} (${ms}ms in this runtime)`, mine, ref);
}
console.log(fail ? `\n${fail} mismatches` : '\nall vectors match');
process.exit(fail ? 1 : 0);

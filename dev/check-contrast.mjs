/* Reads the palettes straight out of ephemeris.html and checks every pairing
   that carries meaning against WCAG AA. Run by dev/check.sh so a pretty colour
   cannot quietly cost someone the ability to read the app. */
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../ephemeris.html', import.meta.url), 'utf8')
  .split('<style>')[1].split('</style>')[0];

function vars(selector) {
  const block = css.split(selector)[1].split('}')[0];
  const out = {};
  for (const m of block.matchAll(/--([\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}
const themes = {
  Ember: vars(':root{'),
  Blush: vars('html[data-theme="day"]{'),
  'High Contrast': vars('html[data-theme="hc"]{')
};
const lum = h => {
  const c = h.replace('#', '');
  const full = c.length === 3 ? [...c].map(x => x + x).join('') : c;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255)
    .map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
/* [what it is, foreground, background, minimum] */
const PAIRS = [
  ['body text on the background', 'ink', 'bg', 4.5],
  ['body text on a card', 'ink', 'panel', 4.5],
  ['quiet text on a card', 'dim', 'panel', 4.5],
  ['quiet text on the background', 'dim', 'bg', 4.5],
  ['a heading on a card', 'brass', 'panel', 4.5],
  ['a heading on the background', 'brass', 'bg', 4.5],
  ['a steady observation', 'good', 'panel', 4.5],
  ['an observation worth raising', 'warn', 'panel', 4.5],
  ['the number inside a bleeding day', 'on-mark', 'mark', 4.5],
  ['the number inside a light day', 'on-mark-dim', 'mark-dim', 4.5],
  ['the label on a chosen button', 'on-brass', 'brass', 4.5],
  ['a control edge against a card', 'edge', 'panel', 3],
  ['a control edge against the background', 'edge', 'bg', 3],
  ['the focus ring against a card', 'focus', 'panel', 3]
];
let bad = 0;
for (const [name, t] of Object.entries(themes)) {
  console.log('\n' + name);
  for (const [label, fg, bg, min] of PAIRS) {
    if (!t[fg] || !t[bg]) { console.log(`  MISSING ${fg} or ${bg}`); bad++; continue; }
    const v = ratio(t[fg], t[bg]);
    const good = v >= min;
    if (!good) bad++;
    console.log(`  ${good ? 'ok ' : 'LOW'} ${v.toFixed(2).padStart(6)} against ${min}   ${label}`);
  }
}
console.log(bad ? `\n${bad} pairings below the line` : '\nevery pairing clears WCAG AA');
process.exit(bad ? 1 : 0);

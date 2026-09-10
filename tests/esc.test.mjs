/* Pulls escClose out of the shipped public/pulse.js and runs it against a
   stubbed DOM, so the branch order under test is the one that ships. */
import fs from 'node:fs';
import assert from 'node:assert/strict';

const src = fs.readFileSync('public/pulse.js', 'utf8');
const start = src.indexOf('function escClose()');
assert.ok(start > 0, 'escClose must exist in public/pulse.js');
// Balance braces to find the end of the function.
let depth = 0, end = -1;
for (let i = src.indexOf('{', start); i < src.length; i++) {
  if (src[i] === '{') depth++;
  else if (src[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const body = src.slice(start, end);

function harness(open, reassignOpen = false) {
  const els = {};
  for (const id of ['onb', 'pal', 'pk', 'ov', 'amenu', 'lensm']) els['#' + id] = { hidden: !open.includes(id) };
  const closed = [];
  const $ = (s) => els[s] ?? null;
  const $$ = () => [];
  const pC = () => { els['#pal'].hidden = true; closed.push('pal'); };
  const render = () => {};
  const PulseLive = { state: { reassign: { open: reassignOpen ? 'Acme' : null } }, closeReassign: () => { closed.push('reassign'); PulseLive.state.reassign.open = null; } };
  // `window.PulseLive = …` makes PulseLive a global binding in a browser, which
  // is why the shipped code reads it both ways. Supplied both ways here too.
  const fn = new Function('$', '$$', 'pC', 'render', 'window', 'PulseLive', `${body}; return escClose;`)(
    $, $$, pC, render, { PulseLive }, PulseLive);
  const consumed = fn();
  const stillOpen = Object.entries(els).filter(([, v]) => !v.hidden).map(([k]) => k.slice(1));
  return { consumed, stillOpen, closed };
}

let pass = 0, fail = 0;
const t = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : `\n     got  ${JSON.stringify(got)}\n     want ${JSON.stringify(want)}`}`);
};

// Nothing open: Escape is not consumed, so the caller may back out of the page.
t('nothing open falls through', harness([]).consumed, false);

// One layer at a time, topmost first.
t('sheet alone closes',        harness(['ov']).stillOpen, []);
t('drawer alone closes',       harness(['pk']).stillOpen, []);
t('palette alone closes',      harness(['pal']).stillOpen, []);
t('onboarding alone closes',   harness(['onb']).stillOpen, []);
t('menu alone closes',         harness(['amenu']).stillOpen, []);

// The reported bug: a sheet open over a company page must eat the key.
t('sheet over page consumes',  harness(['ov']).consumed, true);

// Stacked: only the topmost goes, and the one beneath survives the press.
t('palette beats sheet',       harness(['pal', 'ov']).stillOpen, ['ov']);
t('drawer beats sheet',        harness(['pk', 'ov']).stillOpen, ['ov']);
t('onb beats everything',      harness(['onb', 'pal', 'pk', 'ov']).stillOpen, ['pal', 'pk', 'ov']);
t('sheet beats menus',         harness(['ov', 'amenu', 'lensm']).stillOpen, ['amenu', 'lensm']);

// The reassign sheet must close through PulseLive, not by hiding the element.
t('reassign closes via state', harness(['ov'], true).closed, ['reassign']);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

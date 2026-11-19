import { PX_PER_MM, CAP_MM, buildKeys, hitKey } from './geometry.js';
import { LAYOUTS, keyContent } from './layouts.js';
import {
  NAMES, chordName, pcsOf, identify, nextPcs, voice, sameChord,
  inScale, isDiatonic, PASS_TYPES, passingChords,
} from './chords.js';
import { Synth, SOUNDS } from './audio.js';
import { Output, OUTPUT_MODES } from './output.js';

// Touch radius (CSS px) -> expression. Provisional: tune from touch-test results.
const R_REST = 10;          // radius at light contact -> aftertouch 0
const R_FULL = 22;          // radius at full press -> aftertouch 127
const VEL_DEFAULT = 100;    // when the browser reports no radius (mouse)
const PASS_STEP_MS = 300;   // passing chord length: an eighth note at 100 BPM

const COLORS = {
  root: '#D85A30', scale: '#1D9E75', out: '#534AB7', pressed: '#FAC775',
  locked: '#151518', chordTone: '#FFFFFF', next: '#5DCAA5',
};

const synth = new Synth();
const out = new Output(synth);
const S = {
  layout: 0, tonic: 0, scaleLock: false, passType: 0, passHeld: false, latch: false,
  current: null, prevVoicing: null, label: '',
};
const touches = new Map(); // touch id -> { key, notes, timers, vel, at }
let latched = [];
let keys = [];
let dirty = true;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const $ = id => document.getElementById(id);

// ---------- canvas + geometry ----------
const cv = $('keys');
const ctx = cv.getContext('2d');
let W = 0, H = 0;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = window.innerWidth; H = window.innerHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  keys = buildKeys(W, H);
  assignContent();
}

function assignContent() {
  const L = LAYOUTS[S.layout];
  for (const k of keys) Object.assign(k, keyContent(L, k.q, k.r, S.tonic));
  dirty = true;
}

const playable = k => !!k.chord || !(S.scaleLock && !inScale(k.note % 12, S.tonic));

// ---------- playing ----------
const velFrom = r => (r > 0 ? clamp(Math.round(50 + (r - 8) * 5), 30, 127) : VEL_DEFAULT);
const atFrom = r => clamp(Math.round(((r - R_REST) / (R_FULL - R_REST)) * 127), 0, 127);

function newRec() { return { key: null, notes: [], timers: [], vel: VEL_DEFAULT, at: 0 }; }

function sound(rec, notes) {
  rec.notes.forEach(n => out.noteOff(n));
  rec.notes = notes;
  notes.forEach(n => out.noteOn(n, rec.vel));
  dirty = true;
}

function playChord(rec, chord) {
  const v = voice(chord, S.prevVoicing);
  S.prevVoicing = v;
  S.current = chord;
  sound(rec, [36 + chord.root, ...v]); // bass note + voice-led chord
}

function press(rec, k, radius) {
  rec.key = k;
  rec.vel = velFrom(radius);
  if (k.chord) {
    if (S.passHeld && S.current && !sameChord(S.current, k.chord)) {
      const seq = [...passingChords(PASS_TYPES[S.passType], S.current, k.chord, S.tonic), k.chord];
      S.label = [S.current, ...seq].map(chordName).join(' → ');
      playChord(rec, seq[0]);
      for (let i = 1; i < seq.length; i++) {
        rec.timers.push(setTimeout(() => playChord(rec, seq[i]), i * PASS_STEP_MS));
      }
    } else {
      S.label = '';
      playChord(rec, k.chord);
    }
  } else {
    sound(rec, [k.note]);
    updateCurrent();
  }
}

function releaseRec(rec, allowLatch) {
  rec.timers.forEach(clearTimeout);
  rec.timers = [];
  if (allowLatch && S.latch) latched.push(...rec.notes);
  else rec.notes.forEach(n => out.noteOff(n));
  rec.notes = [];
  rec.key = null;
  dirty = true;
}

function releaseLatched() {
  latched.forEach(n => out.noteOff(n));
  latched = [];
  dirty = true;
}

function soundingNotes() {
  const all = [...latched];
  for (const r of touches.values()) all.push(...r.notes);
  return all;
}

// In note layouts, name whatever is sounding; keep the last chord for guidance after release.
function updateCurrent() {
  if (LAYOUTS[S.layout].chord) return;
  const c = identify(soundingNotes());
  if (c) S.current = c;
}

function allOff() {
  for (const r of touches.values()) { r.timers.forEach(clearTimeout); r.timers = []; r.notes = []; r.key = null; }
  latched = [];
  out.allOff();
  dirty = true;
}

// Stop everything now, including notes the app lost track of.
function silence() {
  for (const r of touches.values()) { r.timers.forEach(clearTimeout); r.timers = []; r.notes = []; r.key = null; }
  latched = [];
  out.silence();
  dirty = true;
}

function resetDefaults() {
  silence();
  Object.assign(S, {
    layout: 0, tonic: 0, scaleLock: false, passType: 0, passHeld: false, latch: false,
    current: null, prevVoicing: null, label: '',
  });
  synth.inst = 0;
  out.mode = 0;
  out.bend(0);
  out.mod(0);
  $('s-pitch').querySelector('i').style.left = '50%';
  $('s-mod').querySelector('i').style.left = '0%';
  assignContent();
}

// ---------- touch input ----------
function onStart(id, x, y, radius) {
  const anyDown = [...touches.values()].some(r => r.key);
  const rec = newRec();
  touches.set(id, rec);
  const k = hitKey(keys, x, y);
  if (k && playable(k)) {
    if (!anyDown) releaseLatched();
    press(rec, k, radius);
  }
}

function onMove(id, x, y, radius) {
  const rec = touches.get(id);
  if (!rec) return;
  const k = hitKey(keys, x, y);
  if (k !== rec.key) { // glide to another key
    if (rec.key) releaseRec(rec, false);
    if (k && playable(k)) press(rec, k, radius);
    updateCurrent();
    return;
  }
  if (rec.key && radius > 0) {
    const at = atFrom(radius);
    if (Math.abs(at - rec.at) >= 2) {
      rec.at = at;
      rec.notes.forEach(n => out.aftertouch(n, at));
    }
  }
}

function onEnd(id) {
  const rec = touches.get(id);
  if (!rec) return;
  if (rec.key) releaseRec(rec, true);
  touches.delete(id);
  updateCurrent();
}

const opts = { passive: false };
cv.addEventListener('touchstart', e => {
  e.preventDefault();
  for (const t of e.changedTouches) onStart(t.identifier, t.clientX, t.clientY, t.radiusX || 0);
}, opts);
cv.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) onMove(t.identifier, t.clientX, t.clientY, t.radiusX || 0);
}, opts);
const endHandler = e => { e.preventDefault(); for (const t of e.changedTouches) onEnd(t.identifier); };
cv.addEventListener('touchend', endHandler, opts);
cv.addEventListener('touchcancel', endHandler, opts);

// Mouse, for testing on a computer.
let mouseDown = false;
cv.addEventListener('mousedown', e => { mouseDown = true; onStart('m', e.clientX, e.clientY, 0); });
window.addEventListener('mousemove', e => { if (mouseDown) onMove('m', e.clientX, e.clientY, 0); });
window.addEventListener('mouseup', () => { if (mouseDown) { mouseDown = false; onEnd('m'); } });

document.addEventListener('gesturestart', e => e.preventDefault(), opts);
document.addEventListener('contextmenu', e => e.preventDefault());

// ---------- control strip ----------
function tap(id, fn) {
  $(id).addEventListener('pointerdown', e => { e.preventDefault(); fn(); updateStrip(); });
}

tap('b-layout', () => {
  allOff();
  S.layout = (S.layout + 1) % LAYOUTS.length;
  S.current = null; S.prevVoicing = null; S.label = '';
  assignContent();
});
tap('b-key', () => { allOff(); S.tonic = (S.tonic + 7) % 12; assignContent(); });
tap('b-lock', () => { S.scaleLock = !S.scaleLock; dirty = true; });
tap('b-sound', () => { synth.inst = (synth.inst + 1) % SOUNDS.length; });
tap('b-out', () => { allOff(); out.mode = (out.mode + 1) % OUTPUT_MODES.length; });
tap('b-ptype', () => { S.passType = (S.passType + 1) % PASS_TYPES.length; });
tap('b-latch', () => { S.latch = !S.latch; if (!S.latch) releaseLatched(); });
tap('b-silence', silence);
tap('b-reset', resetDefaults);

const pass = $('b-pass');
pass.addEventListener('pointerdown', e => {
  e.preventDefault(); pass.setPointerCapture(e.pointerId); S.passHeld = true; updateStrip();
});
['pointerup', 'pointercancel'].forEach(ev => pass.addEventListener(ev, () => { S.passHeld = false; updateStrip(); }));

function slider(id, onValue, springBack) {
  const el = $(id), thumb = el.querySelector('i');
  const set = e => {
    const r = el.getBoundingClientRect();
    const f = clamp((e.clientX - r.left) / r.width, 0, 1);
    thumb.style.left = (f * 100) + '%';
    onValue(f);
  };
  el.addEventListener('pointerdown', e => { e.preventDefault(); el.setPointerCapture(e.pointerId); set(e); });
  el.addEventListener('pointermove', e => { if (el.hasPointerCapture(e.pointerId)) set(e); });
  const up = () => { if (springBack) { thumb.style.left = '50%'; onValue(0.5); } };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
}
slider('s-pitch', f => out.bend((f - 0.5) * 2), true);
slider('s-mod', f => out.mod(f), false);
$('s-mod').querySelector('i').style.left = '0%';

function setBtn(id, value, on, small) {
  const b = $(id);
  b.querySelector('span').textContent = value;
  if (small !== undefined) b.querySelector('small').textContent = small;
  b.classList.toggle('on', !!on);
}

function updateStrip() {
  setBtn('b-layout', LAYOUTS[S.layout].name);
  setBtn('b-key', NAMES[S.tonic] + ' major');
  setBtn('b-lock', S.scaleLock ? 'On' : 'Off', S.scaleLock);
  setBtn('b-sound', SOUNDS[synth.inst]);
  const midiNote = out.mode === 0 ? 'Output' : out.status === 'connected' ? 'Output · ok' : 'Output · ' + out.status;
  setBtn('b-out', OUTPUT_MODES[out.mode], false, midiNote);
  setBtn('b-ptype', PASS_TYPES[S.passType]);
  setBtn('b-latch', S.latch ? 'On' : 'Off', S.latch);
  pass.classList.toggle('on', S.passHeld);
}
out.onStatus = updateStrip;

// ---------- drawing ----------
function hexPath(x, y, r) {
  ctx.beginPath();
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 2 + k * Math.PI / 3;
    ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
  }
  ctx.closePath();
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  const R = (CAP_MM / Math.sqrt(3)) * PX_PER_MM;
  const sounding = new Set(soundingNotes());
  const held = new Set([...touches.values()].map(r => r.key).filter(Boolean));
  const cur = S.current ? pcsOf(S.current) : null;
  const nxt = S.current ? nextPcs(S.current) : [];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const k of keys) {
    let fill, alpha = 0.45, stroke = null, label;
    if (k.chord) {
      label = chordName(k.chord);
      fill = isDiatonic(k.chord, S.tonic) ? COLORS.scale : COLORS.out;
      if (held.has(k)) { fill = COLORS.pressed; alpha = 1; }
      else if (cur) {
        const shared = pcsOf(k.chord).filter(p => cur.includes(p)).length;
        if (sameChord(k.chord, S.current)) { alpha = 0.95; stroke = COLORS.chordTone; }
        else if (shared >= 2) { alpha = 0.9; stroke = COLORS.next; }
        else if (shared === 1) alpha = 0.65;
      }
    } else {
      const pc = k.note % 12;
      const ins = inScale(pc, S.tonic);
      label = NAMES[pc] + (pc === 0 ? Math.floor(k.note / 12) - 1 : '');
      if (S.scaleLock && !ins) { fill = COLORS.locked; alpha = 1; label = ''; }
      else {
        fill = pc === S.tonic ? COLORS.root : ins ? COLORS.scale : COLORS.out;
        if (sounding.has(k.note)) { fill = COLORS.pressed; alpha = 1; }
        else if (cur && cur.includes(pc)) { alpha = 0.95; stroke = COLORS.chordTone; }
        else if (nxt.includes(pc)) { stroke = COLORS.next; }
      }
    }
    hexPath(k.x, k.y, R);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.globalAlpha = 1;
    if (stroke) { ctx.lineWidth = 3; ctx.strokeStyle = stroke; ctx.stroke(); }
    if (label) {
      ctx.fillStyle = fill === COLORS.pressed ? '#412402' : '#F1EFE8';
      ctx.font = (k.chord ? '13px' : '15px') + ' -apple-system, system-ui, sans-serif';
      ctx.fillText(label, k.x, k.y);
    }
  }

  $('r-chord').textContent = S.current ? chordName(S.current) : '—';
  $('r-pass').textContent = S.label;
}

function frame() {
  if (dirty) { dirty = false; draw(); }
  requestAnimationFrame(frame);
}

// ---------- start ----------
let wake = null;
async function requestWake() {
  if (wake || !('wakeLock' in navigator)) return;
  try { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } catch (_) {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && wake === null && synth.ctx) requestWake(); });

$('splash').addEventListener('pointerdown', e => {
  e.preventDefault();
  synth.start();
  requestWake();
  $('splash').remove();
});

window.addEventListener('resize', resize);
resize();
updateStrip();
requestAnimationFrame(frame);

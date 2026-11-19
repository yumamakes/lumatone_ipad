// Chord vocabulary, identification, voice-leading and passing chords.

export const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
export const MAJOR = [0, 2, 4, 5, 7, 9, 11];

export const QUALITIES = {
  maj: [0, 4, 7], min: [0, 3, 7], '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10],
  dim: [0, 3, 6], dim7: [0, 3, 6, 9], m7b5: [0, 3, 6, 10], aug: [0, 4, 8], sus4: [0, 5, 7],
};
const SUFFIX = {
  maj: '', min: 'm', '7': '7', maj7: 'maj7', m7: 'm7',
  dim: 'dim', dim7: 'dim7', m7b5: 'm7♭5', aug: '+', sus4: 'sus4',
};
const ORDER = ['maj', 'min', '7', 'maj7', 'm7', 'dim', 'dim7', 'm7b5', 'aug', 'sus4'];
const DIATONIC_TRIAD = ['maj', 'min', 'min', 'maj', 'maj', 'min', 'dim'];
const DIATONIC_7TH = ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'];

const mod12 = n => ((n % 12) + 12) % 12;

export const pcsOf = c => QUALITIES[c.q].map(i => mod12(c.root + i));
export const chordName = c => NAMES[c.root] + SUFFIX[c.q];
export const sameChord = (a, b) => !!a && !!b && a.root === b.root && a.q === b.q;
export const inScale = (pc, tonic) => MAJOR.includes(mod12(pc - tonic));

export function isDiatonic(c, tonic) {
  const deg = MAJOR.indexOf(mod12(c.root - tonic));
  if (deg < 0) return false;
  return DIATONIC_TRIAD[deg] === c.q || DIATONIC_7TH[deg] === c.q;
}

// Name the chord formed by a set of MIDI notes (3+ distinct pitch classes), preferring the bass note as root.
export function identify(notes) {
  const pcs = [...new Set(notes.map(mod12))];
  if (pcs.length < 3) return null;
  const bass = mod12(Math.min(...notes));
  const roots = [bass, ...pcs.filter(p => p !== bass)];
  for (const root of roots) {
    for (const q of ORDER) {
      const set = pcsOf({ root, q });
      if (set.length === pcs.length && set.every(p => pcs.includes(p))) return { root, q };
    }
  }
  return null;
}

// Notes that turn the current triad into a neighbouring triad by moving one note (P, L, R).
export function nextPcs(c) {
  const r = c.root;
  if (c.q === 'maj') return [r + 3, r + 11, r + 9].map(mod12);
  if (c.q === 'min') return [r + 4, r + 8, r + 10].map(mod12);
  return [];
}

// Pick the inversion and octave that moves the fewest semitones from the previous voicing.
export function voice(chord, prev) {
  const pcs = pcsOf(chord);
  let best = null;
  let bestCost = Infinity;
  for (let inv = 0; inv < pcs.length; inv++) {
    const order = pcs.slice(inv).concat(pcs.slice(0, inv));
    for (let start = 48; start < 67; start++) {
      if (mod12(start) !== order[0]) continue;
      const v = [start];
      for (let i = 1; i < order.length; i++) {
        let x = v[i - 1] + 1;
        while (mod12(x) !== order[i]) x++;
        v.push(x);
      }
      const cost = prev ? distance(v, prev) : Math.abs(v[0] - 55);
      if (cost < bestCost) { bestCost = cost; best = v; }
    }
  }
  return best;
}

function distance(a, b) {
  let s = 0;
  for (const x of a) s += Math.min(...b.map(y => Math.abs(x - y)));
  for (const y of b) s += Math.min(...a.map(x => Math.abs(x - y)));
  return s;
}

export const PASS_TYPES = ['Sec dom', 'Dim', 'Tritone', 'Chromatic', 'ii–V', 'Diatonic'];

// Chords to insert between A and B. Returns an array (ii–V gives two).
export function passingChords(type, A, B, tonic) {
  const b = B.root;
  switch (type) {
    case 'Sec dom': return [{ root: mod12(b + 7), q: '7' }];
    case 'Dim': return [{ root: mod12(b + 11), q: 'dim7' }];
    case 'Tritone': return [{ root: mod12(b + 1), q: '7' }];
    case 'Chromatic': return [{ root: mod12(b + 11), q: B.q }];
    case 'ii–V': return [{ root: mod12(b + 2), q: 'm7' }, { root: mod12(b + 7), q: '7' }];
    case 'Diatonic': {
      const da = MAJOR.indexOf(mod12(A.root - tonic));
      const db = MAJOR.indexOf(mod12(b - tonic));
      if (da >= 0 && db >= 0) {
        let d = (((db - da) % 7) + 7) % 7;
        if (d > 3) d -= 7;
        if (Math.abs(d) >= 2) {
          const dm = (((da + Math.sign(d)) % 7) + 7) % 7;
          return [{ root: mod12(tonic + MAJOR[dm]), q: DIATONIC_TRIAD[dm] }];
        }
      }
      return [{ root: mod12(b + 7), q: '7' }]; // fallback: secondary dominant
    }
  }
  return [];
}

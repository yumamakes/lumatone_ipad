// Key -> note (or chord) for each layout preset.
// Neighbour directions on the grid: right (q+1), up-right (q+0.5, r+1), up-left (q-0.5, r+1).

const CHORD_ROWS = ['maj', 'min', '7', 'm7', 'maj7', 'dim7']; // row 0 (bottom) to row 5

export const LAYOUTS = [
  // Harmonic Table / Tonnetz: right +4 (M3), up-right +7 (P5), up-left +3 (m3).
  // Any three touching keys form a major or minor triad.
  { name: 'Harmonic', note: (q, r) => 48 + 4 * q + 5 * r },

  // Classic (Bosanquet-Wilson / Janko family): whole tones across, semitones between rows.
  // Lumatone repeats identical manuals on separate channels; here each pair of rows is one octave up instead.
  { name: 'Classic', note: (q, r) => 56 + 2 * q + 12 * Math.floor(r / 2) },

  // Melodic (Wicki-Hayden): right +2, up-right +7, up-left +5.
  { name: 'Melodic', note: (q, r) => 48 + 2 * q + 6 * r },

  // Chord grid: each row is one chord quality; roots move by fifths left to right, centred on the key.
  {
    name: 'Chord grid',
    chord: (q, r, tonic) => {
      const k = r % 2 ? q - 0.5 : q;
      return { root: (((tonic + 7 * k) % 12) + 12) % 12, q: CHORD_ROWS[r] };
    },
  },
];

export function keyContent(layout, q, r, tonic) {
  if (layout.chord) return { chord: layout.chord(q, r, tonic), note: null };
  return { note: Math.round(layout.note(q, r)), chord: null };
}

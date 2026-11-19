// Physical layout of the 51-key overlay on the iPad Air 4 (A2316).
// All values hardcoded in mm; converted to CSS px for drawing and hit-testing.

export const PX_PER_MM = 132 / 25.4;              // 264 ppi at devicePixelRatio 2
export const PITCH_MM = 24.15;                    // key centre-to-centre
export const ROW_MM = PITCH_MM * Math.sqrt(3) / 2; // 20.91 mm between rows
export const CAP_MM = 21;                         // cap flat-to-flat
export const STRIP_MM = 18;                       // uncovered control strip at the top
export const HIT_MM = 12.5;                       // max distance from a key centre that counts as that key
export const OFFSET_X_MM = 0;                     // nudge to line the grid up with the printed frame
export const OFFSET_Y_MM = 0;

// 6 rows, alternating 9 / 8 keys. Row 0 is nearest the player (bottom of the screen).
// q is the horizontal position in key pitches (half-integers on odd rows).
export function buildKeys(widthPx, heightPx) {
  const cx = widthPx / PX_PER_MM / 2 + OFFSET_X_MM;
  const cy = (heightPx / PX_PER_MM + STRIP_MM) / 2 + OFFSET_Y_MM;
  const keys = [];
  for (let r = 0; r < 6; r++) {
    const n = r % 2 ? 8 : 9;
    for (let j = 0; j < n; j++) {
      const q = r % 2 ? j - 3.5 : j - 4;
      keys.push({
        i: keys.length, q, r,
        x: (cx + q * PITCH_MM) * PX_PER_MM,
        y: (cy + (2.5 - r) * ROW_MM) * PX_PER_MM,
      });
    }
  }
  return keys;
}

export function hitKey(keys, x, y) {
  let best = null;
  let bestD = (HIT_MM * PX_PER_MM) ** 2;
  for (const k of keys) {
    const d = (k.x - x) ** 2 + (k.y - y) ** 2;
    if (d < bestD) { bestD = d; best = k; }
  }
  return best;
}

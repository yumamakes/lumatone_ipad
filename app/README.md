# app

The instrument: a static web page (plain HTML/CSS/JS modules, no build step) run full screen on the iPad Air 4 (A2316) from the home screen.

Pipeline: **Touch → Key ID → Layout → Chord engine → Output router**

## Files
- `index.html` — page, control strip, styles.
- `js/geometry.js` — 51-key grid in mm (24.15 mm pitch, 6 rows of 9/8, 18 mm control strip), hit-testing, frame-alignment offsets.
- `js/layouts.js` — Harmonic (Tonnetz: +4 / +7 / +3), Classic (whole tones across, semitones between rows, octave per row pair), Melodic (Wicki-Hayden: +2 / +7 / +5), Chord grid (rows: maj, m, 7, m7, maj7, dim7; roots by fifths around the key).
- `js/chords.js` — chord naming, P/L/R neighbour notes, voice-leading, passing-chord rules.
- `js/audio.js` — built-in synths: Keys, E-piano, Pad, Organ.
- `js/output.js` — built-in / MIDI / both; MIDI goes over a WebSocket to `../bridge`.
- `js/main.js` — touch handling, expression, control strip, drawing.

## Playing
- **Note layouts:** keys show note names. While a chord sounds, its notes get a white outline and the notes that move it to a neighbouring major/minor chord get a teal outline.
- **Chord grid:** each key plays a voice-led chord with a bass note. Chords sharing two notes with the current chord get a teal outline.
- **Pass:** in Chord grid, hold Pass and press the target chord. The app plays the passing chord(s) for an eighth note each (100 BPM), then lands on the target. Pass type picks the rule: Sec dom, Dim, Tritone, Chromatic, ii–V, Diatonic.
- **Key:** steps through major keys by fifths. **Scale lock** darkens and silences out-of-key notes.
- **Latch:** chords keep sounding after release until the next press.
- **Pitch / Mod strips:** ±2 semitone bend (springs back); vibrato depth (stays).
- Gliding a finger between keys retriggers (useful without the overlay).

## Expression (provisional)
Touch radius drives velocity (at key-down) and polyphonic aftertouch (while held). Constants `R_REST`, `R_FULL` in `main.js` should be set from `../touch-test` results.

## Outputs
- **Built-in** works from any URL (GitHub Pages is fine).
- **MIDI** needs the page served by the bridge over plain http on your network: Safari blocks `ws://` connections from https pages.

## iPad setup
1. Open in Safari → Share → Add to Home Screen → launch from the home screen.
2. Settings → Multitasking & Gestures → turn off four- and five-finger gestures.
3. Optional: Guided Access during performance.

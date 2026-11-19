# app

The instrument: a single static web page (plain HTML/CSS/JS, no build step) run full screen on the iPad Air 4 (A2316) from the home screen.

Pipeline: **Touch → Key ID → Layout → Chord engine → Output router**

- **Key ID:** hardcoded table from screen position (mm) to key number for the 51-key, 24.15 mm-pitch overlay (6 rows, alternating 9 / 8 keys).
- **Layouts:** Classic, Melodic (Wicki-Hayden), Harmonic Table, Scale Lock, Chord Grid.
- **Chord engine:** Tonnetz guidance lighting, auto voice-leading, passing chords.
- **Outputs:** built-in Web Audio instruments; DAW / MIDI over WebSocket to `../bridge`.
- **Control strip:** uncovered ~18 mm strip for modes, output, pitch/mod strips, pass, latch.

Status: not started (build order step 2).

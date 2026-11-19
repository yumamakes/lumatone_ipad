# Hexboard

A Lumatone-style hexagonal keyboard built from an iPad Air 4 (A2316) and a 3D-printed overlay of moving key caps. The iPad handles sensing, display, logic and sound; the overlay supplies physical keys.

## Layout
- `touch-test/` — step 1: single-key test page. Shows raw touch position, contact radius, press timing and bounces; exports a CSV.
- `app/` — the instrument (planned).
- `bridge/` — WebSocket → MIDI script for a Mac/PC (planned; Safari has no Web MIDI).
- `hardware/` — OpenSCAD files for caps, springs and frame (planned).

## Running the touch test on the iPad
1. Serve the repo over HTTPS (e.g. GitHub Pages) and open `touch-test/` in Safari.
2. Share → Add to Home Screen, then launch it from the home screen (full screen, no browser bars).
3. iPadOS Settings → Multitasking & Gestures → turn off four- and five-finger gestures.
4. Hold the iPad in landscape. Place the printed test cap on the hex outline in the centre.

## What to check in the touch test
- **Registration:** every press of the cap shows one touch, and nothing shows when the cap is at rest.
- **Clean release:** the `bounces` counter stays at 0 over many presses.
- **Pressure:** `maxR` rises when you press harder, and the strip chart moves smoothly instead of jumping in coarse steps.
- **Velocity:** `growth` is larger for fast strikes than for slow presses.
- Compare against a bare fingertip first to get a baseline.

Values are hardcoded for the A2316: 132 CSS px per inch (5.197 px/mm).

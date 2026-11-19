# bridge

Small script for a Mac/PC that receives note messages from the iPad page over a WebSocket (Wi-Fi) and sends them out a virtual MIDI port. A DAW sees it as a normal MIDI keyboard; hardware synths connect through the computer.

Needed because Safari on iPad has no Web MIDI.

- Messages: note on/off, polyphonic aftertouch, pitch bend, mod wheel, plus MIDI clock back to the iPad for passing-chord timing.
- Target: ~30 lines, Node or Python, hardcoded port and port name.

Status: not started (build order step 4).

// Built-in instruments: small Web Audio synths, one voice per MIDI note.

export const SOUNDS = ['Keys', 'E-piano', 'Pad', 'Organ'];

const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
const BEND_RANGE = 2;     // semitones
const VIBRATO_CENTS = 30; // at full mod

export class Synth {
  constructor() {
    this.ctx = null;
    this.inst = 0;
    this.voices = new Map();
    this.bendCents = 0;
  }

  start() {
    if (this.ctx) { this.ctx.resume(); return; }
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (_) {}
    const c = this.ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    const comp = c.createDynamicsCompressor();
    comp.connect(c.destination);
    this.master = c.createGain();
    this.master.gain.value = 0.3;
    this.master.connect(comp);
    const lfo = c.createOscillator();
    lfo.frequency.value = 5.5;
    this.vib = c.createGain();
    this.vib.gain.value = 0;
    lfo.connect(this.vib);
    lfo.start();
  }

  osc(type, freq, dest, offCents = 0) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    o.off = offCents;
    o.detune.value = this.bendCents + offCents;
    this.vib.connect(o.detune);
    o.onended = () => { try { this.vib.disconnect(o.detune); } catch (_) {} };
    if (dest) o.connect(dest);
    return o;
  }

  noteOn(n, vel) {
    if (!this.ctx) return;
    if (this.voices.has(n)) this.noteOff(n);
    const c = this.ctx, t = c.currentTime, f = mtof(n), v = vel / 127;
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass';
    const g = c.createGain();
    g.gain.value = 0;
    filt.connect(g);
    g.connect(this.master);
    const voice = { g, filt, oscs: [], rel: 0.3, fBase: 6000, fRange: 0 };

    switch (SOUNDS[this.inst]) {
      case 'Keys': {
        voice.oscs.push(this.osc('triangle', f, filt));
        const h = c.createGain(); h.gain.value = 0.3; h.connect(filt);
        voice.oscs.push(this.osc('sine', f * 2, h));
        voice.fBase = 800 + v * 3000; voice.fRange = 2000; voice.rel = 0.25;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(v, t + 0.005);
        g.gain.setTargetAtTime(0, t + 0.005, 0.8);
        break;
      }
      case 'E-piano': {
        const mod = this.osc('sine', f, null);
        const mg = c.createGain();
        mg.gain.setValueAtTime(f * (1 + v * 3), t);
        mg.gain.setTargetAtTime(f * 0.2, t, 0.3);
        mod.connect(mg);
        const car = this.osc('sine', f, filt);
        mg.connect(car.frequency);
        voice.oscs.push(mod, car);
        voice.rel = 0.3;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(v, t + 0.003);
        g.gain.setTargetAtTime(0, t + 0.003, 1.2);
        break;
      }
      case 'Pad': {
        voice.oscs.push(this.osc('sawtooth', f, filt), this.osc('sawtooth', f, filt, 8));
        filt.Q.value = 2;
        voice.fBase = 500; voice.fRange = 3000; voice.rel = 1.2;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(v * 0.5, t + 0.4);
        break;
      }
      case 'Organ': {
        [[1, 0.5], [2, 0.3], [3, 0.2]].forEach(([m, lvl]) => {
          const h = c.createGain(); h.gain.value = lvl; h.connect(filt);
          voice.oscs.push(this.osc('sine', f * m, h));
        });
        voice.rel = 0.08;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(v * 0.6, t + 0.01);
        break;
      }
    }
    filt.frequency.value = voice.fBase;
    voice.oscs.forEach(o => o.start(t));
    this.voices.set(n, voice);
  }

  noteOff(n) {
    const vo = this.voices.get(n);
    if (!vo) return;
    this.voices.delete(n);
    const t = this.ctx.currentTime;
    const now = vo.g.gain.value;
    vo.g.gain.cancelScheduledValues(t);
    vo.g.gain.setValueAtTime(now, t);
    vo.g.gain.setTargetAtTime(0, t, vo.rel / 4);
    vo.oscs.forEach(o => o.stop(t + vo.rel * 2));
  }

  aftertouch(n, at) {
    const vo = this.voices.get(n);
    if (!vo || !vo.fRange) return;
    vo.filt.frequency.setTargetAtTime(vo.fBase + (at / 127) * vo.fRange, this.ctx.currentTime, 0.03);
  }

  setBend(b) { // b: -1..1
    if (!this.ctx) return;
    this.bendCents = b * BEND_RANGE * 100;
    const t = this.ctx.currentTime;
    for (const vo of this.voices.values()) {
      for (const o of vo.oscs) o.detune.setTargetAtTime(this.bendCents + o.off, t, 0.01);
    }
  }

  setMod(m) { // m: 0..1
    if (!this.ctx) return;
    this.vib.gain.setTargetAtTime(m * VIBRATO_CENTS, this.ctx.currentTime, 0.02);
  }

  allOff() {
    for (const n of [...this.voices.keys()]) this.noteOff(n);
  }
}

// Output router: built-in synth and/or MIDI over a WebSocket to the bridge.
// Safari blocks ws:// from https pages, so MIDI works only when the page is served by the bridge over http.

export const OUTPUT_MODES = ['Built-in', 'MIDI', 'Both'];
const CH = 0; // MIDI channel 1

export class Output {
  constructor(synth) {
    this.synth = synth;
    this.mode = 0;
    this.refs = new Map(); // note -> how many keys are holding it
    this.ws = null;
    this.onStatus = () => {};
    this.status = location.protocol === 'http:' ? 'connecting' : 'no bridge';
    if (location.protocol === 'http:') this.connect();
  }

  connect() {
    const ws = new WebSocket(`ws://${location.host}/midi`);
    ws.binaryType = 'arraybuffer';
    ws.onopen = () => { this.ws = ws; this.setStatus('connected'); };
    ws.onclose = () => { this.ws = null; this.setStatus('connecting'); setTimeout(() => this.connect(), 2000); };
    ws.onerror = () => {};
  }

  setStatus(s) { this.status = s; this.onStatus(); }
  get builtin() { return this.mode !== 1; }
  get midi() { return this.mode !== 0; }

  send(bytes) {
    if (this.midi && this.ws && this.ws.readyState === 1) this.ws.send(new Uint8Array(bytes));
  }

  noteOn(n, vel) {
    if (n < 0 || n > 127) return;
    const c = this.refs.get(n) || 0;
    this.refs.set(n, c + 1);
    if (c) return;
    if (this.builtin) this.synth.noteOn(n, vel);
    this.send([0x90 | CH, n, vel]);
  }

  noteOff(n) {
    const c = this.refs.get(n) || 0;
    if (!c) return;
    if (c > 1) { this.refs.set(n, c - 1); return; }
    this.refs.delete(n);
    this.synth.noteOff(n);
    this.send([0x80 | CH, n, 0]);
  }

  aftertouch(n, at) {
    if (!this.refs.has(n)) return;
    if (this.builtin) this.synth.aftertouch(n, at);
    this.send([0xA0 | CH, n, at]);
  }

  bend(b) { // -1..1
    const v = Math.max(0, Math.min(16383, Math.round(((b + 1) / 2) * 16383)));
    this.synth.setBend(b);
    this.send([0xE0 | CH, v & 127, v >> 7]);
  }

  mod(m) { // 0..1
    this.synth.setMod(m);
    this.send([0xB0 | CH, 1, Math.round(m * 127)]);
  }

  allOff() {
    for (const n of this.refs.keys()) { this.synth.noteOff(n); this.send([0x80 | CH, n, 0]); }
    this.refs.clear();
    this.synth.allOff();
    this.send([0xB0 | CH, 123, 0]);
  }
}

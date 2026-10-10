// The sound engine (PRD: Design system, Sound). Every sound is synthesized with Web Audio from
// noise, so nothing needs licensing. Nothing plays before a gesture: `unlock` must run inside one.
// Levels are the PRD's starting points in dBFS; tune by ear.

export type Cue = "tick" | "breath" | "paper" | "press";

const db = (value: number) => 10 ** (value / 20);
const STORAGE_KEY = "arcade.sound";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let white: AudioBuffer | null = null;
let muted = true;

function noiseBuffers(context: AudioContext) {
  const length = context.sampleRate * 2;
  const whiteBuffer = context.createBuffer(1, length, context.sampleRate);
  const brownBuffer = context.createBuffer(1, length, context.sampleRate);
  const w = whiteBuffer.getChannelData(0);
  const b = brownBuffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    w[i] = Math.random() * 2 - 1;
    last = (last + 0.02 * w[i]) / 1.02;
    b[i] = last * 3.5;
  }
  return { whiteBuffer, brownBuffer };
}

function loop(context: AudioContext, buffer: AudioBuffer) {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.start();
  return source;
}

/** Room tone: filtered brown noise with faint air, −42 dBFS. Fades in over the gate's 1200 ms. */
function startRoomTone(context: AudioContext, out: AudioNode, brown: AudioBuffer, whiteBuffer: AudioBuffer) {
  const body = context.createBiquadFilter();
  body.type = "lowpass";
  body.frequency.value = 320;
  const air = context.createBiquadFilter();
  air.type = "highpass";
  air.frequency.value = 6000;
  const airGain = context.createGain();
  airGain.gain.value = db(-24);
  const level = context.createGain();
  level.gain.setValueAtTime(0, context.currentTime);
  level.gain.linearRampToValueAtTime(db(-42), context.currentTime + 1.2);

  loop(context, brown).connect(body).connect(level);
  loop(context, whiteBuffer).connect(air).connect(airGain).connect(level);
  level.connect(out);
}

/**
 * Builds the context and the room tone while the gate idles. Starting an AudioContext opens the audio
 * device, which took about 200 ms on a Windows laptop; inside the Enter click that stalled the gate's
 * lift. A context made before any gesture starts suspended, and its clock (and so the room tone's
 * fade-in) holds at zero until `unlock` resumes it. Safe to call more than once.
 */
export function prepare() {
  if (ctx || typeof window === "undefined") return;
  const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) return;
  ctx = new Context();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  const { whiteBuffer, brownBuffer } = noiseBuffers(ctx);
  white = whiteBuffer;
  startRoomTone(ctx, master, brownBuffer, whiteBuffer);
  void ctx.suspend();

  // Audio pauses while the tab is hidden (FR-20).
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (!muted) void ctx.resume();
  });
}

/** Starts sound inside the Enter gesture (the only place a suspended context may resume). */
export function unlock(withSound: boolean) {
  muted = !withSound;
  prepare();
  applyMute();
}

function applyMute() {
  if (!ctx || !master) return;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setTargetAtTime(muted ? 0 : 1, now, 0.03);
  if (muted) window.setTimeout(() => muted && ctx?.suspend(), 200);
  else void ctx.resume();
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    localStorage.setItem(STORAGE_KEY, value ? "off" : "on");
  } catch {}
  applyMute();
}

/** The visitor's last choice; sound is on by default (decision log). */
export function storedSound() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

const CUES: Record<Cue, { level: number; length: number; type: BiquadFilterType; from: number; to?: number; q: number; attack: number }> = {
  // 12 ms filtered click when a car settles at centre.
  tick: { level: -30, length: 0.012, type: "bandpass", from: 2400, q: 1.2, attack: 0.001 },
  // 600 ms band-passed swell on the morph (Shot 2).
  breath: { level: -28, length: 0.6, type: "bandpass", from: 650, to: 900, q: 0.7, attack: 0.3 },
  // 180 ms sweep when the Index opens or closes.
  paper: { level: -32, length: 0.18, type: "bandpass", from: 900, to: 3200, q: 0.8, attack: 0.03 },
  // 8 ms soft click on buttons.
  press: { level: -34, length: 0.008, type: "bandpass", from: 1600, q: 1, attack: 0.001 },
};

export function play(cue: Cue) {
  if (!ctx || !master || !white || muted || ctx.state !== "running") return;
  const spec = CUES[cue];
  const now = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = white;
  const filter = ctx.createBiquadFilter();
  filter.type = spec.type;
  filter.Q.value = spec.q;
  filter.frequency.setValueAtTime(spec.from, now);
  if (spec.to) filter.frequency.exponentialRampToValueAtTime(spec.to, now + spec.length);
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, now);
  envelope.gain.exponentialRampToValueAtTime(db(spec.level), now + spec.attack);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + spec.length);
  source.connect(filter).connect(envelope).connect(master);
  // Random offset so repeated cues never sound identical.
  source.start(now, Math.random() * 1.5, spec.length + 0.02);
}

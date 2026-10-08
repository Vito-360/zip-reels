"""Sound for zip reels: a rhythmic bed plus sound effects placed on the cues the stage emits.
Everything is synthesised here with numpy, so there is nothing to license."""
import zlib
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
TAU = 2 * np.pi


# ------------------------------------------------------------------ primitives
def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR / 2 - 100), "low", fs=SR, output="sos"), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=SR, output="sos"), x)


def bp(x, f1, f2, order=2):
    return sosfilt(butter(order, [f1, f2], "band", fs=SR, output="sos"), x)


def sweep(f0, f1, dur):
    t = tt(dur)
    f = f0 * (f1 / f0) ** (t / max(dur, 1e-6))
    return np.sin(TAU * np.cumsum(f) / SR)


def fade(x, a=0.002, r=0.01):
    n = len(x)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    y = x.copy()
    if na:
        y[:na] *= np.linspace(0, 1, na)
    if nr:
        y[-nr:] *= np.linspace(1, 0, nr)
    return y


def place(buf, x, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= len(buf) or len(x) == 0:
        return
    if i < 0:
        x, i = x[-i:], 0
    n = min(len(x), len(buf) - i)
    a = (pan + 1) * np.pi / 4
    buf[i:i + n, 0] += x[:n] * gain * np.cos(a) * 1.4142
    buf[i:i + n, 1] += x[:n] * gain * np.sin(a) * 1.4142


# ------------------------------------------------------------------ drums and tones
def kick(strength=1.0):
    t = tt(0.32)
    f = 46 + 120 * np.exp(-t / 0.028)
    body = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / 0.13)
    click = hp(np.random.default_rng(1).standard_normal(len(t)), 2500) * np.exp(-t / 0.004) * 0.25
    return fade(np.tanh((body + click) * 1.6) * strength, 0.001, 0.03)


def hat(rng, dur=0.05, open_=False):
    t = tt(0.16 if open_ else dur)
    return fade(hp(rng.standard_normal(len(t)), 7000, 4) * np.exp(-t / (0.05 if open_ else 0.014)), 0.0005, 0.01)


def clap(rng):
    t = tt(0.22)
    n = bp(rng.standard_normal(len(t)), 900, 4200)
    env = np.exp(-t / 0.07) + 0.6 * np.exp(-np.abs(t - 0.012) / 0.004) + 0.5 * np.exp(-np.abs(t - 0.024) / 0.004)
    return fade(n * env * 0.5, 0.001, 0.03)


def rim():
    t = tt(0.06)
    return fade((np.sin(TAU * 1650 * t) + 0.5 * np.sin(TAU * 820 * t)) * np.exp(-t / 0.012), 0.0005, 0.01)


def bass_note(f, dur):
    t = tt(dur)
    x = np.sin(TAU * f * t) + 0.35 * np.sin(TAU * 2 * f * t) + 0.12 * np.sin(TAU * 3 * f * t)
    return fade(np.tanh(x * 1.5) * np.exp(-t / (dur * 0.9)), 0.004, 0.03)


def pluck(f, dur=0.22):
    t = tt(dur)
    x = 2 * np.abs(2 * ((f * t) % 1) - 1) - 1          # triangle
    x = lp(x + 0.3 * np.sign(np.sin(TAU * f * t)), 4200)
    return fade(x * np.exp(-t / 0.07), 0.002, 0.02)


def pad(freqs, dur, rng, bright=1100):
    t = tt(dur)
    out = np.zeros((len(t), 2))
    for f in freqs:
        for det, pan in ((-0.004, -0.5), (0.004, 0.5), (0.0, 0.0)):
            ph = rng.random()
            saw = 2 * (((f * (1 + det)) * t + ph) % 1) - 1
            place(out, lp(saw, bright, 2), 0, 0.33, pan)
    a = min(len(t), int(0.5 * SR))
    env = np.ones(len(t)); env[:a] = np.linspace(0, 1, a) ** 1.5
    r = min(len(t), int(0.4 * SR)); env[-r:] *= np.linspace(1, 0, r)
    return out * env[:, None]


def bell(f, dur=0.9, bright=1.0):
    t = tt(dur)
    x = np.sin(TAU * f * t) * np.exp(-t / (dur * 0.35)) + 0.35 * bright * np.sin(TAU * f * 2.76 * t) * np.exp(-t / (dur * 0.12)) + 0.18 * bright * np.sin(TAU * f * 5.4 * t) * np.exp(-t / (dur * 0.06))
    return fade(x, 0.001, 0.05)


# ------------------------------------------------------------------ effects
def whoosh(rng, dur=0.36, up=True):
    t = tt(dur)
    n = rng.standard_normal(len(t))
    lo, hi = lp(n, 700, 2), bp(n, 1600, 6500, 2)
    k = t / dur if up else 1 - t / dur
    return fade((lo * (1 - k) + hi * k * 0.8) * np.sin(np.pi * t / dur) ** 2, 0.01, 0.02)


def tom(f0=170, f1=80, dur=0.2):
    t = tt(dur)
    return fade(sweep(f0, f1, dur) * np.exp(-t / (dur * 0.35)), 0.001, 0.02)


def blip(f0, f1, dur, tau=None):
    t = tt(dur)
    return fade(sweep(f0, f1, dur) * np.exp(-t / (tau or dur * 0.5)), 0.002, 0.01)


def noise_tick(rng, dur=0.012, f1=2000, f2=7000):
    t = tt(dur * 3)
    return fade(bp(rng.standard_normal(len(t)), f1, f2) * np.exp(-t / dur), 0.0005, 0.005)


def boom(rng, dur=0.9):
    t = tt(dur)
    sub = sweep(62, 34, dur) * np.exp(-t / (dur * 0.3))
    crack = lp(rng.standard_normal(len(t)), 1800) * np.exp(-t / 0.05) * 0.5
    return fade(np.tanh((sub + crack) * 1.5), 0.001, 0.08)


def riser(rng, dur=1.0):
    t = tt(dur)
    n = rng.standard_normal(len(t))
    k = (t / dur) ** 2
    x = bp(n, 300, 1500) * (1 - k) + hp(n, 3000) * k
    tone = sweep(220, 880, dur) * 0.15
    return fade((x * 0.7 + tone) * (t / dur) ** 1.6, 0.02, 0.01)


def suck(rng, dur=0.34):
    t = tt(dur)
    x = bp(rng.standard_normal(len(t)), 400, 5000) * 0.6 + sweep(900, 110, dur) * 0.5
    return fade(x * (t / dur) ** 2.2, 0.01, 0.004)


def ring():
    t = tt(0.9)
    x = (np.sin(TAU * 440 * t) + np.sin(TAU * 480 * t)) * (0.6 + 0.4 * np.sign(np.sin(TAU * 20 * t)))
    return fade(lp(x, 1800) * 0.5, 0.01, 0.05)


def buzz():
    t = tt(0.2)
    x = np.sign(np.sin(TAU * 155 * t)) * 0.5 + np.sign(np.sin(TAU * 164 * t)) * 0.5
    return fade(lp(x, 900) * np.exp(-t / 0.12), 0.003, 0.03)


def reverb_ir(rng, dur=1.1, bright=3500):
    t = tt(dur)
    ir = np.stack([lp(rng.standard_normal(len(t)), bright), lp(rng.standard_normal(len(t)), bright)], 1) * np.exp(-t / (dur * 0.22))[:, None]
    ir[: int(0.012 * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum(0)).max()


def reverb(x, ir, wet):
    y = np.stack([fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in (0, 1)], 1)
    return x + wet * y


# ------------------------------------------------------------------ the mix
KEYS = [45, 48, 50, 43, 41, 47]             # A, C, D, G, F, B (bass octave)
PROGS = [[0, -4, 3, -2], [0, 0, -4, -2], [0, 5, -4, -2], [0, 3, -2, -4]]
MINOR = {0: (0, 3, 7), -4: (0, 4, 7), 3: (0, 4, 7), -2: (0, 4, 7), 5: (0, 3, 7), 7: (0, 3, 7)}
MOODS = {
    "pulse":  dict(kick=[0, 1, 2, 3], hat="off8", clap=True, arp=0.24, bass="8th", pad=0.20),
    "bounce": dict(kick=[0, 1.5, 2, 3], hat="16", clap=True, arp=0.30, bass="sync", pad=0.14),
    "deep":   dict(kick=[0, 2], hat="off8", clap=False, arp=0.18, bass="long", pad=0.28),
    "tick":   dict(kick=[0, 1, 2, 3], hat="8", clap=False, arp=0.14, bass="8th", pad=0.16, rim=True),
    "snap":   dict(kick=[0, 2.5], hat="8", clap=True, arp=0.22, bass="sync", pad=0.18),
    "shuffle": dict(kick=[0, 2, 2.75], hat="16", clap=False, arp=0.20, bass="sync", pad=0.22, rim=True, swing=0.34),
    "glide":  dict(kick=[0, 1.5, 3], hat="8", clap=False, arp=0.26, bass="long", pad=0.24, rim=True, swing=0.18),
    "stutter": dict(kick=[0, 0.5, 2, 3.25], hat="off8", clap=True, arp=0.16, bass="long", pad=0.20),
}


def build(meta, events, cfg=None):
    """Return (bed, sfx): two stereo float arrays of the full duration."""
    cfg = cfg or {}
    dur = float(meta["duration"])
    N = int(dur * SR)
    seed = int(cfg.get("seed", 1))
    rng = np.random.default_rng(seed)
    bpm = float(cfg.get("bpm", 120))
    beat = 60.0 / bpm
    mood = MOODS.get(cfg.get("mood", "pulse"), MOODS["pulse"])
    root = cfg.get("root", KEYS[seed % len(KEYS)])
    prog = PROGS[(seed // len(KEYS)) % len(PROGS)] if "prog" not in cfg else cfg["prog"]
    drop = min(max(float(meta.get("drop", dur * 0.45)), beat), dur - 2 * beat)
    end = min(max(float(meta.get("end", dur - 2)), drop + beat), dur - 0.5)

    drums = np.zeros((N, 2)); tonal = np.zeros((N, 2)); sfx = np.zeros((N, 2))
    kicks = []

    # --- part A: a lighter groove before the turn (soft kick, ticking hats, bass pulse, drone)
    nA = int(np.floor(drop / beat + 1e-6))
    t0A = drop - nA * beat
    for b in range(nA + 1):
        t = t0A + b * beat
        if t < -1e-6 or t >= drop - 1e-6:
            continue
        g = 0.6 + 0.4 * (t / drop)
        last = t >= drop - beat - 1e-6                       # leave a breath before the turn
        if not last:
            place(drums, kick(0.6), t, 0.62 * g); kicks.append(t)
            place(tonal, lp(bass_note(midi(root - 12), beat * 0.9), 600), t, 0.5 * g)
            place(tonal, pluck(midi(root + 24 + (0, 7, 3, 7)[b % 4])), t + beat / 2, mood["arp"] * 0.8 * g, 0.5 if b % 2 else -0.5)
        place(drums, hat(rng), t, 0.16 * g, 0.2)
        place(drums, hat(rng), t + beat / 2, 0.26 * g, -0.2)
        if mood.get("rim") or b % 2 == 1:
            place(drums, rim(), t + (0 if mood.get("rim") else beat / 2), 0.16 * g, 0.1)
    drone = pad([midi(root + 12), midi(root + 19), midi(root + 24)], drop + 0.05, rng, bright=800)
    place(tonal, drone[:, 0], 0, mood["pad"] * 0.9, -0.4); place(tonal, drone[:, 1], 0, mood["pad"] * 0.9, 0.4)
    rl = min(1.0, drop - 0.1)
    place(sfx, riser(rng, rl), drop - rl, 0.34)

    # --- part B: full beat from the turn to the end card
    bars = int(np.ceil((end - drop) / (4 * beat))) + 1
    for bar in range(bars):
        deg = prog[bar % len(prog)]
        chord = [root + deg + x for x in MINOR.get(deg, (0, 3, 7))]
        tb = drop + bar * 4 * beat
        if tb >= end:
            break
        seg = min(4 * beat, end - tb)
        p = pad([midi(n + 12) for n in chord], seg + 0.3, rng)
        place(tonal, p[:, 0], tb, mood["pad"], -0.5); place(tonal, p[:, 1], tb, mood["pad"], 0.5)
        for k in mood["kick"]:
            t = tb + k * beat
            if t < end - 1e-6:
                place(drums, kick(), t, 0.95); kicks.append(t)
        for q in range(16):
            t = tb + (q + (mood.get("swing", 0) if q % 2 else 0)) * beat / 4    # swing: every second 16th arrives late
            if t >= end - 1e-6:
                break
            h = mood["hat"]
            if (h == "off8" and q % 4 == 2) or (h == "8" and q % 2 == 0) or h == "16":
                place(drums, hat(rng, open_=(h == "off8" and q % 8 == 6)), t, (0.32 if q % 4 == 2 else 0.18), 0.25 if q % 2 else -0.25)
            if mood["clap"] and q in (4, 12):
                place(drums, clap(rng), t, 0.42)
            if mood.get("rim") and q in (4, 12):
                place(drums, rim(), t, 0.3, 0.15)
            b = mood["bass"]
            hit = (b == "8th" and q % 2 == 0) or (b == "sync" and q in (0, 3, 6, 8, 11, 14)) or (b == "long" and q in (0, 8))
            if hit:
                place(tonal, bass_note(midi(chord[0] - 12), beat * (1.6 if b == "long" else 0.45)), t, 0.5)
            if mood["arp"]:
                note = chord[(q * 2 + bar) % 3] + 24 + (12 if q % 8 == 6 else 0)
                place(tonal, pluck(midi(note)), t, mood["arp"] * (1.0 if q % 2 == 0 else 0.6), 0.6 if q % 2 else -0.6)

    # --- part C: end card, held chord and tail
    endchord = [root, root + 7, root + 12, root + 15, root + 19]
    p = pad([midi(n + 12) for n in endchord], dur - end, rng, bright=1500)
    place(tonal, p[:, 0], end, mood["pad"] * 1.3, -0.5); place(tonal, p[:, 1], end, mood["pad"] * 1.3, 0.5)
    place(tonal, bass_note(midi(root - 12), min(2.5, dur - end)), end, 0.6)
    kicks.append(end)
    tb = end
    while tb + beat < dur - 0.6:               # light pulse under the end card
        tb += beat
        place(drums, hat(rng), tb, 0.10, 0.2); place(drums, hat(rng), tb + beat / 2, 0.14, -0.2)

    # sidechain the tonal parts to the kick
    sc = np.ones(N)
    for k in kicks:
        i = int(k * SR)
        if i < N:
            n = min(N - i, int(0.3 * SR))
            sc[i:i + n] = np.minimum(sc[i:i + n], 1 - 0.55 * np.exp(-np.arange(n) / (0.09 * SR)))
    tonal *= sc[:, None]

    # --- effects on cues
    ding_notes = [root + 3 + 36 + x for x in (0, 4, 7, 12, 16)]
    for e in events:
        t, k, i = e["t"], e["kind"], int(e.get("i", 0))
        pan = ((zlib.crc32(f"{k}{i}".encode()) % 7) - 3) / 10.0
        if k == "swish":
            place(sfx, whoosh(rng, 0.26), t - 0.10, 0.22, pan)
        elif k == "whoosh":
            place(sfx, whoosh(rng, 0.42), t - 0.16, 0.30, pan)
        elif k == "tap":
            place(sfx, blip(1300, 750, 0.05, 0.012), t, 0.5); place(sfx, noise_tick(rng), t, 0.25)
        elif k == "click":                                # a mouse button: down, then up
            place(sfx, noise_tick(rng, 0.004, 1800, 9000), t, 0.5); place(sfx, blip(900, 600, 0.03, 0.008), t, 0.4)
            place(sfx, noise_tick(rng, 0.004, 2500, 9000), t + 0.075, 0.32)
        elif k == "stamp":                                # a rubber stamp landing
            place(sfx, tom(150, 48, 0.3), t, 0.95); place(sfx, lp(rng.standard_normal(int(0.12 * SR)), 1800) * np.exp(-tt(0.12) / 0.03), t, 0.5)
        elif k == "step":                                 # counting up: one note higher each time
            scale = (0, 3, 5, 7, 10, 12, 15)
            place(sfx, bell(midi(root + 36 + scale[i % len(scale)]), 0.5, 0.7), t, 0.34, (i - 2) / 5.0); place(sfx, tom(150, 80, 0.14), t, 0.4)
        elif k == "key":
            place(sfx, noise_tick(rng, 0.006, 2500, 8000), t, 0.16, rng.uniform(-0.3, 0.3))
        elif k == "tick":
            place(sfx, blip(2100, 1900, 0.04, 0.012), t, 0.32, pan); place(sfx, tom(140, 80, 0.12), t, 0.35)
        elif k == "tock":
            place(sfx, blip(950, 800, 0.06, 0.02), t, 0.36)
        elif k == "pop":
            place(sfx, blip(480, 980, 0.09, 0.05), t, 0.5, -0.2)
        elif k == "send":
            place(sfx, blip(700, 1500, 0.11, 0.06), t, 0.42, 0.2)
        elif k == "error":
            place(sfx, buzz(), t, 0.34)
        elif k == "ding":
            place(sfx, bell(midi(ding_notes[i % len(ding_notes)]), 0.8), t, 0.34, pan)
        elif k == "label":
            place(sfx, bell(midi(ding_notes[i % 3] - 12), 0.6, 0.5), t, 0.3, 0.3); place(sfx, noise_tick(rng), t, 0.2)
        elif k == "count":
            place(sfx, tom(190, 85, 0.22), t, 0.75); place(sfx, blip(1500, 1400, 0.05, 0.015), t, 0.25)
        elif k == "hit":
            place(sfx, tom(120, 55, 0.25), t, 0.7); place(sfx, noise_tick(rng, 0.02, 1500, 6000), t, 0.25)
        elif k == "card":
            place(sfx, whoosh(rng, 0.22), t - 0.06, 0.2, pan); place(sfx, tom(110, 60, 0.2), t + 0.12, 0.5)
        elif k == "slam":
            place(sfx, kick(1.0), t, 0.85); place(sfx, lp(rng.standard_normal(int(0.16 * SR)), 2500) * np.exp(-tt(0.16) / 0.04), t, 0.32)
        elif k == "impact":
            place(sfx, boom(rng), t, 0.9); place(sfx, whoosh(rng, 0.3, up=False), t, 0.25)
        elif k == "rise":
            place(sfx, blip(300, 1200, 0.5, 0.4), t, 0.22); place(sfx, whoosh(rng, 0.5), t, 0.22)
        elif k == "suck":
            place(sfx, suck(rng), t, 0.5)
        elif k == "ring":
            place(sfx, ring(), t, 0.16)
        elif k == "scroll":
            for j in range(6):
                place(sfx, noise_tick(rng, 0.008, 1200, 4000), t + j * float(e.get("dur", 1)) / 7, 0.14)
        elif k == "logo":
            place(sfx, boom(rng, 1.2), t, 0.95)
            for j, n in enumerate([root + 36, root + 43, root + 48, root + 51]):
                place(sfx, bell(midi(n), 1.8, 0.6), t + 0.03 * j, 0.20, (j - 1.5) / 3)

    ir = reverb_ir(rng)
    sfx = reverb(sfx, ir, 0.16)
    bed = reverb(drums, ir, 0.05) + reverb(tonal, ir, 0.12)
    return bed, sfx


def master(x, target_rms_db=-17.0, peak_db=-2.0):
    x = hp(x.T, 38).T
    x = x + 0.7 * hp(x.T, 3000).T                       # lift the top end so the rhythm survives phone speakers
    out = int(0.35 * SR)
    x[-out:] *= np.linspace(1, 0, out)[:, None] ** 1.5
    rms = np.sqrt(np.mean(x ** 2)) + 1e-9
    x = x * (10 ** (target_rms_db / 20) / rms)
    ceil = 10 ** (peak_db / 20)
    x = np.tanh(x / ceil * 0.9) * ceil / np.tanh(0.9) if np.abs(x).max() > ceil else x
    pk = np.abs(x).max()
    if pk > ceil:
        x *= ceil / pk
    return x.astype(np.float32)


def duck(x, voice, depth_db=-8.5):
    """Lower x while the voice is speaking."""
    env = np.abs(voice)
    win = int(0.05 * SR)
    env = np.convolve(env, np.ones(win) / win, "same")
    on = (env > 0.01).astype(float)
    a, r = int(0.04 * SR), int(0.30 * SR)
    on = np.convolve(on, np.ones(a) / a, "same")
    on = np.maximum(on, np.convolve(on, np.ones(r) / r, "same"))
    g = 10 ** (depth_db * np.clip(on, 0, 1) / 20)
    return x * g[:, None]


def write_wav(path, x):
    import soundfile as sf
    sf.write(path, x, SR, subtype="PCM_16")


def mix_voice(music, voice, target_rms_db=-17.3):
    """music: mastered stereo mix; voice: mono track. Voice sits on top, music ducks under it."""
    v = hp(voice, 85)
    pk = np.abs(v).max() or 1.0
    v = v / pk * 0.80
    m = duck(music, v, depth_db=-10.0) * 0.72
    x = m + np.stack([v, v], 1)
    rms = np.sqrt(np.mean(x ** 2)) + 1e-9
    x = x * (10 ** (target_rms_db / 20) / rms)
    ceil = 10 ** (-2.0 / 20)
    if np.abs(x).max() > ceil:
        x = np.tanh(x / ceil * 0.9) * ceil / np.tanh(0.9)
    return x.astype(np.float32)

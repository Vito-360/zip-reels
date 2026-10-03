"""Synthetic voice-over (Kokoro). Each line is placed at its start time and sped up, within a limit,
if it would run past its slot. The delivery is then made livelier: slightly quicker, wider pitch
movement, more presence, a touch of room."""
import os, urllib.request
import numpy as np
from scipy.signal import resample_poly, butter, sosfilt, fftconvolve
from pathlib import Path

SR = 48000
MODEL_DIR = Path(os.environ.get("ZIP_MODELS", Path(__file__).resolve().parent.parent / "models"))
BASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
FILES = ["kokoro-v1.0.onnx", "voices-v1.0.bin"]
MAX_SPEED = 1.2
# The house voice. Change it here once and every later video uses it.
DEFAULT = {"name": "af_heart", "speed": 1.06, "lively": 1.2, "lift": 0.4}
_k = None


def settings(cfg=None):
    s = dict(DEFAULT)
    s.update({k: v for k, v in (cfg or {}).items() if v is not None})
    return s


def ensure_models():
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    for f in FILES:
        p = MODEL_DIR / f
        if not p.exists() or p.stat().st_size < 1_000_000:
            print("downloading", f)
            urllib.request.urlretrieve(BASE + f, p)


def _kokoro():
    global _k
    if _k is None:
        from kokoro_onnx import Kokoro
        ensure_models()
        _k = Kokoro(str(MODEL_DIR / FILES[0]), str(MODEL_DIR / FILES[1]))
    return _k


def _lively(x, sr, amount, lift):
    """Widen the pitch movement around the speaker's median (amount > 1) and lift it by `lift` semitones."""
    if (not amount or abs(amount - 1) < 0.01) and not lift:
        return x
    try:
        import pyworld as pw
    except Exception:
        return x
    x = np.ascontiguousarray(x, dtype=np.float64)
    f0, t = pw.harvest(x, sr, f0_floor=65, f0_ceil=520)
    sp = pw.cheaptrick(x, f0, t, sr)
    ap = pw.d4c(x, f0, t, sr)
    v = f0 > 0
    if v.sum() < 5:
        return x
    med = np.median(f0[v])
    f1 = f0.copy()
    f1[v] = med * (f0[v] / med) ** (amount or 1.0) * 2 ** ((lift or 0) / 12)
    f1[v] = np.clip(f1[v], 60, 600)
    return pw.synthesize(f1, sp, ap, sr)[: len(x)]


def _say(text, voice, speed, lively, lift):
    x, sr = _kokoro().create(text, voice=voice, speed=speed, lang="en-us")
    x = _lively(np.asarray(x, dtype=np.float64), sr, lively, lift)
    if sr != SR:
        x = resample_poly(x, SR, sr)
    idx = np.where(np.abs(x) > 0.01)[0]                  # trim silence
    if len(idx):
        x = x[max(0, idx[0] - int(0.02 * SR)): idx[-1] + int(0.08 * SR)]
    return x


def _polish(x):
    """Presence, levelling and a little room, so the voice sits in the mix instead of on top of it."""
    x = sosfilt(butter(2, 90, "high", fs=SR, output="sos"), x)
    x = x + 0.32 * sosfilt(butter(2, [2400, 6500], "band", fs=SR, output="sos"), x)
    pk = np.abs(x).max() or 1.0
    x = np.tanh(x / pk * 1.8) / np.tanh(1.8)
    rng = np.random.default_rng(7)
    n = int(0.22 * SR)
    ir = sosfilt(butter(2, 4500, "low", fs=SR, output="sos"), rng.standard_normal(n)) * np.exp(-np.arange(n) / (0.045 * SR))
    ir[: int(0.006 * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum())
    return x + 0.07 * fftconvolve(x, ir)[: len(x)]


def render(says, duration, cfg=None, check=True):
    """says: [{t, text, until}]. cfg: {name, speed, lively, lift}. Returns (mono track, report)."""
    c = settings(cfg if isinstance(cfg, dict) else {"name": cfg} if cfg else None)
    out = np.zeros(int(duration * SR))
    report = []
    for s in says:
        slot = max(0.4, s["until"] - s["t"])
        x = _say(s["text"], c["name"], c["speed"], c["lively"], c["lift"])
        speed = c["speed"]
        if len(x) / SR > slot:
            speed = min(MAX_SPEED, c["speed"] * (len(x) / SR) / slot * 1.03)
            x = _say(s["text"], c["name"], speed, c["lively"], c["lift"])
        d = len(x) / SR
        x = _polish(x)
        pk = np.abs(x).max() or 1
        x = x / pk * 0.9
        i = int(s["t"] * SR)
        n = min(len(x), len(out) - i)
        out[i:i + n] += x[:n]
        row = {"t": round(s["t"], 2), "text": s["text"], "dur": round(d, 2), "slot": round(slot, 2), "speed": round(speed, 2), "overrun": round(max(0, d - slot), 2)}
        if check:
            try:
                import listen
                row["heard"] = listen.transcribe(x, SR)
                row["match"] = round(listen.match(s["text"], row["heard"]), 2)
            except Exception as e:                       # the check is a helper, never a blocker
                row["heard"] = f"(check unavailable: {type(e).__name__})"
        report.append(row)
    return out, report

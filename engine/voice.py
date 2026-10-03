"""Synthetic voice-over (Kokoro). Each line is placed at its start time and sped up, within a limit,
if it would run past its slot."""
import os, urllib.request
import numpy as np
from scipy.signal import resample_poly
from pathlib import Path

SR = 48000
MODEL_DIR = Path(os.environ.get("ZIP_MODELS", Path(__file__).resolve().parent.parent / "models"))
BASE = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
FILES = ["kokoro-v1.0.onnx", "voices-v1.0.bin"]
MAX_SPEED = 1.22
_k = None


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


def _say(text, voice, speed):
    x, sr = _kokoro().create(text, voice=voice, speed=speed, lang="en-us")
    x = np.asarray(x, dtype=np.float64)
    if sr != SR:
        x = resample_poly(x, SR, sr)
    idx = np.where(np.abs(x) > 0.01)[0]                  # trim silence
    if len(idx):
        x = x[max(0, idx[0] - int(0.02 * SR)): idx[-1] + int(0.08 * SR)]
    return x


def render(says, duration, voice="am_fenrir", base_speed=1.0, check=True):
    """says: [{t, text, until}]. Returns (mono track, report)."""
    out = np.zeros(int(duration * SR))
    report = []
    for s in says:
        slot = max(0.4, s["until"] - s["t"])
        x = _say(s["text"], voice, base_speed)
        speed = base_speed
        if len(x) / SR > slot:
            speed = min(MAX_SPEED, base_speed * (len(x) / SR) / slot * 1.03)
            x = _say(s["text"], voice, speed)
        d = len(x) / SR
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

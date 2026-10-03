"""Machine check of the voice-over: transcribe each spoken line and compare it with the script.
This catches garbled or mispronounced lines. It does not judge how natural the voice sounds."""
import os, re, tarfile, urllib.request
from pathlib import Path
import numpy as np
from scipy.signal import resample_poly

MODEL_DIR = Path(os.environ.get("ZIP_MODELS", Path(__file__).resolve().parent.parent / "models"))
NAME = "sherpa-onnx-whisper-base.en"
URL = f"https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/{NAME}.tar.bz2"
_r = None


def _rec():
    global _r
    if _r is None:
        import sherpa_onnx
        d = MODEL_DIR / NAME
        if not (d / "base.en-encoder.int8.onnx").exists():
            MODEL_DIR.mkdir(parents=True, exist_ok=True)
            tmp = MODEL_DIR / "asr.tar.bz2"
            print("downloading", NAME)
            urllib.request.urlretrieve(URL, tmp)
            with tarfile.open(tmp) as t:
                t.extractall(MODEL_DIR)
            tmp.unlink()
        _r = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=str(d / "base.en-encoder.int8.onnx"), decoder=str(d / "base.en-decoder.int8.onnx"),
                                                        tokens=str(d / "base.en-tokens.txt"), language="en", num_threads=2)
    return _r


def transcribe(x, sr):
    r = _rec()
    x = np.asarray(x, dtype=np.float32)
    if sr != 16000:
        x = resample_poly(x, 16000, sr).astype(np.float32)
    s = r.create_stream()
    s.accept_waveform(16000, x)
    r.decode_stream(s)
    return s.result.text.strip()


def words(t):
    return re.findall(r"[a-z0-9']+", t.lower().replace("’", "'"))


def match(script, heard):
    """Share of script words that appear, in order, in what was heard (0..1)."""
    a, b = words(script), words(heard)
    if not a:
        return 1.0
    n, m = len(a), len(b)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n):
        for j in range(m):
            dp[i + 1][j + 1] = dp[i][j] + 1 if a[i] == b[j] else max(dp[i][j + 1], dp[i + 1][j])
    return dp[n][m] / n

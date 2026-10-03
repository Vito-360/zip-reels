#!/usr/bin/env bash
# One-time setup per machine or session: Python packages and the voice/listening models.
set -euo pipefail
cd "$(dirname "$0")"
PIP="python3 -m pip install -q"
$PIP numpy scipy pillow soundfile playwright kokoro-onnx sherpa-onnx pyworld 2>/dev/null || $PIP --break-system-packages numpy scipy pillow soundfile playwright kokoro-onnx sherpa-onnx pyworld
command -v ffmpeg >/dev/null || { echo "ffmpeg is missing"; exit 1; }
python3 - <<'PY'
import sys
sys.path.insert(0, "engine")
import voice, listen
voice.ensure_models()
try:
    listen._rec()
except Exception as e:
    print("listening check unavailable:", e)
from playwright.sync_api import sync_playwright
import render
with sync_playwright() as p:
    b = render._launch(p); print("chromium", b.version); b.close()
print("setup ok")
PY

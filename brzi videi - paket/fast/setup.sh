#!/bin/bash
# One-time setup in a fresh Claude workspace. Run from the zip-videi folder: bash setup.sh
set -e
pip install --break-system-packages -q playwright piper-tts numpy pillow 2>/dev/null || pip install -q playwright piper-tts numpy pillow
command -v ffmpeg >/dev/null || (apt-get update -qq && apt-get install -y -qq ffmpeg)
# Chromium: use the pre-installed one if it exists, otherwise install Playwright's
if [ -x /opt/pw-browsers/chromium ] || ls /opt/pw-browsers 2>/dev/null | grep -q chromium; then echo "chromium: pre-installed";
else python3 -m playwright install chromium; fi
# Voice (Piper, en-us-ryan-high, ~105 MB) from GitHub releases
mkdir -p voice
if [ ! -f voice/en-us-ryan-high.onnx ]; then
  curl -sL -o voice/v.tgz https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-ryan-high.tar.gz
  tar -xzf voice/v.tgz -C voice && rm voice/v.tgz
fi
ls voice; echo "setup ok"

# zip-reels

Generator for zip. Instagram reels: 15-second vertical videos (1080×1920) in three styles
(phone scene, kinetic type, cards), each built with sound effects and rhythm, with and without a voice-over.

One JSON spec in `specs/` describes one video. The engine renders it in headless Chromium, synthesises
the sound, and writes the MP4s to `out/`.

```bash
bash setup.sh
python3 make.py specs/2026-10-05.json
```

- `PLAYBOOK.md`: how to choose a topic, write a spec, build and check it. Start here.
- `LOG.md`: every video made so far. Check it before picking a topic.
- `engine/`: stage (HTML/CSS/JS), frame renderer, audio and voice.
- `specs/`: one spec per posting day, plus `_demo-screens.json` as a reference.

Needs Python 3.10+, ffmpeg and a Chromium that Playwright can launch. The voice and listening models
(about 550 MB) are downloaded by `setup.sh` into `models/` and are not committed.

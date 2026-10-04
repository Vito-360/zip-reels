#!/usr/bin/env python3
"""Build one zip reel from a spec.

  python3 make.py specs/2026-10-05.json            full build: two MP4s (with and without voice), cover, check sheet
  python3 make.py specs/2026-10-05.json --sheet    only the check sheet (fast, for iterating on the visuals)
  python3 make.py specs/2026-10-05.json --no-voice skip the voice-over version
  python3 make.py specs/2026-10-05.json --audio-only   keep the rendered picture, redo only sound and voice
  python3 make.py specs/2026-10-05.json --audio-only --voice am_liam --tag liam   a voice variant for comparison
  python3 make.py --history                        what the last videos used (scenes, music, endings)
"""
import json, os, subprocess, sys, shutil, tempfile
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "engine"))
import render, audio  # noqa: E402

SCENE_TYPES = {"phone", "bignum", "flash", "lines", "statement", "cards", "offer", "end", "chaos", "blurtype", "stack", "slam", "cut"}


def validate(spec):
    errs = []
    t = 0.0
    for i, s in enumerate(spec.get("scenes", [])):
        if s.get("type") not in SCENE_TYPES:
            errs.append(f"scene {i}: unknown type {s.get('type')!r}")
        if "dur" not in s:
            errs.append(f"scene {i}: missing dur")
        t = s.get("at", t) + s.get("dur", 0)
    dur = spec.get("duration", 15)
    if abs(t - dur) > 0.02:
        errs.append(f"scenes end at {t:.2f}s but duration is {dur}s")
    for k in ("date", "slug", "style", "pillar", "caption"):
        if not spec.get(k):
            errs.append(f"missing {k}")
    if errs:
        raise SystemExit("spec problems:\n  " + "\n  ".join(errs))


def loudness(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    tail = r[r.rfind("Summary:"):]
    get = lambda key: next((l.split(":")[1].strip() for l in tail.splitlines() if l.strip().startswith(key)), "?")
    return {"integrated": get("I:"), "true_peak": get("Peak:")}


def history(n=8):
    """Print what the last n videos used, so a new one can be made different."""
    specs = sorted(p for p in (ROOT / "specs").glob("2*.json"))[-n:]
    for p in specs:
        s = json.loads(p.read_text(encoding="utf-8"))
        seq = []
        for sc in s["scenes"]:
            t = sc["type"]
            if t == "phone":
                t += ":" + sc.get("screen", {}).get("kind", "?")
            seq.append(t)
        a = s.get("audio", {})
        says = sum(1 for sc in s["scenes"] if sc.get("say")) + sum(len(sc.get("says", [])) for sc in s["scenes"])
        print(f"{s['date']}  {s['style']:8} {s['pillar']:8} {a.get('mood','?')}/{a.get('bpm','?')}/{a.get('seed','?')}  ending={s.get('ending','?')}  voice lines={says}")
        print("   scenes:", " > ".join(seq))


def opt(args, flag):
    return args[args.index(flag) + 1] if flag in args and args.index(flag) + 1 < len(args) else None


def main():
    args = sys.argv[1:]
    if not args:
        raise SystemExit(__doc__)
    if args[0] == "--history":
        return history()
    spec_path = Path(args[0])
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    validate(spec)
    name = f"{spec['date']}-{spec['slug']}"
    out = ROOT / "out"
    out.mkdir(exist_ok=True)
    dur = spec.get("duration", 15)
    tag = opt(args, "--tag")                       # extra suffix for a voice variant
    audio_only = "--audio-only" in args and (out / f"{name}.mp4").exists()

    meta, events = render.probe(spec)
    if not audio_only:
        n = 12
        times = [round(i * (dur - 0.1) / (n - 1), 2) for i in range(n)]
        sheet = out / f"{name}-sheet.jpg"
        render.sheet(spec, times, str(sheet), cols=6, w=300)
        print("check sheet:", sheet)
    if "--sheet" in args:
        return

    work = Path(tempfile.mkdtemp(prefix="zipreel-"))
    try:
        bed, sfx = audio.build(meta, events, spec.get("audio"))
        mix = audio.master(bed + sfx)
        audio.write_wav(str(work / "novoice.wav"), mix)
        plain = out / f"{name}.mp4"
        if audio_only:
            tmp = work / "v.mp4"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(plain), "-i", str(work / "novoice.wav"), "-map", "0:v", "-map", "1:a",
                            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(tmp)], check=True)
            shutil.move(tmp, plain)
        else:
            print("rendering frames…")
            render.render_frames(spec, str(work / "frames"))
            render.encode(str(work / "frames"), str(work / "novoice.wav"), str(plain))
            cover_t = spec.get("cover_at", 0.0)
            shutil.copy(work / "frames" / f"f{int(cover_t * render.FPS):05d}.jpg", out / f"{name}-cover.jpg")
        report = {"video": plain.name, "frames": int(dur * render.FPS), "events": len(events), "audio": loudness(plain)}

        if "--no-voice" not in args and meta.get("says"):
            import voice
            cfg = dict(spec.get("voice") or {})
            if opt(args, "--voice"):
                cfg["name"] = opt(args, "--voice")
            v, vrep = voice.render(meta["says"], dur, cfg)
            v = v[: len(bed)]
            mixv = audio.mix_voice(mix, v)
            audio.write_wav(str(work / "voice.wav"), mixv)
            voiced = out / f"{name}-voice{('-' + tag) if tag else ''}.mp4"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(plain), "-i", str(work / "voice.wav"), "-map", "0:v", "-map", "1:a",
                            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(voiced)], check=True)
            report["voice_video"] = voiced.name
            report["voice"] = voice.settings(cfg)
            report["voice_audio"] = loudness(voiced)
            report["voice_lines"] = vrep
            spoken = sum(r["dur"] for r in vrep)
            report["voice_share"] = round(spoken / dur, 2)

        (out / f"{name}-caption.txt").write_text(spec["caption"].strip() + "\n", encoding="utf-8")
        print(json.dumps(report, indent=1, ensure_ascii=False))
    finally:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()

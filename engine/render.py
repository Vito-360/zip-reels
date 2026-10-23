"""Render a spec to JPEG frames with headless Chromium, stepping the stage frame by frame."""
import json, os, sys, glob, shutil, subprocess
from multiprocessing import Process
from pathlib import Path

HERE = Path(__file__).resolve().parent
W, H, FPS = 1080, 1920, 30


def dims(spec):
    """Frame size: vertical 1080x1920 by default, 1920x1080 for "format": "landscape"."""
    return (1920, 1080) if spec.get("format") == "landscape" else (W, H)


def _launch(p):
    try:
        return p.chromium.launch()
    except Exception:
        for c in ["/opt/pw-browsers/chromium", *sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux/chrome")),
                  shutil.which("chromium") or "", shutil.which("chromium-browser") or "", shutil.which("google-chrome") or ""]:
            if c and os.path.exists(c):
                return p.chromium.launch(executable_path=c)
        raise


def _open(p, spec):
    b = _launch(p)
    fw, fh = dims(spec)
    pg = b.new_page(viewport={"width": fw, "height": fh}, device_scale_factor=1)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.add_init_script("window.SPEC = " + json.dumps(spec) + ";")
    pg.goto((HERE / "stage.html").as_uri())
    pg.wait_for_function("window.__ready || window.__error", timeout=30000)
    err = pg.evaluate("window.__error || null")
    if err or errs:
        raise RuntimeError("stage error: " + str(err or errs))
    return b, pg


def probe(spec):
    """Return (meta, events) computed by the stage for this spec."""
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b, pg = _open(p, spec)
        meta, events = pg.evaluate("[window.__meta, window.__events]")
        b.close()
    return meta, events


def _worker(spec, frames, outdir, quality):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b, pg = _open(p, spec)
        for f in frames:
            pg.evaluate("t => window.seek(t)", f / FPS)
            pg.screenshot(path=os.path.join(outdir, f"f{f:05d}.jpg"), type="jpeg", quality=quality)
        b.close()


def render_frames(spec, outdir, workers=2, quality=93):
    os.makedirs(outdir, exist_ok=True)
    for old in glob.glob(os.path.join(outdir, "f*.jpg")):
        os.remove(old)
    n = int(round(spec.get("duration", 15) * FPS))
    chunks = [list(range(i, n, workers)) for i in range(workers)]
    procs = [Process(target=_worker, args=(spec, c, outdir, quality)) for c in chunks]
    [p.start() for p in procs]
    [p.join() for p in procs]
    if any(p.exitcode for p in procs):
        raise RuntimeError("frame render failed")
    got = len(glob.glob(os.path.join(outdir, "f*.jpg")))
    if got != n:
        raise RuntimeError(f"expected {n} frames, got {got}")
    return n


def still(spec, t, path):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b, pg = _open(p, spec)
        pg.evaluate("t => window.seek(t)", t)
        pg.screenshot(path=path, type="jpeg", quality=92)
        b.close()


def sheet(spec, times, path, cols=6, w=270):
    """Contact sheet of stills at the given times (fast preview without a full render)."""
    from playwright.sync_api import sync_playwright
    from PIL import Image
    import io
    fw, fh = dims(spec)
    h = int(w * fh / fw)
    rows = (len(times) + cols - 1) // cols
    im = Image.new("RGB", (cols * w, rows * h))
    with sync_playwright() as p:
        b, pg = _open(p, spec)
        for i, t in enumerate(times):
            pg.evaluate("t => window.seek(t)", t)
            fr = Image.open(io.BytesIO(pg.screenshot(type="jpeg", quality=88))).resize((w, h))
            im.paste(fr, ((i % cols) * w, (i // cols) * h))
        b.close()
    im.save(path, quality=88)


def encode(framedir, audio_wav, out_mp4):
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(framedir, "f%05d.jpg")]
    if audio_wav:
        cmd += ["-i", audio_wav]
    cmd += ["-c:v", "libx264", "-preset", "slow", "-crf", "17", "-pix_fmt", "yuv420p", "-r", str(FPS)]
    if audio_wav:
        cmd += ["-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest"]
    cmd += ["-movflags", "+faststart", out_mp4]
    subprocess.run(cmd, check=True)


if __name__ == "__main__":
    spec = json.load(open(sys.argv[1]))
    meta, ev = probe(spec)
    print(json.dumps(meta, indent=1))
    print(len(ev), "events")

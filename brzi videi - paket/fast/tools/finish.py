"""Turn a silent render into the two deliverables, both with sound.

python3 tools/finish.py "<content name>" <folder with out/silent.mp4 and sound.wav> voice.json [cover_second]

voice.json: [[start_seconds, "spoken line"], ...]  (3-6 short lines, never read the screen word for word)
Writes to deliverables/:  "<name> - video.mp4" (music + effects), "<name> - video voice.mp4", "<name> - cover.png"
"""
import json, os, subprocess, sys, wave
from piper import PiperVoice, SynthesisConfig

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
name, folder, vj = sys.argv[1], sys.argv[2], sys.argv[3]
cover_t = float(sys.argv[4]) if len(sys.argv) > 4 else 0.0
silent = os.path.join(folder, "out", "silent.mp4"); snd = os.path.join(folder, "sound.wav")
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", silent]))
out = os.path.join(ROOT, "deliverables"); os.makedirs(out, exist_ok=True); tmp = os.path.join(folder, "_mix"); os.makedirs(tmp, exist_ok=True)
run = lambda a: subprocess.run(a, check=True)

run(["ffmpeg", "-v", "error", "-y", "-i", snd, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", f"{tmp}/music.wav"])
voice = PiperVoice.load(os.path.join(ROOT, "voice", "en-us-ryan-high.onnx"))
cfg = SynthesisConfig(length_scale=0.9)
lines = json.load(open(vj)); ins = ["-i", f"{tmp}/music.wav"]; chain = []
for i, (t, text) in enumerate(lines):
    p = f"{tmp}/v{i}.wav"
    with wave.open(p, "wb") as w: voice.synthesize_wav(text, w, syn_config=cfg)
    with wave.open(p) as w: d = w.getnframes() / w.getframerate()
    print(f"line {i}: {t:.2f}s -> {t + d:.2f}s  {text}")
    ins += ["-i", p]; ms = int(t * 1000); chain.append(f"[{i + 1}]adelay={ms}|{ms}[l{i}]")
n = len(lines)
fc = ";".join(chain) + ";" + "".join(f"[l{i}]" for i in range(n)) + \
     f"amix=inputs={n}:normalize=0,aresample=48000,pan=stereo|c0=c0|c1=c0,volume=1.7,apad=whole_dur={dur}[vo];[vo]asplit[a][b];" \
     "[0][a]sidechaincompress=threshold=0.03:ratio=5:attack=15:release=250[d];[d][b]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000"
run(["ffmpeg", "-v", "error", "-y"] + ins + ["-filter_complex", fc, f"{tmp}/vmix.wav"])
for wav, suffix in ((f"{tmp}/music.wav", "video"), (f"{tmp}/vmix.wav", "video voice")):
    run(["ffmpeg", "-v", "error", "-y", "-i", silent, "-i", wav, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
         "-shortest", "-movflags", "+faststart", os.path.join(out, f"{name} - {suffix}.mp4")])
run(["ffmpeg", "-v", "error", "-y", "-ss", str(cover_t), "-i", silent, "-frames:v", "1", os.path.join(out, f"{name} - cover.png")])
for suffix in ("video", "video voice"):
    f = os.path.join(out, f"{name} - {suffix}.mp4")
    a = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=codec_name", "-of", "csv=p=0", f], capture_output=True, text=True).stdout.strip()
    vol = subprocess.run(["ffmpeg", "-i", f, "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
    mv = [l for l in vol.splitlines() if "mean_volume" in l]
    print(f"{os.path.basename(f)}: audio={a or 'MISSING'} {mv[0].split(']')[-1].strip() if mv else ''}")

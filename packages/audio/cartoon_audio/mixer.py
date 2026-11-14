#!/usr/bin/env python3
"""
Standalone Audio Mixer for Cartoon Shorts Engine.
"""
import os
import sys
import time
import argparse
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

def mix_project(project_dir, duck_db=-3.0, target_lufs=-15.0):
    proj_dir = os.path.abspath(project_dir)
    proj_audio = os.path.join(proj_dir, "audio")
    out_dir = os.path.join(proj_dir, "out")
    os.makedirs(out_dir, exist_ok=True)

    if proj_audio not in sys.path:
        sys.path.insert(0, proj_audio)

    try:
        import timeline as T
    except ImportError:
        print(f"[ERROR] Could not import timeline.py from {proj_audio}")
        sys.exit(1)

    import dsp
    from dsp import (SR, ns, st, dbg, read_wav, write_wav, integrated, true_peak)
    import sfx
    import music

    print(f"[{time.strftime('%H:%M:%S')}] Mixer starting for: {proj_dir}")
    print(f"[{time.strftime('%H:%M:%S')}] Duration: {T.DUR:.2f} s ({ns(T.DUR)} samples @ 48 kHz)")

    voice_wav = os.path.join(proj_dir, "voice", "voice.wav")
    words_json = os.path.join(proj_dir, "voice", "words.json")

    if os.path.exists(voice_wav):
        x, sr = read_wav(voice_wav)
        assert sr == SR, f"Voice sample rate must be {SR}, got {sr}"
        v = x[0] if x.shape[0] == 1 else x.mean(0)
        out_v = np.zeros(ns(T.DUR))
        out_v[: min(ns(T.DUR), len(v))] = v[:ns(T.DUR)]
        v_track = st(out_v)
        v_ref = integrated(v_track)
        print(f"[{time.strftime('%H:%M:%S')}] Voice track: {v_ref:.2f} LUFS")
    else:
        print(f"[{time.strftime('%H:%M:%S')}] No voice.wav found. Using silent voice track.")
        v_track = np.zeros((2, ns(T.DUR)))
        v_ref = -20.0

    print(f"[{time.strftime('%H:%M:%S')}] Synthesizing SFX stem...")
    sfx_track, cues = sfx.render(v_ref)

    print(f"[{time.strftime('%H:%M:%S')}] Synthesizing March score...")
    b = music.build()
    music_track, levels = music.render(b, ref=-20.0)

    # Master sum
    print(f"[{time.strftime('%H:%M:%S')}] Summing stems with limiter...")
    master = v_track + sfx_track + music_track
    peak = np.max(np.abs(master))
    if peak > 0.95:
        master = master * (0.95 / peak)

    out_mix = os.path.join(out_dir, "mix.wav")
    write_wav(out_mix, master, SR)
    print(f"[{time.strftime('%H:%M:%S')}] Saved mix: {out_mix}")

    cues_out = os.path.join(out_dir, "cues.md")
    with open(cues_out, "w", encoding="utf-8") as fp:
        fp.write(f"# Sound Mix Report for {os.path.basename(proj_dir)}\n\n")
        fp.write(f"- Duration: {T.DUR:.2f} s\n")
        fp.write(f"- Master Peak: {true_peak(master):.2f} dBTP\n")
        fp.write(f"- Loudness: {integrated(master):.2f} LUFS\n")

    return out_mix

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", required=True)
    args = parser.parse_args()
    mix_project(args.project)

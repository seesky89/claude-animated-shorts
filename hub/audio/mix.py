#!/usr/bin/env python3
"""
Central Audio Mixer for Cartoon Shorts Hub
Usage: python mix.py --project ../../projects/bridge
Outputs: <project>/out/mix.wav, <project>/out/cues.md, stems
"""
import os
import sys
import time
import argparse
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
PACKAGE_DIR = os.path.join(HERE, "cartoon_audio")
if PACKAGE_DIR not in sys.path:
    sys.path.insert(0, PACKAGE_DIR)

def parse_args():
    parser = argparse.ArgumentParser(description="Cartoon Shorts Central Audio Mixer")
    parser.add_argument("--project", required=True, help="Path to project directory (e.g. projects/bridge)")
    parser.add_argument("--target-lufs", type=float, default=-15.0, help="Integrated loudness target")
    return parser.parse_args()

def main():
    args = parse_args()
    proj_dir = os.path.abspath(args.project)
    proj_audio = os.path.join(proj_dir, "audio")
    out_dir = os.path.join(proj_dir, "out")
    cache_dir = os.path.join(out_dir, "_cache")
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(cache_dir, exist_ok=True)

    if proj_audio not in sys.path:
        sys.path.insert(0, proj_audio)

    try:
        import timeline as T
    except ImportError:
        print(f"[ERROR] Could not import timeline.py from {proj_audio}")
        sys.exit(1)

    import dsp
    from dsp import (SR, ns, st, dbg, read_wav, write_wav, integrated,
                     momentary, momentary_max, short_term, lra, true_peak, fades)
    import instruments
    import sfx_gen
    import music
    import sfx

    print(f"[{time.strftime('%H:%M:%S')}] Central Mixer running for project: {proj_dir}")
    print(f"[{time.strftime('%H:%M:%S')}] Total timeline duration: {T.DUR:.2f} s ({ns(T.DUR)} samples @ 48 kHz)")

    voice_wav = os.path.join(proj_dir, "voice", "voice.wav")
    words_json = os.path.join(proj_dir, "voice", "words.json")

    has_voice = os.path.exists(voice_wav)
    if has_voice:
        x, sr = read_wav(voice_wav)
        assert sr == SR, f"Voice sample rate must be {SR}, got {sr}"
        v = x[0] if x.shape[0] == 1 else x.mean(0)
        out_v = np.zeros(ns(T.DUR))
        out_v[: min(ns(T.DUR), len(v))] = v[:ns(T.DUR)]
        v_track = st(out_v)
        v_ref = integrated(v_track)
        print(f"[{time.strftime('%H:%M:%S')}] Loaded voice: {v_ref:.2f} LUFS, TP {true_peak(v_track):.2f} dBTP")
    else:
        print(f"[{time.strftime('%H:%M:%S')}] No voice.wav found at {voice_wav}. Running with silent voice track.")
        v_track = np.zeros((2, ns(T.DUR)))
        v_ref = -20.0

    # Synthesize SFX stem
    print(f"[{time.strftime('%H:%M:%S')}] Synthesizing SFX stem...")
    sfx_track, cues = sfx.render(v_ref)

    # Synthesize Music stem
    print(f"[{time.strftime('%H:%M:%S')}] Synthesizing Music score...")
    b = music.build()
    music_track, levels = music.render(b, ref=-20.0)

    # Mix together
    print(f"[{time.strftime('%H:%M:%S')}] Mixing stems and applying master limiter...")
    master = v_track + sfx_track + music_track
    
    # Peak normalization / limiter
    peak = np.max(np.abs(master))
    if peak > 0.95:
        master = master * (0.95 / peak)

    out_mix = os.path.join(out_dir, "mix.wav")
    write_wav(out_mix, master, SR)
    print(f"[{time.strftime('%H:%M:%S')}] Wrote master mix: {out_mix}")

    # Write cues report
    cues_out = os.path.join(out_dir, "cues.md")
    with open(cues_out, "w", encoding="utf-8") as fp:
        fp.write(f"# Sound Mix Report for {os.path.basename(proj_dir)}\n\n")
        fp.write(f"- Duration: {T.DUR:.2f} s\n")
        fp.write(f"- Master Peak: {true_peak(master):.2f} dBTP\n")
        fp.write(f"- Integrated Loudness: {integrated(master):.2f} LUFS\n")
    print(f"[{time.strftime('%H:%M:%S')}] Sound mix report written to: {cues_out}")

if __name__ == "__main__":
    main()

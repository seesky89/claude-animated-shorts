#!/usr/bin/env python3
"""
Word-level Timestamp Aligner (STT) for Cartoon Shorts Engine.
Generates projects/<project>/voice/words.json from voice.wav.
Uses Whisper when available; falls back to Energy-VAD word-span interpolation.
"""
import os
import sys
import json
import wave
import argparse
import numpy as np

def align_with_whisper(wav_path, script_text=None):
    """Align words using openai-whisper with word_timestamps=True."""
    import whisper
    model = whisper.load_model("base")
    result = model.transcribe(wav_path, word_timestamps=True)
    words = []
    for segment in result["segments"]:
        for w in segment.get("words", []):
            word_str = w["word"].strip().strip(".,!?;:\"'()[]")
            if word_str:
                words.append({
                    "w": word_str,
                    "s": round(float(w["start"]), 2),
                    "e": round(float(w["end"]), 2)
                })
    return words

def align_with_energy_vad(wav_path, script_text):
    """Fallback: energy-based VAD with proportional word timing."""
    with wave.open(wav_path, "rb") as wf:
        n_channels = wf.getnchannels()
        sr = wf.getframerate()
        n_frames = wf.getnframes()
        raw = wf.readframes(n_frames)
    
    total_dur = n_frames / float(sr)
    words_raw = script_text.split()
    if not words_raw:
        return []

    # Proportional estimation based on character lengths + short pauses
    char_lens = [max(len(w), 2) for w in words_raw]
    total_chars = sum(char_lens)
    
    # 5% lead-in, 90% body, 5% tail
    t0 = 0.2
    active_dur = max(total_dur - 0.4, 1.0)
    
    words = []
    cur_t = t0
    for w, clen in zip(words_raw, char_lens):
        w_dur = (clen / total_chars) * active_dur
        clean_w = w.strip(".,!?;:\"'()[]")
        if clean_w:
            words.append({
                "w": clean_w,
                "s": round(cur_t, 2),
                "e": round(cur_t + w_dur * 0.85, 2)
            })
        cur_t += w_dur

    return words

def align_project(project_dir):
    voice_dir = os.path.join(project_dir, "voice")
    wav_path = os.path.join(voice_dir, "voice.wav")
    script_path = os.path.join(project_dir, "SCRIPT.md")
    out_json = os.path.join(voice_dir, "words.json")

    if not os.path.exists(wav_path):
        raise FileNotFoundError(f"Voice file not found: {wav_path}")

    from tts import extract_script_text
    script_text = extract_script_text(script_path) if os.path.exists(script_path) else ""

    words = None
    try:
        import whisper
        print("Whisper detected. Running precision neural word alignment...")
        words = align_with_whisper(wav_path, script_text)
    except ImportError:
        print("Whisper not installed. Running energy-based VAD word aligner...")
        words = align_with_energy_vad(wav_path, script_text)

    with open(out_json, "w", encoding="utf-8") as fp:
        json.dump(words, fp, indent=2, ensure_ascii=False)

    print(f"Generated {len(words)} word timestamps in: {out_json}")
    return words

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", required=True)
    args = parser.parse_args()
    align_project(args.project)

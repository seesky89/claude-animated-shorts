#!/usr/bin/env python3
"""
Automated Voice Synthesizer (TTS) for Cartoon Shorts Engine.
Reads SCRIPT.md and generates voice.wav in projects/<project>/voice/
Supports: edge-tts (local/free), OpenAI TTS, or fallback synthetic voice.
"""
import os
import sys
import re
import argparse
import asyncio
import wave
import struct
import numpy as np

def extract_script_text(script_path):
    """Extract narrator dialogue from SCRIPT.md, ignoring headers and metadata."""
    if not os.path.exists(script_path):
        raise FileNotFoundError(f"Script file not found: {script_path}")
    
    with open(script_path, "r", encoding="utf-8") as fp:
        lines = fp.readlines()

    dialogue_lines = []
    in_dialogue = False
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith("<!--"):
            continue
        if stripped.lower().startswith("fact:") or stripped.lower().startswith("source:"):
            continue
        # Check for bullet points or direct speech
        clean = re.sub(r"^[-*]\s*", "", stripped)
        clean = re.sub(r"\[.*?\]", "", clean) # remove bracketed stage directions like [Beat]
        clean = clean.replace('"', '').strip()
        if clean:
            dialogue_lines.append(clean)

    return " ".join(dialogue_lines)

async def synthesize_edge_tts(text, out_wav, voice="en-US-ChristopherNeural"):
    """Synthesize voice using edge-tts (free Microsoft Azure Neural voices)."""
    import edge_tts
    temp_mp3 = out_wav.replace(".wav", "_temp.mp3")
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(temp_mp3)
    
    # Convert mp3 to 48kHz mono wav using ffmpeg or soundfile
    ret = os.system(f'ffmpeg -y -i "{temp_mp3}" -ar 48000 -ac 1 "{out_wav}" >nul 2>&1')
    if ret != 0:
        # Fallback if ffmpeg isn't available
        import pydub
        sound = pydub.AudioSegment.from_mp3(temp_mp3)
        sound = sound.set_frame_rate(48000).set_channels(1)
        sound.export(out_wav, format="wav")
    if os.path.exists(temp_mp3):
        os.remove(temp_mp3)

def synthesize_fallback(text, out_wav, dur_per_word=0.27):
    """Deterministic fallback: synthesized robotic speech tones if no internet/TTS library."""
    words = text.split()
    total_dur = len(words) * dur_per_word
    sr = 48000
    n_samples = int(total_dur * sr)
    t = np.linspace(0, total_dur, n_samples, endpoint=False)
    
    audio = np.zeros(n_samples)
    for i, word in enumerate(words):
        s = int(i * dur_per_word * sr)
        e = int((i + 1) * dur_per_word * sr)
        freq = 150 + (hash(word) % 60)
        seg_t = t[s:e] - t[s]
        # Formant-like pulse train
        pulse = 0.4 * np.sin(2 * np.pi * freq * seg_t) + 0.2 * np.sin(2 * np.pi * freq * 2 * seg_t)
        # Apply window envelope
        env = np.sin(np.pi * np.linspace(0, 1, e - s))
        audio[s:e] = pulse * env

    audio = np.clip(audio, -0.9, 0.9)
    audio_int16 = (audio * 32767).astype(np.int16)
    
    with wave.open(out_wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(audio_int16.tobytes())

def generate_voice(project_dir, voice_id="en-US-ChristopherNeural"):
    script_path = os.path.join(project_dir, "SCRIPT.md")
    voice_dir = os.path.join(project_dir, "voice")
    os.makedirs(voice_dir, exist_ok=True)
    out_wav = os.path.join(voice_dir, "voice.wav")

    text = extract_script_text(script_path)
    print(f"Extracted script ({len(text.split())} words):\n\"{text[:100]}...\"")

    try:
        import edge_tts
        print("Using edge-tts neural voice...")
        asyncio.run(synthesize_edge_tts(text, out_wav, voice_id))
    except ImportError:
        print("edge-tts not installed. Generating synthesized speech fallback...")
        synthesize_fallback(text, out_wav)

    print(f"Generated voice: {out_wav}")
    return text, out_wav

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", required=True)
    parser.add_argument("--voice", default="en-US-ChristopherNeural")
    args = parser.parse_args()
    generate_voice(args.project, args.voice)

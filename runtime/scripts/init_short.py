#!/usr/bin/env python3
"""Scaffold a lightweight short project in shorts/<name>/ without duplicating node_modules or core engines."""
import argparse
import os
import re
import shutil

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
TEMPLATES_DIR = os.path.join(REPO_ROOT, "templates")
CORE_MODULES = ("ink", "lensblur", "grade", "lights", "shade", "cardshade", "paint", "toon")
CORE_IMPORT_RE = re.compile(
    r"""from\s+(["'])\./(""" + "|".join(CORE_MODULES) + r""")\1"""
)


def rewrite_core_imports(text: str) -> str:
    return CORE_IMPORT_RE.sub(r'from "@core/\2"', text)


def init_short(name: str, force: bool = False) -> str:
    short_dir = os.path.join(REPO_ROOT, "shorts", name)
    if os.path.exists(short_dir) and not force:
        raise FileExistsError(f"Short already exists: {short_dir} (pass --force to overwrite)")

    scene_dir = os.path.join(short_dir, "scene")
    voice_dir = os.path.join(short_dir, "voice")
    audio_dir = os.path.join(short_dir, "audio")
    out_dir = os.path.join(short_dir, "out")
    for d in (scene_dir, voice_dir, audio_dir, out_dir):
        os.makedirs(d, exist_ok=True)

    # Copy only the 4 per-short scene files and rewrite core imports to @core/*
    for fname in ("story.ts", "build.ts", "cast.ts", "world.ts"):
        src = os.path.join(TEMPLATES_DIR, "bridge", fname)
        dst = os.path.join(scene_dir, fname)
        with open(src, "r", encoding="utf-8") as fp:
            content = rewrite_core_imports(fp.read())
        with open(dst, "w", encoding="utf-8") as fp:
            fp.write(content)

    # Copy only timeline.py (audio engine lives in runtime/audio/)
    shutil.copy2(os.path.join(TEMPLATES_DIR, "audio", "timeline.py"), os.path.join(audio_dir, "timeline.py"))
    shutil.copy2(os.path.join(TEMPLATES_DIR, "SCRIPT_example.md"), os.path.join(short_dir, "SCRIPT.md"))

    print(f"[init_short] Created lightweight short at: shorts/{name}")
    print("  - scene/{story,build,cast,world}.ts (imports @core/*)")
    print("  - audio/timeline.py (uses shared runtime/audio/mix.py)")
    print("  - voice/ (place voice.wav and words.json here)")
    print("  - out/ (stills and renders go here)")
    return short_dir


def main():
    p = argparse.ArgumentParser(description="Create a lightweight cartoon-3d-short project")
    p.add_argument("name", help="Short project name (folder under shorts/<name>)")
    p.add_argument("--force", action="store_true", help="Overwrite existing files")
    args = p.parse_args()
    init_short(args.name, force=args.force)


if __name__ == "__main__":
    main()

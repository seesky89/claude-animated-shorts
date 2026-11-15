---
name: cartoon-3d-short-shared
description: Make a ~55-70 s vertical cartoon story short using the shared runtime in runtime/ (no per-short node_modules or duplicated engine code).
---

# Cartoon 3D Story Short (Shared Runtime)

Read and follow the full skill instructions in [SKILL.md](../../../SKILL.md) at the repository root.

Key rules:
- **Never** create `node_modules` or copy shader/audio engine files into individual short folders.
- Always scaffold new shorts with `python runtime/scripts/init_short.py <name>` under `shorts/<name>/`.
- Render stills with `node runtime/scripts/stills.mjs --project shorts/<name> ...`.
- Mix audio with `python runtime/audio/mix.py --project shorts/<name> --clean-cache`.
- Render final 2K video with `node runtime/scripts/render.mjs --project shorts/<name> --2k`.
- Always generate and provide YouTube Shorts metadata (`shorts/<name>/METADATA.md` — Title options, Description, Hashtags, Pinned Comment, Tags) with the final deliverable.

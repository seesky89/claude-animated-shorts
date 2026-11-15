# Workspace Agent Guidelines (`dev_shared_skill`)

- This repository uses the **`cartoon-3d-short-shared`** skill (`SKILL.md` at repo root).
- All common dependencies (`runtime/remotion/node_modules`), 3D/shader/toon core (`runtime/remotion/src/core/`), shared static assets (`runtime/remotion/public/`), and audio DSP/synth engine (`runtime/audio/`) are shared across all shorts.
- Every new short MUST be created under `shorts/<name>/` via `python runtime/scripts/init_short.py <name>` and must NOT duplicate `node_modules` or core engine files.

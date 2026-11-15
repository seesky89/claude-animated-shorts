# Claude Animated Shorts

The free Claude skill from the video **"How to Make Viral Animated Shorts Using Claude (Full Workflow)"**.

It makes 55-70 s vertical animated story shorts: 2D characters in a colourful 3D world, with ink outlines, a painted town, lens blur, gliding cameras, a march score and sound effects. Everything is rendered with three.js inside Remotion on your own PC, with no AI video generator.

Proven on **The Bridge That Fell for a Song**, a 67 s short about the 1831 Broughton bridge.

## What's inside
| Path | What it is |
|---|---|
| `SKILL.md` | The skill: the full pipeline, every rule, every fix, and the final look values |
| `runtime/remotion/` | Shared Remotion + Three.js host (`node_modules`, `src/core/`, `public/`) installed **once** |
| `runtime/audio/` | Shared audio DSP & synthesis engine (`mix.py --project shorts/<name>`) |
| `runtime/scripts/` | Shared scaffolding, stills, render, QA, and side-by-side helpers with auto temp cleanup |
| `templates/` | Original reference templates (`bridge/`, `audio/`, `scripts/`) |
| `references/STYLE_BIBLE.md` | The script and visual formula measured from 20 reference shorts |
| `references/reports/` | Seven measured reports: motion, depth, textures, characters, lighting, outlines, grade |
| `references/frames/` | 38 full-size reference frames (540x960) to compare your frames against |
| `references/sheets/` | 20 contact sheets, one per reference short, 60 frames each (1,200 frames) |

## Install & Setup (Shared Runtime)
1. Install Node dependencies **once** in `runtime/remotion/`:
   ```bash
   cd runtime/remotion && npm install
   ```
2. You need Node.js, Python 3 (`numpy`, `scipy`, `Pillow`), and `ffmpeg`.
3. Create a lightweight short project (no `node_modules` or engine duplication):
   ```bash
   python runtime/scripts/init_short.py my_short
   ```
4. Render stills or final video using the shared runtime:
   ```bash
   node runtime/scripts/stills.mjs --project shorts/my_short --frames 100,400 --scale 0.5
   python runtime/audio/mix.py --project shorts/my_short --clean-cache
   node runtime/scripts/render.mjs --project shorts/my_short --2k
   ```

## Notes
- Set `REMOTION_TMP` to a folder on a big drive. Every Remotion bundle copies `public/` (~1.3 GB) into the temp folder.
- Story, characters and voice should always be your own. Use the references for the look, not the content.

## License
The code and docs are MIT (see `LICENSE`). The reference frames are included for style study only.

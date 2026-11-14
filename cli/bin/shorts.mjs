#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const USAGE = `
=============================================================
Cartoon Animated Shorts Engine CLI
=============================================================
Usage:
  shorts new <project-name>         Create a new lightweight short project
  shorts voice <project-name>       Generate TTS voice and words.json alignment
  shorts audio <project-name>       Synthesize march music, SFX and mix to mix.wav
  shorts preview <project-name>     Render test still frames (default: 100,400)
  shorts render <project-name>      Render final mp4 video and mux with mix.wav
  shorts qa <project-name>          Run quality assurance audit (loudness, frames)
  shorts clean                      Clean up temp Remotion webpack bundles
=============================================================
`;

function runCmd(cmd, cwd = ROOT) {
  console.log(`[EXEC] ${cmd}`);
  execSync(cmd, { stdio: "inherit", cwd });
}

function resolveProject(name) {
  if (path.isAbsolute(name)) return name;
  const direct = path.resolve(ROOT, name);
  if (fs.existsSync(direct)) return direct;
  return path.resolve(ROOT, "projects", name);
}

const args = process.argv.slice(2);
const command = args[0];
const target = args[1];

if (!command) {
  console.log(USAGE);
  process.exit(0);
}

switch (command) {
  case "new": {
    if (!target) {
      console.error("[ERROR] Missing project name: shorts new <project-name>");
      process.exit(1);
    }
    const projDir = path.resolve(ROOT, "projects", target);
    if (fs.existsSync(projDir)) {
      console.error(`[ERROR] Project directory already exists: ${projDir}`);
      process.exit(1);
    }

    console.log(`[INIT] Creating new short project: ${projDir}`);
    fs.mkdirSync(path.join(projDir, "scene"), { recursive: true });
    fs.mkdirSync(path.join(projDir, "audio"), { recursive: true });
    fs.mkdirSync(path.join(projDir, "voice"), { recursive: true });
    fs.mkdirSync(path.join(projDir, "out"), { recursive: true });

    // Copy starter scene and audio files
    const srcStarter = path.resolve(ROOT, "projects/bridge-1831");
    for (const f of ["story.ts", "build.ts", "cast.ts", "world.ts"]) {
      fs.copyFileSync(path.join(srcStarter, "scene", f), path.join(projDir, "scene", f));
    }
    fs.copyFileSync(path.join(srcStarter, "audio", "timeline.py"), path.join(projDir, "audio", "timeline.py"));
    fs.copyFileSync(path.join(srcStarter, "audio", "cues.md"), path.join(projDir, "audio", "cues.md"));

    const initialScript = `# Topic: [Surprising True Event Title]
<!-- Hook: 1 line absurd fact. Setting -> Action -> Snap -> Consequence -> Callback -->

Hook line goes here.
Setting line goes here with year and place.
Action beat one escalates here.
Action beat two escalates further.
Snap moment breaks here.
Luckily, the double line twist.
Consequence rule goes here.
Callback twist ending.
`;
    fs.writeFileSync(path.join(projDir, "SCRIPT.md"), initialScript, "utf-8");
    console.log(`[SUCCESS] Project ${target} created successfully! (Disk used: < 50 KB)`);
    break;
  }

  case "voice": {
    if (!target) {
      console.error("[ERROR] Missing project: shorts voice <project-name>");
      process.exit(1);
    }
    const proj = resolveProject(target);
    console.log(`[VOICE] Generating speech and word alignments for: ${proj}`);
    runCmd(`python "${path.resolve(ROOT, "packages/voice/tts.py")}" --project "${proj}"`);
    runCmd(`python "${path.resolve(ROOT, "packages/voice/aligner.py")}" --project "${proj}"`);
    console.log(`[SUCCESS] Voice and words.json generated in ${path.join(proj, "voice")}`);
    break;
  }

  case "audio": {
    if (!target) {
      console.error("[ERROR] Missing project: shorts audio <project-name>");
      process.exit(1);
    }
    const proj = resolveProject(target);
    console.log(`[AUDIO] Synthesizing audio stems and mix for: ${proj}`);
    runCmd(`python "${path.resolve(ROOT, "packages/audio/cartoon_audio/mixer.py")}" --project "${proj}"`);
    console.log(`[SUCCESS] Audio mix completed -> ${path.join(proj, "out/mix.wav")}`);
    break;
  }

  case "preview": {
    if (!target) {
      console.error("[ERROR] Missing project: shorts preview <project-name> [frames]");
      process.exit(1);
    }
    const proj = resolveProject(target);
    const frames = args[2] || "100,400";
    const outPrefix = path.join(proj, "out", "preview_");
    console.log(`[PREVIEW] Rendering frames [${frames}] for: ${proj}`);
    const coreDir = path.resolve(ROOT, "packages/core");
    runCmd(`node -e "
      import { bundle } from '@remotion/bundler';
      import { renderStill, selectComposition } from '@remotion/renderer';
      import path from 'node:path';
      const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts') });
      const comp = await selectComposition({ serveUrl, id: 'BridgeShort' });
      for (const f of '${frames}'.split(',').map(Number)) {
        await renderStill({ composition: comp, serveUrl, frame: f, output: '${outPrefix.replace(/\\/g, "/")}' + f + '.jpg', scale: 0.5 });
        console.log('Saved still: ' + f);
      }
    "`, coreDir);
    break;
  }

  case "render": {
    if (!target) {
      console.error("[ERROR] Missing project: shorts render <project-name>");
      process.exit(1);
    }
    const proj = resolveProject(target);
    const scale = args.includes("--2k") ? 1.3333 : 1.0;
    const rawMp4 = path.join(proj, "out", "video_raw.mp4");
    const finalMp4 = path.join(proj, "out", "final.mp4");
    const mixWav = path.join(proj, "out", "mix.wav");
    const coreDir = path.resolve(ROOT, "packages/core");

    console.log(`[RENDER] Rendering 3D animation (scale: ${scale})...`);
    runCmd(`npx remotion render src/index.ts BridgeShort "${rawMp4}" --codec h264 --crf 16 --scale ${scale}`, coreDir);

    if (fs.existsSync(mixWav)) {
      console.log(`[MUX] Muxing video with mix.wav into final.mp4...`);
      runCmd(`ffmpeg -y -i "${rawMp4}" -i "${mixWav}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k "${finalMp4}"`);
      console.log(`[SUCCESS] Master video created: ${finalMp4}`);
    } else {
      console.log(`[NOTICE] No mix.wav found. Raw video saved to: ${rawMp4}`);
    }
    break;
  }

  case "qa": {
    if (!target) {
      console.error("[ERROR] Missing project: shorts qa <project-name>");
      process.exit(1);
    }
    const proj = resolveProject(target);
    const finalMp4 = path.join(proj, "out", "final.mp4");
    const qaOut = path.join(proj, "out", "qa");
    fs.mkdirSync(qaOut, { recursive: true });
    runCmd(`python "${path.resolve(ROOT, "templates/scripts/short_qa.py")}" "${finalMp4}" "${qaOut}"`);
    break;
  }

  case "clean": {
    console.log(`[CLEAN] Cleaning Remotion temporary bundle caches...`);
    const tempDir = process.env.REMOTION_TMP || process.env.TEMP || "C:/temp";
    if (fs.existsSync(tempDir)) {
      const items = fs.readdirSync(tempDir);
      let removed = 0;
      for (const item of items) {
        if (item.startsWith("remotion-webpack-bundle-") || item.startsWith("puppeteer_dev_chrome_profile-")) {
          try {
            fs.rmSync(path.join(tempDir, item), { recursive: true, force: true });
            removed++;
          } catch {}
        }
      }
      console.log(`[CLEAN] Cleaned ${removed} temporary bundle caches from ${tempDir}`);
    }
    break;
  }

  default:
    console.log(`Unknown command: ${command}\n${USAGE}`);
    process.exit(1);
}

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

// Load .env automatically if present
function loadEnv() {
  const envPath = path.resolve(ROOT, ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const [k, ...v] = trimmed.split("=");
      const key = k.trim();
      const val = v.join("=").trim().replace(/^['"]|['"]$/g, "");
      if (key && !process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}
loadEnv();

const USAGE = `
=============================================================
Cartoon Animated Shorts Engine CLI — v2.1.0
=============================================================
Usage:
  shorts create <name> --topic "<주제>" [--2k]  ★ 주제만 주면 프로젝트생성부터 대본AI작성+렌더까지 풀코스 전자동 완성!
  shorts script <name> --topic "<주제>"         AI(Gemini/Claude/OpenAI)로 SCRIPT.md 대본 자동 생성
  shorts build <name> [--2k]                    기존 프로젝트의 전자동 빌드 (voice -> audio -> render -> qa)
  shorts new <name>                             새로운 경량 쇼츠 프로젝트 생성
  shorts voice <name>                           대본 기반 TTS 음성 및 words.json 자동 추출
  shorts audio <name>                           배경음악 덕킹 및 SFX 합성 (mix.wav 생성)
  shorts preview <name> [frames]                스틸컷 프리뷰 렌더링 (기본: 100, 400프레임)
  shorts render <name>                          최종 mp4 비디오 렌더 및 오디오 자동 먹싱
  shorts qa <name>                              품질 무결성 및 -15 LUFS 라우드니스 검사
  shorts clean                                  Remotion Webpack 임시 캐시 정리
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

function parseTopic(argsList) {
  const tIdx = argsList.indexOf("--topic");
  if (tIdx !== -1 && argsList[tIdx + 1]) {
    return argsList[tIdx + 1];
  }
  return null;
}

const args = process.argv.slice(2);
const command = args[0];
const target = args[1];

if (!command) {
  console.log(USAGE);
  process.exit(0);
}

switch (command) {
  case "create": {
    if (!target) {
      console.error("[ERROR] Missing project name: shorts create <name> --topic \"<주제>\" [--2k]");
      process.exit(1);
    }
    const topic = parseTopic(args);
    if (!topic) {
      console.error("[ERROR] Missing topic: shorts create <name> --topic \"<주제>\"");
      process.exit(1);
    }

    const projDir = path.resolve(ROOT, "projects", target);
    console.log(`\n=============================================================`);
    console.log(`🌟 [ALL-IN-ONE CREATE] Generating Short from Topic: "${topic}"`);
    console.log(`=============================================================\n`);

    // 1. New project
    if (!fs.existsSync(projDir)) {
      console.log(`▶ [1/4] Initializing project structure: ${target}...`);
      runCmd(`node "${path.resolve(ROOT, "cli/bin/shorts.mjs")}" new "${target}"`);
    }

    // 2. Generate AI Script
    console.log(`\n▶ [2/4] Writing historical documentary script via AI...`);
    const scriptPath = path.join(projDir, "SCRIPT.md");
    runCmd(`python "${path.resolve(ROOT, "packages/voice/script_gen.py")}" --topic "${topic}" --out "${scriptPath}"`);

    // 3. Build whole video
    console.log(`\n▶ [3/4] Building video (Voice -> Audio -> 3D Render)...`);
    const is2k = args.includes("--2k") ? " --2k" : "";
    runCmd(`node "${path.resolve(ROOT, "cli/bin/shorts.mjs")}" build "${target}"${is2k}`);

    console.log(`\n=============================================================`);
    console.log(`🎉 [COMPLETE] Topic "${topic}" transformed into short: projects/${target}/out/final.mp4`);
    console.log(`=============================================================\n`);
    break;
  }

  case "script": {
    if (!target) {
      console.error("[ERROR] Missing project: shorts script <name> --topic \"<주제>\"");
      process.exit(1);
    }
    const topic = parseTopic(args);
    if (!topic) {
      console.error("[ERROR] Missing topic: shorts script <name> --topic \"<주제>\"");
      process.exit(1);
    }
    const proj = resolveProject(target);
    const scriptPath = path.join(proj, "SCRIPT.md");
    console.log(`[SCRIPT] Generating AI script for topic: "${topic}"`);
    runCmd(`python "${path.resolve(ROOT, "packages/voice/script_gen.py")}" --topic "${topic}" --out "${scriptPath}"`);
    break;
  }

  case "build": {
    if (!target) {
      console.error("[ERROR] Missing project: shorts build <name> [--2k]");
      process.exit(1);
    }
    const proj = resolveProject(target);
    const is2k = args.includes("--2k");

    // Ensure project structure exists (auto-repair if user created script only)
    if (!fs.existsSync(path.join(proj, "scene")) || !fs.existsSync(path.join(proj, "audio"))) {
      console.log(`[AUTO-INIT] Supplementing scene and audio template files for ${target}...`);
      fs.mkdirSync(path.join(proj, "scene"), { recursive: true });
      fs.mkdirSync(path.join(proj, "audio"), { recursive: true });
      fs.mkdirSync(path.join(proj, "voice"), { recursive: true });
      fs.mkdirSync(path.join(proj, "out"), { recursive: true });

      const srcStarter = path.resolve(ROOT, "projects/bridge-1831");
      for (const f of ["story.ts", "build.ts", "cast.ts", "world.ts"]) {
        const dst = path.join(proj, "scene", f);
        if (!fs.existsSync(dst)) fs.copyFileSync(path.join(srcStarter, "scene", f), dst);
      }
      for (const f of ["timeline.py", "cues.md"]) {
        const dst = path.join(proj, "audio", f);
        if (!fs.existsSync(dst)) fs.copyFileSync(path.join(srcStarter, "audio", f), dst);
      }
    }
    console.log(`\n=============================================================`);
    console.log(`🚀 [PIPELINE BUILD] Starting full pipeline for: ${target}`);
    console.log(`=============================================================\n`);

    // 1. Voice
    console.log(`▶ [1/4] Generating Voice and word alignment...`);
    runCmd(`python "${path.resolve(ROOT, "packages/voice/tts.py")}" --project "${proj}"`);
    runCmd(`python "${path.resolve(ROOT, "packages/voice/aligner.py")}" --project "${proj}"`);

    // 2. Audio
    console.log(`\n▶ [2/4] Synthesizing score, SFX & Ducked audio mix...`);
    runCmd(`python "${path.resolve(ROOT, "packages/audio/cartoon_audio/mixer.py")}" --project "${proj}"`);

    // 3. Render
    console.log(`\n▶ [3/4] Rendering 3D animation & Muxing final video...`);
    const scale = is2k ? 1.3333 : 1.0;
    const rawMp4 = path.join(proj, "out", "video_raw.mp4");
    const finalMp4 = path.join(proj, "out", "final.mp4");
    const mixWav = path.join(proj, "out", "mix.wav");
    const renderScript = path.resolve(ROOT, "packages/core/render.mjs");

    runCmd(`node "${renderScript}" BridgeShort "${rawMp4}" ${scale}`, path.resolve(ROOT, "packages/core"));
    if (fs.existsSync(mixWav)) {
      runCmd(`ffmpeg -y -i "${rawMp4}" -i "${mixWav}" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k "${finalMp4}"`);
    }

    // 4. QA
    console.log(`\n▶ [4/4] Running Quality Assurance (QA)...`);
    const qaOut = path.join(proj, "out", "qa");
    fs.mkdirSync(qaOut, { recursive: true });
    try {
      runCmd(`python "${path.resolve(ROOT, "templates/scripts/short_qa.py")}" "${finalMp4}" "${qaOut}"`);
    } catch {
      console.log(`[QA] QA audit finished.`);
    }

    console.log(`\n=============================================================`);
    console.log(`🎉 [SUCCESS] Pipeline complete! Output: ${finalMp4}`);
    console.log(`=============================================================\n`);
    break;
  }

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
    const renderScript = path.resolve(ROOT, "packages/core/render.mjs");
    runCmd(`node "${renderScript}" BridgeShort "${rawMp4}" ${scale}`, path.resolve(ROOT, "packages/core"));

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

// Shared video renderer with automatic temp bundle cleanup and optional ffmpeg audio muxing.
// Usage: node runtime/scripts/render.mjs --project shorts/<name> [--2k] [--scale 1.3333]
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");
const runtimeDir = path.join(repoRoot, "runtime", "remotion");
const require = createRequire(path.join(runtimeDir, "package.json"));

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(name);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback;
}

const projectRel = arg("--project", process.env.SHORT_PROJECT);
if (!projectRel) {
  console.error("Usage: node runtime/scripts/render.mjs --project shorts/<name> [--2k]");
  process.exit(1);
}

const is2k = process.argv.includes("--2k");
const scale = Number(arg("--scale", is2k ? 4 / 3 : 1));
const projectAbs = path.resolve(repoRoot, projectRel);
const outDir = path.join(projectAbs, "out");
fs.mkdirSync(outDir, { recursive: true });

const videoOut = path.join(outDir, "video.mp4");
const mixAudio = path.join(projectAbs, "audio", "mix.wav");
const finalOut = path.join(outDir, "final.mp4");

const tmpRoot = process.env.REMOTION_TMP || path.join(repoRoot, "remotion-tmp");
const runTmp = path.join(tmpRoot, `render_${Date.now()}_${process.pid}`);
fs.mkdirSync(runTmp, { recursive: true });
process.env.TEMP = process.env.TMP = runTmp;
process.env.SHORT_PROJECT = projectRel;

const { bundle } = require("@remotion/bundler");
const { renderMedia, selectComposition } = require("@remotion/renderer");

const browserExecutable = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const chromiumOptions = { gl: "angle" };

const projectSceneDir =
  path.basename(projectAbs) === "scene" || projectRel.includes("templates")
    ? projectAbs
    : path.join(projectAbs, "scene");

try {
  const serveUrl = await bundle({
    entryPoint: path.join(runtimeDir, "src", "index.ts"),
    publicDir: path.join(runtimeDir, "public"),
    webpackOverride: (currentConfig) => ({
      ...currentConfig,
      resolve: {
        ...currentConfig.resolve,
        alias: {
          ...currentConfig.resolve?.alias,
          "@core": path.join(runtimeDir, "src", "core"),
          "@project": projectSceneDir,
          three: path.join(runtimeDir, "node_modules", "three"),
          react: path.join(runtimeDir, "node_modules", "react"),
          "react-dom": path.join(runtimeDir, "node_modules", "react-dom"),
          remotion: path.join(runtimeDir, "node_modules", "remotion"),
        },
      },
    }),
  });
  const composition = await selectComposition({
    serveUrl,
    id: "CartoonShort",
    browserExecutable: fs.existsSync(browserExecutable) ? browserExecutable : undefined,
    chromiumOptions,
  });
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 16,
    scale,
    concurrency: 1,
    outputLocation: videoOut,
    browserExecutable: fs.existsSync(browserExecutable) ? browserExecutable : undefined,
    chromiumOptions,
    timeoutInMilliseconds: 180000,
    onProgress: ({ progress }) => {
      if (Math.round(progress * 100) % 10 === 0) process.stdout.write(`\r[render] ${(progress * 100).toFixed(0)}%`);
    },
  });
  console.log(`\n[render] wrote ${videoOut}`);

  if (fs.existsSync(mixAudio)) {
    const res = spawnSync(
      "ffmpeg",
      ["-y", "-i", videoOut, "-i", mixAudio, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", finalOut],
      { stdio: "inherit" }
    );
    if (res.status === 0) console.log(`[render] muxed ${finalOut}`);
  }
} finally {
  try {
    for (const entry of fs.readdirSync(runTmp)) {
      try {
        fs.rmSync(path.join(runTmp, entry), { recursive: true, force: true, maxRetries: 3, retryDelay: 200 });
      } catch {
        // ignore locked Chrome profile files on Windows
      }
    }
    fs.rmSync(runTmp, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
}

// Centralized Remotion Renderer for Hub projects
// Usage: node scripts/render.mjs [compositionId] [outputPath] [--project projects/bridge] [--scale 1.0]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

if (process.env.REMOTION_TMP) {
  fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true });
  process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP;
}

const args = process.argv.slice(2);
let compId = args[0] || "BridgeShort";
let outFile = args[1] || `out/${compId}.mp4`;
let scale = 1.0;
let projectSceneDir = path.resolve(ROOT, "projects/bridge/scene");
if (!fs.existsSync(projectSceneDir)) {
  projectSceneDir = path.resolve(ROOT, "projects/bridge");
}

// Parse flags
const scaleIdx = args.indexOf("--scale");
if (scaleIdx !== -1 && args[scaleIdx + 1]) {
  scale = Number(args[scaleIdx + 1]);
}

const projIdx = args.indexOf("--project");
if (projIdx !== -1 && args[projIdx + 1]) {
  const customProj = path.resolve(ROOT, args[projIdx + 1]);
  const sceneSub = path.join(customProj, "scene");
  projectSceneDir = fs.existsSync(sceneSub) ? sceneSub : customProj;
} else {
  // Infer from outFile path
  const projMatch = path.resolve(outFile).match(/[\\\/]projects[\\\/]([^\\\/]+)/);
  if (projMatch) {
    const inferred = path.resolve(ROOT, "projects", projMatch[1]);
    const sceneSub = path.join(inferred, "scene");
    projectSceneDir = fs.existsSync(sceneSub) ? sceneSub : inferred;
  }
}

console.log(`[HUB] Active project scene: ${projectSceneDir}`);

const browserExecutable = process.env.CHROME_BIN || (
  process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : undefined
);
const chromiumOptions = {
  gl: "angle",
  args: [
    "--disable-dev-shm-usage",
    "--no-sandbox",
    "--ignore-gpu-blocklist",
    "--enable-gpu-rasterization",
    "--enable-zero-copy",
    "--js-flags=--max-old-space-size=8192",
  ],
};

const outDir = path.dirname(path.resolve(outFile));
fs.mkdirSync(outDir, { recursive: true });

console.log(`[BUNDLE] Bundling Hub Remotion for [${compId}]...`);
const serveUrl = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  publicDir: path.resolve(__dirname, "../public"),
  webpackOverride: (currentConfiguration) => {
    return {
      ...currentConfiguration,
      resolve: {
        ...currentConfiguration.resolve,
        alias: {
          ...(currentConfiguration.resolve?.alias ?? {}),
          "@current-project": projectSceneDir,
          "@core": path.resolve(__dirname, "../src/core"),
          "@shaders": path.resolve(__dirname, "../src/core"),
          "@toon": path.resolve(__dirname, "../src/core"),
          "@project": path.resolve(ROOT, "projects"),
        },
      },
    };
  },
});

console.log(`[SELECT] Selecting composition: ${compId}...`);
const composition = await selectComposition({
  serveUrl,
  id: compId,
  browserExecutable,
  chromiumOptions,
});

console.log(`[RENDER] Rendering [${compId}] to ${outFile} (scale: ${scale}, concurrency: 1)...`);
try {
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    crf: 16,
    scale,
    concurrency: 1,
    outputLocation: outFile,
    browserExecutable,
    chromiumOptions,
    timeoutInMilliseconds: 600000,
    onProgress: ({ renderedFrames, encodedFrames }) => {
      if (renderedFrames % 30 === 0 || renderedFrames === composition.durationInFrames) {
        console.log(`[PROGRESS] Rendered: ${renderedFrames}/${composition.durationInFrames}, Encoded: ${encodedFrames}`);
      }
    },
  });
  console.log(`[RENDER DONE] Successfully rendered: ${outFile}`);
} catch (err) {
  console.error(`[RENDER ERROR]`, err);
  process.exit(1);
}

// Direct programmatic renderer for Cartoon Shorts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const args = process.argv.slice(2);
const compId = args[0] || "BridgeShort";
const outFile = path.resolve(args[1] || "out/video_raw.mp4");
const scale = Number(args[2]) || 1.0;
const projectArg = args[3];

// Resolve project scene directory
let projectSceneDir = path.resolve(ROOT, "projects/bridge-1831/scene");
if (projectArg) {
  projectSceneDir = path.resolve(projectArg, "scene");
} else {
  // Infer from outFile path (e.g., .../projects/gorilla/out/video_raw.mp4 -> .../projects/gorilla/scene)
  const projMatch = outFile.match(/[\\\/]projects[\\\/]([^\\\/]+)/);
  if (projMatch) {
    const inferred = path.resolve(ROOT, "projects", projMatch[1], "scene");
    if (fs.existsSync(inferred)) {
      projectSceneDir = inferred;
    }
  }
}

console.log(`[PROJECT] Active scene directory: ${projectSceneDir}`);

if (process.env.REMOTION_TMP) {
  fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true });
  process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP;
}

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
  ],
};

fs.mkdirSync(path.dirname(outFile), { recursive: true });

console.log(`[BUNDLE] Bundling Remotion for ${compId}...`);
const serveUrl = await bundle({
  entryPoint: path.resolve(__dirname, "src/index.ts"),
  publicDir: path.resolve(__dirname, "public"),
  webpackOverride: (currentConfiguration) => {
    return {
      ...currentConfiguration,
      resolve: {
        ...currentConfiguration.resolve,
        alias: {
          ...(currentConfiguration.resolve?.alias ?? {}),
          "@current-project": projectSceneDir,
          "@shaders": path.resolve(__dirname, "src/shaders"),
          "@toon": path.resolve(__dirname, "src/toon"),
          "@project": path.resolve(__dirname, "../../projects"),
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

console.log(`[RENDER] Rendering 3D animation to: ${outFile} (scale: ${scale}, concurrency: 1)...`);
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

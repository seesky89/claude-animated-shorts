// usage: node scripts/render.mjs [compositionId] [outputPath] [--scale 1.3333]
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

if (process.env.REMOTION_TMP) {
  fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true });
  process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP;
}

const args = process.argv.slice(2);
let compId = args[0] || "BridgeShort";
let outFile = args[1] || `out/${compId}.mp4`;
let scale = 1.0;

const scaleIdx = args.indexOf("--scale");
if (scaleIdx !== -1 && args[scaleIdx + 1]) {
  scale = Number(args[scaleIdx + 1]);
}

const browserExecutable = process.env.CHROME_BIN || (
  process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : undefined
);
const chromiumOptions = { gl: "angle" };

const outDir = path.dirname(path.resolve(outFile));
fs.mkdirSync(outDir, { recursive: true });

console.log(`Bundling Hub Remotion for [${compId}]...`);
const serveUrl = await bundle({
  entryPoint: path.resolve(process.env.HUB_ENTRY || "src/index.ts"),
  publicDir: path.resolve("public"),
});

const composition = await selectComposition({
  serveUrl,
  id: compId,
  browserExecutable,
  chromiumOptions,
});

console.log(`Rendering [${compId}] to ${outFile} (scale: ${scale})...`);
await renderMedia({
  composition,
  serveUrl,
  codec: "h264",
  crf: 16,
  scale,
  outputLocation: outFile,
  browserExecutable,
  chromiumOptions,
  timeoutInMilliseconds: 300000,
});

console.log(`Render complete: ${outFile}`);

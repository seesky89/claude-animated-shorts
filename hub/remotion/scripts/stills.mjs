// usage: node scripts/stills.mjs [compositionId] <outPrefix> <frame,frame,...> [scale]
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

if (process.env.REMOTION_TMP) {
  fs.mkdirSync(process.env.REMOTION_TMP, { recursive: true });
  process.env.TEMP = process.env.TMP = process.env.REMOTION_TMP;
}

const args = process.argv.slice(2);
let compId = "BridgeShort";
let prefix = "out/x_";
let frames = "100,400";
let scale = "0.5";

if (args.length === 3) {
  [prefix, frames, scale] = args;
} else if (args.length >= 4) {
  [compId, prefix, frames, scale] = args;
}

const browserExecutable = process.env.CHROME_BIN || (
  process.platform === "win32"
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
    : undefined
);
const chromiumOptions = { gl: "angle" };

const outDir = path.dirname(path.resolve(prefix));
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

const onBrowserLog = (l) => {
  if (l.type === "error" || l.type === "warning") {
    console.log(`[${l.type}]`, l.text.slice(0, 300));
  }
};

for (const f of frames.split(",").map(Number)) {
  const t0 = Date.now();
  const outPath = `${prefix}${f}.jpg`;
  await renderStill({
    composition,
    serveUrl,
    frame: f,
    output: outPath,
    imageFormat: "jpeg",
    jpegQuality: 88,
    scale: Number(scale),
    browserExecutable,
    chromiumOptions,
    timeoutInMilliseconds: 180000,
    onBrowserLog,
  });
  console.log(`Rendered frame ${f} -> ${outPath} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
}

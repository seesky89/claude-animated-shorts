// Shared stills renderer with automatic temp bundle cleanup.
// Usage: node runtime/scripts/stills.mjs --project shorts/<name> --frames 100,400 [--scale 0.5] [--out out/stills/x_]
import fs from "node:fs";
import path from "node:path";
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

const projectRel = arg("--project", process.env.SHORT_PROJECT || "templates/bridge");
const framesArg = arg("--frames", "100");
const scale = Number(arg("--scale", "0.5"));
const projectAbs = path.resolve(repoRoot, projectRel);
const outPrefix = arg(
  "--out",
  path.join(projectAbs, "out", "stills", "x_")
);

// Isolate temp dir per run so we can safely delete remotion-webpack-bundle-* and chrome profiles in finally
const tmpRoot = process.env.REMOTION_TMP || path.join(repoRoot, "remotion-tmp");
const runTmp = path.join(tmpRoot, `stills_${Date.now()}_${process.pid}`);
fs.mkdirSync(runTmp, { recursive: true });
process.env.TEMP = process.env.TMP = runTmp;
process.env.SHORT_PROJECT = projectRel;

const { bundle } = require("@remotion/bundler");
const { renderStill, selectComposition } = require("@remotion/renderer");

const browserExecutable = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const chromiumOptions = { gl: "angle" };

fs.mkdirSync(path.dirname(path.resolve(repoRoot, outPrefix)), { recursive: true });

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
  const onBrowserLog = (l) => {
    if (l.type === "error" || l.type === "warning") console.log(`[${l.type}]`, l.text.slice(0, 300));
  };
  for (const f of framesArg.split(",").map(Number)) {
    const t0 = Date.now();
    const outFile = `${outPrefix}${f}.jpg`;
    await renderStill({
      composition,
      serveUrl,
      frame: f,
      output: outFile,
      imageFormat: "jpeg",
      jpegQuality: 88,
      scale,
      browserExecutable: fs.existsSync(browserExecutable) ? browserExecutable : undefined,
      chromiumOptions,
      timeoutInMilliseconds: 180000,
      onBrowserLog,
    });
    console.log("still", f, "->", outFile, ((Date.now() - t0) / 1000).toFixed(1) + "s");
  }
} finally {
  // Clean up large webpack bundles; swallow Windows EBUSY on Chrome Crashpad lock files
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

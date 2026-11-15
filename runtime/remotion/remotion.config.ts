import path from "node:path";
import { Config } from "@remotion/cli/config";

const repoRoot = path.resolve(__dirname, "../..");
const projectRel = process.env.SHORT_PROJECT || "templates/bridge";
const resolved = path.resolve(repoRoot, projectRel);
// Support both `shorts/<name>` (with `scene/` subfolder) and direct scene dirs like `templates/bridge`
const projectSceneDir = path.basename(resolved) === "scene" || projectRel.includes("templates")
  ? resolved
  : path.join(resolved, "scene");

Config.overrideWebpackConfig((currentConfig) => {
  return {
    ...currentConfig,
    resolve: {
      ...currentConfig.resolve,
      alias: {
        ...currentConfig.resolve?.alias,
        "@core": path.resolve(__dirname, "src/core"),
        "@project": projectSceneDir,
      },
    },
  };
});

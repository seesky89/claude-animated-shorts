import { Config } from "@remotion/cli/config";
import path from "path";

if (process.env.REMOTION_TMP) {
  // @ts-ignore
  Config.setTmpDir(process.env.REMOTION_TMP);
}

Config.overrideWebpackConfig((currentConfiguration) => {
  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      alias: {
        ...(currentConfiguration.resolve?.alias ?? {}),
        "@shaders": path.resolve(__dirname, "src/shaders"),
        "@toon": path.resolve(__dirname, "src/toon"),
        "@project": path.resolve(__dirname, "../../projects"),
      },
    },
  };
});

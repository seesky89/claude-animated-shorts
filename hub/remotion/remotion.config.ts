import { Config } from "@remotion/cli/config";
import path from "path";

// Support custom temp folder to prevent filling system drive
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
        "@core": path.resolve(__dirname, "src/core"),
        "@project": path.resolve(__dirname, "../../projects"),
      },
    },
  };
});

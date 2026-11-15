import React from "react";
import { Composition } from "remotion";
import { CartoonScene } from "./CartoonScene";

// @ts-ignore
import { TOTAL } from "@current-project/story";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BridgeShort"
        component={CartoonScene}
        durationInFrames={TOTAL || 2025}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="RamanujanShort"
        component={CartoonScene}
        durationInFrames={TOTAL || 2010}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};

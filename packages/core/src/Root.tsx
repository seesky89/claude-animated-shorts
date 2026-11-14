import React from "react";
import { Composition } from "remotion";
import { CartoonScene } from "./CartoonScene";

// Bridge demo composition
import * as bridgeWorld from "../../../projects/bridge-1831/scene/world";
import * as bridgeStory from "../../../projects/bridge-1831/scene/story";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BridgeShort"
        component={CartoonScene}
        durationInFrames={bridgeStory.TOTAL}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          worldModule: bridgeWorld,
          storyModule: bridgeStory,
        }}
      />
    </>
  );
};

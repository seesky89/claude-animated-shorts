import React from "react";
import { Composition } from "remotion";
import { ShortComposition, SHORT_FRAMES } from "./ShortComposition";
import { FPS } from "@project/story";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CartoonShort"
      component={ShortComposition}
      durationInFrames={SHORT_FRAMES}
      fps={FPS || 30}
      width={1080}
      height={1920}
    />
  );
};

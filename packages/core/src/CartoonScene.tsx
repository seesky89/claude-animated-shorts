import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";

import { InkPass, noInkFallback } from "./shaders/ink";
import { LensBlur, GrainEffect } from "./shaders/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "./shaders/grade";

export type WorldModule = {
  World: new (kit: any) => {
    root: THREE.Object3D;
    update: (id: number, f: number, cam: THREE.PerspectiveCamera, scene: THREE.Scene) => THREE.Vector3;
  };
  loadKit: () => Promise<any>;
};

export type StoryModule = {
  TOTAL: number;
  FLASH_AT?: number;
  SHOTS: Array<{ light: "day" | "golden"; [key: string]: any }>;
  layersAt: (f: number) => Array<[number, number]>;
  dofAt: (f: number) => { focus?: (f: number) => [number, number, number]; cInf: number };
};

type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean };
const toggles = (): PostToggles => ({
  ink: true, lens: true, pre: true, bloom: true, grade: true, grain: false,
  ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {})
});

const makeBloom = () => {
  const b = new BloomEffect({
    blendFunction: BlendFunction.ADD,
    intensity: 0.5,
    luminanceThreshold: 1.0,
    luminanceSmoothing: 0.2,
    mipmapBlur: true,
    levels: 6,
    radius: 0.6,
  });
  const mip = b.mipmapBlurPass;
  const setSize = mip.setSize.bind(mip);
  mip.setSize = (w: number, h: number) => setSize(Math.round((1920 * w) / Math.max(h, 1)), 1920);
  return b;
};

const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();

const Inner: React.FC<{
  id: number;
  kit: any;
  worldModule: WorldModule;
  storyModule: StoryModule;
}> = ({ id, kit, worldModule, storyModule }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new worldModule.World(kit), [kit, worldModule]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera),
    lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: makeBloom(),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
    grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }),
  }), [camera, scene]);

  useEffect(() => () => fx.ink.dispose(), [fx]);

  const post = useMemo(() => (
    <EffectComposer multisampling={4}>
      {on.ink ? <primitive object={fx.ink} dispose={null} /> : <></>}
      {on.lens && on.pre ? <primitive object={fx.lens.pre} dispose={null} /> : <></>}
      {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : <></>}
      {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : <></>}
      <primitive object={fx.tone} dispose={null} />
      {on.grade ? <primitive object={fx.grade} dispose={null} /> : <></>}
      {on.grain ? <primitive object={fx.grain} dispose={null} /> : <></>}
    </EffectComposer>
  ), [fx, on]);

  const cam = camera as THREE.PerspectiveCamera;
  target.copy(world.update(id, f, cam, scene));
  noInkFallback(world.root);

  const d = storyModule.dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f));
  else fpt.copy(target);

  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;

  const shotLight = storyModule.SHOTS[id - 1]?.light ?? "day";
  gradeFor(fx.grade, shotLight);
  fx.grain.seed = f;

  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;

export const CartoonScene: React.FC<{
  worldModule: WorldModule;
  storyModule: StoryModule;
}> = ({ worldModule, storyModule }) => {
  const [kit, setKit] = useState<any | null>(null);
  const [handle] = useState(() => delayRender("loading kit"));
  useEffect(() => {
    worldModule.loadKit().then((k) => {
      setKit(k);
      continueRender(handle);
    });
  }, [handle, worldModule]);

  const f = useCurrentFrame();
  const layers = storyModule.layersAt(f);
  if (!kit) return null;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {layers.map(([id, alpha]) => (
        <AbsoluteFill key={id} style={{ opacity: alpha }}>
          <ThreeCanvas
            width={1080}
            height={1920}
            {...(dprOverride() ? { dpr: dprOverride() } : {})}
            shadows
            gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
            camera={{ fov: 40, near: 0.2, far: 1500 }}
          >
            <Inner id={id} kit={kit} worldModule={worldModule} storyModule={storyModule} />
          </ThreeCanvas>
        </AbsoluteFill>
      ))}
      {storyModule.FLASH_AT !== undefined && f >= storyModule.FLASH_AT && f < storyModule.FLASH_AT + 4 ? (
        <AbsoluteFill style={{ background: "#fff", opacity: (storyModule.FLASH_AT + 4 - f) / 4 }} />
      ) : null}
    </AbsoluteFill>
  );
};

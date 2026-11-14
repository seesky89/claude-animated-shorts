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

// Import dynamically bound current project scene modules
// @ts-ignore
import { World, loadKit } from "@current-project/world";
// @ts-ignore
import { TOTAL, FLASH_AT, SHOTS, layersAt, dofAt } from "@current-project/story";

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

const Inner: React.FC<{ id: number; kit: any }> = ({ id, kit }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(kit), [kit]);
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

  useEffect(() => {
    const inkToDispose = fx.ink;
    const disposeFn = typeof inkToDispose?.dispose === "function" ? inkToDispose.dispose.bind(inkToDispose) : null;
    return () => {
      if (disposeFn) {
        try {
          disposeFn();
        } catch {
          // ignore already disposed
        }
      }
    };
  }, [fx]);

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

  const d = dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f));
  else fpt.copy(target);

  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;

  const shotDef = SHOTS.find((s: any) => s.id === id);
  const shotLight = shotDef?.light ?? "day";
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

export const CartoonScene: React.FC = () => {
  const [kit, setKit] = useState<any | null>(null);
  const [handle] = useState(() => delayRender("loading kit"));
  useEffect(() => {
    loadKit().then((k: any) => {
      setKit(k);
      continueRender(handle);
    });
  }, [handle]);

  const f = useCurrentFrame();
  const rawLayers = layersAt(f);
  // Support both [{id, alpha}] and [[id, alpha]] formats
  const layers: { id: number; alpha: number }[] = rawLayers.map((l: any) => 
    Array.isArray(l) ? { id: l[0], alpha: l[1] } : l
  );

  if (!kit) return null;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {layers.map(({ id, alpha }, i) => (
        <AbsoluteFill key={i ? "over" : "base"} style={{ opacity: alpha }}>
          <ThreeCanvas
            width={1080}
            height={1920}
            {...(dprOverride() ? { dpr: dprOverride() } : {})}
            shadows
            gl={{ antialias: false, stencil: false, powerPreference: "high-performance", toneMappingExposure: 1.0 }}
            camera={{ fov: 40, near: 0.2, far: 1500 }}
          >
            <Inner id={id} kit={kit} />
          </ThreeCanvas>
        </AbsoluteFill>
      ))}
      {FLASH_AT !== undefined && f >= FLASH_AT && f < FLASH_AT + 4 ? (
        <AbsoluteFill style={{ background: "#fff", opacity: (FLASH_AT + 4 - f) / 4 }} />
      ) : null}
    </AbsoluteFill>
  );
};

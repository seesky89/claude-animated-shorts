import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, getInputProps, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback } from "@core/ink";
import { LensBlur, GrainEffect } from "@core/lensblur";
import { GradeEffect, GRADES, GRADE_STRENGTH, gradeFor } from "@core/grade";
import { World, loadKit } from "@project/world";
import { TOTAL, FLASH_AT, SHOTS, layersAt, dofAt } from "@project/story";

export const SHORT_FRAMES = TOTAL;

type PostToggles = { ink: boolean; lens: boolean; pre: boolean; bloom: boolean; grade: boolean; grain: boolean };
const toggles = (): PostToggles => ({
  ink: true,
  lens: true,
  pre: true,
  bloom: true,
  grade: true,
  grain: false,
  ...((getInputProps() as { post?: Partial<PostToggles> }).post ?? {}),
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

const fwd = new THREE.Vector3();
const fpt = new THREE.Vector3();

const useKit = () => {
  const [kit, setKit] = useState<Record<string, THREE.Object3D> | null>(null);
  const [handle] = useState(() => delayRender("short kit"));
  useEffect(() => {
    const loader = typeof loadKit === "function" ? loadKit() : Promise.resolve({});
    loader
      .then((k) => {
        setKit(k as Record<string, THREE.Object3D>);
        continueRender(handle);
      })
      .catch(() => {
        setKit({});
        continueRender(handle);
      });
  }, [handle]);
  return kit;
};

const Inner: React.FC<{ id: number; kit: Record<string, THREE.Object3D> }> = ({ id, kit }) => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World(kit), [kit]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const on = useMemo(toggles, []);

  const fx = useMemo(() => {
    const ink = new InkPass(scene, camera as THREE.PerspectiveCamera);
    return {
      ink,
      disposeInk: () => {
        try {
          ink.dispose();
        } catch {
          // R3F may overwrite dispose during shot unmount
        }
      },
      lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
      bloom: makeBloom(),
      tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
      grade: new GradeEffect(GRADES.day, GRADE_STRENGTH.day),
      grain: new GrainEffect({ amount: 0.025, cellPx: 1.5 }),
    };
  }, [camera, scene]);

  useEffect(() => () => fx.disposeInk(), [fx]);

  const post = useMemo(
    () => (
      <EffectComposer multisampling={4}>
        {on.ink ? <primitive object={fx.ink} dispose={null} /> : <></>}
        {on.lens && on.pre ? <primitive object={fx.lens.pre} dispose={null} /> : <></>}
        {on.lens ? <primitive object={fx.lens.main} dispose={null} /> : <></>}
        {on.bloom ? <primitive object={fx.bloom} dispose={null} /> : <></>}
        <primitive object={fx.tone} dispose={null} />
        {on.grade ? <primitive object={fx.grade} dispose={null} /> : <></>}
        {on.grain ? <primitive object={fx.grain} dispose={null} /> : <></>}
      </EffectComposer>
    ),
    [fx, on]
  );

  const cam = camera as THREE.PerspectiveCamera;
  target.copy(world.update(id, f, cam, scene));
  noInkFallback(world.root);

  const d = dofAt(f);
  cam.getWorldDirection(fwd);
  if (d.focus) fpt.set(...d.focus(f));
  else fpt.copy(target);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd));
  fx.lens.cInf = d.cInf;
  gradeFor(fx.grade, SHOTS[id - 1].light);
  fx.grain.seed = f;

  return (
    <>
      <primitive object={world.root} dispose={null} />
      {post}
    </>
  );
};

const dprOverride = () => (getInputProps() as { post?: { dpr?: number } }).post?.dpr;

const ShotView: React.FC<{ id: number; kit: Record<string, THREE.Object3D>; alpha: number }> = ({
  id,
  kit,
  alpha,
}) => (
  <AbsoluteFill style={{ opacity: alpha }}>
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
);

export const ShortComposition: React.FC = () => {
  const f = useCurrentFrame();
  const kit = useKit();
  if (!kit) return null;
  const flash = f >= FLASH_AT && f < FLASH_AT + 4 ? [1, 0.75, 0.45, 0.2][f - FLASH_AT] : 0;
  return (
    <AbsoluteFill style={{ background: "#cfe3f2" }}>
      {layersAt(f).map((l, i) => (
        <ShotView key={i ? "over" : "base"} id={l.id} kit={kit} alpha={l.alpha} />
      ))}
      {flash > 0 && <AbsoluteFill style={{ background: "#ffffff", opacity: flash }} />}
    </AbsoluteFill>
  );
};

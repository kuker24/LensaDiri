"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

/** Frost Soft Product portal — decorative hero object (no scoring claims). */
const FROST = {
  fog: 0x101828,
  metal: 0xf0f5ff,
  metalDark: 0xb8ccff,
  glass: 0xe0ebff,
  glassAtten: 0x7a9cff,
  iris: 0x1a2438,
  core: 0x8aafff,
  satA: 0xffffff,
  satB: 0x7a9cff,
  key: 0xffffff,
  fill: 0x8aafff,
  rim: 0xc8d8ff,
  point: 0x8aafff,
  ambient: 0x9aacc8,
} as const;

type PortalLensProps = {
  className?: string;
};

export function PortalLens({ className }: PortalLensProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const preferLite =
      reducedMotion ||
      window.matchMedia("(max-width: 768px)").matches ||
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory === 1;

    const canvas = document.createElement("canvas");
    canvas.className = "absolute inset-0 h-full w-full";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !preferLite,
      alpha: true,
      powerPreference: preferLite ? "low-power" : "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, preferLite ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(FROST.fog, 0.022);

    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.95;

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0.35, 0.12, 7.2);

    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    if (!preferLite) {
      composer = new EffectComposer(renderer);
      composer.addPass(new RenderPass(scene, camera));
      bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.62, 0.48, 0.72);
      composer.addPass(bloomPass);
      composer.addPass(new OutputPass());
    }

    const ambient = new THREE.AmbientLight(FROST.ambient, 0.24);
    scene.add(ambient);
    const key = new THREE.DirectionalLight(FROST.key, 2.2);
    key.position.set(4.2, 5.5, 5.5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(FROST.fill, 0.95);
    fill.position.set(-5.5, 0.5, 2.5);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(FROST.rim, 1.55);
    rim.position.set(-3.5, 3.2, -5.5);
    scene.add(rim);
    const point = new THREE.PointLight(FROST.point, 16, 20, 1.6);
    point.position.set(1.2, 0.35, 3);
    scene.add(point);
    const coreLight = new THREE.PointLight(FROST.core, 7, 6, 2);
    coreLight.position.set(0.2, 0.05, 0.35);
    scene.add(coreLight);

    const portal = new THREE.Group();
    portal.position.set(0.15, 0.05, 0);
    portal.scale.setScalar(0.92);
    scene.add(portal);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(obj: T): T => {
      disposables.push(obj);
      return obj;
    };

    const metal = new THREE.MeshPhysicalMaterial({
      color: FROST.metal,
      metalness: 0.92,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      envMapIntensity: 1.35,
    });
    const metalSoft = new THREE.MeshPhysicalMaterial({
      color: FROST.metalDark,
      metalness: 0.78,
      roughness: 0.28,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
    });
    const glass = new THREE.MeshPhysicalMaterial({
      color: FROST.glass,
      metalness: 0,
      roughness: 0.02,
      transmission: 0.94,
      thickness: 1.15,
      ior: 1.52,
      transparent: true,
      opacity: 0.98,
      side: THREE.DoubleSide,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      attenuationColor: new THREE.Color(FROST.glassAtten),
      attenuationDistance: 1.35,
      envMapIntensity: 1.6,
    });
    const irisMat = new THREE.MeshPhysicalMaterial({
      color: FROST.iris,
      metalness: 0.55,
      roughness: 0.32,
      clearcoat: 0.5,
      transparent: true,
      opacity: 0.88,
    });
    const glowMat = new THREE.MeshBasicMaterial({
      color: FROST.core,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const satA = new THREE.MeshPhysicalMaterial({
      color: FROST.satA,
      metalness: 0.7,
      roughness: 0.16,
      clearcoat: 1,
      emissive: 0x1a2040,
      emissiveIntensity: 0.15,
    });
    const satB = new THREE.MeshPhysicalMaterial({
      color: FROST.satB,
      metalness: 0.55,
      roughness: 0.2,
      clearcoat: 1,
      emissive: FROST.core,
      emissiveIntensity: 0.35,
    });
    [metal, metalSoft, glass, irisMat, glowMat, satA, satB].forEach(track);

    const outer = new THREE.Mesh(
      track(new THREE.TorusGeometry(1.72, 0.042, 28, preferLite ? 96 : 160)),
      metal,
    );
    portal.add(outer);
    const orbit = new THREE.Mesh(
      track(new THREE.TorusGeometry(1.95, 0.014, 14, preferLite ? 80 : 140)),
      metalSoft,
    );
    orbit.rotation.x = 0.72;
    orbit.rotation.y = 0.18;
    portal.add(orbit);
    const mid = new THREE.Mesh(
      track(new THREE.TorusGeometry(1.28, 0.028, 18, preferLite ? 72 : 120)),
      metalSoft,
    );
    mid.rotation.x = 0.38;
    portal.add(mid);
    const hair = new THREE.Mesh(
      track(new THREE.TorusGeometry(1.48, 0.008, 12, preferLite ? 72 : 120)),
      metal,
    );
    hair.rotation.x = -0.22;
    portal.add(hair);

    const lensGeo = track(
      new THREE.SphereGeometry(
        1.12,
        preferLite ? 32 : 64,
        preferLite ? 24 : 48,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.5,
      ),
    );
    lensGeo.scale(1, 0.28, 1);
    lensGeo.rotateX(-Math.PI / 2);
    const lens = new THREE.Mesh(lensGeo, glass);
    lens.position.z = 0.02;
    portal.add(lens);

    const backGlass = glass.clone();
    track(backGlass);
    backGlass.transmission = 0.7;
    backGlass.opacity = 0.55;
    const backLens = new THREE.Mesh(
      track(new THREE.CircleGeometry(1.05, preferLite ? 32 : 64)),
      backGlass,
    );
    backLens.position.z = -0.06;
    portal.add(backLens);

    const iris = new THREE.Group();
    const blades: THREE.Mesh[] = [];
    const BLADE_N = preferLite ? 8 : 10;
    const bladeGeo = track(new THREE.BoxGeometry(0.62, 0.065, 0.018));
    for (let i = 0; i < BLADE_N; i += 1) {
      const blade = new THREE.Mesh(bladeGeo, irisMat);
      iris.add(blade);
      blades.push(blade);
    }
    portal.add(iris);

    const coreGlow = new THREE.Mesh(track(new THREE.CircleGeometry(0.55, 40)), glowMat);
    coreGlow.position.z = 0.05;
    portal.add(coreGlow);
    const coreGlow2Mat = glowMat.clone();
    track(coreGlow2Mat);
    coreGlow2Mat.opacity = 0.06;
    const coreGlow2 = new THREE.Mesh(track(new THREE.CircleGeometry(0.95, 40)), coreGlow2Mat);
    coreGlow2.position.z = -0.02;
    portal.add(coreGlow2);

    const satellites: Array<{
      mesh: THREE.Mesh;
      phase: number;
      r: number;
      yAmp: number;
      speed: number;
    }> = [];
    const satCount = preferLite ? 4 : 6;
    for (let i = 0; i < satCount; i += 1) {
      const geo =
        i % 2 === 0
          ? track(new THREE.OctahedronGeometry(0.09 + (i % 3) * 0.02, 0))
          : track(new THREE.IcosahedronGeometry(0.07 + (i % 2) * 0.02, 0));
      const mesh = new THREE.Mesh(geo, i % 2 ? satB : satA);
      portal.add(mesh);
      satellites.push({
        mesh,
        phase: (i / satCount) * Math.PI * 2,
        r: 2.05 + (i % 3) * 0.12,
        yAmp: 0.35 + (i % 2) * 0.2,
        speed: 0.38 + i * 0.04,
      });
    }

    const dust: Array<{
      mesh: THREE.Mesh;
      phase: number;
      r: number;
      y: number;
      speed: number;
    }> = [];
    if (!preferLite) {
      const dustMatBase = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
      });
      track(dustMatBase);
      for (let i = 0; i < 22; i += 1) {
        const dMat = dustMatBase.clone();
        track(dMat);
        dMat.opacity = 0.15 + Math.random() * 0.35;
        const d = new THREE.Mesh(
          track(new THREE.SphereGeometry(0.012 + Math.random() * 0.01, 6, 6)),
          dMat,
        );
        portal.add(d);
        dust.push({
          mesh: d,
          phase: Math.random() * Math.PI * 2,
          r: 0.8 + Math.random() * 1.8,
          y: (Math.random() - 0.5) * 1.4,
          speed: 0.15 + Math.random() * 0.35,
        });
      }
    }

    const ground = new THREE.Mesh(
      track(new THREE.CircleGeometry(2.6, 48)),
      track(
        new THREE.MeshBasicMaterial({
          color: FROST.core,
          transparent: true,
          opacity: 0.07,
          depthWrite: false,
        }),
      ),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0.15, -1.55, 0);
    scene.add(ground);

    const groundShadow = new THREE.Mesh(
      track(new THREE.CircleGeometry(1.5, 40)),
      track(
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          transparent: true,
          opacity: 0.32,
          depthWrite: false,
        }),
      ),
    );
    groundShadow.rotation.x = -Math.PI / 2;
    groundShadow.position.set(0.15, -1.54, 0);
    scene.add(groundShadow);

    const layoutIris = (open: number, twist: number) => {
      for (let i = 0; i < blades.length; i += 1) {
        const blade = blades[i];
        if (!blade) continue;
        const a = (i / BLADE_N) * Math.PI * 2 + twist;
        blade.position.set(Math.cos(a) * open, Math.sin(a) * open, 0.04);
        blade.rotation.z = a + 0.55;
      }
    };
    layoutIris(0.42, 0.4);

    const pointer = { x: 0, y: 0 };
    const damped = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = host.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });

    const setSize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      composer?.setSize(width, height);
      bloomPass?.setSize(width, height);
    };
    setSize();

    const resizeObserver = new ResizeObserver(() => setSize());
    resizeObserver.observe(host);

    let frameId = 0;
    let entrance = 0;
    const clock = new THREE.Clock();
    let visible = true;

    const intersection = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? true;
      },
      { threshold: 0.05 },
    );
    intersection.observe(host);

    const renderFrame = () => {
      frameId = requestAnimationFrame(renderFrame);
      if (!visible) return;

      const t = clock.getElapsedTime();
      const dt = Math.min(clock.getDelta(), 0.05);

      damped.x += (pointer.x - damped.x) * (1 - Math.exp(-dt * 4.2));
      damped.y += (pointer.y - damped.y) * (1 - Math.exp(-dt * 4.2));

      if (entrance < 1) {
        entrance = Math.min(1, entrance + dt * 1.15);
        const e = 1 - (1 - entrance) ** 3;
        portal.scale.setScalar(0.92 + 0.08 * e);
      }

      if (!reducedMotion) {
        const breathe = Math.sin(t * 0.7) * 0.5 + 0.5;
        portal.rotation.y = t * 0.18 + damped.x * 0.35;
        portal.rotation.x = Math.sin(t * 0.32) * 0.1 + damped.y * -0.18;
        portal.rotation.z = Math.sin(t * 0.21) * 0.04;
        portal.position.y = 0.05 + Math.sin(t * 0.75) * 0.08;

        outer.rotation.z = t * 0.08;
        orbit.rotation.z = -t * 0.22;
        mid.rotation.z = t * 0.28;
        hair.rotation.z = -t * 0.12;
        lens.rotation.z = t * 0.04;

        layoutIris(0.36 + breathe * 0.1, t * 0.12);
        glowMat.opacity = 0.1 + breathe * 0.1;
        coreGlow.scale.setScalar(0.92 + breathe * 0.12);
        coreLight.intensity = 6 + breathe * 5;
        point.intensity = 14 + Math.sin(t * 1.1) * 3;

        for (const s of satellites) {
          const a = s.phase + t * s.speed;
          s.mesh.position.set(
            Math.cos(a) * s.r,
            Math.sin(a * 1.15) * s.yAmp,
            Math.sin(a) * s.r * 0.32,
          );
          s.mesh.rotation.x += 0.012;
          s.mesh.rotation.y += 0.016;
        }

        for (const d of dust) {
          const a = d.phase + t * d.speed;
          d.mesh.position.set(
            Math.cos(a) * d.r,
            d.y + Math.sin(t * 0.5 + d.phase) * 0.08,
            Math.sin(a) * d.r * 0.4,
          );
        }
      }

      camera.position.x += (0.35 + damped.x * 0.22 - camera.position.x) * 0.06;
      camera.position.y += (0.12 + damped.y * -0.1 - camera.position.y) * 0.06;
      camera.lookAt(0.1, 0.02, 0);

      if (composer) composer.render();
      else renderer.render(scene, camera);
    };
    frameId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      composer?.dispose();
      pmrem.dispose();
      renderer.dispose();
      for (const d of disposables) d.dispose();
      scene.clear();
      if (canvas.parentNode === host) host.removeChild(canvas);
    };
  }, []);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={
        className ??
        "relative isolate min-h-[22rem] w-full overflow-hidden rounded-[20px] sm:min-h-[26rem] lg:min-h-[28rem]"
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_58%_42%,#243656_0%,#101828_48%,#070a12_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_75%_at_60%_50%,transparent_0%,rgba(0,0,0,0.22)_70%,rgba(0,0,0,0.45)_100%)]" />
    </div>
  );
}

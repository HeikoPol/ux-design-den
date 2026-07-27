"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type DenPortal3DProps = {
  progress: number;
  pointer: { x: number; y: number };
  reducedMotion: boolean;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeInOut = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

function tunnelPoint(ring: number, angle: number, depth: number) {
  const driftX = Math.sin(ring * 0.24) * 0.34;
  const driftY = Math.cos(ring * 0.19) * 0.2;
  const baseRadius =
    3.45 +
    Math.sin(ring * 0.31) * 0.22 +
    Math.sin(ring * 0.09 + 1.8) * 0.3;
  const contour =
    1 +
    Math.sin(angle * 3 + ring * 0.18) * 0.075 +
    Math.cos(angle * 5 - ring * 0.12) * 0.045 +
    Math.sin(angle * 7 + 0.7) * 0.025;

  return new THREE.Vector3(
    Math.cos(angle) * baseRadius * contour * 1.22 + driftX,
    Math.sin(angle) * baseRadius * contour * 0.73 + driftY,
    -ring * depth,
  );
}

export function DenPortal3D({
  progress,
  pointer,
  reducedMotion,
}: DenPortal3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);
  const pointerRef = useRef(pointer);
  const reducedMotionRef = useRef(reducedMotion);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    pointerRef.current = pointer;
  }, [pointer]);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      mount.dataset.webgl = "unavailable";
      return;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(
      Math.min(Math.max(window.devicePixelRatio * 1.25, 2), 2.5),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0d090b, 0.052);

    const camera = new THREE.PerspectiveCamera(48, 1, 0.08, 90);
    camera.position.set(0, 0, 7.8);

    const group = new THREE.Group();
    scene.add(group);

    const radialSegments = 84;
    const depthSegments = 54;
    const depthStep = 0.68;
    const positions: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const colorA = new THREE.Color("#23b7b7");
    const colorB = new THREE.Color("#6bd8ce");
    const colorC = new THREE.Color("#dce85a");
    const colorD = new THREE.Color("#cf4d91");

    for (let ring = 0; ring <= depthSegments; ring += 1) {
      for (let segment = 0; segment < radialSegments; segment += 1) {
        const angle = (segment / radialSegments) * Math.PI * 2;
        const point = tunnelPoint(ring, angle, depthStep);
        positions.push(point.x, point.y, point.z);

        const angularMix = (Math.sin(angle * 2.1 + ring * 0.13) + 1) / 2;
        const depthMix = ring / depthSegments;
        const tint = (depthMix < 0.48 ? colorA.clone().lerp(colorB, angularMix) : colorD.clone().lerp(colorC, angularMix));
        tint.multiplyScalar(0.72 + Math.sin(angle * 4 - ring * 0.16) * 0.13);
        colors.push(tint.r, tint.g, tint.b);
      }
    }

    for (let ring = 0; ring < depthSegments; ring += 1) {
      for (let segment = 0; segment < radialSegments; segment += 1) {
        const nextSegment = (segment + 1) % radialSegments;
        const a = ring * radialSegments + segment;
        const b = ring * radialSegments + nextSegment;
        const c = (ring + 1) * radialSegments + nextSegment;
        const d = (ring + 1) * radialSegments + segment;
        indices.push(a, b, d, b, c, d);
      }
    }

    const tunnelGeometry = new THREE.BufferGeometry();
    tunnelGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    tunnelGeometry.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colors, 3),
    );
    tunnelGeometry.setIndex(indices);
    tunnelGeometry.computeVertexNormals();

    const tunnelMaterial = new THREE.MeshBasicMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial);
    group.add(tunnel);

    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0xe9e6df,
      side: THREE.DoubleSide,
      wireframe: true,
      transparent: true,
      opacity: 0.055,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const wire = new THREE.Mesh(tunnelGeometry, wireMaterial);
    group.add(wire);

    const contourMaterials: THREE.LineBasicMaterial[] = [];
    const contourGeometries: THREE.BufferGeometry[] = [];
    const contourColors = [0x23b7b7, 0x6bd8ce, 0xdce85a, 0xcf4d91];

    for (let ring = 0; ring <= depthSegments; ring += 3) {
      const contourPoints: THREE.Vector3[] = [];
      for (let segment = 0; segment <= radialSegments; segment += 1) {
        const angle = ((segment % radialSegments) / radialSegments) * Math.PI * 2;
        contourPoints.push(tunnelPoint(ring, angle, depthStep));
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(contourPoints);
      const material = new THREE.LineBasicMaterial({
        color: contourColors[Math.floor(ring / 3) % contourColors.length],
        transparent: true,
        opacity: ring === 0 ? 0.95 : 0.28,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const contour = new THREE.Line(geometry, material);
      contourGeometries.push(geometry);
      contourMaterials.push(material);
      group.add(contour);
    }

    const particleCount = 360;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particlePalette = [
      new THREE.Color("#23b7b7"),
      new THREE.Color("#6bd8ce"),
      new THREE.Color("#dce85a"),
      new THREE.Color("#cf4d91"),
    ];

    for (let index = 0; index < particleCount; index += 1) {
      const z = -Math.random() * depthSegments * depthStep;
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.35 + Math.random() * 2.55;
      particlePositions[index * 3] = Math.cos(angle) * radius * 1.12;
      particlePositions[index * 3 + 1] = Math.sin(angle) * radius * 0.68;
      particlePositions[index * 3 + 2] = z;
      const color = particlePalette[index % particlePalette.length];
      particleColors[index * 3] = color.r;
      particleColors[index * 3 + 1] = color.g;
      particleColors[index * 3 + 2] = color.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3),
    );
    particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(particleColors, 3),
    );
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.62,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0x23b7b7,
      transparent: true,
      opacity: 0.48,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const coreGeometry = new THREE.CircleGeometry(1.1, 64);
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    core.position.z = -depthSegments * depthStep - 1;
    group.add(core);

    const resize = () => {
      const rect = mount.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      renderer.setSize(rect.width, rect.height, false);
      camera.aspect = rect.width / rect.height;
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();

    let frame = 0;
    let elapsed = 0;
    let lastTime = performance.now();

    const render = (time: number) => {
      const delta = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      elapsed += delta;

      const rawProgress = progressRef.current;
      const travel = easeInOut(clamp01((rawProgress - 0.08) / 0.86));
      const targetZ = 7.8 - travel * 42.2;
      const pointerNow = pointerRef.current;
      const motionMultiplier = reducedMotionRef.current ? 0 : 1;

      camera.position.z += (targetZ - camera.position.z) * 0.095;
      camera.position.x +=
        (pointerNow.x * 5.4 * motionMultiplier - camera.position.x) * 0.06;
      camera.position.y +=
        (-pointerNow.y * 4.2 * motionMultiplier - camera.position.y) * 0.06;
      camera.rotation.z +=
        ((Math.sin(elapsed * 0.33) * 0.025 + pointerNow.x * 0.12) *
          motionMultiplier -
          camera.rotation.z) *
        0.04;

      group.rotation.z =
        Math.sin(elapsed * 0.2) * 0.035 * motionMultiplier + travel * 0.16;
      group.position.x = Math.sin(travel * Math.PI * 2) * 0.18;
      particles.rotation.z = -elapsed * 0.018 * motionMultiplier;
      core.scale.setScalar(1 + Math.sin(elapsed * 1.2) * 0.08 * motionMultiplier);
      tunnelMaterial.opacity = 0.34 + travel * 0.24;
      wireMaterial.opacity = 0.055 + travel * 0.055;
      particleMaterial.opacity = 0.62 + travel * 0.24;
      coreMaterial.opacity = 0.48 + travel * 0.3;

      camera.lookAt(
        camera.position.x * 0.18,
        camera.position.y * 0.12,
        camera.position.z - 5.8,
      );
      renderer.render(scene, camera);

      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      tunnelGeometry.dispose();
      tunnelMaterial.dispose();
      wireMaterial.dispose();
      contourGeometries.forEach((geometry) => geometry.dispose());
      contourMaterials.forEach((material) => material.dispose());
      particleGeometry.dispose();
      particleMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="den-portal-canvas" ref={mountRef} aria-hidden="true" />;
}

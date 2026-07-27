"use client";

import { useMemo } from "react";

type DenPortal3DProps = {
  progress: number;
  pointer: { x: number; y: number };
  reducedMotion: boolean;
};

type RingState = {
  depth: number;
  index: number;
  scale: number;
  x: number;
  y: number;
};

type ParticleSeed = {
  angle: number;
  depth: number;
  offset: number;
  paletteIndex: number;
  size: number;
};

const RING_COUNT = 34;
const RING_SEGMENTS = 72;
const SPOKE_COUNT = 36;
const PALETTE = ["#23b7b7", "#6bd8ce", "#dce85a", "#cf4d91"];

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

function easeInOut(value: number) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return Number((value - Math.floor(value)).toFixed(8));
}

function ringState(
  index: number,
  travel: number,
  pointer: { x: number; y: number },
): RingState {
  const depth = (index / RING_COUNT + travel * 1.35) % 1;
  const scale = 0.055 + Math.pow(depth, 2.08) * 1.2;
  const drift = index * 0.43 + travel * 7.2;

  return {
    depth,
    index,
    scale,
    x:
      Math.sin(drift) * 42 * depth +
      Math.sin(drift * 0.37) * 24 +
      pointer.x * 340 * depth,
    y:
      Math.cos(drift * 0.82) * 28 * depth +
      Math.sin(drift * 0.28) * 18 -
      pointer.y * 280 * depth,
  };
}

function pointOnRing(state: RingState, angle: number) {
  const contour =
    1 +
    Math.sin(angle * 3 + state.index * 0.31) * 0.075 +
    Math.cos(angle * 5 - state.index * 0.18) * 0.046 +
    Math.sin(angle * 7 + 0.8) * 0.025;

  return {
    x:
      state.x +
      Math.cos(angle) * 650 * state.scale * contour +
      Math.sin(angle * 2 + state.index * 0.14) * 16 * state.depth,
    y:
      state.y +
      Math.sin(angle) * 390 * state.scale * contour +
      Math.cos(angle * 3 - state.index * 0.12) * 10 * state.depth,
  };
}

function pathFromPoints(points: Array<{ x: number; y: number }>, close = false) {
  if (points.length === 0) return "";
  const commands = points.map(
    (point, index) =>
      `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
  );
  if (close) commands.push("Z");
  return commands.join(" ");
}

export function DenPortal3D({
  progress,
  pointer,
  reducedMotion,
}: DenPortal3DProps) {
  const particleSeeds = useMemo<ParticleSeed[]>(
    () =>
      Array.from({ length: 150 }, (_, index) => ({
        angle: seeded(index, 1) * Math.PI * 2,
        depth: seeded(index, 2),
        offset: seeded(index, 3),
        paletteIndex: index % PALETTE.length,
        size: 1.5 + seeded(index, 4) * 5.5,
      })),
    [],
  );

  const travel = reducedMotion
    ? 0.18
    : easeInOut((progress - 0.08) / 0.86);
  const portalReveal = reducedMotion
    ? 1
    : clamp01(progress / 0.3);
  const swallowProgress = reducedMotion
    ? 0
    : clamp01((progress - 0.22) / 0.62);
  const portalScale = reducedMotion
    ? 0.58
    : 0.08 +
      (1 - Math.pow(1 - portalReveal, 3)) * 0.54 +
      Math.pow(swallowProgress, 1.35) * 2;

  const rings = Array.from({ length: RING_COUNT }, (_, index) =>
    ringState(index, travel, pointer),
  ).sort((a, b) => a.depth - b.depth);

  const ringPaths = rings.map((state) => {
    const points = Array.from({ length: RING_SEGMENTS }, (_, segment) =>
      pointOnRing(state, (segment / RING_SEGMENTS) * Math.PI * 2),
    );
    return {
      color: PALETTE[state.index % PALETTE.length],
      depth: state.depth,
      path: pathFromPoints(points, true),
      strokeOpacity: (0.16 + state.depth * 0.72).toFixed(4),
      strokeWidth: (0.8 + state.depth * 1.9).toFixed(3),
    };
  });

  const spokePaths = Array.from({ length: SPOKE_COUNT }, (_, spoke) => {
    const angle = (spoke / SPOKE_COUNT) * Math.PI * 2;
    return pathFromPoints(rings.map((state) => pointOnRing(state, angle)));
  });

  const particles = particleSeeds.map((seed, index) => {
    const depth = (seed.depth + travel * (0.72 + seed.offset * 0.45)) % 1;
    const state = ringState(
      Math.floor(depth * RING_COUNT),
      travel + seed.offset * 0.08,
      pointer,
    );
    state.depth = depth;
    state.scale = 0.04 + Math.pow(depth, 2.2) * 1.02;
    const point = pointOnRing(state, seed.angle);

    return {
      color: PALETTE[seed.paletteIndex],
      height: (seed.size * (0.45 + depth * 1.2)).toFixed(2),
      opacity: (0.2 + depth * 0.8).toFixed(4),
      rotation: (seed.offset * 180 + travel * 120 + index) % 180,
      x: point.x.toFixed(2),
      y: point.y.toFixed(2),
    };
  });

  const meshTransform = `translate(800 450) scale(${portalScale.toFixed(4)})`;
  const corePulse = reducedMotion ? 1 : 1 + Math.sin(progress * Math.PI * 8) * 0.035;

  return (
    <svg
      className="den-portal-canvas"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      aria-hidden="true"
    >
      <g transform={meshTransform}>
        <path
          d="M-290-95 C-235-238 68-252 252-137 C365-66 340 106 184 194 C12 290-261 202-326 61 C-348 13-331-48-290-95Z"
          fill="#0d0c0d"
          opacity="0.96"
        />

        <g fill="none">
          {spokePaths.map((path, index) => (
            <path
              key={`spoke-${index}`}
              d={path}
              stroke={index % 3 === 0 ? "#23b7b7" : "#e9e6df"}
              strokeWidth={index % 3 === 0 ? 1.15 : 0.72}
              strokeOpacity={index % 3 === 0 ? 0.34 : 0.21}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {ringPaths.map((ring, index) => (
            <path
              key={`ring-${index}`}
              d={ring.path}
              stroke={ring.color}
              strokeWidth={ring.strokeWidth}
              strokeOpacity={ring.strokeOpacity}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        <g>
          {particles.map((particle, index) => (
            <rect
              key={`particle-${index}`}
              x={(Number(particle.x) - Number(particle.height) / 2).toFixed(2)}
              y={(Number(particle.y) - Number(particle.height) / 2).toFixed(2)}
              width={particle.height}
              height={particle.height}
              fill={particle.color}
              opacity={particle.opacity}
              transform={`rotate(${particle.rotation.toFixed(2)} ${particle.x} ${particle.y})`}
            />
          ))}
        </g>

        <circle
          cx="0"
          cy="0"
          r="78"
          fill="#23b7b7"
          opacity={(0.68 + travel * 0.22).toFixed(4)}
          transform={`scale(${corePulse.toFixed(4)})`}
        />
        <circle
          cx="-18"
          cy="-20"
          r="28"
          fill="#e9e6df"
          opacity="0.2"
        />
      </g>
    </svg>
  );
}

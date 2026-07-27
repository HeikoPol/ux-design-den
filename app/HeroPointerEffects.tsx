"use client";

import { useEffect, useRef } from "react";

const GRID_SIZE = 32;
const TRAIL_DURATION = 1150;
const TRAIL_COLORS = ["#23b7b7", "#e85f47", "#dce85a", "#b73d80"];

type TrailCell = {
  column: number;
  row: number;
  color: string;
  startedAt: number;
};

export function HeroPointerEffects({ disabled }: { disabled: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const axisRef = useRef<HTMLDivElement>(null);
  const verticalRef = useRef<HTMLSpanElement>(null);
  const horizontalRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (disabled || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    const canvas = canvasRef.current;
    const axis = axisRef.current;
    const vertical = verticalRef.current;
    const horizontal = horizontalRef.current;
    const dot = dotRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !axis || !vertical || !horizontal || !dot || !context) {
      return;
    }

    let width = 0;
    let height = 0;
    let animationFrame: number | null = null;
    let lastCell = "";
    let colorIndex = 0;
    let trail: TrailCell[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * pixelRatio));
      canvas.height = Math.max(1, Math.round(height * pixelRatio));
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = (time: number) => {
      animationFrame = null;
      context.clearRect(0, 0, width, height);
      trail = trail.filter((cell) => time - cell.startedAt < TRAIL_DURATION);

      for (const cell of trail) {
        const age = Math.min(1, (time - cell.startedAt) / TRAIL_DURATION);
        const opacity = Math.pow(1 - age, 2) * 0.34;
        const x = cell.column * GRID_SIZE;
        const y = cell.row * GRID_SIZE;

        context.globalAlpha = opacity;
        context.fillStyle = cell.color;
        context.fillRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2);
      }

      context.globalAlpha = 1;
      if (trail.length > 0) {
        animationFrame = requestAnimationFrame(draw);
      }
    };

    const keepDrawing = () => {
      if (animationFrame === null) {
        animationFrame = requestAnimationFrame(draw);
      }
    };

    const hideAxis = () => {
      axis.style.opacity = "0";
      lastCell = "";
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const inside = x >= 0 && x <= rect.width && y >= 0 && y <= rect.height;

      if (!inside) {
        hideAxis();
        return;
      }

      axis.style.opacity = "1";
      vertical.style.transform = `translate3d(${x}px, 0, 0)`;
      horizontal.style.transform = `translate3d(0, ${y}px, 0)`;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      const column = Math.floor(x / GRID_SIZE);
      const row = Math.floor(y / GRID_SIZE);
      const cellKey = `${column}:${row}`;

      if (cellKey !== lastCell) {
        lastCell = cellKey;
        trail.push({
          column,
          row,
          color: TRAIL_COLORS[colorIndex % TRAIL_COLORS.length],
          startedAt: performance.now(),
        });
        colorIndex += 1;

        if (trail.length > 42) {
          trail = trail.slice(-42);
        }
        keepDrawing();
      }
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("blur", hideAxis);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", hideAxis);
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [disabled]);

  return (
    <>
      <div className="prism-grid-layer" aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>
      <div className="axis-cursor-layer" ref={axisRef} aria-hidden="true">
        <span className="axis-line axis-line-vertical" ref={verticalRef} />
        <span className="axis-line axis-line-horizontal" ref={horizontalRef} />
        <span className="axis-dot" ref={dotRef} />
      </div>
    </>
  );
}

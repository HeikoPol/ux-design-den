"use client";

import { useEffect, useRef } from "react";

export function AxisCursor({ disabled }: { disabled: boolean }) {
  const axisRef = useRef<HTMLDivElement>(null);
  const verticalRef = useRef<HTMLSpanElement>(null);
  const horizontalRef = useRef<HTMLSpanElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (disabled || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    const axis = axisRef.current;
    const vertical = verticalRef.current;
    const horizontal = horizontalRef.current;
    const dot = dotRef.current;

    if (!axis || !vertical || !horizontal || !dot) {
      return;
    }

    const hideAxis = () => {
      axis.style.opacity = "0";
    };

    const handlePointerMove = (event: PointerEvent) => {
      axis.style.opacity = "1";
      vertical.style.transform = `translate3d(${event.clientX}px, 0, 0)`;
      horizontal.style.transform = `translate3d(0, ${event.clientY}px, 0)`;
      dot.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) {
        hideAxis();
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerout", handlePointerOut);
    window.addEventListener("blur", hideAxis);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("blur", hideAxis);
    };
  }, [disabled]);

  return (
    <div className="axis-cursor-layer" ref={axisRef} aria-hidden="true">
      <span className="axis-line axis-line-vertical" ref={verticalRef} />
      <span className="axis-line axis-line-horizontal" ref={horizontalRef} />
      <span className="axis-dot" ref={dotRef} />
    </div>
  );
}

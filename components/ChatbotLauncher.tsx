"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ChatbotPanel from "./ChatbotPanel";

export default function ChatbotLauncher() {
  const [open, setOpen] = useState(false);
  const leftPupil = useRef<SVGCircleElement>(null);
  const rightPupil = useRef<SVGCircleElement>(null);
  const launcher = useRef<HTMLButtonElement>(null);
  const frame = useRef(0);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const wasOpen = useRef(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const button = launcher.current;
    const left = leftPupil.current;
    const right = rightPupil.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!button || !left || !right || reduceMotion.matches) return;

    const updateEyes = () => {
      frame.current = 0;
      if (!pointer.current) return;
      const bounds = button.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const x = Math.max(-1, Math.min(1, (pointer.current.x - centerX) / (bounds.width / 2))) * 4.2;
      const y = Math.max(-1, Math.min(1, (pointer.current.y - centerY) / (bounds.height / 2))) * 3.6;
      const transform = `translate(${x}px, ${y}px)`;
      left.style.transform = transform;
      right.style.transform = transform;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || reduceMotion.matches) return;
      pointer.current = { x: event.clientX, y: event.clientY };
      if (!frame.current) frame.current = window.requestAnimationFrame(updateEyes);
    };

    const onPointerLeave = () => {
      pointer.current = null;
      if (frame.current) window.cancelAnimationFrame(frame.current);
      frame.current = 0;
      left.style.transform = "translate(0, 0)";
      right.style.transform = "translate(0, 0)";
    };

    const onPointerOut = (event: PointerEvent) => {
      if (!event.relatedTarget) onPointerLeave();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("blur", onPointerLeave);
    window.addEventListener("pointerout", onPointerOut);
    reduceMotion.addEventListener("change", onPointerLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onPointerLeave);
      window.removeEventListener("pointerout", onPointerOut);
      reduceMotion.removeEventListener("change", onPointerLeave);
      if (frame.current) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const updateViewport = () => {
      const root = document.documentElement;
      root.style.setProperty("--cue-chat-visual-height", `${viewport.height}px`);
      root.style.setProperty(
        "--cue-chat-keyboard-inset",
        `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`,
      );
    };
    updateViewport();
    viewport.addEventListener("resize", updateViewport);
    viewport.addEventListener("scroll", updateViewport);
    return () => {
      viewport.removeEventListener("resize", updateViewport);
      viewport.removeEventListener("scroll", updateViewport);
      document.documentElement.style.removeProperty("--cue-chat-visual-height");
      document.documentElement.style.removeProperty("--cue-chat-keyboard-inset");
    };
  }, []);

  useEffect(() => {
    if (wasOpen.current && !open) launcher.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  return (
    <div className={`cue-chat-launcher${open ? " cue-chat-launcher--open" : ""}`}>
      <ChatbotPanel open={open} onClose={close} />
      <button
        className={`cue-chat-button${open ? " cue-chat-button--open" : ""}`}
        ref={launcher}
        type="button"
        aria-label={open ? "Close Cue chatbot" : "Open Cue chatbot"}
        aria-expanded={open}
        aria-controls="cue-chat-panel"
        onClick={() => setOpen(value => !value)}
      >
        <svg className="cue-chat-orbit-type" viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <path id="cue-chat-circle-path" d="M 50,50 m -39,0 a 39,39 0 1,1 78,0 a 39,39 0 1,1 -78,0" />
          </defs>
          <text>
            <textPath href="#cue-chat-circle-path" startOffset="3%">LET&apos;S TALK · CREATIF CUE ·</textPath>
          </text>
        </svg>
        <svg className="cue-chat-eyes" viewBox="0 0 100 100" aria-hidden="true">
          <g className="cue-chat-blink">
            <ellipse className="cue-chat-eye" cx="35" cy="48" rx="12" ry="14" />
            <ellipse className="cue-chat-eye" cx="65" cy="48" rx="12" ry="14" />
          </g>
          <circle className="cue-chat-pupil" cx="37" cy="49" r="4.1" ref={leftPupil} />
          <circle className="cue-chat-pupil" cx="67" cy="49" r="4.1" ref={rightPupil} />
        </svg>
      </button>
    </div>
  );
}

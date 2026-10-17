"use client";

import { useEffect, type RefObject } from "react";

/** One instance per image, with no React updates during pointer tracking. */
export function useProjectCursorArrow(
  imageRef: RefObject<HTMLDivElement | null>,
  cursorRef: RefObject<HTMLSpanElement | null>,
) {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const init = async () => {
      if (!imageRef.current || !cursorRef.current) return;
      const { gsap } = await import("gsap");
      const image = imageRef.current;
      const cursor = cursorRef.current;
      const circle = cursor?.querySelector<HTMLElement>(".project-cursor-circle");
      if (disposed || !image || !cursor || !circle) return;

      const context = gsap.context(() => {
        const media = gsap.matchMedia();
        media.add("(hover: hover) and (pointer: fine) and (min-width: 681px) and (prefers-reduced-motion: no-preference)", () => {
          gsap.set(cursor, { xPercent: -50, yPercent: -50, x: 0, y: 0, autoAlpha: 0 });
          gsap.set(circle, { scale: 0.85 });
          const xTo = gsap.quickTo(cursor, "x", { duration: 0.26, ease: "power3.out" });
          const yTo = gsap.quickTo(cursor, "y", { duration: 0.26, ease: "power3.out" });
          let pointer: { x: number; y: number } | null = null;
          let frame = 0;
          let visible = false;

          const show = () => {
            if (visible) return;
            visible = true;
            gsap.to(cursor, { autoAlpha: 1, duration: 0.3, ease: "power3.out", overwrite: "auto" });
            gsap.to(circle, { scale: 1, duration: 0.3, ease: "power3.out", overwrite: "auto" });
          };
          const hide = () => {
            visible = false;
            if (frame) cancelAnimationFrame(frame);
            frame = 0;
            xTo.tween.pause(); yTo.tween.pause();
            gsap.to(cursor, { autoAlpha: 0, duration: 0.28, ease: "power3.out", overwrite: "auto" });
            gsap.to(circle, { scale: 0.85, duration: 0.28, ease: "power3.out", overwrite: "auto" });
          };
          const locate = () => {
            if (!pointer) return null;
            const rect = image.getBoundingClientRect();
            const { x, y } = pointer;
            const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
            const hit = document.elementFromPoint(x, y);
            if (!inside || !hit || !image.contains(hit)) return null;
            const insetX = Math.min(cursor.offsetWidth / 2 + 6, rect.width / 2);
            const insetY = Math.min(cursor.offsetHeight / 2 + 6, rect.height / 2);
            return {
              x: Math.max(insetX, Math.min(rect.width - insetX, x - rect.left)),
              y: Math.max(insetY, Math.min(rect.height - insetY, y - rect.top)),
            };
          };
          const update = () => {
            frame = 0;
            const position = locate();
            if (!position) { hide(); return; }
            if (!visible) gsap.set(cursor, position);
            else { xTo(position.x); yTo(position.y); }
            show();
          };
          const schedule = () => {
            if (pointer && !frame) frame = requestAnimationFrame(update);
          };
          const enter = (event: PointerEvent) => {
            if (event.pointerType !== "mouse") return;
            pointer = { x: event.clientX, y: event.clientY };
            if (frame) cancelAnimationFrame(frame);
            frame = 0;
            update();
          };
          const move = (event: PointerEvent) => {
            if (event.pointerType !== "mouse") return;
            pointer = { x: event.clientX, y: event.clientY };
            schedule();
          };
          const leave = () => { pointer = null; hide(); };
          const visibility = () => { if (document.hidden) leave(); };

          image.addEventListener("pointerenter", enter);
          image.addEventListener("pointermove", move, { passive: true });
          image.addEventListener("pointerleave", leave);
          image.addEventListener("pointercancel", leave);
          // Capture also covers scrolling in a nested scrolling container.
          window.addEventListener("scroll", schedule, { passive: true, capture: true });
          window.addEventListener("resize", leave, { passive: true });
          window.addEventListener("blur", leave);
          document.addEventListener("visibilitychange", visibility);
          return () => {
            if (frame) cancelAnimationFrame(frame);
            image.removeEventListener("pointerenter", enter);
            image.removeEventListener("pointermove", move);
            image.removeEventListener("pointerleave", leave);
            image.removeEventListener("pointercancel", leave);
            window.removeEventListener("scroll", schedule, true);
            window.removeEventListener("resize", leave);
            window.removeEventListener("blur", leave);
            document.removeEventListener("visibilitychange", visibility);
            xTo.tween.kill(); yTo.tween.kill();
            gsap.killTweensOf([cursor, circle]);
          };
        });
      }, image);
      cleanup = () => context.revert();
    };
    void init();
    return () => { disposed = true; cleanup?.(); };
  }, [imageRef, cursorRef]);
}

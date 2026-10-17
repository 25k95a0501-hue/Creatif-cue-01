import { Bodies, Body, Composite, Engine, Query, Sleeping } from "matter-js";

type Point = { x: number; y: number };
type Region = { left: number; top: number; right: number; bottom: number };
type Tile = { element: HTMLButtonElement; figure: HTMLElement; body: Body; origin: Point };
const STEP = 1000 / 60;
const MAX_SPEED = 12;
const MAX_ANGLE = Math.PI / 22.5;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Velocity is in Matter's pixels per 60 Hz step, independent of event frequency. */
export function throwVelocity(samples: Array<Point & { time: number }>, now: number): Point {
  const recent = samples.filter((sample) => now - sample.time < 100);
  if (recent.length < 2) return { x: 0, y: 0 };
  const first = recent[0], last = recent[recent.length - 1];
  const elapsed = Math.max(8, last.time - first.time);
  const x = (last.x - first.x) / elapsed * STEP;
  const y = (last.y - first.y) / elapsed * STEP;
  const ratio = Math.min(1, MAX_SPEED / (Math.hypot(x, y) || 1));
  return { x: x * ratio, y: y * ratio };
}

export function createAIPlayground(canvas: HTMLElement, copy: HTMLElement, reset: HTMLButtonElement) {
  const engine = Engine.create({ enableSleeping: true, gravity: { x: 0, y: 0, scale: 0 } });
  engine.positionIterations = 8;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let tiles: Tile[] = [];
  let protectedArea: Region;
  let width = 0, height = 0;
  let frame = 0, resizeFrame = 0, previousTime = 0, accumulator = 0;
  let visible = false, disposed = false;
  let drag: { tile: Tile; pointer: number; offset: Point; samples: Array<Point & { time: number }> } | null = null;
  let resetting: { start: number; from: Array<Point & { angle: number }> } | null = null;
  const buttons = Array.from(canvas.querySelectorAll<HTMLButtonElement>(".ai-showcase-grab"));

  const draw = (tile: Tile) => {
    tile.element.style.transform = `translate3d(${tile.body.position.x - tile.origin.x}px,${tile.body.position.y - tile.origin.y}px,0) rotate(${tile.body.angle}rad)`;
  };
  const stop = () => { cancelAnimationFrame(frame); frame = 0; previousTime = 0; accumulator = 0; };
  const schedule = () => {
    if (!disposed && visible && !document.hidden && !motion.matches && !frame) frame = requestAnimationFrame(tick);
  };
  const endDrag = (throwIt: boolean) => {
    if (!drag) return;
    const current = drag;
    drag = null;
    if (current.tile.element.hasPointerCapture(current.pointer)) current.tile.element.releasePointerCapture(current.pointer);
    current.tile.figure.classList.remove("is-dragging");
    Body.setStatic(current.tile.body, false);
    Body.setVelocity(current.tile.body, throwIt ? throwVelocity(current.samples, performance.now()) : { x: 0, y: 0 });
    Sleeping.set(current.tile.body, !throwIt);
    schedule();
  };

  // Expand the content obstacle by the image footprint. Sweep the drag segment
  // against it so a fast pointer cannot tunnel through the headline.
  const safePosition = (tile: Tile, point: Point): Point => {
    const body = tile.body;
    const halfX = (body.bounds.max.x - body.bounds.min.x) / 2 + 3;
    const halfY = (body.bounds.max.y - body.bounds.min.y) / 2 + 3;
    const target = { x: clamp(point.x, halfX + 8, width - halfX - 8), y: clamp(point.y, halfY + 8, height - halfY - 8) };
    const zone = { left: protectedArea.left - halfX, right: protectedArea.right + halfX, top: protectedArea.top - halfY, bottom: protectedArea.bottom + halfY };
    const from = body.position;
    const dx = target.x - from.x, dy = target.y - from.y;
    const tx1 = dx ? (zone.left - from.x) / dx : -Infinity;
    const tx2 = dx ? (zone.right - from.x) / dx : Infinity;
    const ty1 = dy ? (zone.top - from.y) / dy : -Infinity;
    const ty2 = dy ? (zone.bottom - from.y) / dy : Infinity;
    const enterX = Math.min(tx1, tx2), exitX = Math.max(tx1, tx2);
    const enterY = Math.min(ty1, ty2), exitY = Math.max(ty1, ty2);
    const enters = Math.max(enterX, enterY);
    const xInRange = dx !== 0 || (from.x > zone.left && from.x < zone.right);
    const yInRange = dy !== 0 || (from.y > zone.top && from.y < zone.bottom);
    if (xInRange && yInRange && enters >= 0 && enters <= 1 && enters <= Math.min(exitX, exitY)) {
      if (enterX > enterY) target.x = dx > 0 ? zone.left : zone.right;
      else target.y = dy > 0 ? zone.top : zone.bottom;
    }
    return target;
  };

  function tick(time: number) {
    frame = 0;
    if (disposed || !visible || document.hidden || motion.matches) return;
    if (resetting) {
      const progress = clamp((time - resetting.start) / 550, 0, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      tiles.forEach((tile, index) => {
        const from = resetting!.from[index];
        Body.setPosition(tile.body, { x: from.x + (tile.origin.x - from.x) * ease, y: from.y + (tile.origin.y - from.y) * ease });
        Body.setAngle(tile.body, from.angle * (1 - ease));
        draw(tile);
      });
      if (progress === 1) finishReset();
    } else {
      accumulator += Math.min(previousTime ? time - previousTime : STEP, 50);
      while (accumulator >= STEP) {
        if (drag) {
          // A grabbed body is kinematic. Wake its contacts explicitly because
          // Matter deliberately does not wake sleeping bodies against statics.
          Body.setVelocity(drag.tile.body, throwVelocity(drag.samples, time));
          Query.collides(drag.tile.body, tiles.filter((tile) => tile !== drag!.tile).map(({ body }) => body))
            .forEach((collision) => {
              const other = collision.bodyA === drag!.tile.body ? collision.bodyB : collision.bodyA;
              Sleeping.set(other, false);
            });
        }
        Engine.update(engine, STEP);
        tiles.forEach(({ body }) => {
          const speed = Math.hypot(body.velocity.x, body.velocity.y);
          if (!body.isStatic && speed > MAX_SPEED) Body.setVelocity(body, { x: body.velocity.x / speed * MAX_SPEED, y: body.velocity.y / speed * MAX_SPEED });
          if (Math.abs(body.angle) > MAX_ANGLE) {
            Body.setAngle(body, clamp(body.angle, -MAX_ANGLE, MAX_ANGLE));
            Body.setAngularVelocity(body, 0);
          }
        });
        accumulator -= STEP;
      }
      tiles.forEach(draw);
    }
    previousTime = time;
    if (resetting || drag || tiles.some(({ body }) => !body.isSleeping)) schedule();
  }

  function finishReset() {
    resetting = null;
    tiles.forEach((tile) => {
      Body.setPosition(tile.body, tile.origin);
      Body.setAngle(tile.body, 0);
      Body.setStatic(tile.body, false);
      Body.setVelocity(tile.body, { x: 0, y: 0 });
      Body.setAngularVelocity(tile.body, 0);
      Sleeping.set(tile.body, true);
      draw(tile);
    });
    previousTime = 0;
  }
  const resetImages = () => {
    endDrag(false);
    resetting = { start: performance.now(), from: tiles.map(({ body }) => ({ ...body.position, angle: body.angle })) };
    tiles.forEach(({ body }) => { Body.setStatic(body, true); });
    if (motion.matches || !visible || document.hidden) finishReset();
    else schedule();
  };

  const rebuild = () => {
    resizeFrame = 0;
    endDrag(false); stop(); resetting = null;
    Composite.clear(engine.world, false); Engine.clear(engine);
    width = canvas.clientWidth; height = canvas.clientHeight;
    protectedArea = { left: copy.offsetLeft - 12, top: copy.offsetTop - 12, right: copy.offsetLeft + copy.offsetWidth + 12, bottom: copy.offsetTop + copy.offsetHeight + 12 };
    const wall = (x: number, y: number, w: number, h: number) => Bodies.rectangle(x, y, w, h, { isStatic: true, restitution: 0.25 });
    Composite.add(engine.world, [wall(width / 2, -42, width + 200, 100), wall(width / 2, height + 42, width + 200, 100), wall(-42, height / 2, 100, height), wall(width + 42, height / 2, 100, height), wall((protectedArea.left + protectedArea.right) / 2, (protectedArea.top + protectedArea.bottom) / 2, protectedArea.right - protectedArea.left, protectedArea.bottom - protectedArea.top)]);
    tiles = buttons.map((element) => {
      const figure = element.closest<HTMLElement>(".ai-showcase-figure")!;
      const w = figure.offsetWidth, h = figure.offsetHeight;
      const origin = { x: figure.offsetLeft + w / 2, y: figure.offsetTop + h / 2 };
      const body = Bodies.rectangle(origin.x, origin.y, w + 4, h + 4, { chamfer: { radius: 12 }, frictionAir: 0.055, friction: 0.15, restitution: 0.28, sleepThreshold: 45 });
      Body.setInertia(body, body.inertia * 3);
      Sleeping.set(body, true);
      Composite.add(engine.world, body);
      return { element, figure, body, origin };
    });
    tiles.forEach(draw);
  };
  const localPoint = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || !event.isPrimary || motion.matches || drag || resetting) return;
    const tile = tiles.find(({ element }) => element === event.currentTarget)!;
    const point = localPoint(event);
    event.preventDefault();
    Body.setStatic(tile.body, true); Body.setVelocity(tile.body, { x: 0, y: 0 });
    tile.figure.classList.add("is-dragging");
    tile.element.setPointerCapture(event.pointerId);
    drag = { tile, pointer: event.pointerId, offset: { x: point.x - tile.body.position.x, y: point.y - tile.body.position.y }, samples: [{ ...tile.body.position, time: performance.now() }] };
    schedule();
  };
  const move = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const point = localPoint(event);
    const next = safePosition(drag.tile, { x: point.x - drag.offset.x, y: point.y - drag.offset.y });
    Body.setPosition(drag.tile.body, next);
    draw(drag.tile); // No interpolation while grabbed: update in the pointer event.
    const time = performance.now();
    drag.samples = drag.samples.filter((sample) => time - sample.time < 100);
    drag.samples.push({ ...next, time });
  };
  const up = (event: PointerEvent) => { if (event.pointerId === drag?.pointer) endDrag(event.type === "pointerup"); };
  const key = (event: KeyboardEvent) => {
    if (event.key === "Escape") { endDrag(false); return; }
    const directions: Record<string, Point> = { ArrowLeft: { x: -20, y: 0 }, ArrowRight: { x: 20, y: 0 }, ArrowUp: { x: 0, y: -20 }, ArrowDown: { x: 0, y: 20 } };
    const delta = directions[event.key];
    if (!delta || motion.matches || resetting) return;
    event.preventDefault(); endDrag(false);
    const tile = tiles.find(({ element }) => element === event.currentTarget)!;
    Body.setPosition(tile.body, safePosition(tile, { x: tile.body.position.x + delta.x, y: tile.body.position.y + delta.y }));
    Body.setVelocity(tile.body, { x: 0, y: 0 });
    Sleeping.set(tile.body, false); draw(tile); schedule();
  };
  buttons.forEach((element) => {
    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", up);
    element.addEventListener("lostpointercapture", up);
    element.addEventListener("keydown", key);
  });
  reset.addEventListener("click", resetImages);
  const visibility = () => { if (document.hidden) { endDrag(false); stop(); } else schedule(); };
  const blur = () => endDrag(false);
  window.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", visibility);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) schedule(); else { endDrag(false); stop(); }
  });
  observer.observe(canvas);
  const resizeObserver = new ResizeObserver(() => {
    if (!resizeFrame) resizeFrame = requestAnimationFrame(rebuild);
  });
  resizeObserver.observe(canvas); resizeObserver.observe(copy);
  const changedMotion = () => { resetImages(); if (motion.matches) stop(); };
  motion.addEventListener("change", changedMotion);
  rebuild();
  return () => {
    disposed = true; endDrag(false); stop(); cancelAnimationFrame(resizeFrame);
    observer.disconnect(); resizeObserver.disconnect();
    document.removeEventListener("visibilitychange", visibility);
    window.removeEventListener("blur", blur);
    motion.removeEventListener("change", changedMotion);
    reset.removeEventListener("click", resetImages);
    buttons.forEach((element) => {
      element.removeEventListener("pointerdown", down); element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up); element.removeEventListener("pointercancel", up);
      element.removeEventListener("lostpointercapture", up); element.removeEventListener("keydown", key);
      element.style.removeProperty("transform");
    });
    Composite.clear(engine.world, false); Engine.clear(engine);
  };
}

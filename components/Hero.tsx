"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowDownRight, MoveUpRight } from "lucide-react";
import { BlobLink } from "./BlobLink";

const HERO_IMAGE = "/projects/project-01.svg";

// Round the outline of the measured, left-aligned strips, including inside corners.
function stripOutline(strips: { width: number; bottom: number }[], radius: number) {
  if (!strips.length) return "";
  const points = [{ x: 0, y: 0 }, { x: strips[0].width, y: 0 }];
  strips.forEach((strip, index) => {
    points.push({ x: strip.width, y: strip.bottom });
    if (strips[index + 1]) points.push({ x: strips[index + 1].width, y: strip.bottom });
  });
  points.push({ x: 0, y: strips[strips.length - 1].bottom });
  const vertices = points.filter((point, index) => {
    const previous = points[(index + points.length - 1) % points.length];
    const next = points[(index + 1) % points.length];
    return (point.x !== previous.x || point.y !== previous.y) &&
      !((previous.x === point.x && point.x === next.x) || (previous.y === point.y && point.y === next.y));
  });
  const corners = vertices.map((point, index) => {
    const previous = vertices[(index + vertices.length - 1) % vertices.length];
    const next = vertices[(index + 1) % vertices.length];
    const before = Math.hypot(point.x - previous.x, point.y - previous.y);
    const after = Math.hypot(next.x - point.x, next.y - point.y);
    const rounded = Math.min(radius, before / 2, after / 2);
    return {
      point,
      entry: { x: point.x + (previous.x - point.x) * rounded / before, y: point.y + (previous.y - point.y) * rounded / before },
      exit: { x: point.x + (next.x - point.x) * rounded / after, y: point.y + (next.y - point.y) * rounded / after },
    };
  });
  return corners.map(({ point, entry, exit }, index) =>
    `${index ? "L" : "M"}${entry.x},${entry.y} Q${point.x},${point.y} ${exit.x},${exit.y}`,
  ).join(" ") + " Z";
}

export default function Hero() {
  const root = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const silhouette = useRef<SVGSVGElement>(null);
  const outline = useRef<SVGPathElement>(null);

  useEffect(() => {
    const group = copy.current;
    const svg = silhouette.current;
    const path = outline.current;
    if (!group || !svg || !path) return;
    let disposed = false;
    const measure = () => {
      if (disposed) return;
      const bounds = group.getBoundingClientRect();
      let bottom = 0;
      const strips = Array.from(group.querySelectorAll<HTMLElement>(".hero-strip"), (strip) => {
        const rect = strip.getBoundingClientRect();
        // Heights stay stable during GSAP's translated reveal; screen Y does not.
        bottom += rect.height;
        return { width: rect.width, bottom };
      });
      const radius = parseFloat(getComputedStyle(group).getPropertyValue("--hero-radius"));
      path.setAttribute("d", stripOutline(strips, radius));
      svg.setAttribute("viewBox", `0 0 ${bounds.width} ${bounds.height}`);
      group.classList.add("hero-copy--shaped");
    };
    const observer = new ResizeObserver(measure);
    observer.observe(group);
    group.querySelectorAll(".hero-strip").forEach((strip) => observer.observe(strip));
    measure();
    void document.fonts.ready.then(measure);
    return () => { disposed = true; observer.disconnect(); };
  }, []);

  useEffect(() => {
    let active = true;
    let cleanup: (() => void) | undefined;

    const init = async () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !root.current) return;

      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (!active || !root.current) return;

      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
        const timeline = gsap.timeline({ defaults: { ease: "power3.out" } });
        timeline.fromTo(".hero-image-clip", {
          clipPath: "inset(100% 0% 0% 0% round 30px)",
        }, {
          clipPath: "inset(0% 0% 0% 0% round 30px)",
          duration: 1.25,
          ease: "power4.out",
        })
          .fromTo(".hero-overline", { y: 18, autoAlpha: 0 }, {
            y: 0,
            autoAlpha: 1,
            duration: 0.7,
          }, "-=.7")
          .fromTo(".hero-line-inner", { y: "110%", autoAlpha: 0 }, {
            y: "0%",
            autoAlpha: 1,
            duration: 1,
            stagger: 0.13,
          }, "-=.4")
          .fromTo(".hero-support, .hero-actions", { y: 18, autoAlpha: 0 }, {
            y: 0,
            autoAlpha: 1,
            duration: 0.65,
            stagger: 0.1,
          }, "-=.45");

        gsap.to(".hero-image-parallax", {
          yPercent: 3,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero-visual",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }, root);

      cleanup = () => context.revert();
    };

    void init();
    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  return <div id="top" ref={root}>
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-stage">
        <div className="hero-visual">
          <div className="hero-image-clip">
            <div className="hero-image-parallax">
              <Image
                className="hero-image"
                src={HERO_IMAGE}
                alt="Original Creatif Cue brand identity portfolio artwork with an editorial composition"
                fill
                priority
                sizes="(max-width: 720px) 156vw, 127vw"
              />
            </div>
          </div>
        </div>
        <div className="hero-copy" ref={copy}>
          <svg className="hero-silhouette" aria-hidden="true" ref={silhouette}><path ref={outline} /></svg>
          <p className="hero-overline hero-strip"><span className="hero-live-dot"/> Independent creative agency</p>
          <h1 id="hero-title" className="hero-headline">
            <span className="hero-strip"><span className="hero-line-window"><span className="hero-line-inner">We turn ideas into</span></span></span>
            <span className="hero-strip"><span className="hero-line-window"><span className="hero-line-inner">brands that</span></span></span>
            <span className="hero-strip"><span className="hero-line-window"><span className="hero-line-inner">move people.</span></span></span>
          </h1>
          <div className="hero-actions hero-strip">
            <BlobLink className="hero-cta" variant="navy" href="#work" icon={<MoveUpRight size={18} strokeWidth={1.8}/>}>Explore our work</BlobLink>
            <a className="hero-text-link" href="#about">Meet the agency <ArrowDownRight size={18}/></a>
          </div>
        </div>
      </div>
      <p className="hero-support">Strategy with feeling. Design with direction. Where brands evolve.</p>
    </section>
  </div>;
}

"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { BlobLink } from "./BlobLink";
import { serviceNavigation } from "./serviceNavigation";

// Replace these paths with approved portfolio photography when available.
const services = [
  { title: "Brand Identity", image: "/projects/project-01.svg" },
  { title: "Websites", image: "/projects/project-02.svg" },
  { title: "Social Media & Content", image: "/projects/project-03.svg" },
  { title: "Motion Graphics & 3D", image: "/services/motion-placeholder.svg" },
  { title: "Creative Campaigns", image: "/projects/project-04.svg" },
];

export default function ServicesSection() {
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    const init = async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"), import("gsap/ScrollTrigger"),
      ]);
      if (disposed || !section.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const host = section.current;
      const rows = Array.from(host.querySelectorAll<HTMLAnchorElement>(".expertise-row"));
      const listeners: (() => void)[] = [];
      const context = gsap.context(() => {
        const media = gsap.matchMedia();
        media.add({ motion: "(prefers-reduced-motion: no-preference)", reduced: "(prefers-reduced-motion: reduce)" }, (match) => {
          const reduced = Boolean(match.conditions?.reduced);
          const duration = reduced ? 0 : 0.56;
          // Inline baseline lets GSAP own the reveal while CSS remains a no-JS fallback.
          gsap.set(rows, { "--preview-progress": 0 });
          const names = rows.map((row) => row.querySelector(".expertise-name"));
          const arrows = rows.map((row) => row.querySelector(".expertise-pointer"));
          gsap.set(names, { opacity: 1 });
          gsap.set(arrows, { x: 0, y: 0, autoAlpha: 0, scale: 0.85 });
          let activeRow: HTMLAnchorElement | null = null;
          let tappedRow: HTMLAnchorElement | null = null;
          let touchClick = false;
          const animate = (row: HTMLAnchorElement | null) => {
            activeRow = row;
            rows.forEach((item) => {
              const selected = item === row;
              gsap.to(item, { "--preview-progress": selected ? 1 : 0, duration, ease: "power3.out", overwrite: "auto" });
              gsap.to(item.querySelector(".expertise-name"), { opacity: row && !selected ? 0.42 : 1, duration: reduced ? 0 : 0.35, overwrite: "auto" });
              gsap.to(item.querySelector(".expertise-pointer"), { autoAlpha: selected ? 1 : 0, scale: selected ? 1 : 0.85, duration: reduced ? 0 : 0.25, overwrite: "auto" });
            });
          };
          rows.forEach((row) => {
            const arrow = row.querySelector<HTMLElement>(".expertise-pointer")!;
            const xTo = gsap.quickTo(arrow, "x", { duration: 0.25, ease: "power3.out" });
            const yTo = gsap.quickTo(arrow, "y", { duration: 0.25, ease: "power3.out" });
            const position = (event?: PointerEvent) => {
              const rect = row.getBoundingClientRect();
              const x = event ? Math.max(32, Math.min(rect.width - 32, event.clientX - rect.left)) : Math.min(rect.width - 32, 180);
              const y = event ? Math.max(32, Math.min(rect.height - 32, event.clientY - rect.top)) : rect.height / 2;
              if (reduced || activeRow !== row) gsap.set(arrow, { x, y });
              else { xTo(x); yTo(y); }
            };
            const enter = (event: PointerEvent) => {
              if (event.pointerType !== "mouse") return;
              position(event);
              animate(row);
            };
            const move = (event: PointerEvent) => {
              if (activeRow === row && event.pointerType === "mouse") position(event);
            };
            const leave = () => {
              if (document.activeElement !== row && activeRow === row) animate(null);
            };
            const focus = () => { position(); animate(row); };
            const blur = () => { tappedRow = null; if (activeRow === row) animate(null); };
            const pointerDown = (event: PointerEvent) => { touchClick = event.pointerType !== "mouse"; };
            const click = (event: MouseEvent) => {
              if (touchClick && tappedRow !== row) {
                event.preventDefault();
                tappedRow = row;
                position();
                animate(row);
              }
              touchClick = false;
            };
            row.addEventListener("pointerenter", enter);
            row.addEventListener("pointermove", move);
            row.addEventListener("pointerleave", leave);
            row.addEventListener("focus", focus);
            row.addEventListener("blur", blur);
            row.addEventListener("pointerdown", pointerDown);
            row.addEventListener("click", click);
            listeners.push(() => {
              row.removeEventListener("pointerenter", enter);
              row.removeEventListener("pointermove", move);
              row.removeEventListener("pointerleave", leave);
              row.removeEventListener("focus", focus);
              row.removeEventListener("blur", blur);
              row.removeEventListener("pointerdown", pointerDown);
              row.removeEventListener("click", click);
              xTo.tween.kill(); yTo.tween.kill();
            });
          });
          const outside = (event: PointerEvent) => {
            if (!activeRow?.contains(event.target as Node)) { tappedRow = null; animate(null); }
          };
          document.addEventListener("pointerdown", outside);
          if (!reduced) {
            gsap.fromTo(".expertise-intro-reveal", { y: 24, autoAlpha: 0 }, {
              y: 0, autoAlpha: 1, duration: 0.75, stagger: 0.1, ease: "power3.out",
              scrollTrigger: { trigger: ".expertise-intro", start: "top 85%", once: true },
            });
            rows.forEach((row, index) => {
              gsap.fromTo(row, { y: 22, autoAlpha: 0 }, {
                y: 0, autoAlpha: 1, duration: 0.65, delay: (index % 2) * 0.07, ease: "power3.out",
                scrollTrigger: { trigger: row, start: "top 94%", once: true },
              });
            });
          }
          return () => {
            document.removeEventListener("pointerdown", outside);
            listeners.splice(0).forEach((remove) => remove());
            // Event-created tweens also need explicit cancellation on teardown.
            gsap.killTweensOf([...rows, ...names, ...arrows]);
          };
        });
      }, host);
      cleanup = () => context.revert();
    };
    void init();
    return () => { disposed = true; cleanup?.(); };
  }, []);

  return <section id="services" className="expertise-section" aria-labelledby="services-title" ref={section}>
    <div className="expertise-inner">
      <div className="expertise-intro">
        <p className="expertise-eyebrow expertise-intro-reveal"><span aria-hidden="true" />Our Expertise</p>
        <h2 id="services-title" className="expertise-heading expertise-intro-reveal">How we make brands impossible to ignore.</h2>
        <div className="expertise-description expertise-intro-reveal">
          <p>We create identities, experiences and campaigns that turn ambitious ideas into unforgettable brands.</p>
          <BlobLink variant="navy" href="#services-list">Explore our services</BlobLink>
        </div>
      </div>
      <p className="expertise-touch-hint" id="services-touch-hint">Tap a service to preview. Tap again to discuss your project.</p>
      <div className="expertise-list" id="services-list">
        {services.map((service, index) => <a id={serviceNavigation[index].id} className="expertise-row" href="#contact" key={service.title}>
          <span className="expertise-preview" aria-hidden="true">
            <span className="expertise-preview-image">
              <Image src={service.image} alt="" fill sizes="120px" />
              <span className="expertise-preview-label">Concept preview</span>
            </span>
          </span>
          <h3 className="expertise-name">{service.title}</h3>
          <span className="expertise-pointer" aria-hidden="true"><ArrowUpRight size={25} strokeWidth={1.6} /></span>
        </a>)}
      </div>
      <div className="expertise-footnote"><span>ONE CONNECTED CREATIVE PRACTICE</span><span>STRATEGY — DESIGN — DIGITAL</span></div>
    </div>
  </section>;
}

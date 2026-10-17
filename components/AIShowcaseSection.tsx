"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { BlobLink } from "./BlobLink";

// Original local concept artwork, not completed client work. Replace paths here.
const previews = [
  { category: "Branding", src: "/projects/project-01.svg", alt: "Demo branding concept with abstract lime forms and editorial type" },
  { category: "Visual exploration", src: "/ai/visual-exploration-demo.svg", alt: "Demo visual exploration study with a sculptural arch and layered paper forms" },
  { category: "Art direction", src: "/projects/project-03.svg", alt: "Demo art direction concept using geometric packaging-inspired artwork" },
  { category: "Motion design", src: "/services/motion-placeholder.svg", alt: "Demo motion design concept showing an orbital form on deep navy" },
  { category: "Digital experience", src: "/projects/project-02.svg", alt: "Demo digital experience concept with an editorial interface composition" },
  { category: "Studio workflow", src: "/ai/studio-workflow-demo.svg", alt: "Demo studio workflow illustration showing notes, a storyboard and a creative planning sheet" },
];

const capabilities = ["AI Visuals", "Creative Concepts", "Motion & Video", "Smart Workflows"];

export default function AIShowcaseSection() {
  const section = useRef<HTMLElement>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const init = async () => {
      if (!section.current) return;
      const [{ gsap }, { ScrollTrigger }, { createAIPlayground }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("./aiShowcasePhysics")]);
      if (disposed || !section.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const host = section.current;
      const canvas = host.querySelector<HTMLElement>(".ai-showcase-canvas")!;
      const figures = Array.from(host.querySelectorAll<HTMLElement>(".ai-showcase-entrance"));
      const context = gsap.context(() => {
        const media = gsap.matchMedia();
        media.add("(prefers-reduced-motion: no-preference)", () => {
          const reveal = gsap.timeline({
            defaults: { ease: "power3.out" },
            scrollTrigger: { trigger: host, start: "top 75%", once: true },
          });
          reveal.fromTo(".ai-showcase-copy-reveal", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.09 })
            .fromTo(figures, { autoAlpha: 0, y: 25 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.1 }, 0.12);
        });
      }, host);
      const stopPhysics = createAIPlayground(canvas, host.querySelector<HTMLElement>(".ai-showcase-copy")!, host.querySelector<HTMLButtonElement>(".ai-showcase-reset")!);
      cleanup = () => { stopPhysics(); context.revert(); };
    };
    void init();
    return () => { disposed = true; cleanup?.(); };
  }, []);

  return <section id="how-we-use-ai" className="ai-showcase-section" aria-labelledby="ai-showcase-title" ref={section}>
    <div className="ai-showcase-canvas">
      {previews.map((preview, index) => <figure className={`ai-showcase-figure ai-showcase-figure--${index + 1}`} key={preview.category}>
        <button type="button" className="ai-showcase-grab" aria-label={`Move ${preview.category} preview using arrow keys or drag. Escape cancels dragging.`}>
          <span className="ai-showcase-entrance"><span className="ai-showcase-image">
          <Image src={preview.src} alt={preview.alt} draggable={false} fill sizes="(max-width: 720px) 30vw, (max-width: 1100px) 160px, 240px" />
          <span className="ai-showcase-caption">{preview.category}<span>Demo concept</span></span>
        </span></span></button>
      </figure>)}
      <div className="ai-showcase-copy">
        <p className="ai-showcase-eyebrow ai-showcase-copy-reveal"><span aria-hidden="true" />HOW WE THINK DIFFERENTLY</p>
        <h2 id="ai-showcase-title" className="ai-showcase-heading">
          <span className="ai-showcase-copy-reveal">Human imagination.</span>
          <span className="ai-showcase-copy-reveal">AI possibilities.</span>
        </h2>
        <p className="ai-showcase-description ai-showcase-copy-reveal">At Creatif Cue, we use AI to explore ideas faster, enhance creative production, and bring ambitious brand experiences to life — with human creativity leading every decision.</p>
        <ul className="ai-showcase-capabilities ai-showcase-copy-reveal" aria-label="How we use AI">{capabilities.map((label) => <li key={label}>{label}</li>)}</ul>
        <div className="ai-showcase-copy-reveal"><BlobLink variant="navy" href="#about">Explore our process</BlobLink></div>
        <div className="ai-showcase-playground-controls ai-showcase-copy-reveal"><span>Drag, throw, explore.</span><button type="button" className="ai-showcase-reset">Reset images <span aria-hidden="true">&#8634;</span></button></div>
      </div>
    </div>
  </section>;
}

"use client";

import { useEffect, useRef } from "react";
import ServicesSection from "./ServicesSection";
import { BlobLink } from "./BlobLink";

export default function ServicesAbout() {
  const root = useRef<HTMLDivElement>(null);

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
        gsap.fromTo(".about-reveal", { y: 36, autoAlpha: 0 }, {
          y: 0,
          autoAlpha: 1,
          duration: 0.85,
          stagger: 0.16,
          ease: "power3.out",
          scrollTrigger: { trigger: ".about-content", start: "top 78%", once: true },
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

  return <div className="phase-two" ref={root}>
    <ServicesSection />

    <section id="about" className="about-section" aria-labelledby="about-title">
      <div className="about-inner">
        <div className="about-aside about-reveal">
          <p className="section-eyebrow"><span>02</span> / WHO WE ARE</p>
          <p className="about-aside-note">Independent by nature.<br />Connected by curiosity.</p>
          <span className="about-mark" aria-hidden="true">CC<span>®</span></span>
        </div>
        <div className="about-content">
          <p className="about-tagline about-reveal">Where Brands Evolve</p>
          <h2 id="about-title" className="about-title about-reveal">We make room<br />for <em>what’s next.</em></h2>
          <div className="about-bottom about-reveal">
            <p className="about-positioning">Creatif Cue is an independent creative agency partnering with ambitious people to shape what their brand can become. We turn sharp thinking into identities, experiences and ideas that move with the world around them.</p>
            <BlobLink className="about-link" variant="cream" href="#services">Explore our approach</BlobLink>
          </div>
          <div className="about-caption"><span>STRATEGY WITH FEELING</span><span>DESIGN WITH DIRECTION</span><span>IDEAS IN MOTION</span></div>
        </div>
      </div>
    </section>

  </div>;
}

"use client";

import { useEffect, useRef } from "react";
import ProjectsCard from "./ProjectsCard";
import { projects } from "./projects";

export default function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    let cleanup: (() => void) | undefined;

    const init = async () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !sectionRef.current) return;
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (!active || !sectionRef.current) return;

      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
        gsap.fromTo(".projects-heading-inner", { y: "110%", autoAlpha: 0 }, {
          y: "0%",
          autoAlpha: 1,
          duration: 0.95,
          stagger: 0.14,
          ease: "power3.out",
          scrollTrigger: { trigger: ".projects-heading", start: "top 85%", once: true },
        });

        gsap.fromTo(".project-card", { y: 46, autoAlpha: 0 }, {
          y: 0,
          autoAlpha: 1,
          duration: 0.85,
          stagger: 0.16,
          ease: "power3.out",
          scrollTrigger: { trigger: ".projects-grid", start: "top 82%", once: true },
        });
      }, sectionRef);

      cleanup = () => context.revert();
    };

    void init();
    return () => {
      active = false;
      cleanup?.();
    };
  }, []);

  return <section id="work" className="projects-section" aria-labelledby="projects-title" ref={sectionRef}>
    <div className="projects-inner">
      <div className="projects-intro">
        <p className="projects-eyebrow"><span>03</span> / SELECTED PROJECTS</p>
        <h2 id="projects-title" className="projects-heading" aria-label="Take a look at our projects">
          <span className="projects-heading-line"><span className="projects-heading-inner">Take a look at</span></span>
          {" "}
          <span className="projects-heading-line"><span className="projects-heading-inner">our <em>projects</em></span></span>
        </h2>
      </div>
      <div className="projects-grid">
        {projects.map((project, index) => <ProjectsCard key={project.id} project={project} index={index} />)}
      </div>
      <div className="projects-footer"><span>FOUR CUES. FOUR DIFFERENT WORLDS.</span><span>BRAND / DIGITAL / CAMPAIGN</span></div>
    </div>
  </section>;
}
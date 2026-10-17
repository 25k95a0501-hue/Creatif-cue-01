"use client";

import { useEffect, useRef } from "react";
import type { WorkCategory } from "../data/workPortfolio";
import WorkGallery from "./WorkGallery";

export default function WorkCategorySection({ category }: { category: WorkCategory }) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    const init = async () => {
      const root = sectionRef.current;
      if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed || !sectionRef.current) return;

      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
        gsap.fromTo(".work-category-title", { y: "14%", autoAlpha: 0 }, {
          y: "0%",
          autoAlpha: 1,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: ".work-category-title", start: "top 88%", once: true },
        });
        gsap.fromTo(".work-category-divider", { scaleX: 0 }, {
          scaleX: 1,
          duration: 1,
          ease: "power2.out",
          transformOrigin: "left center",
          scrollTrigger: { trigger: ".work-category-divider", start: "top 88%", once: true },
        });
        gsap.fromTo([".work-category-copy", ".work-deliverables li"], { y: 24, autoAlpha: 0 }, {
          y: 0,
          autoAlpha: 1,
          duration: 0.7,
          stagger: 0.07,
          ease: "power3.out",
          scrollTrigger: { trigger: ".work-category-information", start: "top 88%", once: true },
        });
        gsap.fromTo(".work-project", { y: 34, autoAlpha: 0 }, {
          y: 0,
          autoAlpha: 1,
          duration: 0.75,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: ".work-gallery", start: "top 88%", once: true },
        });
      }, root);
      cleanup = () => context.revert();
    };

    void init();
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <section
      className={`work-category work-category--${category.layout}`}
      id={category.id}
      aria-labelledby={`${category.id}-title`}
      ref={sectionRef}
    >
      <div className="work-category-heading">
        <p className="work-category-kicker"><span>{category.number}</span> / WHAT WE MAKE</p>
        <h2 className="work-category-title" id={`${category.id}-title`}>{category.title}</h2>
      </div>
      <div className="work-category-divider" />
      <div className="work-category-information">
        <p className="work-category-copy">{category.description}</p>
        <ol className="work-deliverables" aria-label={`${category.title} deliverables`}>
          {category.deliverables.map((deliverable, index) => (
            <li key={deliverable}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <span>{deliverable}</span>
            </li>
          ))}
        </ol>
      </div>
      <WorkGallery images={category.images} />
    </section>
  );
}

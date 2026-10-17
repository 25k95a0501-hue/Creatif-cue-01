"use client";

import Image from "next/image";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Project } from "./projects";
import { BlobAffordance } from "./BlobLink";
import { useProjectCursorArrow } from "./useProjectCursorArrow";

type ProjectsCardProps = {
  project: Project;
  index: number;
};

export default function ProjectsCard({ project, index }: ProjectsCardProps) {
  const imageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  useProjectCursorArrow(imageRef, cursorRef);

  return <a
    className={`project-card project-card--${index + 1}`}
    href="/contact#enquiry"
    aria-label={`Discuss a ${project.category.toLowerCase()} project like ${project.name}`}
  >
    <div className="project-image-wrap" ref={imageRef}>
      <Image
        className="project-image"
        src={project.image}
        alt={project.imageAlt}
        fill
        sizes="(max-width: 680px) calc(100vw - 40px), (max-width: 1000px) 46vw, 42vw"
      />
      <div className="project-image-meta">
        <span>{project.year}</span>
        <span>{project.category}</span>
      </div>
      <span className="project-cursor" ref={cursorRef} aria-hidden="true">
        <span className="project-cursor-circle"><ArrowUpRight size={31} strokeWidth={1.4} /></span>
      </span>
    </div>
    <div className="project-card-details">
      <div className="project-card-topline">
        <span className="project-name">{project.name}</span>
        <span className="project-tags">{project.tags.join(" / ")}</span>
      </div>
      <h3>{project.title}</h3>
      <BlobAffordance className="project-action" variant="navy" size="small">Discuss this project</BlobAffordance>
    </div>
  </a>;
}

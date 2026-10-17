"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import type { WorkImage } from "../data/workPortfolio";
import { useProjectCursorArrow } from "./useProjectCursorArrow";

function WorkProject({ project, index }: { project: WorkImage; index: number }) {
  const imageRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);
  useProjectCursorArrow(imageRef, cursorRef);

  const imageContent = (
    <div className={`work-image-frame work-visual--${project.visual}`} ref={imageRef}>
      {project.src ? (
        <Image
          className="work-image"
          src={project.src}
          alt={project.alt}
          fill
          sizes="(max-width: 680px) calc(100vw - 44px), (max-width: 1000px) 82vw, 88vw"
        />
      ) : (
        <div className="work-image-placeholder" role="img" aria-label={project.alt}>
          <span className="work-placeholder-mark" aria-hidden="true" />
          <span className="work-placeholder-copy">Image placeholder</span>
          <span className="work-placeholder-index">{String(index + 1).padStart(2, "0")}</span>
        </div>
      )}
      <div className="work-image-meta" aria-hidden="true">
        <span>{project.category}</span>
        <span>{project.placeholder ? "Portfolio image to come" : project.year}</span>
      </div>
      {project.link && <span className="work-project-cursor" ref={cursorRef} aria-hidden="true">
        <span><ArrowUpRight size={28} strokeWidth={1.4} /></span>
      </span>}
    </div>
  );

  return (
    <figure className="work-project">
      {project.link ? (
        <a
          className="work-project-link"
          href={project.link}
          aria-label={`${project.title}, ${project.category}`}
        >
          {imageContent}
        </a>
      ) : imageContent}
      <figcaption className="work-project-caption">
        <span>{project.title}</span>
        <span>{project.year ?? "Year pending"}</span>
      </figcaption>
    </figure>
  );
}

export default function WorkGallery({ images }: { images: WorkImage[] }) {
  return (
    <div className="work-gallery">
      {images.map((project, index) => (
        <WorkProject key={`${project.category}-${index}`} project={project} index={index} />
      ))}
    </div>
  );
}

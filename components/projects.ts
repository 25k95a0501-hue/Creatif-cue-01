export type Project = {
  id: string;
  year: string;
  name: string;
  category: string;
  tags: string[];
  title: string;
  image: string;
  imageAlt: string;
};

export const projects: Project[] = [
  {
    id: "project-01",
    year: "2026",
    name: "Project 01",
    category: "Brand Identity",
    tags: ["Strategy", "Identity"],
    title: "A point of view, made visible.",
    image: "/projects/project-01.svg",
    imageAlt: "Original abstract placeholder artwork for a Creatif Cue brand identity project",
  },
  {
    id: "project-02",
    year: "2026",
    name: "Project 02",
    category: "Digital Experience",
    tags: ["Digital", "Experience"],
    title: "A new way to find your way.",
    image: "/projects/project-02.svg",
    imageAlt: "Original abstract placeholder artwork for a Creatif Cue digital experience project",
  },
  {
    id: "project-03",
    year: "2026",
    name: "Project 03",
    category: "Packaging & Art Direction",
    tags: ["Packaging", "Art direction"],
    title: "Every detail has a feeling.",
    image: "/projects/project-03.svg",
    imageAlt: "Original abstract placeholder artwork for a Creatif Cue packaging and art direction project",
  },
  {
    id: "project-04",
    year: "2026",
    name: "Project 04",
    category: "Creative Campaign",
    tags: ["Campaign", "Motion"],
    title: "Ideas that move outwards.",
    image: "/projects/project-04.svg",
    imageAlt: "Original abstract placeholder artwork for a Creatif Cue creative campaign project",
  },
];
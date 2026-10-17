export type WorkLayout = "feature" | "staggered" | "collage" | "asymmetric";

export type WorkVisual =
  | "identity"
  | "print"
  | "social"
  | "website"
  | "motion"
  | "ai"
  | "campaign";

export type WorkImage = {
  src?: string;
  alt: string;
  category: string;
  title: string;
  year?: string;
  link?: string;
  placeholder: boolean;
  visual: WorkVisual;
};

export type WorkCategory = {
  id: string;
  number: string;
  title: string;
  description: string;
  deliverables: string[];
  layout: WorkLayout;
  images: WorkImage[];
};

function placeholders(category: string, visual: WorkVisual, count: number): WorkImage[] {
  return Array.from({ length: count }, (_, index) => ({
    alt: `${category} portfolio image placeholder ${String(index + 1).padStart(2, "0")}`,
    category,
    title: `Project image placeholder ${String(index + 1).padStart(2, "0")}`,
    placeholder: true,
    visual,
  }));
}

export const workPortfolio: WorkCategory[] = [
  {
    id: "brand-identity",
    number: "01",
    title: "Brand Identity",
    description: "Thoughtful identities built to make brands recognizable, relevant and memorable.",
    deliverables: ["Logo Design", "Visual Identity", "Brand Guidelines", "Brand Strategy", "Brand Applications"],
    layout: "feature",
    images: placeholders("Brand Identity", "identity", 1),
  },
  {
    id: "print-design",
    number: "02",
    title: "Print Design",
    description: "Beautifully crafted print experiences that bring brand stories into the real world.",
    deliverables: ["Brochures", "Packaging", "Business Stationery", "Catalogues", "Posters & Advertising"],
    layout: "staggered",
    images: placeholders("Print Design", "print", 2),
  },
  {
    id: "social-media",
    number: "03",
    title: "Social Media",
    description: "Scroll-stopping creative content and campaigns designed to connect with modern audiences.",
    deliverables: ["Social Media Creatives", "Campaign Design", "Content Strategy", "Digital Advertisements", "Creative Templates"],
    layout: "collage",
    images: placeholders("Social Media", "social", 3),
  },
  {
    id: "website-design",
    number: "04",
    title: "Website Design",
    description: "Purposeful digital experiences where creative design meets intuitive functionality.",
    deliverables: ["Website Design", "UI/UX Design", "Responsive Development", "Landing Pages", "Interactive Experiences"],
    layout: "asymmetric",
    images: placeholders("Website Design", "website", 2),
  },
  {
    id: "motion-graphics",
    number: "05",
    title: "Motion Graphics",
    description: "Movement that adds energy, emotion and personality to every brand story.",
    deliverables: ["Logo Animation", "Motion Graphics", "3D Visuals", "Explainer Videos", "Promotional Reels"],
    layout: "staggered",
    images: placeholders("Motion Graphics", "motion", 2),
  },
  {
    id: "ai-creative-production",
    number: "06",
    title: "AI Creative Production",
    description: "Human creativity enhanced by intelligent tools to produce compelling visuals and new possibilities.",
    deliverables: ["AI-Assisted Visuals", "AI Video Advertising", "Creative Concept Development", "Product Visualizations", "AI-Enhanced Campaigns"],
    layout: "feature",
    images: placeholders("AI Creative Production", "ai", 1),
  },
  {
    id: "creative-campaigns",
    number: "07",
    title: "Creative Campaigns",
    description: "Connected creative ideas that bring brands to life across multiple platforms.",
    deliverables: ["Advertising Campaigns", "Art Direction", "Campaign Concepts", "Digital & Print Campaigns", "Visual Storytelling"],
    layout: "collage",
    images: placeholders("Creative Campaigns", "campaign", 3),
  },
];

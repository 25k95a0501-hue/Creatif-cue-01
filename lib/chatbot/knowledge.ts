export type ChatTopic =
  | "branding"
  | "website"
  | "social"
  | "print"
  | "motion"
  | "ai"
  | "portfolio"
  | "campaign"
  | "project"
  | "company";

export type ChatAction = {
  label: "View Work" | "Explore Services" | "Start a Project" | "Contact Us";
  href: "/work" | "/#services" | "/contact#enquiry" | "/contact";
};

export type KnowledgeEntry = {
  topic: ChatTopic;
  triggers: readonly string[];
  answer: string;
  actions: readonly ChatAction[];
};

const exploreServices: ChatAction = { label: "Explore Services", href: "/#services" };
const viewWork: ChatAction = { label: "View Work", href: "/work" };
const startProject: ChatAction = { label: "Start a Project", href: "/contact#enquiry" };
const contactUs: ChatAction = { label: "Contact Us", href: "/contact" };

export const chatbotKnowledge: readonly KnowledgeEntry[] = [
  {
    topic: "branding",
    triggers: [
      "branding", "brand identity", "brand identities", "identity design", "visual identity",
      "brand strategy", "brand guidelines", "logo", "logos", "logo design", "brand applications",
      "brand positioning", "rebrand", "rebranding",
    ],
    answer: "Absolutely! Creatif Cue works on brand identities, including logo design, visual systems and brand guidelines. Would you like to explore our work or discuss your brand?",
    actions: [viewWork, startProject],
  },
  {
    topic: "website",
    triggers: [
      "website", "websites", "web design", "web development", "website design", "site design",
      "landing page", "landing pages", "ui ux", "ui/ux", "user experience", "user interface",
      "responsive development", "responsive site", "interactive experience",
    ],
    answer: "We create responsive digital experiences with thoughtful design and intuitive functionality. Tell us a little about your project and we can help you take the next step.",
    actions: [viewWork, startProject],
  },
  {
    topic: "social",
    triggers: [
      "social media", "social content", "social creatives", "instagram", "content strategy",
      "digital advertisement", "digital advertisements", "digital ad", "digital ads",
      "social campaign", "social campaigns", "creative templates",
    ],
    answer: "Creatif Cue creates social media creatives, content strategy, campaign design and digital advertisements to help brands connect with modern audiences.",
    actions: [exploreServices, startProject],
  },
  {
    topic: "print",
    triggers: [
      "print design", "print", "brochure", "brochures", "packaging", "stationery",
      "business stationery", "catalogue", "catalogues", "catalog", "catalogs", "poster",
      "posters", "marketing material", "marketing materials", "print advertising",
    ],
    answer: "Yes. Print design can include brochures, packaging, business stationery, catalogues, posters and advertising—beautifully crafted to bring a brand story into the real world.",
    actions: [viewWork, startProject],
  },
  {
    topic: "motion",
    triggers: [
      "motion graphics", "motion design", "logo animation", "logo animations", "animation",
      "animate a logo", "animated logo", "animating a logo", "animations", "3d", "three dimensional", "promotional reel", "promotional reels",
      "promo reel", "explainer video", "explainer videos", "video production",
    ],
    answer: "Creatif Cue creates motion graphics, logo animations, 3D visuals and promotional reels that add energy and personality to a brand story.",
    actions: [viewWork, startProject],
  },
  {
    topic: "ai",
    triggers: [
      "ai", "artificial intelligence", "ai creative production", "ai assisted", "ai-assisted",
      "ai design", "ai video", "ai video advertising", "ai visuals", "ai visual",
      "product visualisation", "product visualization", "product visuals",
      "product visualizations", "creative concept", "creative concepts",
    ],
    answer: "Creatif Cue offers AI creative production: human creativity enhanced by intelligent tools for AI-assisted visuals, product visualisations, creative concepts and video advertising.",
    actions: [exploreServices, startProject],
  },
  {
    topic: "portfolio",
    triggers: [
      "portfolio", "our work", "your work", "past work", "previous work", "projects",
      "project examples", "examples", "case studies", "show me", "see your work", "see examples",
    ],
    answer: "You can explore our creative work across branding, print, social media, websites, motion, AI production and creative campaigns. The portfolio currently uses placeholders while project imagery is being prepared.",
    actions: [viewWork],
  },
  {
    topic: "campaign",
    triggers: [
      "creative campaign", "creative campaigns", "advertising campaign", "advertising campaigns",
      "campaign concept", "campaign concepts", "campaign design", "art direction",
      "visual storytelling", "digital and print campaign", "campaign",
    ],
    answer: "Creative campaigns can include advertising campaigns, art direction, campaign concepts, digital and print campaigns, and visual storytelling.",
    actions: [viewWork, startProject],
  },
  {
    topic: "project",
    triggers: [
      "project enquiry", "project inquiry", "start a project", "starting a project", "work together",
      "hire you", "hire creatif", "get a quote", "quote", "pricing", "price", "cost", "costs",
      "budget", "how much", "timeline", "timelines", "how long", "speak to someone", "talk to someone",
      "contact", "get in touch", "reach the team", "email address", "phone number",
    ],
    answer: "Project pricing and timelines depend on the scope and requirements. Share a little about what you need through our contact page and the Creatif Cue team can help with the next step.",
    actions: [startProject, contactUs],
  },
  {
    topic: "company",
    triggers: [
      "creatif cue", "creatifcue", "what do you do", "what does the company do", "what services",
      "creative agency", "creative studio", "about the company", "about you", "your company",
      "who are you", "what is creatif cue", "where brands evolve",
    ],
    answer: "Creatif Cue is an independent creative agency partnering with ambitious people to shape what their brand can become. The studio brings strategy, design and digital together to create identities, experiences, campaigns and ideas that move with the world around them.",
    actions: [exploreServices, viewWork, startProject],
  },
];

export const chatActions = {
  viewWork,
  exploreServices,
  startProject,
  contactUs,
} as const;

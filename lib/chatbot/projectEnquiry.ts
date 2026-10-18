export const PROJECT_ENQUIRY_DRAFT_KEY = "creatif-cue:project-enquiry-draft";
export const PROJECT_ENQUIRY_DRAFT_VERSION = 1;
export const PROJECT_ENQUIRY_DRAFT_TTL_MS = 15 * 60 * 1000;

export const PROJECT_TYPE_OPTIONS = [
  "Brand Identity",
  "Website Design",
  "Social Media",
  "Print Design",
  "AI & Motion",
  "Creative Campaign",
  "Something Else",
] as const;

export const PROJECT_BUDGET_OPTIONS = [
  "Under ₹25,000",
  "₹25,000–₹75,000",
  "₹75,000+",
  "Not sure yet",
] as const;

export const PROJECT_TIMELINE_OPTIONS = [
  "As soon as possible",
  "Within a month",
  "In 2–3 months",
  "Just exploring",
] as const;

export type ProjectEnquiry = {
  projectType: (typeof PROJECT_TYPE_OPTIONS)[number];
  description: string;
  budget: (typeof PROJECT_BUDGET_OPTIONS)[number];
  timeline: (typeof PROJECT_TIMELINE_OPTIONS)[number];
  name: string;
  email: string;
  phone: string;
};

export type ProjectEnquiryDraft = {
  version: typeof PROJECT_ENQUIRY_DRAFT_VERSION;
  createdAt: number;
  expiresAt: number;
  enquiry: ProjectEnquiry;
};

export function createProjectEnquiryDraft(enquiry: ProjectEnquiry): ProjectEnquiryDraft {
  const createdAt = Date.now();
  return {
    version: PROJECT_ENQUIRY_DRAFT_VERSION,
    createdAt,
    expiresAt: createdAt + PROJECT_ENQUIRY_DRAFT_TTL_MS,
    enquiry,
  };
}

export function parseProjectEnquiryDraft(value: unknown): ProjectEnquiryDraft | null {
  if (typeof value !== "object" || value === null || !("version" in value) || !("createdAt" in value) || !("expiresAt" in value) || !("enquiry" in value)) return null;
  const draft = value as Partial<ProjectEnquiryDraft>;
  const enquiry = draft.enquiry;
  if (
    draft.version !== PROJECT_ENQUIRY_DRAFT_VERSION
    || typeof draft.createdAt !== "number"
    || draft.createdAt < 0
    || draft.createdAt > Date.now()
    || typeof draft.expiresAt !== "number"
    || draft.expiresAt <= draft.createdAt
    || draft.expiresAt <= Date.now()
    || draft.expiresAt - draft.createdAt > PROJECT_ENQUIRY_DRAFT_TTL_MS
    || typeof enquiry !== "object"
    || enquiry === null
    || !PROJECT_TYPE_OPTIONS.includes(enquiry.projectType)
    || !PROJECT_BUDGET_OPTIONS.includes(enquiry.budget)
    || !PROJECT_TIMELINE_OPTIONS.includes(enquiry.timeline)
    || typeof enquiry.description !== "string"
    || enquiry.description.length > 4000
    || typeof enquiry.name !== "string"
    || enquiry.name.length > 100
    || enquiry.name.trim().length < 2
    || typeof enquiry.email !== "string"
    || enquiry.email.length > 254
    || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(enquiry.email)
    || typeof enquiry.phone !== "string"
    || enquiry.phone.length > 40
  ) return null;
  return draft as ProjectEnquiryDraft;
}

export function formatProjectEnquiryMessage(enquiry: ProjectEnquiry): string {
  return [
    `Project type: ${enquiry.projectType}`,
    `Budget range (indicative only): ${enquiry.budget}`,
    `Preferred timeline: ${enquiry.timeline}`,
    `Project details: ${enquiry.description.trim() || "Not provided"}`,
  ].join("\n");
}

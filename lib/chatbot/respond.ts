import { chatActions, chatbotKnowledge, type ChatAction, type ChatTopic } from "./knowledge";

export type ChatReply = {
  text: string;
  topic?: ChatTopic;
  actions: readonly ChatAction[];
};

const greetingPattern = /^(hi|hello|hey|hiya|howdy|good morning|good afternoon|good evening|greetings)( there)?$/;
const thanksPattern = /^(thanks|thank you|thank you so much|cheers|much appreciated)( so much)?$/;
const goodbyePattern = /^(bye|goodbye|see you|talk later|take care)$/;
const pricingPattern = /\b(pric(e|es|ing)|cost(s)?|budget|quote|how much)\b/;
const contactPattern = /\b(contact|speak|talk|human|person|team|email|phone|get in touch|reach (you|someone|the team)|work together|hire (you|creatif))\b/;
const followUpPattern = /^(tell me more|more|more info|more information|how much(\s+does it cost)?|what about (the )?(price|cost|pricing)|can i see (some )?(examples|work)|show me (some )?(examples|work)|see (some )?(examples|work)|examples|what else|and\??)$/;
const ambiguousPattern = /^(what|which)\s+(services?|kind of work|type of work)(\s+.*)?$|^(what can you (help me with|create)|what do you (create|design)|can you help( me)?|design|help|services?)$/;
const aiPhrasePattern = /\b(ai|artificial intelligence|machine learning)\b/;

function normalizeMessage(message: string): string {
  return message
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/&/g, " and ")
    .replace(/ui\s*\/\s*ux/g, "ui ux")
    .replace(/([a-z])[-’']([a-z])/g, "$1$2")
    .replace(/[^\p{L}\p{N}\s/]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesTrigger(message: string, trigger: string): boolean {
  const normalizedTrigger = normalizeMessage(trigger);
  if (normalizedTrigger.includes(" ")) return message.includes(normalizedTrigger);
  return new RegExp(`(^|\\s)${normalizedTrigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|\\s)`, "u").test(message);
}

function findKnowledgeEntry(message: string) {
  const scored = chatbotKnowledge
    .map((entry, order) => ({
      entry,
      order,
      score: Math.max(0, ...entry.triggers.map(trigger => matchesTrigger(message, trigger) ? normalizeMessage(trigger).length : 0)),
    }))
    .filter(result => result.score > 0)
    .sort((left, right) => right.score - left.score || left.order - right.order);
  return scored[0]?.entry;
}

function topicReply(topic: ChatTopic): ChatReply {
  const entry = chatbotKnowledge.find(candidate => candidate.topic === topic);
  if (!entry) return fallbackReply();
  return { text: entry.answer, topic, actions: entry.actions };
}

function pricingReply(topic: ChatTopic = "project"): ChatReply {
  return {
    text: "Project pricing and timelines depend on the scope and requirements. Share a little about what you need through our contact page and the Creatif Cue team can help with the next step.",
    topic,
    actions: [chatActions.startProject, chatActions.contactUs],
  };
}

function fallbackReply(): ChatReply {
  return {
    text: "I don’t have verified information about that just yet. You can explore our services or creative work, or share your question with the team through our contact page.",
    actions: [chatActions.exploreServices, chatActions.viewWork, chatActions.contactUs],
  };
}

function ambiguousReply(): ChatReply {
  return {
    text: "I can help with brand identity, websites, social media, print, motion and 3D, AI creative production, creative campaigns, our portfolio or starting a project. Which would you like to know about?",
    actions: [chatActions.exploreServices, chatActions.viewWork, chatActions.startProject],
  };
}

export function respond(message: string, previousTopic?: ChatTopic): ChatReply {
  const normalized = normalizeMessage(message);
  if (!normalized) return { text: "Type a question or choose one of the suggested topics to get started.", actions: [] };
  if (normalized === "explore services" || normalized === "services") {
    return {
      text: "Creatif Cue’s creative services include brand identity, website design, social media and content, print design, motion graphics and 3D, AI creative production, and creative campaigns.",
      topic: "company",
      actions: [chatActions.exploreServices, chatActions.startProject],
    };
  }

  if (greetingPattern.test(normalized)) {
    return {
      text: "Hi there! I can help you explore Creatif Cue’s services, portfolio or project enquiries. What are you curious about?",
      actions: [chatActions.exploreServices, chatActions.viewWork, chatActions.startProject],
    };
  }
  if (thanksPattern.test(normalized)) {
    return { text: "You’re very welcome. If anything else comes to mind, I’m here to point you in the right direction.", actions: [chatActions.contactUs] };
  }
  if (goodbyePattern.test(normalized)) {
    return { text: "Take care, and thanks for stopping by Creatif Cue. We’ll be here whenever you’re ready to start a conversation.", actions: [chatActions.startProject] };
  }
  if (followUpPattern.test(normalized)) {
    if (normalized.includes("much") || normalized.includes("price") || normalized.includes("cost")) {
      return pricingReply(previousTopic);
    }
    if (normalized.includes("example") || normalized.includes("show me") || normalized.includes("see work")) {
      return { text: "You can explore Creatif Cue’s portfolio across branding, print, social media, websites, motion and AI production. Project imagery is currently represented by placeholders.", topic: "portfolio", actions: [chatActions.viewWork] };
    }
    if (previousTopic) return topicReply(previousTopic);
    return ambiguousReply();
  }

  if (pricingPattern.test(normalized) || contactPattern.test(normalized)) {
    const matchedTopic = findKnowledgeEntry(normalized);
    if (pricingPattern.test(normalized)) return pricingReply(matchedTopic?.topic ?? "project");
    return topicReply("project");
  }

  if (aiPhrasePattern.test(normalized)) {
    const aiEntry = chatbotKnowledge.find(entry => entry.topic === "ai");
    if (aiEntry && aiEntry.triggers.some(trigger => matchesTrigger(normalized, trigger))) {
      return { text: aiEntry.answer, topic: aiEntry.topic, actions: aiEntry.actions };
    }
  }

  const entry = findKnowledgeEntry(normalized);
  if (entry) return { text: entry.answer, topic: entry.topic, actions: entry.actions };
  if (ambiguousPattern.test(normalized)) return ambiguousReply();
  return fallbackReply();
}

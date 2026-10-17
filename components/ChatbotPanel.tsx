"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUp, ArrowUpRight, RotateCcw, X } from "lucide-react";
import type { ChatAction, ChatTopic } from "../lib/chatbot/knowledge";
import {
  createProjectEnquiryDraft,
  PROJECT_BUDGET_OPTIONS,
  PROJECT_ENQUIRY_DRAFT_KEY,
  PROJECT_TIMELINE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  type ProjectEnquiry,
} from "../lib/chatbot/projectEnquiry";

type AssistantMode = "checking" | "rules" | "configured" | "connected" | "unavailable";
type EnquiryStep = "projectType" | "description" | "budget" | "timeline" | "contact" | "summary";
type EnquiryAnswers = Partial<ProjectEnquiry>;

const enquirySteps: Exclude<EnquiryStep, "summary">[] = ["projectType", "description", "budget", "timeline", "contact"];

const enquiryQuestions: Record<Exclude<EnquiryStep, "summary">, string> = {
  projectType: "What are we creating together?",
  description: "Tell me a little about what you have in mind.",
  budget: "Do you have a budget range in mind?",
  timeline: "When would you like to begin?",
  contact: "How can our team reach you?",
};

const enquiryLabels: Record<Exclude<EnquiryStep, "summary">, string> = {
  projectType: "Project type",
  description: "Project details",
  budget: "Budget range",
  timeline: "Timeline",
  contact: "Contact details",
};

function isProjectEnquiryIntent(message: string): boolean {
  const normalized = message.toLocaleLowerCase("en").replace(/[^\p{L}\p{N}\s₹]/gu, " ").replace(/\s+/g, " ").trim();
  return /^(start a project|get a quote|discuss my project)$/.test(normalized)
    || /\b(start|discuss|begin|plan)\s+(a\s+)?(new\s+)?project\b/.test(normalized)
    || /\b(get|request|need)\s+(a\s+)?quote\b/.test(normalized)
    || /\b(project|work)\s+enquir(y|ies)\b/.test(normalized)
    || /\b(work together|work with you|hire you|hire creatif cue)\b/.test(normalized);
}

type Message = {
  id: number;
  role: "assistant" | "user";
  text: string;
  actions?: readonly ChatAction[];
  loading?: boolean;
  retry?: boolean;
};

const allowedTopics: ChatTopic[] = ["branding", "website", "social", "print", "motion", "ai", "portfolio", "campaign", "project", "company"];
const allowedActionLabels: ChatAction["label"][] = ["View Work", "Explore Services", "Start a Project", "Contact Us"];
const allowedActionPaths: ChatAction["href"][] = ["/work", "/#services", "/contact#enquiry", "/contact"];
const quickActions = ["Explore services", "View our work", "Start a project", "AI & creativity"];
const welcomeMessage: Message = {
  id: 0,
  role: "assistant",
  text: "Hey there! 👋 Welcome to Creatif Cue. What can I help you create today?",
};

export default function ChatbotPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [assistantMode, setAssistantMode] = useState<AssistantMode>("checking");
  const [enquiryStep, setEnquiryStep] = useState<EnquiryStep | null>(null);
  const [enquiry, setEnquiry] = useState<EnquiryAnswers>({});
  const [enquiryError, setEnquiryError] = useState("");
  const [editingAnswers, setEditingAnswers] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const messageList = useRef<HTMLDivElement>(null);
  const questionHeading = useRef<HTMLHeadingElement>(null);
  const sendingLock = useRef(false);
  const requestController = useRef<AbortController | null>(null);
  const nextMessageId = useRef(1);
  const activeTopic = useRef<ChatTopic | undefined>(undefined);
  const nameInput = useRef<HTMLInputElement>(null);
  const emailInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/chat", { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Assistant status unavailable");
        const result: unknown = await response.json();
        if (typeof result !== "object" || result === null || !("mode" in result)) throw new Error("Assistant status unavailable");
        setAssistantMode(result.mode === "ai-configured" ? "configured" : "rules");
      })
      .catch(() => {
        if (!controller.signal.aborted) setAssistantMode("unavailable");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => {
      const mobile = window.matchMedia("(max-width: 720px)").matches;
      (mobile ? closeButton.current : input.current)?.focus({ preventScroll: true });
    });
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    const list = messageList.current;
    if (!list || !open) return;
    list.scrollTo({ top: list.scrollHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [messages, open, enquiryStep]);

  useEffect(() => {
    if (!open || !enquiryStep) return;
    const target = enquiryStep === "contact" ? nameInput.current : questionHeading.current;
    target?.focus({ preventScroll: true });
  }, [open, enquiryStep]);

  const requestAssistantReply = async (text: string, retryMessageId?: number) => {
    if (sendingLock.current) return;
    sendingLock.current = true;
    const controller = new AbortController();
    requestController.current = controller;
    const assistantId = retryMessageId ?? nextMessageId.current++;
    const userId = nextMessageId.current++;
    const history = messages
      .filter(message => !message.loading && !message.retry && message.id !== retryMessageId)
      .map(({ role, text: content }) => ({ role, content }));
    const requestMessages = (retryMessageId ? history : [...history, { role: "user" as const, content: text }]).slice(-8);

    if (retryMessageId) {
      setMessages(previous => previous.map(message => message.id === retryMessageId ? { ...message, text: "", loading: true, retry: false, actions: undefined } : message));
    } else {
      setMessages(previous => [
        ...previous,
        { id: userId, role: "user", text },
        { id: assistantId, role: "assistant", text: "", loading: true },
      ]);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: requestMessages, previousTopic: activeTopic.current }),
        signal: controller.signal,
      });
      const result: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        const errorText = typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
          ? result.error
          : "Cue couldn't reply just now. Please try again.";
        throw new Error(errorText);
      }
      if (typeof result !== "object" || result === null || !("reply" in result) || typeof result.reply !== "string" || !result.reply.trim()) {
        throw new Error("Cue couldn't reply just now. Please try again.");
      }
      const payload = result as { reply: string; topic?: unknown; actions?: unknown; mode?: unknown };
      const topic = typeof payload.topic === "string" && allowedTopics.includes(payload.topic as ChatTopic)
        ? payload.topic as ChatTopic
        : undefined;
      const actions = Array.isArray(payload.actions)
        ? payload.actions.filter((action): action is ChatAction =>
            typeof action === "object" && action !== null
            && "label" in action && allowedActionLabels.includes(action.label as ChatAction["label"])
            && "href" in action && allowedActionPaths.includes(action.href as ChatAction["href"]))
        : [];
      activeTopic.current = topic ?? activeTopic.current;
      setAssistantMode(payload.mode === "ai" ? "connected" : payload.mode === "rules" ? "rules" : "unavailable");
      setMessages(previous => previous.map(message => message.id === assistantId
        ? { id: assistantId, role: "assistant", text: payload.reply.slice(0, 2000), actions }
        : message));
    } catch (error) {
      if (!controller.signal.aborted) {
        const safeMessage = error instanceof Error && error.message.startsWith("Cue ")
          ? error.message
          : "Cue couldn't reply just now. Please try again.";
        setMessages(previous => previous.map(message => message.id === assistantId
          ? { id: assistantId, role: "assistant", text: safeMessage, retry: true }
          : message));
      }
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        sendingLock.current = false;
      }
    }
  };

  const appendConversation = (entries: Array<{ role: Message["role"]; text: string; actions?: readonly ChatAction[] }>) => {
    setMessages(previous => [
      ...previous,
      ...entries.map(entry => ({ ...entry, id: nextMessageId.current++ })),
    ]);
  };

  const beginProjectEnquiry = (visitorMessage: string) => {
    appendConversation([
      { role: "user", text: visitorMessage },
      { role: "assistant", text: "Amazing! Let's turn your idea into something great. I'll ask a few quick questions." },
    ]);
    setEnquiry({});
    setEnquiryError("");
    setEditingAnswers(false);
    setEnquiryStep("projectType");
  };

  const cancelProjectEnquiry = () => {
    setEnquiryStep(null);
    setEnquiry({});
    setEnquiryError("");
    setEditingAnswers(false);
    appendConversation([{ role: "assistant", text: "No problem. Your enquiry draft has not been submitted. Ask me anything about Creatif Cue whenever you're ready." }]);
  };

  const appendMessage = (text: string) => {
    if (sendingLock.current) return;
    const normalized = text.toLocaleLowerCase("en").trim().replace(/[.!?]+$/g, "");
    if (enquiryStep && normalized === "cancel") {
      appendConversation([{ role: "user", text }, { role: "assistant", text: "No problem. Your enquiry draft has not been submitted. Ask me anything about Creatif Cue whenever you're ready." }]);
      setEnquiryStep(null);
      setEnquiry({});
      setEnquiryError("");
      return;
    }
    if (enquiryStep === "description") {
      const description = text.trim().slice(0, 4000);
      setEnquiry(previous => ({ ...previous, description }));
      appendConversation([{ role: "user", text: description || "Skip project details" }]);
      setEnquiryError("");
      setEnquiryStep("budget");
      return;
    }
    if (enquiryStep) {
      appendConversation([{ role: "assistant", text: "Choose an option below, or cancel the enquiry to return to the conversation." }]);
      return;
    }
    if (isProjectEnquiryIntent(text)) {
      sendingLock.current = true;
      try {
        beginProjectEnquiry(text);
      } finally {
        sendingLock.current = false;
      }
    } else {
      void requestAssistantReply(text);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || sendingLock.current) return;
    appendMessage(text);
    setDraft("");
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (draft.trim() && !sendingLock.current) {
        appendMessage(draft.trim());
        setDraft("");
      }
    }
  };

  const setEnquiryAnswer = <K extends keyof ProjectEnquiry>(key: K, value: ProjectEnquiry[K]) => {
    setEnquiry(previous => ({ ...previous, [key]: value }));
    setEnquiryError("");
  };

  const goToNextEnquiryStep = () => {
    if (!enquiryStep || enquiryStep === "summary") return;
    if (enquiryStep === "projectType" && !enquiry.projectType) return;
    if (enquiryStep === "budget" && !enquiry.budget) return;
    if (enquiryStep === "timeline" && !enquiry.timeline) return;
    if (enquiryStep === "contact") {
      const name = enquiry.name?.trim() ?? "";
      const email = enquiry.email?.trim() ?? "";
      if (name.length < 2) {
        setEnquiryError("Please enter your full name (at least 2 characters).");
        nameInput.current?.focus();
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        setEnquiryError("Please enter a valid email address.");
        emailInput.current?.focus();
        return;
      }
    }
    const currentIndex = enquirySteps.indexOf(enquiryStep);
    setEnquiryStep(currentIndex === enquirySteps.length - 1 ? "summary" : enquirySteps[currentIndex + 1]);
    setEnquiryError("");
  };

  const goToPreviousEnquiryStep = () => {
    if (!enquiryStep || enquiryStep === "summary") return;
    const currentIndex = enquirySteps.indexOf(enquiryStep);
    if (currentIndex > 0) setEnquiryStep(enquirySteps[currentIndex - 1]);
    setEnquiryError("");
  };

  const continueToContact = () => {
    const name = enquiry.name?.trim() ?? "";
    const email = enquiry.email?.trim() ?? "";
    if (
      !enquiry.projectType || !enquiry.budget || !enquiry.timeline
      || name.length < 2
      || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
    ) {
      setEnquiryError("Please edit the brief and complete the project type, budget, timeline, name and valid email before continuing.");
      if (!enquiry.projectType) setEnquiryStep("projectType");
      else if (!enquiry.budget) setEnquiryStep("budget");
      else if (!enquiry.timeline) setEnquiryStep("timeline");
      else setEnquiryStep("contact");
      return;
    }
    const completeEnquiry: ProjectEnquiry = {
      projectType: enquiry.projectType,
      description: enquiry.description ?? "",
      budget: enquiry.budget,
      timeline: enquiry.timeline,
      name,
      email,
      phone: enquiry.phone?.trim() ?? "",
    };
    try {
      window.sessionStorage.setItem(PROJECT_ENQUIRY_DRAFT_KEY, JSON.stringify(createProjectEnquiryDraft(completeEnquiry)));
    } catch {
      setEnquiryError("Your browser could not securely prepare the handoff. Your answers are still here; please try again or use the contact page directly.");
      return;
    }
    setEnquiryStep(null);
    onClose();
    router.push("/contact#enquiry");
  };

  return (
    <section
      className={`cue-chat-panel${open ? " cue-chat-panel--open" : ""}`}
      id="cue-chat-panel"
      aria-label="Cue — Creative Assistant chat"
      aria-hidden={!open}
      inert={!open}
    >
      <header className="cue-chat-header">
        <span className="cue-chat-avatar" aria-hidden="true">
          <svg viewBox="0 0 44 44">
            <ellipse cx="15" cy="21" rx="5.2" ry="6.5" />
            <ellipse cx="29" cy="21" rx="5.2" ry="6.5" />
            <circle cx="16" cy="22" r="1.8" />
            <circle cx="30" cy="22" r="1.8" />
          </svg>
        </span>
        <div className="cue-chat-header-copy">
          <h2>Cue <span>— Creative Assistant</span></h2>
          <p>{assistantMode === "rules" ? "Rule-based guide · AI not configured" : assistantMode === "configured" ? "AI mode configured" : assistantMode === "connected" ? "AI assistant · connected" : assistantMode === "unavailable" ? "Assistant temporarily unavailable" : "Checking assistant mode…"}</p>
        </div>
        {messages.length > 1 && (
          <button
            className="cue-chat-close cue-chat-new"
            type="button"
            aria-label="Start new conversation"
            title="Start new conversation"
            onClick={() => {
              requestController.current?.abort();
              requestController.current = null;
              sendingLock.current = false;
              activeTopic.current = undefined;
              nextMessageId.current = 1;
              setEnquiry({});
              setEnquiryStep(null);
              setEnquiryError("");
              setEditingAnswers(false);
              setMessages([welcomeMessage]);
              setDraft("");
            }}
          >
            <RotateCcw size={16} strokeWidth={1.7} aria-hidden="true" />
          </button>
        )}
        <button className="cue-chat-close" ref={closeButton} type="button" aria-label="Close chat window" onClick={onClose}>
          <X size={19} strokeWidth={1.7} aria-hidden="true" />
        </button>
      </header>

      <div className="cue-chat-messages" ref={messageList} role="log" aria-label="Chat conversation" aria-live="polite" aria-relevant="additions text">
        <div className="cue-chat-date"><span>CREATIF CUE</span></div>
        {messages.map(message => (
          <article className={`cue-chat-message cue-chat-message--${message.role}`} key={message.id}>
            {message.loading ? (
              <div className="cue-chat-thinking" role="status" aria-label="Cue is preparing a reply"><span /><span /><span /><span className="cue-chat-visually-hidden">Cue is preparing a reply</span></div>
            ) : <p>{message.text}</p>}
            {message.retry && (
              <button className="cue-chat-retry" type="button" onClick={() => void requestAssistantReply(messages[messages.indexOf(message) - 1]?.text ?? "", message.id)}>
                <RotateCcw size={12} aria-hidden="true" /> Try again
              </button>
            )}
            {message.actions && message.actions.length > 0 && (
              <nav className="cue-chat-message-actions" aria-label="Suggested next steps">
                {message.actions.map(action => action.label === "Start a Project" ? (
                  <button className="cue-chat-chip" type="button" key={`${action.label}-${action.href}`} onClick={() => appendMessage("Start a project")}>
                    {action.label}
                  </button>
                ) : (
                  <Link className="cue-chat-chip" href={action.href} key={`${action.label}-${action.href}`} onClick={onClose}>
                    {action.label}{action.href === "/work" && <ArrowUpRight size={12} aria-hidden="true" />}
                  </Link>
                ))}
              </nav>
            )}
          </article>
        ))}
        {messages.length === 1 && !enquiryStep && (
          <div className="cue-chat-quick-actions" aria-label="Suggested topics">
            <span>HERE ARE A FEW PLACES TO BEGIN</span>
            <div>
              {quickActions.map(action => (
                <button className="cue-chat-chip" type="button" key={action} onClick={() => appendMessage(action)}>
                  {action}{action === "View our work" && <ArrowUpRight size={12} aria-hidden="true" />}
                </button>
              ))}
            </div>
          </div>
        )}
        {enquiryStep && (
          <section className="cue-enquiry-flow" aria-labelledby="cue-enquiry-question" aria-live="polite">
            {enquiryStep !== "summary" && (
              <>
                <ol className="cue-enquiry-progress" aria-label={`Project enquiry step ${enquirySteps.indexOf(enquiryStep) + 1} of ${enquirySteps.length}`}>
                  {enquirySteps.map((step, index) => (
                    <li key={step} aria-current={step === enquiryStep ? "step" : undefined} className={index <= enquirySteps.indexOf(enquiryStep) ? "is-current" : ""}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                    </li>
                  ))}
                </ol>
                <h3 id="cue-enquiry-question" ref={questionHeading} tabIndex={-1}>{enquiryQuestions[enquiryStep]}</h3>
                {enquiryStep === "projectType" && (
                  <div className="cue-enquiry-options" role="group" aria-label="Choose a project type">
                    {PROJECT_TYPE_OPTIONS.map(option => (
                      <button className="cue-enquiry-option" type="button" key={option} aria-pressed={enquiry.projectType === option} onClick={() => setEnquiryAnswer("projectType", option)}>{option}</button>
                    ))}
                  </div>
                )}
                {enquiryStep === "description" && (
                  <div className="cue-enquiry-field">
                    <label htmlFor="cue-enquiry-description">Project details <span>(optional)</span></label>
                    <textarea id="cue-enquiry-description" value={enquiry.description ?? ""} maxLength={4000} rows={3} placeholder="A few words about your idea, audience or goals…" onChange={event => setEnquiryAnswer("description", event.target.value)} />
                  </div>
                )}
                {enquiryStep === "budget" && (
                  <>
                    <p className="cue-enquiry-note">These are for understanding your plans only—not Creatif Cue prices or minimum fees.</p>
                    <div className="cue-enquiry-options" role="group" aria-label="Choose an indicative budget range">
                      {PROJECT_BUDGET_OPTIONS.map(option => (
                        <button className="cue-enquiry-option" type="button" key={option} aria-pressed={enquiry.budget === option} onClick={() => setEnquiryAnswer("budget", option)}>{option}</button>
                      ))}
                    </div>
                  </>
                )}
                {enquiryStep === "timeline" && (
                  <div className="cue-enquiry-options" role="group" aria-label="Choose a preferred timeline">
                    {PROJECT_TIMELINE_OPTIONS.map(option => (
                      <button className="cue-enquiry-option" type="button" key={option} aria-pressed={enquiry.timeline === option} onClick={() => setEnquiryAnswer("timeline", option)}>{option}</button>
                    ))}
                  </div>
                )}
                {enquiryStep === "contact" && (
                  <div className="cue-enquiry-contact">
                    <div className="cue-enquiry-field">
                      <label htmlFor="cue-enquiry-name">Full name <span>*</span></label>
                      <input ref={nameInput} id="cue-enquiry-name" value={enquiry.name ?? ""} maxLength={100} autoComplete="name" aria-invalid={Boolean(enquiryError && (enquiry.name?.trim().length ?? 0) < 2)} onChange={event => setEnquiryAnswer("name", event.target.value)} />
                    </div>
                    <div className="cue-enquiry-field">
                      <label htmlFor="cue-enquiry-email">Email address <span>*</span></label>
                      <input ref={emailInput} id="cue-enquiry-email" type="email" value={enquiry.email ?? ""} maxLength={254} autoComplete="email" aria-invalid={Boolean(enquiryError && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(enquiry.email ?? ""))} onChange={event => setEnquiryAnswer("email", event.target.value)} />
                    </div>
                    <div className="cue-enquiry-field">
                      <label htmlFor="cue-enquiry-phone">Phone number <span>(optional)</span></label>
                      <input id="cue-enquiry-phone" type="tel" value={enquiry.phone ?? ""} maxLength={40} autoComplete="tel" onChange={event => setEnquiryAnswer("phone", event.target.value)} />
                    </div>
                    <p className="cue-enquiry-privacy">We’ll use these details only to reply to your enquiry. They stay in this browser session until you continue to the contact form. Nothing is submitted here; you can review and edit everything there, and must explicitly submit the form with its privacy consent.</p>
                  </div>
                )}
                {enquiryError && <p className="cue-enquiry-error" role="alert">{enquiryError}</p>}
                <div className="cue-enquiry-controls">
                  <button type="button" className="cue-enquiry-cancel" onClick={cancelProjectEnquiry}>Cancel</button>
                  <div>
                    <button type="button" className="cue-enquiry-back" onClick={goToPreviousEnquiryStep} disabled={enquiryStep === "projectType"}><ArrowLeft size={13} aria-hidden="true" /> Back</button>
                    {enquiryStep === "description" && <button type="button" className="cue-enquiry-skip" onClick={() => { setEnquiryAnswer("description", ""); appendConversation([{ role: "user", text: "Skip project details" }]); setEnquiryStep("budget"); }}>Skip</button>}
                    <button type="button" className="cue-enquiry-next" onClick={goToNextEnquiryStep} disabled={(enquiryStep === "projectType" && !enquiry.projectType) || (enquiryStep === "budget" && !enquiry.budget) || (enquiryStep === "timeline" && !enquiry.timeline)}>
                      {enquiryStep === "contact" ? "Review brief" : "Next"} <ArrowRight size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </>
            )}
            {enquiryStep === "summary" && (
              <>
                <h3 id="cue-enquiry-question" ref={questionHeading} tabIndex={-1}>Your project brief</h3>
                <dl className="cue-enquiry-summary">
                  {enquirySteps.filter(step => step !== "contact").map(step => (
                    <div key={step}>
                      <dt>{enquiryLabels[step]}</dt>
                      <dd>{step === "description" ? enquiry.description || "Not provided" : enquiry[step]}</dd>
                    </div>
                  ))}
                  <div><dt>Full name</dt><dd>{enquiry.name}</dd></div>
                  <div><dt>Email address</dt><dd>{enquiry.email}</dd></div>
                  {enquiry.phone && <div><dt>Phone number</dt><dd>{enquiry.phone}</dd></div>}
                </dl>
                {enquiryError && <p className="cue-enquiry-error" role="alert">{enquiryError}</p>}
                {editingAnswers && (
                  <div className="cue-enquiry-edit-list" aria-label="Choose an answer to edit">
                    {enquirySteps.map(step => <button type="button" key={step} onClick={() => { setEnquiryStep(step); setEditingAnswers(false); setEnquiryError(""); }}>Edit {enquiryLabels[step]}</button>)}
                  </div>
                )}
                <p className="cue-enquiry-privacy">Your enquiry hasn’t been sent. Continue to the contact form to review and edit the details, give consent, and submit explicitly.</p>
                <div className="cue-enquiry-controls cue-enquiry-controls--summary">
                  <button type="button" className="cue-enquiry-cancel" onClick={cancelProjectEnquiry}>Cancel</button>
                  <div>
                    <button type="button" className="cue-enquiry-back" onClick={() => setEditingAnswers(value => !value)}>{editingAnswers ? "Done editing" : "Edit answers"}</button>
                    <button type="button" className="cue-enquiry-next" onClick={continueToContact}>Continue to Contact <ArrowRight size={13} aria-hidden="true" /></button>
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </div>

      <form className="cue-chat-composer" onSubmit={submit}>
        <label className="cue-chat-visually-hidden" htmlFor="cue-chat-input">Your message to Cue</label>
        <textarea
          id="cue-chat-input"
          ref={input}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onKeyDown={onInputKeyDown}
          placeholder={enquiryStep ? "Use the enquiry controls above…" : "Ask me anything..."}
          rows={1}
          maxLength={1500}
          disabled={Boolean(enquiryStep)}
        />
        <button className="cue-chat-send" type="submit" aria-label="Send message" disabled={!draft.trim() || Boolean(enquiryStep) || sendingLock.current}>
          <ArrowUp size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
        <span className="cue-chat-composer-hint">Enter to send · Shift + Enter for a new line</span>
      </form>
    </section>
  );
}

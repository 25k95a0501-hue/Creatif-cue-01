"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDownRight, ArrowLeft, ArrowRight, Check } from "lucide-react";
import {
  formatProjectEnquiryMessage,
  parseProjectEnquiryDraft,
  PROJECT_ENQUIRY_DRAFT_KEY,
} from "../lib/chatbot/projectEnquiry";

const questions = [
  {
    id: "projectType",
    title: "What are we creating together?",
    options: ["Brand Identity", "Website", "Social Media", "AI & Motion", "Something Else"],
  },
  {
    id: "personality",
    title: "What's your brand's personality?",
    options: ["Bold & Expressive", "Minimal & Refined", "Playful & Fun", "Premium & Elegant"],
  },
  {
    id: "timing",
    title: "When should the magic begin?",
    options: ["As soon as possible", "Within a month", "Just exploring"],
  },
] as const;

type QuizAnswers = Partial<Record<(typeof questions)[number]["id"], string>>;
type QuizMode = "question" | "summary" | "skipped";

const fieldLabels: Record<(typeof questions)[number]["id"], string> = {
  projectType: "What we're creating",
  personality: "Brand personality",
  timing: "When to begin",
};

export default function ContactExperience() {
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [step, setStep] = useState(0);
  const [quizMode, setQuizMode] = useState<QuizMode>("question");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [draftNotice, setDraftNotice] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let rawDraft: string | null;
    try {
      rawDraft = window.sessionStorage.getItem(PROJECT_ENQUIRY_DRAFT_KEY);
    } catch {
      setDraftNotice("Your browser could not access the temporary project brief. You can still complete the enquiry form below.");
      return;
    }
    if (!rawDraft) return;

    try {
      const parsed = parseProjectEnquiryDraft(JSON.parse(rawDraft));
      if (!parsed || !formRef.current) {
        setDraftNotice("The temporary project brief expired or could not be read. Please review and enter your details below.");
        return;
      }
      const name = formRef.current.querySelector<HTMLInputElement>("#contact-name");
      const email = formRef.current.querySelector<HTMLInputElement>("#contact-email");
      const phone = formRef.current.querySelector<HTMLInputElement>("#contact-phone");
      const message = formRef.current.querySelector<HTMLTextAreaElement>("#contact-message");
      if (!name || !email || !phone || !message) {
        setDraftNotice("The project brief could not be placed into the form. Please enter your details below.");
        return;
      }
      name.value = parsed.enquiry.name;
      email.value = parsed.enquiry.email;
      phone.value = parsed.enquiry.phone;
      message.value = formatProjectEnquiryMessage(parsed.enquiry);
      setDraftNotice("Your project brief is ready. Review and edit any details below, then provide consent and submit when you’re ready.");
    } catch {
      setDraftNotice("The temporary project brief expired or could not be read. Please review and enter your details below.");
    } finally {
      try {
        window.sessionStorage.removeItem(PROJECT_ENQUIRY_DRAFT_KEY);
      } catch {
        setDraftNotice("The project brief was loaded, but your browser could not clear its temporary copy. It will expire automatically.");
      }
    }
  }, []);

  const currentQuestion = questions[step];
  const completedAnswers = questions.filter(question => answers[question.id]).length;

  const scrollToForm = () => {
    document.getElementById("enquiry-form-title")?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => formRef.current?.querySelector<HTMLInputElement>("#contact-name")?.focus({ preventScroll: true }), 350);
  };

  const startBrief = () => {
    const firstUnanswered = questions.findIndex(question => !answers[question.id]);
    setStep(firstUnanswered < 0 ? 0 : firstUnanswered);
    setQuizMode(firstUnanswered < 0 ? "summary" : "question");
  };

  const submitEnquiry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!formRef.current || submitting) return;

    setSubmitting(true);
    setStatus(null);
    const formData = new FormData(formRef.current);
    const quiz = Object.fromEntries(
      questions
        .filter(question => answers[question.id])
        .map(question => [question.id, answers[question.id]]),
    );

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          message: formData.get("message"),
          consent: formData.get("consent") === "on",
          website: formData.get("website"),
          quiz,
        }),
      });
      const result: { message?: string; error?: string } = await response.json();

      if (!response.ok) {
        setStatus({ type: "error", message: result.error ?? "Your enquiry could not be sent. Please try again." });
        return;
      }

      setStatus({ type: "success", message: result.message ?? "Your enquiry has been sent." });
      formRef.current.reset();
    } catch {
      setStatus({
        type: "error",
        message: "We couldn't reach the enquiry service. Your details have not been sent; please try again later.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="contact-enquiry" id="enquiry" aria-labelledby="contact-enquiry-title">
      <div className="contact-enquiry-grid">
        <div className="contact-enquiry-intro">
          <p className="contact-section-kicker"><span>01</span> / THE CREATIVE SPARK</p>
          <h2 id="contact-enquiry-title">A little spark.<br />A lot of possibility.</h2>
          <p>A few quick prompts can help us get a feel for what you have in mind. There are no wrong answers, and the brief is entirely optional.</p>
        </div>

        <div className="contact-experience">
          <div className="contact-brief">
            <div className="contact-brief-topline">
              <p className="contact-brief-label">THE CREATIVE SPARK</p>
              <span className="contact-brief-optional">OPTIONAL · NO WRONG ANSWERS</span>
            </div>

            {quizMode !== "skipped" && (
              <>
                <ol className="contact-progress" aria-label="Creative brief progress">
                  {questions.map((question, index) => (
                    <li key={question.id} aria-current={quizMode === "question" && index === step ? "step" : undefined}>
                      <span className="contact-progress-number">{answers[question.id] ? <Check size={12} aria-label="Answered" /> : `0${index + 1}`}</span>
                      <span className="contact-progress-text">{["The idea", "The feeling", "The timing"][index]}</span>
                    </li>
                  ))}
                </ol>

                {quizMode === "question" && (
                  <div className="contact-question" key={currentQuestion.id}>
                    <h3 id="contact-question-title">{currentQuestion.title}</h3>
                    <div className="contact-options" role="group" aria-labelledby="contact-question-title">
                      {currentQuestion.options.map(option => (
                        <button
                          className="contact-option"
                          type="button"
                          key={option}
                          aria-pressed={answers[currentQuestion.id] === option}
                          onClick={() => setAnswers(previous => ({ ...previous, [currentQuestion.id]: option }))}
                        >
                          <span className="contact-option-mark" aria-hidden="true">{answers[currentQuestion.id] === option ? <Check size={12} /> : null}</span>
                          {option}
                        </button>
                      ))}
                    </div>
                    <div className="contact-quiz-actions">
                      <button className="contact-skip" type="button" onClick={() => { setQuizMode("skipped"); scrollToForm(); }}>
                        Skip the brief — go straight to the form
                      </button>
                      <div className="contact-quiz-navigation">
                        <button className="contact-action contact-action--quiet" type="button" disabled={step === 0} onClick={() => setStep(value => Math.max(value - 1, 0))}>
                          <ArrowLeft size={15} aria-hidden="true" /> Back
                        </button>
                        <button
                          className="contact-action"
                          type="button"
                          disabled={!answers[currentQuestion.id]}
                          onClick={() => step === questions.length - 1 ? setQuizMode("summary") : setStep(value => value + 1)}
                        >
                          {step === questions.length - 1 ? "Review brief" : "Next"} <ArrowRight size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {quizMode === "summary" && (
                  <div className="contact-summary">
                    <h3 id="contact-question-title">Your starting point.</h3>
                    <ul className="contact-summary-list">
                      {questions.map((question, index) => (
                        <li key={question.id}>
                          <span>{fieldLabels[question.id]}</span>
                          <span>{answers[question.id]}</span>
                          <button className="contact-edit-brief" type="button" aria-label={`Edit ${fieldLabels[question.id]}`} onClick={() => { setStep(index); setQuizMode("question"); }}>Edit</button>
                        </li>
                      ))}
                    </ul>
                    <div className="contact-quiz-actions">
                      <button className="contact-skip" type="button" onClick={() => { setQuizMode("skipped"); scrollToForm(); }}>
                        Send an enquiry without the brief
                      </button>
                      <button className="contact-action" type="button" onClick={scrollToForm}>
                        Continue to your enquiry <ArrowDownRight size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {quizMode === "skipped" && (
              <div className="contact-quiz-skipped">
                <span>{completedAnswers ? `${completedAnswers} brief ${completedAnswers === 1 ? "answer" : "answers"} saved for your enquiry.` : "No brief needed — tell us about your project below."}</span>
                <button className="contact-edit-brief" type="button" onClick={startBrief}>Add or edit the creative brief</button>
              </div>
            )}
          </div>

          <form className="contact-form" ref={formRef} onSubmit={submitEnquiry} noValidate={false}>
            <div className="contact-form-heading">
              <h3 id="enquiry-form-title">Tell us a little more.</h3>
              <p>Fields marked * are required</p>
            </div>
            {draftNotice && <p className="contact-draft-notice" role="status" aria-live="polite">{draftNotice}</p>}
            <div className="contact-form-fields">
              <div className="contact-field">
                <label htmlFor="contact-name">Full name *</label>
                <input id="contact-name" name="name" type="text" autoComplete="name" maxLength={100} placeholder="Your name" required disabled={submitting} />
              </div>
              <div className="contact-field">
                <label htmlFor="contact-email">Email address *</label>
                <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required disabled={submitting} />
              </div>
              <div className="contact-field">
                <label htmlFor="contact-phone">Phone number <span>(optional)</span></label>
                <input id="contact-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="Your number" disabled={submitting} />
              </div>
              <div className="contact-field contact-field--full">
                <label htmlFor="contact-message">Tell us about your project</label>
                <textarea id="contact-message" name="message" maxLength={5000} placeholder="The big idea, a small question, or wherever you are in between..." rows={5} disabled={submitting} />
              </div>
              <div className="contact-field contact-honeypot" aria-hidden="true">
                <label htmlFor="contact-website">Leave this field empty</label>
                <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" disabled={submitting} />
              </div>
            </div>
            <label className="contact-consent" htmlFor="contact-consent">
              <input id="contact-consent" name="consent" type="checkbox" required disabled={submitting} />
              <span>I agree that Creatif Cue may use these details to respond to my enquiry. They won’t be used for unrelated marketing. If email delivery is configured, the enquiry will be processed by our email delivery provider.</span>
            </label>
            <div className="contact-form-submit-row">
              <button className="contact-action contact-submit" type="submit" disabled={submitting}>
                {submitting ? "Sending enquiry…" : "Send your enquiry"} {!submitting && <ArrowRight size={16} aria-hidden="true" />}
              </button>
              <span className="contact-brief-optional">Your brief answers travel with your enquiry.</span>
            </div>
            <p className={`contact-form-status${status ? ` contact-form-status--${status.type}` : ""}`} role={status?.type === "error" ? "alert" : "status"} aria-live="polite">
              {status?.message ?? ""}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import { ArrowDownRight } from "lucide-react";
import ContactExperience from "../../components/ContactExperience";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";

export const metadata: Metadata = {
  title: "Contact | Creatif Cue",
  description: "Tell Creatif Cue what you're imagining. Start a creative brief or send an enquiry directly.",
  openGraph: {
    title: "Contact | Creatif Cue",
    description: "Every great idea starts with a hello. Start a project with Creatif Cue.",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="contact-page">
        <section className="contact-hero" aria-labelledby="contact-title">
          <div className="contact-hero-main">
            <p className="contact-eyebrow">CREATIF CUE <span>/</span> SAY HELLO</p>
            <h1 id="contact-title">Every great idea starts with <em>a hello.</em></h1>
            <p className="contact-hero-intro">Big idea, small question or something in between? Tell us what you&apos;re imagining. We&apos;re all ears.</p>
          </div>
          <aside className="contact-hero-note">
            <p>Good things begin with a conversation. Start wherever you are.</p>
            <a className="contact-arrow" href="#enquiry" aria-label="Go to the creative brief and enquiry form">
              <ArrowDownRight size={21} strokeWidth={1.4} aria-hidden="true" />
            </a>
          </aside>
        </section>
        <ContactExperience />
      </main>
      <Footer />
    </>
  );
}

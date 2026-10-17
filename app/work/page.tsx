import type { Metadata } from "next";
import { ArrowDown } from "lucide-react";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import WorkCategorySection from "../../components/WorkCategorySection";
import { workPortfolio } from "../../data/workPortfolio";

export const metadata: Metadata = {
  title: "Our Work | Creatif Cue",
  description: "Explore Creatif Cue's creative work across brand identity, print, social, digital, motion and campaigns.",
  openGraph: {
    title: "Our Work | Creatif Cue",
    description: "Creative work made to matter. Explore the services and portfolio of Creatif Cue.",
    type: "website",
  },
};

export default function WorkPage() {
  return (
    <>
      <Navbar />
      <main className="work-page">
        <section className="work-hero" aria-labelledby="work-page-title">
          <div className="work-hero-content">
            <p className="work-hero-eyebrow">OUR WORK <span>/</span> CREATIF CUE</p>
            <h1 id="work-page-title">Creative work.<br /><em>Made to matter.</em></h1>
            <p className="work-hero-description">
              From brand identities to digital experiences, we turn ideas into work that connects, inspires and evolves.
            </p>
          </div>
          <a className="work-scroll-indicator" href="#brand-identity">
            <span>SCROLL TO EXPLORE</span>
            <ArrowDown size={17} strokeWidth={1.5} aria-hidden="true" />
          </a>
        </section>
        <div className="work-categories">
          {workPortfolio.map((category) => (
            <WorkCategorySection key={category.id} category={category} />
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}

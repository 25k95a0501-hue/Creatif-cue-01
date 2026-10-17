"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowUp, ArrowUpRight, Instagram, Linkedin, Mail } from "lucide-react";
import { BlobLink } from "./BlobLink";

const discover = [
  { label: "About", href: "/#about" },
  { label: "Our Approach", href: "/#how-we-use-ai" },
  { label: "Services", href: "/#services" },
  { label: "Our Work", href: "/work" },
];
const explore = [
  { label: "Home", href: "/" },
  { label: "Brand Identity", href: "/#services-list" },
  { label: "Websites", href: "/#services-list" },
  { label: "Social Media", href: "/#services-list" },
  { label: "Motion & 3D", href: "/#services-list" },
  { label: "Contact", href: "/contact" },
];

function BehanceMark() {
  return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M3 6h4.5a3 3 0 0 1 0 6H3zm0 6h5a3 3 0 0 1 0 6H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M15 7h6m-6 7h6a3.5 3.5 0 1 0-7 0c0 2.5 1.5 4 3.5 4 1.4 0 2.2-.4 3-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>;
}

// No profile URLs or verified contact details are supplied by this checkout.
const socialPlaceholders = [
  { name: "Instagram", icon: <Instagram size={21} strokeWidth={1.7} aria-hidden="true" /> },
  { name: "LinkedIn", icon: <Linkedin size={20} strokeWidth={1.7} aria-hidden="true" /> },
  { name: "Behance", icon: <BehanceMark /> },
];

export default function Footer() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const init = async () => {
      if (!root.current) return;
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (disposed || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
        const media = gsap.matchMedia();
        media.add("(prefers-reduced-motion: no-preference)", () => {
          gsap.fromTo(".cue-footer-top-reveal", { y: 22, autoAlpha: 0 }, {
            y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.1, ease: "power3.out",
            scrollTrigger: { trigger: ".cue-footer-top", start: "top 86%", once: true },
          });
          gsap.fromTo(".cue-footer-statement", { y: 24, autoAlpha: 0 }, {
            y: 0, autoAlpha: 1, duration: 0.95, ease: "power3.out",
            scrollTrigger: { trigger: ".cue-footer-statement", start: "top 92%", once: true },
          });
          gsap.fromTo(".cue-footer-bottom", { y: 12, autoAlpha: 0 }, {
            y: 0, autoAlpha: 1, duration: 0.6, ease: "power3.out",
            scrollTrigger: { trigger: ".cue-footer-bottom", start: "top 98%", once: true },
          });
        });
      }, root);
      cleanup = () => context.revert();
    };
    void init();
    return () => { disposed = true; cleanup?.(); };
  }, []);

  return <footer id="contact" className="cue-footer" aria-labelledby="cue-footer-title" ref={root}>
    <div className="cue-footer-panel">
      <div className="cue-footer-corner">
        <ArrowUpRight size={19} strokeWidth={1.5} aria-hidden="true" />
        <p>You’ve reached the bottom.<br />Let’s create something great.</p>
      </div>
      <div className="cue-footer-socials" aria-label="Social profiles awaiting confirmation">
        {socialPlaceholders.map((social) => <span className="cue-footer-social" key={social.name} role="img" aria-label={`${social.name} profile — awaiting confirmation`} title={`${social.name} — profile awaiting confirmation`}>{social.icon}</span>)}
        <span className="cue-footer-social-note">Profiles<br />pending</span>
      </div>
      <div className="cue-footer-top">
        <div className="cue-footer-invitation cue-footer-top-reveal">
          <h2 id="cue-footer-title">Do you like<br />what you see?</h2>
          <BlobLink variant="cream" href="/contact#enquiry">Start a project</BlobLink>
        </div>
        <nav className="cue-footer-nav cue-footer-top-reveal" aria-label="Discover Creatif Cue">
          <h3>Discover</h3>
          <ul>{discover.map((link) => <li key={link.label}><Link href={link.href}>{link.label}</Link></li>)}</ul>
        </nav>
        <nav className="cue-footer-nav cue-footer-top-reveal" aria-label="Explore Creatif Cue">
          <h3>Explore</h3>
          <ul>{explore.map((link) => <li key={link.label}><Link href={link.href}>{link.label}</Link></li>)}</ul>
        </nav>
        <div className="cue-footer-contact cue-footer-top-reveal">
          <h3>Get in touch</h3>
          <p className="cue-footer-email"><Mail size={16} strokeWidth={1.5} aria-hidden="true" /><span>hello@creatifcue.com</span></p>
          <p className="cue-footer-contact-note">Email awaiting confirmation</p>
          <p className="cue-footer-contact-caption">Let’s create something.</p>
        </div>
      </div>
      <p className="cue-footer-statement"><span>Where Brands</span>{" "}<span>Evolve.</span></p>
      <div className="cue-footer-bottom">
        <div className="cue-footer-identity">
          <Link className="cue-footer-wordmark" href="/" aria-label="Creatif Cue, back to top">creatif<span>cue.</span></Link>
          <span>© 2026 Creatif Cue.</span>
        </div>
        <div className="cue-footer-legal"><span>All Rights Reserved</span><Link className="cue-footer-back" href="/">Back to Top <ArrowUp size={15} strokeWidth={1.6} aria-hidden="true" /></Link></div>
      </div>
    </div>
  </footer>;
}

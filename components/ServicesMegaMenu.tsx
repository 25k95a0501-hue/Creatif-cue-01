"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { serviceNavigation } from "./serviceNavigation";

export function MobileServicesAccordion({ onNavigate }: { onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  return <div className="mobile-services">
    <button type="button" className="mobile-services-trigger" aria-expanded={expanded} aria-controls="mobile-services-list" onClick={() => setExpanded(!expanded)}>Services<ChevronDown size={24} /></button>
    <div id="mobile-services-list" hidden={!expanded}>
      {serviceNavigation.map(service => <Link className="mobile-service-link" key={service.id} href={`/#${service.id}`} onClick={onNavigate}><span>{service.name}<small>{service.description}</small></span><ArrowUpRight size={18} /></Link>)}
      <Link className="mobile-service-link" href="/#services" onClick={onNavigate}>Explore all Services<ArrowUpRight size={18} /></Link>
    </div>
  </div>;
}

export default function ServicesMegaMenu() {
  const [open, setOpen] = useState(false);
  const region = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLAnchorElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = useCallback(() => { if (timer.current) clearTimeout(timer.current); timer.current = null; }, []);
  const close = useCallback(() => { cancelClose(); setOpen(false); }, [cancelClose]);
  const show = () => { cancelClose(); setOpen(true); };

  useEffect(() => {
    const host = region.current;
    const nav = host?.parentElement;
    if (!host || !nav) return;
    const measure = () => {
      const button = trigger.current?.getBoundingClientRect();
      const navigation = nav.getBoundingClientRect();
      if (button) host.style.setProperty("--services-trigger-offset", `${button.left + button.width / 2 - navigation.left - navigation.width / 2}px`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    measure();
    const desktop = window.matchMedia("(min-width: 721px)");
    const resize = () => { if (!desktop.matches) setOpen(false); };
    desktop.addEventListener("change", resize);
    return () => { observer.disconnect(); desktop.removeEventListener("change", resize); if (timer.current) clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        // Restore focus before closing so the focus handler cannot reopen it.
        if (region.current?.contains(document.activeElement)) trigger.current?.focus({ preventScroll: true });
        close();
      }
    };
    const outside = (event: PointerEvent) => { if (!region.current?.contains(event.target as Node)) close(); };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", escape); document.removeEventListener("pointerdown", outside); };
  }, [open, close]);

  return <div ref={region} className={`services-menu${open ? " services-menu--open" : ""}`}
    onPointerEnter={event => { if (event.pointerType === "mouse") show(); }}
    onPointerLeave={() => { cancelClose(); timer.current = setTimeout(() => { if (!region.current?.contains(document.activeElement)) setOpen(false); }, 140); }}
    onFocus={show} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close(); }}>
    <Link ref={trigger} className="services-menu-trigger" href="/#services" aria-expanded={open} aria-controls="desktop-services-menu" onClick={close} onKeyDown={event => {
      if (event.key === " " || event.key === "ArrowDown") { event.preventDefault(); show(); }
    }}>Services</Link>
    <div id="desktop-services-menu" className="services-menu-positioner" inert={!open} aria-hidden={!open}>
      <div className="services-menu-panel">
        <ul className="services-menu-list">
          {serviceNavigation.map((service, index) => <li key={service.id} style={{ "--service-index": index } as React.CSSProperties}>
            <Link className="services-menu-row" href={`/#${service.id}`} onClick={close}><span>{service.name}</span><small>{service.description}</small></Link>
          </li>)}
        </ul>
        <Link className="services-menu-feature" href="/#services" onClick={close}>
          <div className="services-menu-feature-heading"><h2>Explore all Services</h2><ArrowUpRight size={23} aria-hidden="true" /></div>
          <p>Discover how we bring strategy, design and technology together to help brands evolve.</p>
          <figure><Image src="/services/studio-demo.webp" alt="Demo photograph of paper swatches and sculptural objects on a sunlit design studio table" fill sizes="320px" /><figcaption>AI-generated studio demo</figcaption></figure>
        </Link>
      </div>
    </div>
  </div>;
}

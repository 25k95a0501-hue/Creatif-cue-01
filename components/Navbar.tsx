"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, Moon, Sun, X } from "lucide-react";
import { BlobLink } from "./BlobLink";
import ServicesMegaMenu, { MobileServicesAccordion } from "./ServicesMegaMenu";

const items = [
  { label: "Work", href: "/work" },
  { label: "About", href: "/#about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const header = useRef<HTMLElement>(null);
  const floating = useRef(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLDivElement>(null);

  const closeMenu = () => {
    setOpen(false);
    menuButton.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    const onScroll = () => {
      let next = floating.current;
      if (window.scrollY > 80) next = true;
      else if (window.scrollY < 25) next = false;
      if (next !== floating.current) {
        floating.current = next;
        setScrolled(next);
      }
    };
    const shell = header.current;
    const glass = shell?.querySelector<HTMLElement>(".navbar-glass");
    // Geometry is measured only on resize, never during scroll tracking.
    const measure = () => {
      if (!shell || !glass?.offsetWidth) return;
      shell.style.setProperty("--nav-expansion", String(shell.clientWidth / glass.offsetWidth));
      shell.style.setProperty("--nav-inset", `${(shell.clientWidth - glass.offsetWidth) / 2}px`);
    };
    const observer = new ResizeObserver(measure);
    if (shell && glass) { observer.observe(shell); observer.observe(glass); }
    measure();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const main = document.querySelector("main");
    const previousInert = main?.inert ?? false;
    if (main) main.inert = true;
    drawer.current?.querySelector<HTMLButtonElement>(".mobile-services-trigger")?.focus({ preventScroll: true });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
      if (event.key === "Tab") {
        const links = Array.from(drawer.current?.querySelectorAll<HTMLAnchorElement | HTMLButtonElement>("a[href], button") ?? []).filter(node => node.getClientRects().length > 0);
        const controls = [menuButton.current, ...links].filter((node): node is HTMLButtonElement | HTMLAnchorElement => node !== null);
        const index = controls.indexOf(document.activeElement as HTMLButtonElement | HTMLAnchorElement);
        event.preventDefault();
        const nextIndex = index < 0 ? (event.shiftKey ? controls.length - 1 : 0) : (index + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
        controls[nextIndex]?.focus();
      }
    };
    const desktop = window.matchMedia("(min-width: 721px)");
    const onDesktop = () => {
      if (desktop.matches) {
        setOpen(false);
        document.querySelector<HTMLAnchorElement>(".brand")?.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onDesktop);
    onDesktop();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (main) main.inert = previousInert;
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [open]);
  return <>
    <header ref={header} className={`navbar${scrolled ? " navbar--scrolled" : ""}${open ? " navbar--menu-open" : ""}`}>
      <div className="navbar-glass" aria-hidden="true" />
      <div className="navbar-content">
        <Link className="brand" href="/" aria-label="Creatif Cue, back to top">creatif<span>cue.</span></Link>
        <nav className="navlinks" aria-label="Main navigation">
          <ServicesMegaMenu />
          {items.map(item => <Link key={item.label} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className="navtools">
          <button type="button" className="theme-toggle" aria-label={dark ? "Switch to light theme" : "Switch to dark theme"} onClick={() => setDark(!dark)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button>
          <BlobLink className="nav-cta" variant="navy" href="/contact#enquiry">Start a project</BlobLink>
          <button ref={menuButton} type="button" className="menu-toggle" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => open ? closeMenu() : setOpen(true)}>{open ? <X size={22}/> : <Menu size={22}/>}</button>
        </div>
      </div>
    </header>
    <div ref={drawer} id="mobile-navigation" className={`mobile-drawer ${open ? "mobile-drawer--open" : ""}`} inert={!open}>
      <nav aria-label="Mobile navigation"><MobileServicesAccordion onNavigate={closeMenu} />{items.map((item,i) => <Link style={{"--n":i} as React.CSSProperties} href={item.href} key={item.label} onClick={closeMenu}>{item.label}<ArrowUpRight size={22}/></Link>)}</nav>
      <BlobLink className="mobile-contact" variant="navy" href="/contact#enquiry" onClick={closeMenu}>Start a project</BlobLink>
    </div>
  </>;
}

import type { Metadata } from "next";
import ChatbotLauncher from "../components/ChatbotLauncher";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creatif Cue — Where Brands Evolve",
  description: "Creatif Cue is an independent creative studio building distinctive brands and digital experiences.",
  openGraph: { title: "Creatif Cue — Where Brands Evolve", description: "Independent creative studio. Branding, digital and design.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<ChatbotLauncher /></body></html>;
}

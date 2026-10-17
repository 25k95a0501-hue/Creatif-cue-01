import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import ClientLogoMarquee from "../components/ClientLogoMarquee";
import ProjectsSection from "../components/ProjectsSection";
import ServicesAbout from "../components/ServicesAbout";
import AIShowcaseSection from "../components/AIShowcaseSection";
import Footer from "../components/Footer";

export default function Home() {
  return <><Navbar/><main><Hero/><ClientLogoMarquee/><ProjectsSection/><ServicesAbout/><AIShowcaseSection/></main><Footer/></>;
}

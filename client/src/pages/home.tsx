import Navigation from "@/components/navigation";
import HeroSection from "@/components/hero-section";
import EcosystemOverview from "@/components/ecosystem-overview";
import TokenomicsSection from "@/components/tokenomics-section";
import ProjectsSection from "@/components/projects-section";
import RoadmapSection from "@/components/roadmap-section";
import CTASection from "@/components/cta-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <HeroSection />
      <EcosystemOverview />
      <TokenomicsSection />
      <ProjectsSection />
      <RoadmapSection />
      <CTASection />
      <Footer />
    </div>
  );
}

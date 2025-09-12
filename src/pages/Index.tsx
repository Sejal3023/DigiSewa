import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ServicesSection } from "@/components/ServicesSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Footer } from "@/components/Footer";
import { GovernmentBranding } from "@/components/GovernmentBranding";
import { AccessibilityBar } from "@/components/AccessibilityBar";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <GovernmentBranding />
      <AccessibilityBar />
      <Header />
      <main id="main-content">
        <HeroSection />
        <ServicesSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

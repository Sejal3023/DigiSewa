import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Footer } from "@/components/Footer";
import { AccessibilityBar } from "@/components/AccessibilityBar";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <AccessibilityBar />
      <Header />
      <main id="main-content">
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

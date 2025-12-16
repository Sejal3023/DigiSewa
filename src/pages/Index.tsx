import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { ServicesSection } from "@/components/ServicesSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-background">
      <Header userRole="citizen" />
      <main>
        <HeroSection />
        <ServicesSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

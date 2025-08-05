import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Smartphone, 
  Shield, 
  Clock, 
  FileCheck, 
  Users, 
  Globe,
  Zap,
  CheckCircle2 
} from "lucide-react";

export const FeaturesSection = () => {
  const features = [
    {
      icon: Smartphone,
      title: "Mobile-First Design",
      description: "Access all services seamlessly from your smartphone or tablet",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Tamper-proof records and certificates stored on blockchain",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      icon: Clock,
      title: "Real-time Tracking",
      description: "Track your application status in real-time with SMS/Email updates",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      icon: FileCheck,
      title: "One-Time KYC",
      description: "Submit documents once, use across all government departments",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      icon: Users,
      title: "Multi-Language Support",
      description: "Available in Hindi, English, and 10+ regional languages",
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      icon: Zap,
      title: "AI-Powered Processing",
      description: "Automated document verification and risk assessment",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    }
  ];

  const benefits = [
    "No physical visits required",
    "24/7 service availability", 
    "Digital certificates with QR codes",
    "Integrated payment gateway",
    "Auto-filled application forms",
    "Digital signature support"
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Key Features</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose Our Digital Platform?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the future of government services with our cutting-edge technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card 
              key={feature.title}
              className="group hover:shadow-government transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefits List */}
        <div className="bg-gradient-card rounded-2xl p-8 border shadow-card-soft">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">Additional Benefits</h3>
            <p className="text-muted-foreground">Everything you need for seamless government interactions</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <div 
                key={benefit}
                className="flex items-center space-x-3 animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
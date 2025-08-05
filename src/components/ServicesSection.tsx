import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Car, 
  UtensilsCrossed, 
  FileText, 
  Shield, 
  Briefcase,
  Home,
  Plane,
  ArrowRight,
  Clock,
  CheckCircle2
} from "lucide-react";
import { Link } from "react-router-dom";

export const ServicesSection = () => {
  const services = [
    {
      id: "business",
      title: "Business Licenses",
      description: "Shop & Establishment, GST Registration, Import/Export License",
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      count: "15+ Services",
      avgTime: "2-3 Days"
    },
    {
      id: "vehicle",
      title: "Vehicle Registration",
      description: "New Vehicle Registration, Transfer of Ownership, Driving License",
      icon: Car,
      color: "text-green-600",
      bgColor: "bg-green-50",
      count: "8+ Services",
      avgTime: "1-2 Days"
    },
    {
      id: "food",
      title: "Food & Safety",
      description: "FSSAI License, Hotel License, Food Vendor Permits",
      icon: UtensilsCrossed,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      count: "6+ Services",
      avgTime: "3-5 Days"
    },
    {
      id: "property",
      title: "Property & Construction",
      description: "Building Permits, Property Registration, NOC Applications",
      icon: Home,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      count: "12+ Services",
      avgTime: "5-7 Days"
    },
    {
      id: "legal",
      title: "Legal Documents",
      description: "Affidavits, Character Certificates, Income Certificates",
      icon: FileText,
      color: "text-red-600",
      bgColor: "bg-red-50",
      count: "10+ Services",
      avgTime: "1 Day"
    },
    {
      id: "security",
      title: "Security Clearances",
      description: "Police Verification, Security Licenses, Arms License",
      icon: Shield,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      count: "5+ Services",
      avgTime: "7-10 Days"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">Our Services</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Comprehensive Government Services
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Access all government licenses, permits, and registrations through our unified digital platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {services.map((service, index) => (
            <Card 
              key={service.id} 
              className="group hover:shadow-elevated transition-all duration-300 cursor-pointer border-l-4 border-l-transparent hover:border-l-primary animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-lg ${service.bgColor}`}>
                    <service.icon className={`h-6 w-6 ${service.color}`} />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {service.count}
                  </Badge>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {service.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {service.avgTime}
                  </div>
                  <Button variant="ghost" size="sm" className="p-0 h-auto" asChild>
                    <Link to={`/services/${service.id}`}>
                      View Services
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button size="lg" variant="government" asChild>
            <Link to="/services">
              View All Services
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};
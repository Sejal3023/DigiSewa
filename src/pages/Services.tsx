import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  Building2, 
  Car, 
  UtensilsCrossed, 
  Home, 
  FileText, 
  Shield,
  Clock,
  Star,
  ArrowRight 
} from "lucide-react";
import { Link } from "react-router-dom";

const Services = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "business", label: "Business Licenses" },
    { value: "vehicle", label: "Vehicle Registration" },
    { value: "food", label: "Food & Safety" },
    { value: "property", label: "Property & Construction" },
    { value: "legal", label: "Legal Documents" },
    { value: "security", label: "Security Clearances" }
  ];

  const services = [
    {
      id: "shop-establishment",
      title: "Shop & Establishment License",
      description: "Required for all commercial establishments including shops, offices, and restaurants",
      category: "business",
      icon: Building2,
      processingTime: "2-3 Days",
      fees: "₹500 - ₹2000",
      rating: 4.8,
      documents: ["Identity Proof", "Address Proof", "Property Documents"],
      popular: true
    },
    {
      id: "vehicle-registration",
      title: "New Vehicle Registration",
      description: "Register your new vehicle and get RC book with digital certificate",
      category: "vehicle", 
      icon: Car,
      processingTime: "1-2 Days",
      fees: "₹300 - ₹1500",
      rating: 4.9,
      documents: ["Invoice", "Insurance", "PUC Certificate"],
      popular: true
    },
    {
      id: "fssai-license",
      title: "FSSAI Food License",
      description: "Food Safety and Standards Authority of India license for food businesses",
      category: "food",
      icon: UtensilsCrossed,
      processingTime: "3-5 Days",
      fees: "₹100 - ₹7500",
      rating: 4.7,
      documents: ["Identity Proof", "Address Proof", "Medical Certificate"],
      popular: false
    },
    {
      id: "building-permit",
      title: "Building Construction Permit",
      description: "Permission for new construction or major renovation of buildings",
      category: "property",
      icon: Home,
      processingTime: "5-7 Days", 
      fees: "₹1000 - ₹10000",
      rating: 4.5,
      documents: ["Plot Documents", "Building Plans", "NOC"],
      popular: false
    },
    {
      id: "income-certificate",
      title: "Income Certificate",
      description: "Official document stating annual income for various government schemes",
      category: "legal",
      icon: FileText,
      processingTime: "1 Day",
      fees: "₹50",
      rating: 4.9,
      documents: ["Income Proof", "Identity Proof", "Address Proof"],
      popular: true
    },
    {
      id: "police-verification",
      title: "Police Verification Certificate",
      description: "Character verification certificate from local police station",
      category: "security",
      icon: Shield,
      processingTime: "7-10 Days",
      fees: "₹200",
      rating: 4.6,
      documents: ["Identity Proof", "Address Proof", "Passport Photos"],
      popular: false
    }
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-8 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Government Services</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse and apply for all government licenses, permits, and certificates online
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-4xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, index) => (
              <Card 
                key={service.id}
                className="group hover:shadow-elevated transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <service.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex items-center space-x-2">
                      {service.popular && (
                        <Badge variant="secondary" className="text-xs">
                          Popular
                        </Badge>
                      )}
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{service.rating}</span>
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">
                    {service.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {service.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {service.processingTime}
                      </div>
                      <div className="font-medium text-primary">
                        {service.fees}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Required Documents:</p>
                      <div className="flex flex-wrap gap-1">
                        {service.documents.slice(0, 2).map(doc => (
                          <Badge key={doc} variant="outline" className="text-xs">
                            {doc}
                          </Badge>
                        ))}
                        {service.documents.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{service.documents.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button className="w-full" variant="government" asChild>
                      <Link to={`/apply/${service.id}`}>
                        Apply Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No services found matching your criteria</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Services;
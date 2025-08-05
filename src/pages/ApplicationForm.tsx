import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Upload, 
  CreditCard, 
  Shield, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Building2,
  Car,
  UtensilsCrossed,
  Home,
  Users,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ApplicationForm = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serviceDetails: { [key: string]: any } = {
    "shop-establishment": {
      title: "Shop & Establishment License",
      icon: Building2,
      department: "Municipal Corporation",
      fees: "₹500 - ₹2000",
      processingTime: "2-3 Days",
      description: "Required for all commercial establishments including shops, offices, and restaurants",
      steps: ["Basic Information", "Business Details", "Document Upload", "Payment", "Review & Submit"],
      documents: ["Identity Proof (Aadhaar/PAN)", "Address Proof", "Property Documents", "Partnership Deed (if applicable)"]
    },
    "vehicle-registration": {
      title: "New Vehicle Registration",
      icon: Car,
      department: "Regional Transport Office",
      fees: "₹300 - ₹1500", 
      processingTime: "1-2 Days",
      description: "Register your new vehicle and get RC book with digital certificate",
      steps: ["Personal Details", "Vehicle Information", "Document Upload", "Payment", "Review & Submit"],
      documents: ["Invoice/Bill of Sale", "Insurance Certificate", "PUC Certificate", "Identity Proof"]
    },
    "fssai-license": {
      title: "FSSAI Food Safety License",
      icon: UtensilsCrossed,
      department: "Food & Drug Administration",
      fees: "₹100 - ₹7500",
      processingTime: "3-5 Days",
      description: "Food Safety and Standards Authority of India license for food businesses",
      steps: ["Applicant Details", "Business Information", "Food Category", "Document Upload", "Payment", "Review & Submit"],
      documents: ["Identity Proof", "Address Proof", "Medical Certificate", "Water Test Report"]
    },
    "building-permit": {
      title: "Building Construction Permit",
      icon: Home,
      department: "Urban Development",
      fees: "₹1000 - ₹10000",
      processingTime: "5-7 Days", 
      description: "Permission for new construction or major renovation of buildings",
      steps: ["Owner Details", "Plot Information", "Construction Plans", "Document Upload", "Payment", "Review & Submit"],
      documents: ["Plot Documents", "Building Plans", "NOC from Fire Department", "Architect Certificate"]
    },
    "income-certificate": {
      title: "Income Certificate",
      icon: FileText,
      department: "Revenue Department",
      fees: "₹50",
      processingTime: "1 Day",
      description: "Official document stating annual income for various government schemes",
      steps: ["Personal Details", "Income Information", "Document Upload", "Payment", "Review & Submit"],
      documents: ["Income Proof", "Identity Proof", "Address Proof", "Bank Statements"]
    }
  };

  const service = serviceDetails[serviceId || ""] || serviceDetails["shop-establishment"];
  const totalSteps = service.steps.length;

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API submission
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const applicationId = `${serviceId?.toUpperCase().substring(0, 3)}${new Date().getFullYear()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    toast({
      title: "Application Submitted Successfully!",
      description: `Your application ID is: ${applicationId}`,
    });

    setIsSubmitting(false);
    navigate(`/track?id=${applicationId}`);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Personal/Business Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Enter full name"
                  value={formData.fullName || ""}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="+91-XXXXXXXXXX"
                  value={formData.phone || ""}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email || ""}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="aadhaar">Aadhaar Number *</Label>
                <Input
                  id="aadhaar"
                  placeholder="XXXX-XXXX-XXXX"
                  value={formData.aadhaar || ""}
                  onChange={(e) => handleInputChange("aadhaar", e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Complete Address *</Label>
              <Textarea
                id="address"
                placeholder="Enter complete address with pincode"
                value={formData.address || ""}
                onChange={(e) => handleInputChange("address", e.target.value)}
              />
            </div>
          </div>
        );

      case 2:
        if (serviceId === "vehicle-registration") {
          return (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Vehicle Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleType">Vehicle Type *</Label>
                  <Select onValueChange={(value) => handleInputChange("vehicleType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="car">Car</SelectItem>
                      <SelectItem value="motorcycle">Motorcycle</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="bus">Bus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="engineNumber">Engine Number *</Label>
                  <Input
                    id="engineNumber"
                    placeholder="Engine number"
                    value={formData.engineNumber || ""}
                    onChange={(e) => handleInputChange("engineNumber", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="chassisNumber">Chassis Number *</Label>
                  <Input
                    id="chassisNumber"
                    placeholder="Chassis number"
                    value={formData.chassisNumber || ""}
                    onChange={(e) => handleInputChange("chassisNumber", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="fuelType">Fuel Type *</Label>
                  <Select onValueChange={(value) => handleInputChange("fuelType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="petrol">Petrol</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="cng">CNG</SelectItem>
                      <SelectItem value="electric">Electric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Business Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    placeholder="Enter business name"
                    value={formData.businessName || ""}
                    onChange={(e) => handleInputChange("businessName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="businessType">Business Type *</Label>
                  <Select onValueChange={(value) => handleInputChange("businessType", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail Shop</SelectItem>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="employeeCount">Number of Employees *</Label>
                  <Select onValueChange={(value) => handleInputChange("employeeCount", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-5">1-5</SelectItem>
                      <SelectItem value="6-20">6-20</SelectItem>
                      <SelectItem value="21-50">21-50</SelectItem>
                      <SelectItem value="50+">50+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="annualTurnover">Annual Turnover</Label>
                  <Input
                    id="annualTurnover"
                    placeholder="Enter annual turnover"
                    value={formData.annualTurnover || ""}
                    onChange={(e) => handleInputChange("annualTurnover", e.target.value)}
                  />
                </div>
              </div>
            </div>
          );
        }

      case totalSteps - 2: // Document Upload
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Document Upload</h3>
            <div className="space-y-4">
              {service.documents.map((doc: string, index: number) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{doc}</p>
                        <p className="text-sm text-muted-foreground">
                          Upload clear, readable document (PDF, JPG, PNG - Max 5MB)
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-start space-x-2">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Blockchain Security</p>
                  <p className="text-xs text-muted-foreground">
                    All uploaded documents will be encrypted and stored securely on the blockchain
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case totalSteps - 1: // Payment
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Payment</h3>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Application Fees:</span>
                    <span className="font-semibold">{service.fees}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Processing Fees:</span>
                    <span>₹50</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Platform Fees:</span>
                    <span>₹25</span>
                  </div>
                  <hr />
                  <div className="flex items-center justify-between font-semibold text-lg">
                    <span>Total Amount:</span>
                    <span>₹575</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="h-16">
                <CreditCard className="h-6 w-6 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Credit/Debit Card</p>
                  <p className="text-xs text-muted-foreground">Visa, Mastercard, RuPay</p>
                </div>
              </Button>
              <Button variant="outline" className="h-16">
                <FileText className="h-6 w-6 mr-3" />
                <div className="text-left">
                  <p className="font-medium">UPI Payment</p>
                  <p className="text-xs text-muted-foreground">GPay, PhonePe, Paytm</p>
                </div>
              </Button>
            </div>
          </div>
        );

      case totalSteps: // Review & Submit
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Review & Submit</h3>
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Application Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Service:</span>
                        <p>{service.title}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Department:</span>
                        <p>{service.department}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Applicant:</span>
                        <p>{formData.fullName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Processing Time:</span>
                        <p>{service.processingTime}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the Terms & Conditions and Privacy Policy
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="authentic" />
                    <Label htmlFor="authentic" className="text-sm">
                      I declare that all information provided is authentic and correct
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-8 pb-20">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-6">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-3">
              <service.icon className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">{service.title}</h1>
                <p className="text-muted-foreground">{service.department}</p>
              </div>
            </div>
          </div>

          {/* Service Info */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Processing: {service.processingTime}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Fees: {service.fees}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{service.department}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Indicator */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
                  <span className="text-sm text-muted-foreground">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
                </div>
                <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
              </div>
              <div className="grid grid-cols-5 gap-2">
                {service.steps.map((step: string, index: number) => (
                  <div key={index} className="text-center">
                    <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-medium ${
                      index + 1 === currentStep 
                        ? "bg-primary text-primary-foreground" 
                        : index + 1 < currentStep 
                          ? "bg-success text-success-foreground" 
                          : "bg-muted text-muted-foreground"
                    }`}>
                      {index + 1 < currentStep ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <p className="text-xs text-muted-foreground">{step}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Form Content */}
          <Card className="mb-6">
            <CardContent className="p-6">
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            {currentStep < totalSteps ? (
              <Button variant="government" onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button 
                variant="government" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
                <CheckCircle2 className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ApplicationForm;
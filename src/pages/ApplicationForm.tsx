import { useState,useEffect } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { PaymentModal } from "@/components/payment/PaymentModal";
import { paymentService } from "@/services/paymentService";
import documentService from "@/services/documentService";
import { apiService } from "@/services/apiService";

const ApplicationForm = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'upi' | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [selectedDocs, setSelectedDocs] = useState<Record<string, File | null>>({});
  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);
  const [eligibilityCheck, setEligibilityCheck] = useState<{
    checked: boolean;
    canApply: boolean;
    reason?: string;
    loading: boolean;
  }>({ checked: false, canApply: false, loading: true });

  // NEW: states for real application data
const [timeline, setTimeline] = useState<any[]>([]);
const [documents, setDocuments] = useState<any[]>([]);
const [currentStageInfo, setCurrentStageInfo] = useState<any>(null);
const [applicationProgress, setApplicationProgress] = useState<number>(0);


  const serviceDetails: { [key: string]: any } = {
    "shop-establishment": {
      title: "Shop & Establishment License",
      icon: Building2,
      department: "Municipal Corporation",
      fees: "₹500 - ₹2000",
      processingTime: "2-3 Days",
      description: "Required for all commercial establishments including shops, offices, and restaurants",
      steps: ["Basic Information", "Business Details", "Document Upload", "Payment", "Review & Submit"],
      documents: ["Identity Proof (Aadhaar/PAN)", "Address Proof", "Business Registration","Property Documents", "Partnership Deed (if applicable)"]
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
      documents: ["Identity Proof", "Address Proof","Food Business Details", "Medical Certificate", "Water Test Report","Kitchen Layout / Photos"]
    },
    "building-permit": {
      title: "Building Construction Permit",
      icon: Home,
      department: "Urban Development",
      fees: "₹1000 - ₹10000",
      processingTime: "5-7 Days", 
      description: "Permission for new construction or major renovation of buildings",
      steps: ["Owner Details", "Plot Information", "Construction Plans", "Document Upload", "Payment", "Review & Submit"],
      documents: ["Plot Documents", "Building Plans", "NOC from Fire Department", "Architect Certificate","Zoning / Land Use Certificate", "Environmental Clearance (if applicable)"]
    },
    "income-certificate": {
      title: "Income Certificate",
      icon: FileText,
      department: "Revenue Department",
      fees: "₹50",
      processingTime: "1 Day",
      description: "Official document stating annual income for various government schemes",
      steps: ["Personal Details", "Income Information", "Document Upload", "Payment", "Review & Submit"],
      documents: ["Income Proof", "Identity Proof", "Address Proof", "Bank Statements","Family Details (if required)"]
    },
    "police-verification": {
    title: "Police Verification Certificate",
    icon: Shield,
    department: "Police Department",
    fees: "₹100",
    processingTime: "3-5 Days",
    description: "Character verification certificate required for jobs, passports, and tenancy",
    steps: ["Personal Details", "Address Details", "Document Upload", "Payment", "Review & Submit"],
    documents: ["Identity Proof", "Address Proof", "Passport Photo", "Purpose Letter / Application Form"]
    }
  };

  const service = serviceDetails[serviceId || ""] || serviceDetails["shop-establishment"];
  const totalSteps = service.steps.length;
  const totalAmount = paymentService.calculateTotal(service.fees);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const fetchApplicationDetails = async (id: string) => {
  try {
    const res = await fetch(`/applications/track/${id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
      }
    });
    if (!res.ok) throw new Error("Failed to fetch application details");
    const data = await res.json();
    
    // Fill form fields
    setFormData(data.data.application);
    setTimeline(data.data.timeline || []);
    setDocuments(data.data.documents || []);
    setCurrentStageInfo(data.data.current_stage);
    setApplicationProgress(data.data.progress || 0);
  } catch (err: any) {
    toast({
      title: "Error fetching application",
      description: err?.message || "Could not load application data",
      variant: "destructive",
    });
  }
};

  // Check if user already has this license (block direct URL access)
  useEffect(() => {
    const checkExistingLicense = async () => {
      if (!serviceId || !user) return;

      try {
        const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("/api/licenses/user/certificates", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // Check if user already has this license
            const hasLicense = data.data.some((cert: any) => {
              const serviceNameToType: { [key: string]: string } = {
                'Shop & Establishment License': 'shop-establishment',
                'Vehicle Registration Certificate': 'vehicle-registration',
                'Driver\'s License': 'drivers-license',
                'Food Safety License (FSSAI)': 'fssai-license',
                'Building Permit License': 'building-permit',
                'Income Certificate': 'income-certificate',
                'Police Verification Certificate': 'police-verification'
              };
              return serviceNameToType[cert.service_name] === serviceId;
            });

            if (hasLicense) {
              // User already has this license, redirect to services page
              toast({
                title: "License Already Issued",
                description: "You already have this license. Browse other available services.",
                variant: "destructive",
              });
              navigate('/services');
              return;
            }
          }
        }
      } catch (error) {
        console.error('Failed to check existing licenses:', error);
      }
    };

    checkExistingLicense();
  }, [serviceId, user, navigate]);

  // Check user eligibility for this license type
  useEffect(() => {
    const checkEligibility = async () => {
      if (!serviceId) return;

      try {
        setEligibilityCheck(prev => ({ ...prev, loading: true }));

        const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
        if (!token) {
          setEligibilityCheck({
            checked: true,
            canApply: false,
            reason: "Please log in to apply for licenses",
            loading: false
          });
          return;
        }

        // Call the backend eligibility check endpoint
        const response = await fetch(`/api/licenses/check-eligibility/${serviceId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to check eligibility`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Eligibility check failed');
        }

        setEligibilityCheck({
          checked: true,
          canApply: result.canApply,
          reason: result.reason,
          loading: false
        });

      } catch (error: any) {
        console.error('Eligibility check failed:', error);
        setEligibilityCheck({
          checked: true,
          canApply: false,
          reason: error.message || "Failed to verify eligibility. Please try again.",
          loading: false
        });
      }
    };

    checkEligibility();
  }, [serviceId]);

  useEffect(() => {
    if (submittedAppId) {
      fetchApplicationDetails(submittedAppId);
    }
  }, [submittedAppId]);

  const handleNext = () => {
    let isValid = true;
    let errorMessage = "Please fill all required fields."; // Default error message

    if (currentStep === 1) {
      // Step 1: Personal / Business Info - Always required for all services
      const requiredFields = ["fullName", "phone", "email", "aadhaar", "address"];
      const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim() === "");

      if (missingFields.length > 0) {
        const fieldNames = missingFields.map(field => {
          switch(field) {
            case "fullName": return "Full Name";
            case "phone": return "Phone Number";
            case "email": return "Email Address";
            case "aadhaar": return "Aadhaar Number";
            case "address": return "Complete Address";
            default: return field;
          }
        });
        errorMessage = `Please fill the following required fields: ${fieldNames.join(", ")}`;
        isValid = false;
      }
    }

    if (currentStep === 2) {
      // Step 2: Service-specific information
      switch(serviceId) {
        case "vehicle-registration":
          const vehicleFields = ["vehicleType", "engineNumber", "chassisNumber", "fuelType"];
          const missingVehicleFields = vehicleFields.filter(field => !formData[field] || formData[field].trim() === "");
          if (missingVehicleFields.length > 0) {
            const fieldNames = missingVehicleFields.map(field => {
              switch(field) {
                case "vehicleType": return "Vehicle Type";
                case "engineNumber": return "Engine Number";
                case "chassisNumber": return "Chassis Number";
                case "fuelType": return "Fuel Type";
                default: return field;
              }
            });
            errorMessage = `Please fill all required vehicle information: ${fieldNames.join(", ")}`;
            isValid = false;
          }
          break;

        case "fssai-license":
          const fssaiFields = ["businessName", "businessType"];
          const missingFssaiFields = fssaiFields.filter(field => !formData[field] || formData[field].trim() === "");
          if (missingFssaiFields.length > 0) {
            errorMessage = "Please fill all required food business information fields.";
            isValid = false;
          }
          break;

        case "building-permit":
          const buildingFields = ["businessName", "businessType"];
          const missingBuildingFields = buildingFields.filter(field => !formData[field] || formData[field].trim() === "");
          if (missingBuildingFields.length > 0) {
            errorMessage = "Please fill all required building permit information fields.";
            isValid = false;
          }
          break;

        case "income-certificate":
          const incomeFields = ["businessName", "businessType", "annualTurnover"];
          const missingIncomeFields = incomeFields.filter(field => !formData[field] || formData[field].trim() === "");
          if (missingIncomeFields.length > 0) {
            errorMessage = "Please fill all required income certificate information fields.";
            isValid = false;
          }
          break;

        case "police-verification":
          const policeFields = ["businessName", "businessType"];
          const missingPoliceFields = policeFields.filter(field => !formData[field] || formData[field].trim() === "");
          if (missingPoliceFields.length > 0) {
            errorMessage = "Please fill all required police verification information fields.";
            isValid = false;
          }
          break;

        default: // shop-establishment and other business licenses
          const businessFields = ["businessName", "businessType", "employeeCount"];
          const missingBusinessFields = businessFields.filter(field => !formData[field] || formData[field].trim() === "");
          if (missingBusinessFields.length > 0) {
            const fieldNames = missingBusinessFields.map(field => {
              switch(field) {
                case "businessName": return "Business Name";
                case "businessType": return "Business Type";
                case "employeeCount": return "Number of Employees";
                default: return field;
              }
            });
            errorMessage = `Please fill all required business information: ${fieldNames.join(", ")}`;
            isValid = false;
          }
      }
    }

    // Step 3: Food category for FSSAI license
    if (currentStep === 3 && serviceId === "fssai-license") {
      if (!formData.foodCategory || formData.foodCategory.trim() === "") {
        errorMessage = "Please select a food category.";
        isValid = false;
      }
    }

    // Show validation error
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    // Proceed to next step
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };




  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePaymentMethodSelect = (method: 'card' | 'upi') => {
    setSelectedPaymentMethod(method);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (txnId: string) => {
    setTransactionId(txnId);
    setPaymentCompleted(true);
    setShowPaymentModal(false);
    toast({
      title: "Payment Successful!",
      description: `Transaction ID: ${txnId}`,
    });
    // Auto advance to next step
    setCurrentStep(currentStep + 1);
  };

  const handleSubmit = async () => {
    if (!paymentCompleted) {
      toast({
        title: "Payment Required",
        description: "Please complete the payment to submit your application",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    try {
      const updatedformData = {
      ...formData,
      businessRegistrationNumber: formData.businessRegistrationNumber || "",
      foodCategory: formData.foodCategory || "",
      plotDetails: formData.plotDetails || "",
      };

     const createRes = await apiService.createApplication({
        license_type: serviceId || "",
        application_data: updatedformData,
       
               // optional
      });

      const appId = createRes?.application?.id || createRes?.id;
      if (!appId) throw new Error("Failed to create application");

      setSubmittedAppId(String(appId)); // <-- store app ID for download

      const uploadPromises: Promise<any>[] = [];
      Object.entries(selectedDocs).forEach(([docLabel, file]) => {
        if (file) {
          uploadPromises.push(
            documentService.uploadDocumentFile(file, {
              departmentId: serviceId || "general",
              applicationId: String(appId),
              name: docLabel,
              accessPolicy: "read",
            })
          );
        }
      });

      if (uploadPromises.length) {
        await Promise.all(uploadPromises);
      }

      toast({
        title: "Application Submitted Successfully!",
        description: `Your application ID is: ${appId}`,
      });

      
      navigate(`/track?id=${appId}`);
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

const handleDownloadPDF = async () => {
  if (!submittedAppId) {
    toast({
      title: "Cannot download",
      description: "Application ID not found",
      variant: "destructive",
    });
    return;
  }

  const token = localStorage.getItem("auth_token") || localStorage.getItem("token");

  try {
    // Use the correct API route with /api prefix
    const res = await fetch(`/api/applications/track/${submittedAppId}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg || `HTTP ${res.status}: ${res.statusText}`);
    }

    const ct = res.headers.get("Content-Type") || "";
    // More flexible content type checking
    if (!ct.toLowerCase().includes("pdf") && !ct.toLowerCase().includes("octet-stream")) {
      console.warn('Received non-PDF file type:', ct);
      // Continue anyway as it might still be a PDF
    }

    // ✅ PDF blob download
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `application_${submittedAppId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    // ✅ Show success toast
    toast({
      title: "Download successful!",
      description: "PDF downloaded successfully",
    });

    // ✅ Navigate to track page after short delay (2 seconds)
    setTimeout(() => {
      navigate(`/track?id=${submittedAppId}`);
    }, 2000);

  } catch (err: any) {
    console.error("PDF download error", err);
    toast({
      title: "Download failed",
      description: err?.message || "Unable to download application PDF",
      variant: "destructive",
    });
  }
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

      case 3:
        if (serviceId === "fssai-license") {
          return (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Food Category</h3>
              <div>
                <Label htmlFor="foodCategory">Food Category *</Label>
                <Select
                  onValueChange={(value) => handleInputChange("foodCategory", value)}
                  value={formData.foodCategory || ""}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select food category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="veg">Vegetarian</SelectItem>
                    <SelectItem value="non-veg">Non-Vegetarian</SelectItem>
                    <SelectItem value="packaged">Packaged Foods</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        }
        // Fall through to document upload if not fssai-license

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
                        {selectedDocs[doc] && (
                          <p className="text-xs mt-1">Selected: {selectedDocs[doc]?.name}</p>
                        )}
                      </div>
                      <div>
                        <input
                          id={`file-${index}`}
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setSelectedDocs((prev) => ({ ...prev, [doc]: file }));
                          }}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById(`file-${index}`)?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {selectedDocs[doc] ? 'Change' : 'Upload'}
                        </Button>
                      </div>
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
                    <span>₹{totalAmount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {paymentCompleted ? (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">Payment Completed Successfully!</p>
                      <p className="text-sm text-green-600">Transaction ID: {transactionId}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-16"
                  onClick={() => handlePaymentMethodSelect('card')}
                >
                  <CreditCard className="h-6 w-6 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">Credit/Debit Card</p>
                    <p className="text-xs text-muted-foreground">Visa, Mastercard, RuPay</p>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-16"
                  onClick={() => handlePaymentMethodSelect('upi')}
                >
                  <FileText className="h-6 w-6 mr-3" />
                  <div className="text-left">
                    <p className="font-medium">UPI Payment</p>
                    <p className="text-xs text-muted-foreground">GPay, PhonePe, Paytm</p>
                  </div>
                </Button>
              </div>
            )}
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
                   {/* --- Download PDF Button --- */}
                 {submittedAppId && (
              <Button variant="outline" onClick={handleDownloadPDF}>
                Download Application PDF
              </Button>
                  )}
                  
                               {/* --- Timeline --- */}
{timeline.length > 0 && (
  <Card className="mt-4">
    <CardContent className="p-4">
      <h4 className="font-medium mb-2">Application Timeline</h4>
      <ul className="space-y-2 text-sm">
        {timeline.map((event, idx) => (
          <li key={idx} className="flex justify-between">
            <span>{event.status.replace("_", " ")}</span>
            <span className="text-muted-foreground">{new Date(event.created_at).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
)}

{/* --- Uploaded Documents --- */}
{documents.length > 0 && (
  <Card className="mt-4">
    <CardContent className="p-4">
      <h4 className="font-medium mb-2">Uploaded Documents</h4>
      {documents.map((doc) => (
        <div key={doc.id} className="flex justify-between items-center p-2 border rounded mb-2">
          <span>{doc.filename || doc.ipfs_hash}</span>
          <a
            href={`https://gateway.pinata.cloud/ipfs/${doc.ipfs_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            View
          </a>
        </div>
      ))}
    </CardContent>
  </Card>
)}

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

          {/* Eligibility Check */}
          {eligibilityCheck.checked && !eligibilityCheck.loading && (
            <Card className={`mb-6 ${eligibilityCheck.canApply ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  {eligibilityCheck.canApply ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <h3 className={`font-semibold ${eligibilityCheck.canApply ? 'text-green-800' : 'text-red-800'}`}>
                      {eligibilityCheck.canApply ? 'Eligible to Apply' : 'Not Eligible to Apply'}
                    </h3>
                    <p className={`text-sm ${eligibilityCheck.canApply ? 'text-green-600' : 'text-red-600'}`}>
                      {eligibilityCheck.reason}
                    </p>
                    {!eligibilityCheck.canApply && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={() => navigate('/dashboard')}
                      >
                        Go to Dashboard
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading Eligibility Check */}
          {eligibilityCheck.loading && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <p className="text-sm text-muted-foreground">Checking eligibility...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Content */}
          {eligibilityCheck.checked && eligibilityCheck.canApply && (
            <Card className="mb-6">
              <CardContent className="p-6">
                {renderStepContent()}
              </CardContent>
            </Card>
          )}

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
                 disabled={isSubmitting || !paymentCompleted}
               >
                 {isSubmitting ? "Submitting..." : "Submit Application"}
                 <CheckCircle2 className="h-4 w-4 ml-2" />
               </Button>
             )}
           </div>
         </div>
        

       </main>
       
       <PaymentModal
         isOpen={showPaymentModal}
         onClose={() => setShowPaymentModal(false)}
         paymentMethod={selectedPaymentMethod}
         amount={totalAmount}
         onPaymentSuccess={handlePaymentSuccess}
       />
       
       <Footer />
     </div>
   );
 };

export default ApplicationForm;

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Phone, Mail, MapPin } from "lucide-react";
import governmentLogo from "@/assets/government-logo.png";

export const GovernmentBranding = () => {
  return (
    <div className="bg-gradient-to-r from-orange-500 via-white to-green-500 py-2 border-b-2 border-primary">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Left: Government Emblems */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img src={governmentLogo} alt="Government of India" className="h-8 w-8" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-gray-800">Government of India</span>
                <span className="text-xs text-gray-600">भारत सरकार</span>
              </div>
            </div>
            
            <Badge variant="outline" className="bg-white/90 text-primary border-primary text-xs">
              Digital India Initiative
            </Badge>
          </div>

          {/* Right: Important Links */}
          <div className="hidden md:flex items-center space-x-3 text-xs">
            <Button variant="ghost" size="sm" className="text-gray-700 hover:text-primary p-1 h-auto" asChild>
              <a href="https://www.india.gov.in" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                India.gov.in
              </a>
            </Button>
            
            <Button variant="ghost" size="sm" className="text-gray-700 hover:text-primary p-1 h-auto" asChild>
              <a href="https://mygov.in" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 mr-1" />
                MyGov.in
              </a>
            </Button>
            
            <Button variant="ghost" size="sm" className="text-gray-700 hover:text-primary p-1 h-auto" asChild>
              <a href="tel:1800-123-4567">
                <Phone className="h-3 w-3 mr-1" />
                1800-123-4567
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
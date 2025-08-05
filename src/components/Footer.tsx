import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Youtube } from "lucide-react";
import governmentLogo from "@/assets/government-logo.png";

export const Footer = () => {
  const quickLinks = [
    { href: "/services", label: "All Services" },
    { href: "/applications", label: "My Applications" },
    { href: "/track", label: "Track Status" },
    { href: "/help", label: "Help Center" },
    { href: "/faq", label: "FAQ" },
  ];

  const legalLinks = [
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/accessibility", label: "Accessibility" },
    { href: "/rtI", label: "RTI" },
    { href: "/sitemap", label: "Sitemap" },
  ];

  const departments = [
    { href: "/dept/municipal", label: "Municipal Corporation" },
    { href: "/dept/transport", label: "Transport Department" },
    { href: "/dept/food", label: "Food & Drug Administration" },
    { href: "/dept/police", label: "Police Department" },
    { href: "/dept/revenue", label: "Revenue Department" },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo and About */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img src={governmentLogo} alt="Government Logo" className="h-12 w-12" />
              <div>
                <h3 className="font-bold text-lg">Blockchain Gov System</h3>
                <p className="text-sm text-primary-foreground/80">Digital India Initiative</p>
              </div>
            </div>
            <p className="text-sm text-primary-foreground/80 leading-relaxed">
              Blockchain-Based Digital Government License & Registration System - Revolutionary 
              government services with cryptographic security and smart contract automation.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4" />
                <span>Helpline: 1800-XXX-XXXX</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4" />
                <span>support@udlrp.gov.in</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Departments */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Departments</h4>
            <ul className="space-y-2">
              {departments.map((dept) => (
                <li key={dept.href}>
                  <Link 
                    to={dept.href}
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {dept.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Legal & Policies</h4>
            <ul className="space-y-2 mb-6">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    to={link.href}
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            
            {/* Social Media */}
            <div>
              <h5 className="font-semibold mb-3">Follow Us</h5>
              <div className="flex space-x-3">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary-foreground/80 hover:text-primary-foreground">
                  <Facebook className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary-foreground/80 hover:text-primary-foreground">
                  <Twitter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary-foreground/80 hover:text-primary-foreground">
                  <Linkedin className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary-foreground/80 hover:text-primary-foreground">
                  <Youtube className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-primary-foreground/20" />

        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-primary-foreground/80">
            © {new Date().getFullYear()} Government of India. All rights reserved.
          </div>
          <div className="flex items-center space-x-4 text-sm text-primary-foreground/80">
            <span>Last Updated: {new Date().toLocaleDateString()}</span>
            <Separator orientation="vertical" className="h-4 bg-primary-foreground/20" />
            <span>Version 2.1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
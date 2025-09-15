import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Clock, MessageCircle, FileText, Users, HeadphonesIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Help = () => {
  const { t } = useLanguage();

  const contactMethods = [
    {
      icon: Phone,
      title: "Phone Support",
      description: "Call our helpline for immediate assistance",
      contact: "1800-XXX-XXXX",
      hours: "9:00 AM - 6:00 PM (Mon-Fri)"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us your queries via email",
      contact: "support@gov.in",
      hours: "Response within 24 hours"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team",
      contact: "Available on website",
      hours: "9:00 AM - 6:00 PM (Mon-Fri)"
    }
  ];

  const faqItems = [
    {
      question: "How to track my application status?",
      answer: "You can track your application status by visiting the 'Track Application' page and entering your application ID."
    },
    {
      question: "What documents are required for license application?",
      answer: "Required documents vary by license type. Please check the specific service page for detailed requirements."
    },
    {
      question: "How long does it take to process applications?",
      answer: "Processing time varies by license type, typically ranging from 7-30 business days depending on the complexity."
    },
    {
      question: "Can I modify my application after submission?",
      answer: "Limited modifications are allowed before the application moves to processing stage. Contact support for assistance."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">Help & Support</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get assistance with your applications, find answers to common questions, or contact our support team
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">User Guide</h3>
              <p className="text-sm text-muted-foreground mb-4">Step-by-step instructions</p>
              <Button variant="outline" size="sm">View Guide</Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Community Forum</h3>
              <p className="text-sm text-muted-foreground mb-4">Connect with other users</p>
              <Button variant="outline" size="sm">Join Forum</Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <HeadphonesIcon className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Video Tutorials</h3>
              <p className="text-sm text-muted-foreground mb-4">Watch how-to videos</p>
              <Button variant="outline" size="sm">Watch Now</Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Service Status</h3>
              <p className="text-sm text-muted-foreground mb-4">Check system status</p>
              <Button variant="outline" size="sm">Check Status</Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Methods */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Contact Support</h2>
            <div className="space-y-4">
              {contactMethods.map((method, index) => {
                const IconComponent = method.icon;
                return (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{method.title}</h3>
                          <p className="text-muted-foreground text-sm mb-2">{method.description}</p>
                          <p className="font-medium text-primary">{method.contact}</p>
                          <p className="text-xs text-muted-foreground">{method.hours}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Office Location */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Office Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Government License Bureau<br />
                  Central Secretariat Building<br />
                  New Delhi - 110001<br />
                  India
                </p>
              </CardContent>
            </Card>
          </div>

          {/* FAQ and Contact Form */}
          <div>
            {/* FAQ Section */}
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4 mb-8">
              {faqItems.map((faq, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-muted-foreground text-sm">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="First Name" />
                  <Input placeholder="Last Name" />
                </div>
                <Input placeholder="Email Address" type="email" />
                <Input placeholder="Subject" />
                <Textarea placeholder="Describe your issue or question..." className="min-h-[120px]" />
                <Button className="w-full">Send Message</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Help;
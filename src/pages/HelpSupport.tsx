import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Clock, MessageCircle, FileText, Users, HeadphonesIcon, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const HelpSupport = () => {
  const contactMethods = [
    {
      icon: Phone,
      title: "Phone Support",
      description: "Call our helpline for immediate assistance",
      contact: "1800-XXX-XXXX",
      hours: "9:00 AM - 6:00 PM (Mon-Fri)",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us your queries via email",
      contact: "support@gov.in",
      hours: "Response within 24 hours",
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team",
      contact: "Available on website",
      hours: "9:00 AM - 6:00 PM (Mon-Fri)",
    },
  ];

  const faqItems = [
    {
      question: "How to track my application status?",
      answer:
        "You can track your application status by visiting the 'Track Application' page and entering your application ID.",
    },
    {
      question: "What documents are required for license application?",
      answer:
        "Required documents vary by license type. Please check the specific service page for detailed requirements.",
    },
    {
      question: "How long does it take to process applications?",
      answer:
        "Processing time varies by license type, typically ranging from 7-30 business days depending on the complexity.",
    },
    {
      question: "Can I modify my application after submission?",
      answer:
        "Limited modifications are allowed before the application moves to processing stage. Contact support for assistance.",
    },
  ];

  // --- Form state and handler ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showForum, setShowForum] = useState(false);
  const [showTutorials, setShowTutorials] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:5002/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ firstName, lastName, email, subject, message }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send message");

      toast({
        title: "Message Sent Successfully",
        description: "Thank you for contacting us. We'll get back to you soon.",
      });

      // Reset form fields
      setFirstName("");
      setLastName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

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
              <Button variant="outline" size="sm" onClick={() => setShowUserGuide(true)}>View Guide</Button>
              
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Community Forum</h3>
              <p className="text-sm text-muted-foreground mb-4">Connect with other users</p>
              <Button variant="outline" size="sm" onClick={() => setShowForum(true)}>Join Forum</Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <HeadphonesIcon className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Video Tutorials</h3>
              <p className="text-sm text-muted-foreground mb-4">Watch how-to videos</p>
              <Button variant="outline" size="sm" onClick={() => setShowTutorials(true)}>Watch Now</Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Service Status</h3>
              <p className="text-sm text-muted-foreground mb-4">Check system status</p>
              <Button variant="outline" size="sm" onClick={() => setShowStatus(true)}>Check Status</Button>
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
                  <Input placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  <Input placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <Input placeholder="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <Input placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
                <Textarea placeholder="Describe your issue or question..." className="min-h-[120px]" value={message} onChange={(e) => setMessage(e.target.value)} />
                <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
        {/* User Guide Dialog */}
      <Dialog open={showUserGuide} onOpenChange={setShowUserGuide}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Guide - Step-by-Step Instructions</DialogTitle>
            <DialogDescription>Complete guide to using the license portal</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">1. Creating an Account</h3>
              <p className="text-muted-foreground">Register with your email and phone number. Verify your email through the link sent to your inbox.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">2. Applying for a License</h3>
              <p className="text-muted-foreground">Navigate to Services, select the license type, fill out the application form, and upload required documents.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">3. Document Requirements</h3>
              <p className="text-muted-foreground">Ensure all documents are clear, in PDF/JPG format, and under 5MB. Common documents include ID proof, address proof, and photographs.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">4. Payment Process</h3>
              <p className="text-muted-foreground">Pay the application fee using UPI, card, or net banking. Keep the transaction ID for reference.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">5. Tracking Your Application</h3>
              <p className="text-muted-foreground">Use the Track Application page with your application ID to check status updates in real-time.</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">6. Receiving Your License</h3>
              <p className="text-muted-foreground">Once approved, download your digital license from the Dashboard or receive it via registered mail.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Community Forum Dialog */}
      <Dialog open={showForum} onOpenChange={setShowForum}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Community Forum</DialogTitle>
            <DialogDescription>Connect with other users and share experiences</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">Join our community forum to:</p>
            <ul className="space-y-2 ml-6 list-disc text-muted-foreground">
              <li>Ask questions and get answers from experienced users</li>
              <li>Share tips and best practices</li>
              <li>Report issues and suggest improvements</li>
              <li>Stay updated with the latest announcements</li>
            </ul>
            <div className="bg-muted p-4 rounded-lg mt-4">
              <p className="text-sm">Our community forum is coming soon! In the meantime, you can reach out to us through the contact form or email support@gov.in</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Tutorials Dialog */}
<Dialog open={showTutorials} onOpenChange={setShowTutorials}>
  <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-auto">
    <DialogHeader className="text-center pb-6">
      <DialogTitle className="text-2xl font-bold text-primary">Video Tutorials</DialogTitle>
      <DialogDescription className="text-base">Watch step-by-step video guides to get started</DialogDescription>
    </DialogHeader>

    <div className="grid gap-8 py-4">
      {/* Video Card 1 */}
      <Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2 text-primary">
                How to Register and Create Your Account
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration: 3 minutes
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-xl">
            <video
              controls
              className="w-full h-64 rounded-lg shadow-md"
              preload="metadata"
              poster="/placeholder.svg"
            >
              <source src="/registeration and login .mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </CardContent>
      </Card>

      {/* Video Card 2 */}
      <Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="bg-primary/10 p-3 rounded-lg flex-shrink-0">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2 text-primary">
                Applying for Your First License
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Duration: 5 minutes
              </p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-4 rounded-xl">
            <video
              controls
              className="w-full h-64 rounded-lg shadow-md"
              preload="metadata"
              poster="/placeholder.svg"
            >
              <source src="/license applying.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </CardContent>
      </Card>
    </div>

    <div className="mt-6 p-4 bg-primary/5 rounded-lg text-center">
      <p className="text-sm text-muted-foreground">
        Need more help? Check out our <span className="font-medium text-primary">User Guide</span> or contact our support team.
      </p>
    </div>
  </DialogContent>
</Dialog>


      {/* Service Status Dialog */}
      <Dialog open={showStatus} onOpenChange={setShowStatus}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>System Status</DialogTitle>
            <DialogDescription>Current status of all services</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <h3 className="font-semibold">Application Portal</h3>
                  <p className="text-sm text-muted-foreground">All systems operational</p>
                </div>
              </div>
              <span className="text-green-500 font-medium">Operational</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <h3 className="font-semibold">Payment Gateway</h3>
                  <p className="text-sm text-muted-foreground">Processing transactions normally</p>
                </div>
              </div>
              <span className="text-green-500 font-medium">Operational</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <h3 className="font-semibold">Document Upload</h3>
                  <p className="text-sm text-muted-foreground">File uploads working properly</p>
                </div>
              </div>
              <span className="text-green-500 font-medium">Operational</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <h3 className="font-semibold">Blockchain Verification</h3>
                  <p className="text-sm text-muted-foreground">Certificate verification active</p>
                </div>
              </div>
              <span className="text-green-500 font-medium">Operational</span>
            </div>

            <div className="mt-6 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm">Last updated: {new Date().toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">All services are running smoothly. If you experience any issues, please contact support.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HelpSupport;

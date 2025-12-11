import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      toast({
        title: "Message sent!",
        description: "Thank you for contacting HappiKid. We'll get back to you soon.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-brand-sage">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-headline mb-4 text-brand-evergreen">Contact HappiKid</h1>
          <p className="text-xl max-w-2xl mx-auto text-brand-evergreen">
            Have questions about our childcare directory? Need help finding the perfect provider? 
            We're here to help you every step of the way.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <Card className="rounded-2xl bg-brand-white border-brand-evergreen/10">
              <CardHeader>
                <CardTitle className="flex items-center text-brand-evergreen">
                  <Mail className="h-5 w-5 mr-2 text-action-clay" />
                  Get in Touch
                </CardTitle>
                <CardDescription className="text-text-muted">
                  Reach out to us directly or use the contact form
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 mt-1 text-action-clay" />
                  <div>
                    <p className="font-medium text-brand-evergreen">Email</p>
                    <a 
                      href="mailto:adam@happikid.com" 
                      className="text-action-clay hover:underline"
                    >
                      adam@happikid.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 mt-1 text-brand-evergreen" />
                  <div>
                    <p className="font-medium text-brand-evergreen">Service Area</p>
                    <p className="text-text-muted">
                      NYC Metro Area<br />
                      New York, New Jersey, Connecticut
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 mt-1 text-action-teal" />
                  <div>
                    <p className="font-medium text-brand-evergreen">Response Time</p>
                    <p className="text-text-muted">
                      We typically respond within 24 hours
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand-evergreen/10">
                  <p className="font-medium mb-2 text-brand-evergreen">Adam Krouse</p>
                  <p className="text-sm text-text-muted">
                    Founder & CEO<br />
                    Connecting families with quality childcare across the tri-state area
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Quick Links */}
            <Card className="mt-6 rounded-2xl bg-brand-white border-brand-evergreen/10">
              <CardHeader>
                <CardTitle className="font-headline text-brand-evergreen">Quick Help</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-sm text-brand-evergreen">Provider Questions?</p>
                    <p className="text-sm text-text-muted">Visit our Provider section for enrollment info</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-brand-evergreen">Search Issues?</p>
                    <p className="text-sm text-text-muted">Try adjusting filters or browse by borough</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-brand-evergreen">Coverage Area?</p>
                    <p className="text-sm text-text-muted">We serve 23 counties across NY, NJ, and CT</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl bg-brand-white border-brand-evergreen/10">
              <CardHeader>
                <CardTitle className="font-headline text-brand-evergreen">Send us a Message</CardTitle>
                <CardDescription className="text-text-muted">
                  Tell us how we can help you find the perfect childcare solution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="What can we help you with?"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us more about your childcare needs, questions, or feedback..."
                      rows={6}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-center text-text-muted">
                    By submitting this form, you agree to be contacted by HappiKid regarding your inquiry.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 rounded-2xl shadow-sm p-8 bg-brand-white">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-headline mb-2 text-brand-evergreen">Why Choose HappiKid?</h2>
            <p className="text-text-muted">Trusted by families across the NYC metropolitan area</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold mb-2 text-action-clay">510+</div>
              <div className="text-sm text-text-muted">Verified Providers</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2 text-brand-evergreen">23</div>
              <div className="text-sm text-text-muted">Counties Covered</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2 text-action-clay">3</div>
              <div className="text-sm text-text-muted">States Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2 text-brand-evergreen">100%</div>
              <div className="text-sm text-text-muted">Authentic Data</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

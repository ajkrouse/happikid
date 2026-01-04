import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MessageSquare, Calendar, DollarSign, Clock, Send, LogIn } from "lucide-react";
import type { Provider } from "@shared/schema";

interface MessageProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: Provider;
}

const MESSAGE_TEMPLATES = [
  {
    id: "tour_request",
    label: "Schedule a Tour",
    icon: Calendar,
    template: "Hi! I'm interested in scheduling a tour of your program. When would be a good time to visit?"
  },
  {
    id: "rates_inquiry",
    label: "Ask About Rates",
    icon: DollarSign,
    template: "Hello! I'd like to learn more about your pricing and any available openings. Could you share your current rates?"
  },
  {
    id: "availability",
    label: "Check Availability",
    icon: Clock,
    template: "Hi! I'm looking for childcare and wanted to check if you have any availability. My child is [AGE] years old."
  },
  {
    id: "general",
    label: "General Question",
    icon: MessageSquare,
    template: ""
  }
];

export function MessageProviderModal({ isOpen, onClose, provider }: MessageProviderModalProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [messageType, setMessageType] = useState("tour_request");
  const [message, setMessage] = useState(MESSAGE_TEMPLATES[0].template);
  const [childAge, setChildAge] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const sendMessageMutation = useMutation({
    mutationFn: async (data: {
      providerId: number;
      message: string;
      messageType: string;
      childAge?: string;
      parentEmail?: string;
      parentPhone?: string;
    }) => {
      return apiRequest('POST', '/api/inquiries', data);
    },
    onSuccess: () => {
      toast({
        title: "Message sent!",
        description: `Your message has been sent to ${provider.name}. They'll respond soon.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/inquiries'] });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setMessageType("tour_request");
    setMessage(MESSAGE_TEMPLATES[0].template);
    setChildAge("");
    setContactEmail("");
    setContactPhone("");
  };

  const handleTemplateChange = (templateId: string) => {
    setMessageType(templateId);
    const template = MESSAGE_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setMessage(template.template);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please write a message to the provider.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      providerId: provider.id,
      message: message.trim(),
      messageType,
      childAge: childAge || undefined,
      parentEmail: contactEmail || user?.email || undefined,
      parentPhone: contactPhone || undefined,
    });
  };

  const handleSignIn = () => {
    window.location.href = `/api/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
  };

  if (!isAuthenticated) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl text-brand-evergreen">Sign in to Message {provider.name}</DialogTitle>
            <DialogDescription>
              Create a free account to contact providers directly.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-4">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 text-action-teal mx-auto mb-4" />
              <p className="text-text-muted mb-6">
                Sign in to send messages, save favorites, and get personalized recommendations.
              </p>
              <Button 
                onClick={handleSignIn}
                className="w-full bg-action-clay hover:bg-action-clay/90"
                data-testid="button-signin-to-message"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In to Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-brand-evergreen">
            Message {provider.name}
          </DialogTitle>
          <DialogDescription>
            Send a message directly to this provider. They typically respond within 1-2 business days.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Quick message templates */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-brand-evergreen">What would you like to ask about?</Label>
            <RadioGroup 
              value={messageType} 
              onValueChange={handleTemplateChange}
              className="grid grid-cols-2 gap-2"
            >
              {MESSAGE_TEMPLATES.map((template) => {
                const Icon = template.icon;
                return (
                  <div key={template.id}>
                    <RadioGroupItem
                      value={template.id}
                      id={template.id}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={template.id}
                      className="flex items-center gap-2 rounded-lg border-2 border-gray-200 bg-white p-3 cursor-pointer transition-all hover:bg-brand-sage/30 peer-checked:border-action-teal peer-checked:bg-action-teal/10"
                    >
                      <Icon className="h-4 w-4 text-action-teal" />
                      <span className="text-sm font-medium">{template.label}</span>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          {/* Message textarea */}
          <div className="space-y-2">
            <Label htmlFor="message">Your Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              rows={4}
              className="resize-none"
              data-testid="input-message"
            />
          </div>

          {/* Optional details */}
          <div className="space-y-4 bg-brand-sage/30 p-4 rounded-lg">
            <p className="text-sm font-medium text-brand-evergreen">Optional Details</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="childAge" className="text-sm">Child's Age</Label>
                <Input
                  id="childAge"
                  value={childAge}
                  onChange={(e) => setChildAge(e.target.value)}
                  placeholder="e.g., 3 years"
                  data-testid="input-child-age"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="text-sm">Phone (optional)</Label>
                <Input
                  id="contactPhone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  data-testid="input-phone"
                />
              </div>
            </div>

            {!user?.email && (
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="text-sm">Email for Reply</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="your@email.com"
                  data-testid="input-email"
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              data-testid="button-cancel-message"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-action-clay hover:bg-action-clay/90"
              disabled={sendMessageMutation.isPending}
              data-testid="button-send-message"
            >
              {sendMessageMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

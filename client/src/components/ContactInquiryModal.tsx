import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Provider } from "@shared/schema";
import { Phone, Mail, MessageCircle, Calendar } from "lucide-react";

interface ContactInquiryModalProps {
  provider: Provider | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactInquiryModal({ provider, isOpen, onClose }: ContactInquiryModalProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [inquiryData, setInquiryData] = useState({
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    childAge: "",
    message: "",
    inquiryType: "info" as "info" | "tour" | "enrollment",
  });

  // Pre-fill user information when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      setInquiryData(prev => ({
        ...prev,
        parentName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || '',
        parentEmail: user.email || '',
      }));
    }
  }, [isAuthenticated, user]);

  // Reset form when provider changes
  useEffect(() => {
    if (provider && isAuthenticated && user) {
      setInquiryData(prev => ({
        ...prev,
        message: `Hi ${provider.name}, I'm interested in learning more about your ${provider.type} program. Could you please provide more information about enrollment, availability, and pricing?`,
      }));
    }
  }, [provider, isAuthenticated, user]);

  // Submit inquiry mutation
  const submitInquiryMutation = useMutation({
    mutationFn: async () => {
      if (!provider) return;
      return await apiRequest("POST", "/api/inquiries", {
        ...inquiryData,
        providerId: provider.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Inquiry sent successfully!",
        description: `Your message has been sent to ${provider?.name}. They will contact you soon.`,
      });
      onClose();
      // Reset form
      setInquiryData({
        parentName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email?.split('@')[0] || '',
        parentEmail: user?.email || '',
        parentPhone: "",
        childAge: "",
        message: "",
        inquiryType: "info",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send inquiry",
        description: error?.message || "Please try again or contact the provider directly.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!inquiryData.parentName.trim() || !inquiryData.parentEmail.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in your name and email address.",
        variant: "destructive",
      });
      return;
    }

    if (!inquiryData.message.trim()) {
      toast({
        title: "Missing message",
        description: "Please write a message to the provider.",
        variant: "destructive",
      });
      return;
    }

    submitInquiryMutation.mutate();
  };

  const getInquiryTypeIcon = (type: string) => {
    switch (type) {
      case "tour": return <Calendar className="h-4 w-4" />;
      case "enrollment": return <MessageCircle className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getInquiryTypeLabel = (type: string) => {
    switch (type) {
      case "tour": return "Schedule a Tour";
      case "enrollment": return "Enrollment Inquiry";
      default: return "General Information";
    }
  };

  if (!provider) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Contact {provider.name}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Provider Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start space-x-4">
              <img
                src={
                  provider.name.includes('Bright Horizons') 
                    ? "https://images.pexels.com/photos/8613311/pexels-photo-8613311.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop"
                    : "https://images.pexels.com/photos/8613311/pexels-photo-8613311.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop"
                }
                alt={provider.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{provider.name}</h3>
                <p className="text-sm text-gray-600">{provider.address}</p>
                <p className="text-sm text-gray-600">
                  {provider.type} • Ages {Math.floor(provider.ageRangeMin / 12)}+ years
                </p>
              </div>
            </div>
          </div>

          {/* Inquiry Type */}
          <div>
            <Label htmlFor="inquiryType" className="text-sm font-medium">
              What would you like to know about?
            </Label>
            <Select 
              value={inquiryData.inquiryType} 
              onValueChange={(value: "info" | "tour" | "enrollment") => 
                setInquiryData(prev => ({ ...prev, inquiryType: value }))
              }
            >
              <SelectTrigger data-testid="select-inquiry-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">
                  <div className="flex items-center space-x-2">
                    {getInquiryTypeIcon("info")}
                    <span>General Information</span>
                  </div>
                </SelectItem>
                <SelectItem value="tour">
                  <div className="flex items-center space-x-2">
                    {getInquiryTypeIcon("tour")}
                    <span>Schedule a Tour</span>
                  </div>
                </SelectItem>
                <SelectItem value="enrollment">
                  <div className="flex items-center space-x-2">
                    {getInquiryTypeIcon("enrollment")}
                    <span>Enrollment Inquiry</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Parent Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parentName" className="text-sm font-medium">
                Your Name *
              </Label>
              <Input
                id="parentName"
                data-testid="input-parent-name"
                value={inquiryData.parentName}
                onChange={(e) => setInquiryData(prev => ({ ...prev, parentName: e.target.value }))}
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="parentEmail" className="text-sm font-medium">
                Email Address *
              </Label>
              <Input
                id="parentEmail"
                type="email"
                data-testid="input-parent-email"
                value={inquiryData.parentEmail}
                onChange={(e) => setInquiryData(prev => ({ ...prev, parentEmail: e.target.value }))}
                placeholder="your.email@example.com"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parentPhone" className="text-sm font-medium">
                Phone Number
              </Label>
              <Input
                id="parentPhone"
                type="tel"
                data-testid="input-parent-phone"
                value={inquiryData.parentPhone}
                onChange={(e) => setInquiryData(prev => ({ ...prev, parentPhone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="childAge" className="text-sm font-medium">
                Child's Age
              </Label>
              <Input
                id="childAge"
                data-testid="input-child-age"
                value={inquiryData.childAge}
                onChange={(e) => setInquiryData(prev => ({ ...prev, childAge: e.target.value }))}
                placeholder="e.g., 3 years old, 18 months"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message" className="text-sm font-medium">
              Your Message *
            </Label>
            <Textarea
              id="message"
              data-testid="textarea-message"
              value={inquiryData.message}
              onChange={(e) => setInquiryData(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Tell the provider what you're looking for..."
              rows={4}
              required
            />
          </div>

          {/* Direct Contact Info */}
          {(provider.phone || provider.email) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                You can also contact them directly:
              </h4>
              <div className="space-y-1 text-sm text-blue-800">
                {provider.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{provider.phone}</span>
                  </div>
                )}
                {provider.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{provider.email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitInquiryMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitInquiryMutation.isPending}
              data-testid="button-send-inquiry"
            >
              {submitInquiryMutation.isPending ? "Sending..." : `Send ${getInquiryTypeLabel(inquiryData.inquiryType)}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
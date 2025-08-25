import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Search, MapPin, Building2, Mail, FileText, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Provider } from "@shared/schema";

type ClaimStep = 1 | 2 | 3 | 4;

interface VerificationMethod {
  type: 'email_domain' | 'document_upload';
  data: any;
}

export default function ClaimBusiness() {
  const [currentStep, setCurrentStep] = useState<ClaimStep>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<VerificationMethod | null>(null);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  // Search providers for claiming
  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch(`/api/claims/search?q=${encodeURIComponent(query)}`);
      return response.json();
    }
  });

  // Submit claim
  const submitClaimMutation = useMutation({
    mutationFn: async (claimData: any) => {
      const response = await fetch("/api/claims", {
        method: "POST",
        body: JSON.stringify(claimData),
        headers: { "Content-Type": "application/json" }
      });
      return response.json();
    },
    onSuccess: () => {
      setCurrentStep(4);
      toast({
        title: "Claim submitted successfully!",
        description: "We'll review your claim and get back to you within 2-3 business days.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to submit claim",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a search term",
        description: "Enter the name of your business to find it in our directory.",
        variant: "destructive",
      });
      return;
    }
    searchMutation.mutate(searchQuery.trim());
  };

  const handleProviderSelect = (provider: Provider) => {
    if (provider.claimStatus !== 'unclaimed') {
      toast({
        title: "Cannot claim this business",
        description: "This business is already claimed or has a pending claim.",
        variant: "destructive",
      });
      return;
    }
    setSelectedProvider(provider);
    setCurrentStep(2);
  };

  const handleVerificationSubmit = () => {
    if (!verificationMethod) {
      toast({
        title: "Please select a verification method",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(3);
  };

  const handleClaimSubmit = () => {
    if (!selectedProvider || !verificationMethod) return;

    submitClaimMutation.mutate({
      providerId: selectedProvider.id,
      verificationMethod: verificationMethod.type,
      verificationPayload: verificationMethod.data
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Building2 className="w-12 h-12 mx-auto text-blue-600 mb-4" />
            <CardTitle>Claim Your Business</CardTitle>
            <CardDescription>
              Sign in to claim and manage your childcare business listing
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="w-full"
              data-testid="button-login"
            >
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Claim Your Business
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Take control of your childcare business listing in 3 simple steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {[
            { step: 1, title: "Find", icon: Search },
            { step: 2, title: "Verify", icon: Mail },
            { step: 3, title: "Submit", icon: FileText },
            { step: 4, title: "Complete", icon: CheckCircle }
          ].map(({ step, title, icon: Icon }) => (
            <div key={step} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 
                ${currentStep >= step 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 text-gray-400'
                }`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`ml-2 text-sm font-medium 
                ${currentStep >= step ? 'text-blue-600' : 'text-gray-400'}
              `}>
                {title}
              </span>
              {step < 4 && (
                <div className={`w-16 h-0.5 mx-4 
                  ${currentStep > step ? 'bg-blue-600' : 'bg-gray-300'}
                `} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <Card data-testid="card-find-step">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Step 1: Find Your Business
              </CardTitle>
              <CardDescription>
                Search for your childcare business in our directory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="search">Business Name</Label>
                  <Input
                    id="search"
                    placeholder="Enter your business name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    data-testid="input-business-search"
                  />
                </div>
                <Button 
                  onClick={handleSearch}
                  disabled={searchMutation.isPending}
                  className="mt-6"
                  data-testid="button-search-business"
                >
                  {searchMutation.isPending ? "Searching..." : "Search"}
                </Button>
              </div>

              {/* Search Results */}
              {searchMutation.data && (
                <div className="space-y-3">
                  <h3 className="font-medium">Search Results:</h3>
                  {Array.isArray(searchMutation.data) && searchMutation.data.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No businesses found. Try a different search term or 
                      <a href="/contact" className="text-blue-600 ml-1">contact us</a> to add your business.
                    </p>
                  ) : (
                    Array.isArray(searchMutation.data) && searchMutation.data.map((provider: Provider) => (
                      <Card 
                        key={provider.id} 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => handleProviderSelect(provider)}
                        data-testid={`card-provider-${provider.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-lg">{provider.name}</h4>
                              <div className="flex items-center text-gray-600 dark:text-gray-300 mt-1">
                                <MapPin className="w-4 h-4 mr-1" />
                                {provider.address}, {provider.city}, {provider.state}
                              </div>
                              <div className="flex gap-2 mt-2">
                                <Badge variant="secondary">{provider.type}</Badge>
                                <Badge variant={provider.claimStatus === 'unclaimed' ? 'default' : 'destructive'}>
                                  {provider.claimStatus === 'unclaimed' ? 'Available' : 'Already claimed'}
                                </Badge>
                              </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && selectedProvider && (
          <Card data-testid="card-verify-step">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Step 2: Verify Ownership
              </CardTitle>
              <CardDescription>
                Prove that you own or manage {selectedProvider.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Selected Business:</h4>
                <p className="font-medium">{selectedProvider.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {selectedProvider.address}, {selectedProvider.city}, {selectedProvider.state}
                </p>
              </div>

              <div>
                <Label className="text-base font-medium mb-4 block">Choose verification method:</Label>
                <RadioGroup 
                  onValueChange={(value) => {
                    if (value === 'email') {
                      setVerificationMethod({
                        type: 'email_domain',
                        data: { businessDomain: selectedProvider.website || selectedProvider.email }
                      });
                    } else if (value === 'document') {
                      setVerificationMethod({
                        type: 'document_upload',
                        data: { documentType: 'business_license' }
                      });
                    }
                  }}
                  data-testid="radiogroup-verification-method"
                >
                  <div className="space-y-4">
                    <Card className="p-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="email" id="email" data-testid="radio-email-verification" />
                        <div className="flex-1">
                          <Label htmlFor="email" className="cursor-pointer">
                            <div className="font-medium">Email Domain Verification (Recommended)</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              Verify using your business email domain
                              {selectedProvider.website && (
                                <span className="block text-blue-600">
                                  Domain: {new URL(`https://${selectedProvider.website}`).hostname}
                                </span>
                              )}
                            </div>
                          </Label>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="document" id="document" data-testid="radio-document-verification" />
                        <div className="flex-1">
                          <Label htmlFor="document" className="cursor-pointer">
                            <div className="font-medium">Document Verification</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              Upload business license or other official documents
                            </div>
                          </Label>
                        </div>
                      </div>
                    </Card>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(1)}
                  data-testid="button-back-to-find"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleVerificationSubmit}
                  disabled={!verificationMethod}
                  data-testid="button-continue-to-submit"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 3 && selectedProvider && verificationMethod && (
          <Card data-testid="card-submit-step">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Step 3: Review & Submit
              </CardTitle>
              <CardDescription>
                Review your claim details and submit for approval
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Business Details:</h4>
                  <p className="font-medium">{selectedProvider.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {selectedProvider.address}, {selectedProvider.city}, {selectedProvider.state}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Type: {selectedProvider.type}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Verification Method:</h4>
                  <p className="text-sm">
                    {verificationMethod.type === 'email_domain' 
                      ? 'Email Domain Verification' 
                      : 'Document Verification'
                    }
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Claimant Information:</h4>
                  <p className="text-sm">
                    {user?.firstName} {user?.lastName} ({user?.email})
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="additional-info" className="text-base font-medium">
                  Additional Information (Optional)
                </Label>
                <Textarea 
                  id="additional-info"
                  placeholder="Provide any additional information that would help verify your ownership..."
                  className="mt-2"
                  data-testid="textarea-additional-info"
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What happens next?</h4>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <li>• Our team will review your claim within 2-3 business days</li>
                  <li>• You'll receive an email notification with the decision</li>
                  <li>• Once approved, you'll have full control of your business listing</li>
                  <li>• You can update information, respond to reviews, and manage photos</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep(2)}
                  data-testid="button-back-to-verify"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button 
                  onClick={handleClaimSubmit}
                  disabled={submitClaimMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-claim"
                >
                  {submitClaimMutation.isPending ? "Submitting..." : "Submit Claim"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 4 && (
          <Card data-testid="card-success-step">
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <CardTitle>Claim Submitted Successfully!</CardTitle>
              <CardDescription>
                Thank you for claiming your business. We'll review your request shortly.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <p className="text-sm">
                  <strong>What's next?</strong><br />
                  Our verification team will review your claim within 2-3 business days. 
                  You'll receive an email notification with the decision.
                </p>
              </div>
              <Button 
                onClick={() => window.location.href = '/'}
                data-testid="button-return-home"
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
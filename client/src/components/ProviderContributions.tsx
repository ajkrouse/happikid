import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ObjectUploader } from "./ObjectUploader";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Edit, ThumbsUp, ThumbsDown, MapPin, Phone, Globe, Clock, DollarSign } from "lucide-react";
import type { UploadResult } from "@uppy/core";

interface ProviderContributionsProps {
  providerId: number;
  provider: any;
}

export function ProviderContributions({ providerId, provider }: ProviderContributionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    updateType: "",
    field: "",
    oldValue: "",
    newValue: "",
    reason: ""
  });
  const [photoForm, setPhotoForm] = useState({
    caption: "",
    photoType: "other"
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user-contributed photos
  const { data: userPhotos = [] } = useQuery({
    queryKey: ['/api/providers', providerId, 'user-photos'],
  });

  const photosArray = Array.isArray(userPhotos) ? userPhotos : [];

  // Mutation to suggest an edit
  const suggestEditMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/providers/${providerId}/suggest-update`, 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Edit suggested successfully",
        description: "Your suggestion has been submitted for review. Thank you for helping keep provider information accurate!",
      });
      setIsEditDialogOpen(false);
      setUpdateForm({ updateType: "", field: "", oldValue: "", newValue: "", reason: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting suggestion",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation to contribute a photo
  const contributePhotoMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/providers/${providerId}/contribute-photo`, 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Photo contributed successfully",
        description: "Your photo has been submitted for review. It will appear once approved.",
      });
      setIsPhotoDialogOpen(false);
      setPhotoForm({ caption: "", photoType: "other" });
      queryClient.invalidateQueries({ queryKey: ['/api/providers', providerId, 'user-photos'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error uploading photo",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSuggestEdit = () => {
    if (!updateForm.updateType || !updateForm.field || !updateForm.newValue) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    suggestEditMutation.mutate(updateForm);
  };

  const handleGetUploadParameters = async () => {
    const response = await apiRequest('/api/objects/upload', 'POST');
    return {
      method: 'PUT' as const,
      url: response.uploadURL,
    };
  };

  const handlePhotoUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      contributePhotoMutation.mutate({
        imageUrl: uploadedFile.uploadURL,
        caption: photoForm.caption,
        photoType: photoForm.photoType,
      });
    }
  };

  const getFieldOptions = (updateType: string) => {
    switch (updateType) {
      case 'contact_info':
        return [
          { value: 'phone', label: 'Phone Number', icon: Phone },
          { value: 'email', label: 'Email Address', icon: Phone },
          { value: 'website', label: 'Website', icon: Globe },
          { value: 'address', label: 'Address', icon: MapPin },
        ];
      case 'hours':
        return [
          { value: 'hoursOpen', label: 'Opening Time', icon: Clock },
          { value: 'hoursClose', label: 'Closing Time', icon: Clock },
        ];
      case 'pricing':
        return [
          { value: 'monthlyPrice', label: 'Monthly Price', icon: DollarSign },
        ];
      case 'description':
        return [
          { value: 'description', label: 'Description', icon: Edit },
        ];
      case 'features':
        return [
          { value: 'features', label: 'Features/Amenities', icon: Edit },
        ];
      default:
        return [];
    }
  };

  const getCurrentValue = (field: string) => {
    switch (field) {
      case 'phone': return provider?.phone || '';
      case 'email': return provider?.email || '';
      case 'website': return provider?.website || '';
      case 'address': return provider?.address || '';
      case 'hoursOpen': return provider?.hoursOpen || '';
      case 'hoursClose': return provider?.hoursClose || '';
      case 'monthlyPrice': return provider?.monthlyPrice || '';
      case 'description': return provider?.description || '';
      case 'features': return provider?.features?.join(', ') || '';
      default: return '';
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit className="h-5 w-5" />
          Help Improve This Listing
        </CardTitle>
        <CardDescription>
          Contribute photos and suggest updates to help other parents make informed decisions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Suggest an Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Suggest an Edit</DialogTitle>
                <DialogDescription>
                  Help us keep provider information accurate and up-to-date
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="updateType">What would you like to update?</Label>
                  <Select value={updateForm.updateType} onValueChange={(value) => {
                    setUpdateForm(prev => ({ ...prev, updateType: value, field: "", oldValue: "", newValue: "" }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contact_info">Contact Information</SelectItem>
                      <SelectItem value="hours">Hours of Operation</SelectItem>
                      <SelectItem value="pricing">Pricing</SelectItem>
                      <SelectItem value="description">Description</SelectItem>
                      <SelectItem value="features">Features & Amenities</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {updateForm.updateType && (
                  <div>
                    <Label htmlFor="field">Specific Field</Label>
                    <Select value={updateForm.field} onValueChange={(value) => {
                      const currentValue = getCurrentValue(value);
                      setUpdateForm(prev => ({ ...prev, field: value, oldValue: currentValue }));
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        {getFieldOptions(updateForm.updateType).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {updateForm.field && (
                  <>
                    <div>
                      <Label htmlFor="oldValue">Current Value</Label>
                      <Input
                        id="oldValue"
                        value={updateForm.oldValue}
                        readOnly
                        className="bg-gray-50"
                        placeholder="Current information"
                      />
                    </div>

                    <div>
                      <Label htmlFor="newValue">Suggested Value *</Label>
                      <Input
                        id="newValue"
                        value={updateForm.newValue}
                        onChange={(e) => setUpdateForm(prev => ({ ...prev, newValue: e.target.value }))}
                        placeholder="Enter the correct information"
                      />
                    </div>

                    <div>
                      <Label htmlFor="reason">Reason for Change (Optional)</Label>
                      <Textarea
                        id="reason"
                        value={updateForm.reason}
                        onChange={(e) => setUpdateForm(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Why is this information incorrect or outdated?"
                        className="min-h-[80px]"
                      />
                    </div>

                    <Button 
                      onClick={handleSuggestEdit} 
                      disabled={suggestEditMutation.isPending}
                      className="w-full"
                    >
                      {suggestEditMutation.isPending ? "Submitting..." : "Submit Suggestion"}
                    </Button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Add Photo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Contribute a Photo</DialogTitle>
                <DialogDescription>
                  Share photos to help other parents see what this provider offers
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="photoType">Photo Type</Label>
                  <Select value={photoForm.photoType} onValueChange={(value) => {
                    setPhotoForm(prev => ({ ...prev, photoType: value }));
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exterior">Building Exterior</SelectItem>
                      <SelectItem value="interior">Interior/Classroom</SelectItem>
                      <SelectItem value="playground">Playground/Outdoor Area</SelectItem>
                      <SelectItem value="activity">Activities</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="caption">Caption (Optional)</Label>
                  <Input
                    id="caption"
                    value={photoForm.caption}
                    onChange={(e) => setPhotoForm(prev => ({ ...prev, caption: e.target.value }))}
                    placeholder="Describe what's shown in the photo"
                  />
                </div>

                <ObjectUploader
                  maxNumberOfFiles={1}
                  maxFileSize={10485760} // 10MB
                  onGetUploadParameters={handleGetUploadParameters}
                  onComplete={handlePhotoUploadComplete}
                  buttonClassName="w-full"
                >
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Upload Photo
                  </div>
                </ObjectUploader>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Display user-contributed photos */}
        {photosArray.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Photos from the community</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {photosArray.map((photo: any) => (
                <div key={photo.id} className="relative">
                  <img 
                    src={photo.imageUrl} 
                    alt={photo.caption || "User contributed photo"}
                    className="w-full h-24 object-cover rounded"
                  />
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 rounded-b">
                      {photo.caption}
                    </div>
                  )}
                  <Badge variant="secondary" className="absolute top-1 right-1 text-xs">
                    {photo.photoType}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, Building2, Search, TrendingUp } from "lucide-react";

interface RoleSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RoleSelectionModal({ isOpen, onClose }: RoleSelectionModalProps) {
  const handleParentChoice = () => {
    onClose();
    window.location.href = "/api/login?returnTo=/search";
  };

  const handleProviderChoice = () => {
    onClose();
    window.location.href = "/api/login?returnTo=/provider/onboarding";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Welcome to HappiKid!</DialogTitle>
          <p className="text-center text-gray-600 mt-2">What would you like to do first?</p>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
          {/* Parent/Caretaker Option */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary" onClick={handleParentChoice}>
            <CardHeader className="text-center">
              <div className="bg-primary-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Find Childcare</CardTitle>
              <CardDescription>Search for providers as a parent/caretaker</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-center">
                  <Search className="h-4 w-4 text-primary mr-2" />
                  <span>Search for providers</span>
                </li>
                <li className="flex items-center">
                  <Search className="h-4 w-4 text-primary mr-2" />
                  <span>Compare options</span>
                </li>
                <li className="flex items-center">
                  <Search className="h-4 w-4 text-primary mr-2" />
                  <span>Read reviews</span>
                </li>
                <li className="flex items-center">
                  <Search className="h-4 w-4 text-primary mr-2" />
                  <span>Save favorites</span>
                </li>
              </ul>
              <Button className="w-full" onClick={handleParentChoice}>
                Find Childcare
              </Button>
            </CardContent>
          </Card>

          {/* Provider Option */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-secondary-500" onClick={handleProviderChoice}>
            <CardHeader className="text-center">
              <div className="bg-secondary-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-secondary-500" />
              </div>
              <CardTitle className="text-xl">Grow My Business</CardTitle>
              <CardDescription>Set up your childcare provider profile</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600 mb-4">
                <li className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-secondary-500 mr-2" />
                  <span>Create your profile</span>
                </li>
                <li className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-secondary-500 mr-2" />
                  <span>Connect with families</span>
                </li>
                <li className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-secondary-500 mr-2" />
                  <span>Manage inquiries</span>
                </li>
                <li className="flex items-center">
                  <TrendingUp className="h-4 w-4 text-secondary-500 mr-2" />
                  <span>Grow enrollment</span>
                </li>
              </ul>
              <Button className="w-full bg-secondary-500 hover:bg-secondary-600" onClick={handleProviderChoice}>
                Start Your Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center text-sm text-gray-500 pb-2">
          You can access both experiences anytime from your dashboard.
        </div>
      </DialogContent>
    </Dialog>
  );
}
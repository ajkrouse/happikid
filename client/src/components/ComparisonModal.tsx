import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Provider } from "@shared/schema";
import { MapPin, Star, Clock, Users } from "lucide-react";

interface ComparisonModalProps {
  providers: Provider[];
  isOpen: boolean;
  onClose: () => void;
  onSelectProvider: (provider: Provider) => void;
}

export default function ComparisonModal({ 
  providers, 
  isOpen, 
  onClose, 
  onSelectProvider 
}: ComparisonModalProps) {
  const getTypeLabel = (type: string) => {
    const labels = {
      daycare: "Daycare",
      afterschool: "After School",
      camp: "Camp",
      school: "Private School",
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Compare Providers</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {providers.map((provider) => (
            <Card key={provider.id} className="border-2">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <img
                    src="https://images.unsplash.com/photo-1576085898323-218337e3e43c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"
                    alt={provider.name}
                    className="w-full h-32 object-cover rounded-lg mb-4"
                  />
                  <h3 className="text-xl font-semibold text-gray-900">{provider.name}</h3>
                  <p className="text-gray-600 flex items-center justify-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {provider.borough}, {provider.city}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Price</span>
                    <span className="font-semibold text-gray-900">
                      {provider.monthlyPrice ? `$${provider.monthlyPrice}` : "Contact for pricing"}
                    </span>
                  </div>
                  
                  {provider.rating && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rating</span>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="font-semibold text-gray-900">
                          {provider.rating}/5 ({provider.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ages</span>
                    <span className="font-semibold text-gray-900">
                      {provider.ageRangeMin}-{provider.ageRangeMax} years
                    </span>
                  </div>
                  
                  {provider.hoursOpen && provider.hoursClose && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hours</span>
                      <span className="font-semibold text-gray-900">
                        {provider.hoursOpen} - {provider.hoursClose}
                      </span>
                    </div>
                  )}
                  
                  {provider.capacity && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity</span>
                      <span className="font-semibold text-gray-900">
                        {provider.capacity} children
                      </span>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {getTypeLabel(provider.type)}
                      </Badge>
                      {provider.features?.slice(0, 3).map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4"
                    onClick={() => onSelectProvider(provider)}
                  >
                    Select {provider.name}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {providers.length < 4 && (
          <div className="text-center mt-8">
            <Button variant="outline" onClick={onClose}>
              Add More to Compare
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

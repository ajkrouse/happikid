import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, TrendingUp, Search, BarChart3, Zap, Users, Star, CheckCircle } from "lucide-react";

interface PremiumFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

const premiumFeatures = [
  {
    icon: BarChart3,
    title: "Advanced Analytics Dashboard",
    description: "Comprehensive insights into your profile performance, visitor behavior, and inquiry patterns",
    details: [
      "Real-time visitor tracking and demographics",
      "Conversion funnel analysis",
      "Peak inquiry time insights",
      "Geographic reach mapping",
      "Performance comparison with competitors"
    ],
    value: "$299/month value"
  },
  {
    icon: TrendingUp,
    title: "Competitive Market Insights",
    description: "Stay ahead with detailed competitor analysis and market positioning data",
    details: [
      "Competitor pricing analysis",
      "Market demand trends in your area",
      "Parent preference insights",
      "Seasonal enrollment patterns",
      "Local market saturation data"
    ],
    value: "$199/month value"
  },
  {
    icon: Search,
    title: "Priority Search Placement",
    description: "Boost your visibility with premium search ranking and featured placement",
    details: [
      "Top 3 search result placement",
      "Featured provider badge",
      "Enhanced profile highlighting",
      "Mobile app priority listing",
      "Weekend and evening visibility boost"
    ],
    value: "$149/month value"
  },
  {
    icon: Users,
    title: "Enhanced Parent Engagement",
    description: "Advanced tools to connect with and convert prospective families",
    details: [
      "Direct messaging system",
      "Automated follow-up sequences",
      "Parent preference matching",
      "Inquiry response templates",
      "Booking calendar integration"
    ],
    value: "$99/month value"
  },
  {
    icon: Zap,
    title: "Marketing Automation Suite",
    description: "Streamline your marketing efforts with intelligent automation tools",
    details: [
      "Social media post scheduling",
      "Email campaign automation",
      "Review request automation",
      "Parent newsletter templates",
      "Seasonal promotion tools"
    ],
    value: "$179/month value"
  },
  {
    icon: Star,
    title: "Premium Support & Training",
    description: "Dedicated success manager and exclusive training resources",
    details: [
      "1-on-1 success coaching sessions",
      "Priority customer support",
      "Monthly best practices webinars",
      "Custom marketing consultation",
      "Early access to new features"
    ],
    value: "$249/month value"
  }
];

export default function PremiumFeaturesModal({ isOpen, onClose, onUpgrade }: PremiumFeaturesModalProps) {
  const totalValue = premiumFeatures.reduce((sum, feature) => {
    const value = parseInt(feature.value.replace(/\$|\/month value/g, ''));
    return sum + value;
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Unlock Premium Features
            </DialogTitle>
          </div>
          <p className="text-gray-600 text-lg">
            Take your childcare business to the next level with advanced tools designed for growth
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Value Proposition */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Everything Premium Included</h3>
                  <p className="text-gray-600 mt-1">Complete suite of professional tools</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">${totalValue}</div>
                  <div className="text-sm text-gray-500 line-through">Monthly Value</div>
                  <div className="text-lg font-semibold text-green-600">Now $49/month</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {premiumFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="relative overflow-hidden border hover:shadow-lg transition-all duration-200">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-yellow-400/20 to-transparent"></div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex-shrink-0">
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 leading-tight">
                          {feature.title}
                        </CardTitle>
                        <Badge variant="secondary" className="mt-1 text-xs bg-green-100 text-green-700">
                          {feature.value}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-gray-600 mb-3">
                      {feature.description}
                    </CardDescription>
                    <div className="space-y-2">
                      {feature.details.slice(0, 3).map((detail, detailIndex) => (
                        <div key={detailIndex} className="flex items-start gap-2 text-sm text-gray-700">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{detail}</span>
                        </div>
                      ))}
                      {feature.details.length > 3 && (
                        <div className="text-sm text-gray-500 italic">
                          +{feature.details.length - 3} more features...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Trial Offer */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Start Your Free Trial Today</h3>
                <p className="text-gray-600 mb-4">
                  Try all premium features risk-free for 14 days. Cancel anytime.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={onUpgrade}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-2.5 text-lg font-semibold"
                  >
                    Start Free Trial
                  </Button>
                  <Button variant="outline" onClick={onClose} className="px-8 py-2.5">
                    Maybe Later
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  No credit card required • Cancel anytime • Full refund guarantee
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
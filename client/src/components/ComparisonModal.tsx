import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Provider } from "@shared/schema";
import { 
  MapPin, 
  Star, 
  Clock, 
  Users, 
  X, 
  Heart,
  Share2,
  Save,
  Filter,
  Award,
  Shield,
  DollarSign,
  Home,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface ComparisonModalProps {
  providers: Provider[];
  isOpen: boolean;
  onClose: () => void;
  onSelectProvider: (provider: Provider) => void;
  onRemoveProvider: (providerId: number) => void;
}

interface UserPreferences {
  priorities: string;
  sortBy: 'fit' | 'price' | 'rating' | 'distance';
  ageGroup: 'infant' | 'toddler' | 'preschool' | 'school-age' | 'all';
  budget: 'low' | 'medium' | 'high' | 'any';
  focusAreas: string[];
}

type ComparisonAttribute = {
  key: string;
  label: string;
  icon: any;
  getValue: (provider: Provider) => string | number | null;
  getScore: (provider: Provider, preferences: UserPreferences) => number;
  isHighlighted: (provider: Provider, preferences: UserPreferences) => boolean;
  dataSource: 'provider' | 'public' | 'reviews';
};

export default function ComparisonModal({ 
  providers, 
  isOpen, 
  onClose, 
  onSelectProvider,
  onRemoveProvider 
}: ComparisonModalProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    priorities: '',
    sortBy: 'fit',
    ageGroup: 'all',
    budget: 'any',
    focusAreas: []
  });
  
  const [showPreferencesPanel, setShowPreferencesPanel] = useState(true);
  const [comparisonName, setComparisonName] = useState('');
  const [savedComparisons, setSavedComparisons] = useState<any[]>([]);

  const getTypeLabel = (type: string) => {
    const labels = {
      daycare: "Daycare",
      afterschool: "After-School Program", 
      camp: "Summer Camp",
      school: "Private School",
    };
    return labels[type as keyof typeof labels] || type;
  };

  const formatAge = (months: number) => {
    if (months < 12) return `${months}mo`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return remainingMonths > 0 ? `${years}y ${remainingMonths}mo` : `${years}y`;
  };

  const formatPrice = (provider: Provider) => {
    if (provider.monthlyPrice) return `$${provider.monthlyPrice}`;
    return "Contact for pricing";
  };

  // Define comparison attributes with smart scoring
  const comparisonAttributes: ComparisonAttribute[] = [
    {
      key: 'type',
      label: 'Type',
      icon: Home,
      getValue: (p) => getTypeLabel(p.type),
      getScore: (p, prefs) => prefs.priorities.toLowerCase().includes(p.type) ? 1 : 0,
      isHighlighted: (p, prefs) => prefs.priorities.toLowerCase().includes(p.type),
      dataSource: 'provider'
    },
    {
      key: 'location',
      label: 'Location',
      icon: MapPin,
      getValue: (p) => `${p.borough}, ${p.city === p.borough ? 'NYC' : p.city}`,
      getScore: (p, prefs) => prefs.priorities.toLowerCase().includes(p.borough.toLowerCase()) ? 1 : 0,
      isHighlighted: (p, prefs) => prefs.priorities.toLowerCase().includes(p.borough.toLowerCase()),
      dataSource: 'provider'
    },
    {
      key: 'price',
      label: 'Monthly Price',
      icon: DollarSign,
      getValue: (p) => formatPrice(p),
      getScore: (p, prefs) => {
        if (!p.monthlyPrice) return 0;
        const price = Number(p.monthlyPrice);
        const budgetRanges = { low: [0, 1500], medium: [1500, 3000], high: [3000, Infinity] };
        const range = budgetRanges[prefs.budget as keyof typeof budgetRanges];
        return range && price >= range[0] && price <= range[1] ? 1 : 0;
      },
      isHighlighted: (p, prefs) => prefs.priorities.toLowerCase().includes('affordable') || prefs.priorities.toLowerCase().includes('budget'),
      dataSource: 'provider'
    },
    {
      key: 'rating',
      label: 'Rating',
      icon: Star,
      getValue: (p) => p.rating ? `${p.rating}/5 (${p.reviewCount} reviews)` : 'No ratings yet',
      getScore: (p, prefs) => p.rating ? (Number(p.rating) / 5) : 0,
      isHighlighted: (p, prefs) => prefs.priorities.toLowerCase().includes('rating') || prefs.priorities.toLowerCase().includes('reviews'),
      dataSource: 'reviews'
    },
    {
      key: 'ages',
      label: 'Age Range',
      icon: Users,
      getValue: (p) => `${formatAge(p.ageRangeMin)} - ${formatAge(p.ageRangeMax)}`,
      getScore: (p, prefs) => {
        const ageMatches = {
          infant: p.ageRangeMin <= 12,
          toddler: p.ageRangeMin <= 36 && p.ageRangeMax >= 12,
          preschool: p.ageRangeMin <= 60 && p.ageRangeMax >= 36,
          'school-age': p.ageRangeMax >= 60
        };
        return ageMatches[prefs.ageGroup as keyof typeof ageMatches] ? 1 : 0;
      },
      isHighlighted: (p, prefs) => prefs.ageGroup !== 'all',
      dataSource: 'provider'
    },
    {
      key: 'hours',
      label: 'Hours',
      icon: Clock,
      getValue: (p) => p.hoursOpen && p.hoursClose ? `${p.hoursOpen} - ${p.hoursClose}` : 'Contact for hours',
      getScore: (p, prefs) => prefs.priorities.toLowerCase().includes('hours') || prefs.priorities.toLowerCase().includes('schedule') ? 1 : 0,
      isHighlighted: (p, prefs) => prefs.priorities.toLowerCase().includes('hours') || prefs.priorities.toLowerCase().includes('late'),
      dataSource: 'provider'
    },
    {
      key: 'capacity',
      label: 'Class Size',
      icon: Users,
      getValue: (p) => p.capacity ? `${p.capacity} children` : 'Not specified',
      getScore: (p, prefs) => {
        if (!p.capacity) return 0;
        return prefs.priorities.toLowerCase().includes('small') ? (p.capacity <= 20 ? 1 : 0) : 0.5;
      },
      isHighlighted: (p, prefs) => prefs.priorities.toLowerCase().includes('small') || prefs.priorities.toLowerCase().includes('class size'),
      dataSource: 'provider'
    },
    {
      key: 'verified',
      label: 'Verification',
      icon: Shield,
      getValue: (p) => p.isVerified ? 'Verified' : 'Not verified',
      getScore: (p, prefs) => p.isVerified ? 1 : 0,
      isHighlighted: (p, prefs) => prefs.priorities.toLowerCase().includes('safe') || prefs.priorities.toLowerCase().includes('trust'),
      dataSource: 'public'
    }
  ];

  // Calculate fit score for each provider
  const calculateFitScore = (provider: Provider) => {
    if (!preferences.priorities) return 0;
    
    const scores = comparisonAttributes.map(attr => attr.getScore(provider, preferences));
    const totalScore = scores.reduce((sum, score) => sum + score, 0);
    return Math.round((totalScore / comparisonAttributes.length) * 100);
  };

  // Sort providers based on preferences
  const sortedProviders = [...providers].sort((a, b) => {
    switch (preferences.sortBy) {
      case 'fit':
        return calculateFitScore(b) - calculateFitScore(a);
      case 'price':
        const priceA = Number(a.monthlyPrice) || Infinity;
        const priceB = Number(b.monthlyPrice) || Infinity;
        return priceA - priceB;
      case 'rating':
        const ratingA = Number(a.rating) || 0;
        const ratingB = Number(b.rating) || 0;
        return ratingB - ratingA;
      default:
        return 0;
    }
  });

  const handleSaveComparison = () => {
    const comparison = {
      id: Date.now(),
      name: comparisonName || `Comparison ${new Date().toLocaleDateString()}`,
      providers: providers,
      preferences: preferences,
      createdAt: new Date()
    };
    
    const saved = JSON.parse(localStorage.getItem('savedComparisons') || '[]');
    saved.push(comparison);
    localStorage.setItem('savedComparisons', JSON.stringify(saved));
    setSavedComparisons(saved);
    setComparisonName('');
  };

  const handleShareComparison = () => {
    const shareData = {
      providers: providers.map(p => p.id),
      preferences: preferences
    };
    const shareUrl = `${window.location.origin}/compare?data=${encodeURIComponent(JSON.stringify(shareData))}`;
    navigator.clipboard.writeText(shareUrl);
  };

  const getDataSourceIcon = (source: string) => {
    const sources = {
      provider: { icon: Home, className: 'text-blue-600', tooltip: 'Information provided by the childcare provider' },
      public: { icon: Shield, className: 'text-green-600', tooltip: 'Verified through public records and licensing data' },
      reviews: { icon: Star, className: 'text-purple-600', tooltip: 'Based on parent reviews and ratings' }
    };
    const sourceInfo = sources[source as keyof typeof sources];
    return (
      <div className="group relative">
        <sourceInfo.icon className={`h-3 w-3 ${sourceInfo.className}`} />
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          {sourceInfo.tooltip}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Compare Providers</DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleShareComparison}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowPreferencesPanel(!showPreferencesPanel)}>
                <Filter className="h-4 w-4 mr-2" />
                Preferences
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Preferences Panel */}
        {showPreferencesPanel && (
          <Card className="mb-6 border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-500" />
                  What matters most to you?
                </h3>
                {!preferences.priorities && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 animate-pulse">
                    💡 Share your priorities to see match rates!
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priorities" className="text-sm font-medium">
                    Tell us your priorities to get personalized match scores
                  </Label>
                  <Textarea
                    id="priorities"
                    placeholder="e.g., Small class sizes, late pickup hours, STEM curriculum, close to subway, outdoor playground, vegetarian meals..."
                    value={preferences.priorities}
                    onChange={(e) => setPreferences(prev => ({ ...prev, priorities: e.target.value }))}
                    className={`mt-1 transition-all duration-200 ${
                      !preferences.priorities 
                        ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-200' 
                        : 'border-green-300 focus:border-green-500 focus:ring-green-200'
                    }`}
                    rows={3}
                  />
                  {preferences.priorities && (
                    <div className="text-xs text-green-600 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Great! Now you'll see personalized match scores above.
                    </div>
                  )}
                  {!preferences.priorities && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        The more specific you are, the better we can match you with providers.
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded p-2">
                        <div className="text-xs font-medium text-blue-800 mb-1">Try these examples:</div>
                        <div className="flex flex-wrap gap-1">
                          {[
                            "small class sizes",
                            "late pickup hours",
                            "STEM curriculum",
                            "outdoor playground",
                            "near subway"
                          ].map((example) => (
                            <button
                              key={example}
                              onClick={() => {
                                const current = preferences.priorities;
                                const newValue = current ? `${current}, ${example}` : example;
                                setPreferences(prev => ({ ...prev, priorities: newValue }));
                              }}
                              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
                            >
                              + {example}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sort">Sort by</Label>
                    <Select value={preferences.sortBy} onValueChange={(value: any) => setPreferences(prev => ({ ...prev, sortBy: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fit">Best Match</SelectItem>
                        <SelectItem value="price">Lowest Price</SelectItem>
                        <SelectItem value="rating">Highest Rating</SelectItem>
                        <SelectItem value="distance">Closest to Me</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="age">Age Group</Label>
                      <Select value={preferences.ageGroup} onValueChange={(value: any) => setPreferences(prev => ({ ...prev, ageGroup: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Ages</SelectItem>
                          <SelectItem value="infant">Infants</SelectItem>
                          <SelectItem value="toddler">Toddlers</SelectItem>
                          <SelectItem value="preschool">Preschool</SelectItem>
                          <SelectItem value="school-age">School Age</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="budget">Budget</Label>
                      <Select value={preferences.budget} onValueChange={(value: any) => setPreferences(prev => ({ ...prev, budget: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Budget</SelectItem>
                          <SelectItem value="low">Under $1,500/mo</SelectItem>
                          <SelectItem value="medium">$1,500-$3,000/mo</SelectItem>
                          <SelectItem value="high">$3,000+/mo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Source Legend */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Data Sources:</span>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center">
                <Home className="h-3 w-3 text-blue-600 mr-1" />
                <span className="text-gray-600">Provider Info</span>
              </div>
              <div className="flex items-center">
                <Shield className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-gray-600">Public Records</span>
              </div>
              <div className="flex items-center">
                <Star className="h-3 w-3 text-purple-600 mr-1" />
                <span className="text-gray-600">Parent Reviews</span>
              </div>
            </div>
          </div>
        </div>

        {/* Provider Header Row */}
        <div className="grid grid-cols-12 gap-4 mb-4">
          <div className="col-span-3">
            <h4 className="font-semibold text-gray-700">Criteria</h4>
          </div>
          {sortedProviders.map((provider) => {
            const fitScore = calculateFitScore(provider);
            return (
              <div key={provider.id} className="col-span-3 text-center relative">
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full hover:bg-red-100"
                    onClick={() => onRemoveProvider(provider.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                  
                  <img
                    src="https://images.unsplash.com/photo-1576085898323-218337e3e43c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=100"
                    alt={provider.name}
                    className="w-full h-20 object-cover rounded-lg mb-2"
                  />
                  
                  <h5 className="font-semibold text-sm text-gray-900 mb-1">{provider.name}</h5>
                  
                  {fitScore > 0 && (
                    <div className="flex items-center justify-center mb-2">
                      <Badge 
                        className={`text-xs ${
                          fitScore >= 80 ? 'bg-green-100 text-green-800' : 
                          fitScore >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <Award className="h-3 w-3 mr-1" />
                        {fitScore}% Match
                      </Badge>
                    </div>
                  )}
                  
                  {fitScore >= 80 && (
                    <Badge className="bg-green-100 text-green-800 text-xs mb-2">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Best Match
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="space-y-1">
          {comparisonAttributes.map((attr) => (
            <div 
              key={attr.key} 
              className={`grid grid-cols-12 gap-4 py-3 px-2 rounded-lg transition-colors ${
                sortedProviders.some(p => attr.isHighlighted(p, preferences)) 
                  ? 'bg-blue-50 border-l-4 border-l-blue-400' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="col-span-3 flex items-center justify-between">
                <div className="flex items-center">
                  <attr.icon className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="font-medium text-gray-700">{attr.label}</span>
                </div>
                {getDataSourceIcon(attr.dataSource)}
              </div>
              
              {sortedProviders.map((provider) => (
                <div key={provider.id} className="col-span-3 text-sm">
                  <div className={`${
                    attr.isHighlighted(provider, preferences) 
                      ? 'font-semibold text-blue-900 bg-blue-100 px-2 py-1 rounded' 
                      : 'text-gray-700'
                  }`}>
                    {attr.getValue(provider)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Features Row */}
        <div className="grid grid-cols-12 gap-4 py-3 px-2 bg-gray-50 rounded-lg mt-4">
          <div className="col-span-3 flex items-center justify-between">
            <div className="flex items-center">
              <Award className="h-4 w-4 mr-2 text-gray-600" />
              <span className="font-medium text-gray-700">Special Features</span>
            </div>
            {getDataSourceIcon('provider')}
          </div>
          
          {sortedProviders.map((provider) => (
            <div key={provider.id} className="col-span-3">
              <div className="flex flex-wrap gap-1">
                {provider.features?.slice(0, 4).map((feature) => (
                  <Badge key={feature} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {(provider.features?.length || 0) > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{(provider.features?.length || 0) - 4} more
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6 pt-4 border-t">
          <div className="flex-1">
            <Input
              placeholder="Name this comparison (optional)"
              value={comparisonName}
              onChange={(e) => setComparisonName(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveComparison}>
              <Save className="h-4 w-4 mr-2" />
              Save Comparison
            </Button>
            
            {sortedProviders.map((provider) => (
              <Button 
                key={provider.id}
                onClick={() => onSelectProvider(provider)}
                className="flex-1 sm:flex-none"
              >
                Select {provider.name.split(' ')[0]}
              </Button>
            ))}
          </div>
        </div>

        {providers.length < 5 && (
          <div className="text-center mt-4">
            <Button variant="outline" onClick={onClose}>
              Add More Providers
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  Palette, 
  Dumbbell, 
  TreePine, 
  Laptop, 
  Users, 
  Sparkles, 
  Heart,
  Calendar
} from "lucide-react";
import type { TaxonomyResponse, Category } from "../../../types/taxonomy";

const categoryIcons: Record<string, any> = {
  "academic-enrichment": BookOpen,
  "creative-performing-arts": Palette,
  "sports-fitness-movement": Dumbbell,
  "outdoor-nature-adventure": TreePine,
  "technology-innovation": Laptop,
  "social-emotional-leadership": Users,
  "special-interests-clubs": Sparkles,
  "support-care-based": Heart,
  "seasonal-hybrid": Calendar,
};

export default function AfterSchoolPrograms() {
  const { data, isLoading } = useQuery<TaxonomyResponse>({
    queryKey: ["/api/taxonomy/after-school-programs"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const categories = data?.afterSchoolPrograms || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <Link href="/" data-testid="link-home">
            <span className="text-sm hover:underline cursor-pointer">← Back to Home</span>
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mt-4" data-testid="heading-page-title">
            After-School Programs Directory
          </h1>
          <p className="text-xl mt-4 text-blue-100" data-testid="text-description">
            Explore enrichment programs across {categories.length} categories
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-6">
          {categories.map((category: Category) => {
            const Icon = categoryIcons[category.slug] || BookOpen;
            
            return (
              <Card key={category.id} data-testid={`card-category-${category.id}`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl" data-testid={`text-category-name-${category.id}`}>
                        {category.name}
                      </CardTitle>
                      <CardDescription data-testid={`text-category-count-${category.id}`}>
                        {category.subcategories?.length || 0} program types
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.subcategories?.map((subcategory) => (
                      <AccordionItem 
                        key={subcategory.id} 
                        value={`sub-${subcategory.id}`}
                        data-testid={`accordion-item-${subcategory.id}`}
                      >
                        <AccordionTrigger 
                          className="hover:no-underline"
                          data-testid={`accordion-trigger-${subcategory.id}`}
                        >
                          <span className="font-medium text-left" data-testid={`text-subcategory-name-${subcategory.id}`}>
                            {subcategory.name}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-2">
                            {/* Keywords */}
                            {subcategory.keywords && subcategory.keywords.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                  Keywords:
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {subcategory.keywords.map((keyword, idx) => (
                                    <Badge 
                                      key={idx} 
                                      variant="secondary"
                                      data-testid={`badge-keyword-${subcategory.id}-${idx}`}
                                    >
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Example Providers */}
                            {subcategory.example_providers && 
                             Array.isArray(subcategory.example_providers) && 
                             subcategory.example_providers.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                                  Example Providers:
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {subcategory.example_providers.map((provider, idx) => (
                                    <Badge 
                                      key={idx} 
                                      variant="outline"
                                      data-testid={`badge-provider-${subcategory.id}-${idx}`}
                                    >
                                      {String(provider)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Search Link */}
                            <div className="pt-2">
                              <Link 
                                href={`/search?category=${category.slug}&subcategory=${subcategory.slug}`}
                                data-testid={`link-search-${subcategory.id}`}
                              >
                                <span className="text-blue-600 hover:underline text-sm cursor-pointer">
                                  Find {subcategory.name} programs near you →
                                </span>
                              </Link>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

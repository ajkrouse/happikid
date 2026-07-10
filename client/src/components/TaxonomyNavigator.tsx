import { useState } from "react";
import { BookOpen, ChevronRight, Palette, Dumbbell, TreePine, Laptop, Users, Sparkles, Heart, Calendar } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Category } from "../../../types/taxonomy";

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

interface TaxonomyNavigatorProps {
  categories: Category[];
  selectedCategory?: string;
  selectedSubcategory?: string;
  onCategorySelect: (category: string, subcategory: string) => void;
}

export function TaxonomyNavigator({
  categories,
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
}: TaxonomyNavigatorProps) {
  const [openCategory, setOpenCategory] = useState<string>(selectedCategory || "");

  return (
    <div className="rounded-2xl border p-4 bg-brand-white border-brand-evergreen/10" data-testid="taxonomy-navigator">
      <h3 className="font-headline text-lg mb-4 flex items-center gap-2 text-brand-evergreen">
        <BookOpen className="h-5 w-5 text-action-teal" />
        Browse by Category
      </h3>
      <Accordion type="single" collapsible value={openCategory} onValueChange={setOpenCategory}>
        {categories.map((category: Category) => {
          const Icon = categoryIcons[category.slug] || BookOpen;

          return (
            <AccordionItem key={category.id} value={category.slug} data-testid={`accordion-category-${category.slug}`}>
              <AccordionTrigger className="hover:no-underline py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Icon className="h-4 w-4 text-action-teal" />
                  <span className="font-medium text-left text-brand-evergreen">{category.name}</span>
                  <span className="text-xs ml-auto text-brand-evergreen/60">({category.subcategories?.length || 0})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pl-6 space-y-1">
                  {category.subcategories?.map((subcategory) => {
                    const isSelected = selectedCategory === category.slug && selectedSubcategory === subcategory.slug;

                    return (
                      <button
                        key={subcategory.id}
                        onClick={() => onCategorySelect(category.slug, subcategory.slug)}
                        className={`w-full text-left text-sm py-2 px-3 rounded-lg transition-colors ${
                          isSelected
                            ? "font-medium bg-brand-sage text-action-teal"
                            : "hover:opacity-70 text-brand-evergreen"
                        }`}
                        data-testid={`button-subcategory-${subcategory.slug}`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{subcategory.name}</span>
                          {isSelected && <ChevronRight className="h-4 w-4" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

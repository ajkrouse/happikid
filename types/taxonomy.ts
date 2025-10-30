export type Subcategory = {
  id: number;
  name: string;
  slug: string;
  keywords: string[];
  example_providers: unknown[];
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  subcategories: Subcategory[];
};

export type TaxonomyResponse = {
  afterSchoolPrograms: Category[];
};

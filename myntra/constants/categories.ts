export const DEFAULT_CATEGORIES = [
  {
    _id: "fallback-men",
    name: "Men",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&auto=format&fit=crop",
    subcategory: ["T-Shirts", "Shirts", "Jeans", "Trousers", "Suits", "Activewear"],
  },
  {
    _id: "fallback-women",
    name: "Women",
    image:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=500&auto=format&fit=crop",
    subcategory: ["Dresses", "Tops", "Ethnic Wear", "Western Wear", "Activewear"],
  },
  {
    _id: "fallback-kids",
    name: "Kids",
    image:
      "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=500&auto=format&fit=crop",
    subcategory: ["Boys Clothing", "Girls Clothing", "Infants", "Toys", "School Essentials"],
  },
  {
    _id: "fallback-beauty",
    name: "Beauty",
    image:
      "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500&auto=format&fit=crop",
    subcategory: ["Makeup", "Skincare", "Haircare", "Fragrances", "Personal Care"],
  },
];

export function normalizeCategories(categories: any[] = []) {
  const byName = new Map(DEFAULT_CATEGORIES.map((category) => [category.name.toLowerCase(), category]));
  const normalized = categories
    .filter((category) => category?.name)
    .map((category) => {
      const fallback = byName.get(category.name.toLowerCase());
      return {
        ...category,
        image: category.image || fallback?.image || DEFAULT_CATEGORIES[0].image,
        subcategory: category.subcategory?.length ? category.subcategory : fallback?.subcategory || [],
      };
    });

  DEFAULT_CATEGORIES.forEach((fallback) => {
    if (!normalized.some((category) => category.name?.toLowerCase() === fallback.name.toLowerCase())) {
      normalized.push(fallback);
    }
  });

  return normalized;
}

export function isRealCategoryId(categoryId?: string) {
  return /^[a-f\d]{24}$/i.test(categoryId || "");
}

export type DemoProduct = {
  _id: string;
  name: string;
  brand: string;
  price: number;
  discount: string;
  description: string;
  sizes: string[];
  images: string[];
  category: string;
  viewCount: number;
  purchaseCount: number;
};

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    _id: "demo-shoe-nike-air-zoom",
    name: "Air Zoom Running Sneakers",
    brand: "Nike",
    price: 3999,
    discount: "35% OFF",
    description: "Lightweight running sneakers with soft cushioning.",
    sizes: ["UK6", "UK7", "UK8", "UK9", "UK10"],
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop"],
    category: "Shoes",
    viewCount: 980,
    purchaseCount: 240,
  },
  {
    _id: "demo-shoe-adidas-ultraboost",
    name: "Ultraboost Street Shoes",
    brand: "Adidas",
    price: 4599,
    discount: "30% OFF",
    description: "Responsive sneakers for everyday street and running style.",
    sizes: ["UK6", "UK7", "UK8", "UK9", "UK10"],
    images: ["https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&auto=format&fit=crop"],
    category: "Shoes",
    viewCount: 910,
    purchaseCount: 220,
  },
  {
    _id: "demo-shoe-puma-velocity",
    name: "Velocity Nitro Sneakers",
    brand: "Puma",
    price: 3299,
    discount: "40% OFF",
    description: "Sporty sneakers with breathable mesh upper.",
    sizes: ["UK6", "UK7", "UK8", "UK9", "UK10"],
    images: ["https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&auto=format&fit=crop"],
    category: "Shoes",
    viewCount: 870,
    purchaseCount: 210,
  },
  {
    _id: "demo-shoe-campus-runner",
    name: "Street Runner Shoes",
    brand: "Campus",
    price: 1599,
    discount: "55% OFF",
    description: "Budget friendly running shoes with durable sole.",
    sizes: ["UK6", "UK7", "UK8", "UK9", "UK10"],
    images: ["https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&auto=format&fit=crop"],
    category: "Shoes",
    viewCount: 840,
    purchaseCount: 260,
  },
  {
    _id: "demo-shoe-redtape-casual",
    name: "Casual Lace-Up Sneakers",
    brand: "Red Tape",
    price: 2199,
    discount: "50% OFF",
    description: "Smart casual sneakers for jeans and chinos.",
    sizes: ["UK6", "UK7", "UK8", "UK9", "UK10"],
    images: ["https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&auto=format&fit=crop"],
    category: "Shoes",
    viewCount: 780,
    purchaseCount: 190,
  },
  {
    _id: "demo-shoe-reebok-training",
    name: "Flex Training Shoes",
    brand: "Reebok",
    price: 2899,
    discount: "45% OFF",
    description: "Gym-ready shoes with flexible grip and padded collar.",
    sizes: ["UK6", "UK7", "UK8", "UK9", "UK10"],
    images: ["https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=600&auto=format&fit=crop"],
    category: "Shoes",
    viewCount: 730,
    purchaseCount: 175,
  },
  {
    _id: "demo-shoe-skechers-walk",
    name: "Go Walk Comfort Shoes",
    brand: "Skechers",
    price: 3799,
    discount: "25% OFF",
    description: "Slip-on walking shoes with extra comfort foam.",
    sizes: ["UK6", "UK7", "UK8", "UK9", "UK10"],
    images: ["https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&auto=format&fit=crop"],
    category: "Shoes",
    viewCount: 700,
    purchaseCount: 168,
  },
  {
    _id: "demo-shoe-woodland-trek",
    name: "Outdoor Trekking Shoes",
    brand: "Woodland",
    price: 4299,
    discount: "20% OFF",
    description: "Rugged trekking shoes with strong outdoor grip.",
    sizes: ["UK6", "UK7", "UK8", "UK9", "UK10"],
    images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop"],
    category: "Shoes",
    viewCount: 650,
    purchaseCount: 145,
  },
  {
    _id: "demo-shirt-roadster-cotton",
    name: "Premium Cotton T-Shirt",
    brand: "Roadster",
    price: 799,
    discount: "60% OFF",
    description: "Soft cotton t-shirt for daily casual wear.",
    sizes: ["S", "M", "L", "XL"],
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&auto=format&fit=crop"],
    category: "T-Shirts",
    viewCount: 890,
    purchaseCount: 310,
  },
  {
    _id: "demo-shirt-hm-graphic",
    name: "Graphic Oversized T-Shirt",
    brand: "H&M",
    price: 999,
    discount: "45% OFF",
    description: "Oversized graphic tee with relaxed streetwear fit.",
    sizes: ["S", "M", "L", "XL"],
    images: ["https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=600&auto=format&fit=crop"],
    category: "T-Shirts",
    viewCount: 790,
    purchaseCount: 205,
  },
  {
    _id: "demo-shirt-allen-solly",
    name: "Checked Casual Shirt",
    brand: "Allen Solly",
    price: 1499,
    discount: "35% OFF",
    description: "Smart checked shirt for office and weekend plans.",
    sizes: ["S", "M", "L", "XL"],
    images: ["https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop"],
    category: "Shirts",
    viewCount: 610,
    purchaseCount: 135,
  },
  {
    _id: "demo-shirt-peter-england",
    name: "Formal Slim Fit Shirt",
    brand: "Peter England",
    price: 1299,
    discount: "30% OFF",
    description: "Crisp slim fit shirt for formal occasions.",
    sizes: ["S", "M", "L", "XL"],
    images: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop"],
    category: "Shirts",
    viewCount: 580,
    purchaseCount: 125,
  },
  {
    _id: "demo-jacket-levis-denim",
    name: "Classic Denim Jacket",
    brand: "Levis",
    price: 2499,
    discount: "40% OFF",
    description: "Classic denim jacket with a modern fit.",
    sizes: ["S", "M", "L", "XL"],
    images: ["https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?w=600&auto=format&fit=crop"],
    category: "Jackets",
    viewCount: 760,
    purchaseCount: 155,
  },
  {
    _id: "demo-jeans-wrogn-slim",
    name: "Slim Fit Blue Jeans",
    brand: "Wrogn",
    price: 1899,
    discount: "50% OFF",
    description: "Stretch denim jeans with a clean slim fit.",
    sizes: ["30", "32", "34", "36"],
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop"],
    category: "Jeans",
    viewCount: 690,
    purchaseCount: 180,
  },
  {
    _id: "demo-dress-only-summer",
    name: "Summer White Dress",
    brand: "ONLY",
    price: 1299,
    discount: "50% OFF",
    description: "Lightweight summer dress with a soft flowy fit.",
    sizes: ["XS", "S", "M", "L"],
    images: ["https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&auto=format&fit=crop"],
    category: "Dresses",
    viewCount: 820,
    purchaseCount: 195,
  },
  {
    _id: "demo-tee-hrx-training",
    name: "Training Dry Fit Tee",
    brand: "HRX",
    price: 699,
    discount: "55% OFF",
    description: "Workout t-shirt with quick dry fabric.",
    sizes: ["S", "M", "L", "XL"],
    images: ["https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop"],
    category: "T-Shirts",
    viewCount: 720,
    purchaseCount: 225,
  },
];

const SHOE_TERMS = ["shoe", "sneaker", "running", "trainer", "footwear"];
const CLOTHING_TERMS = ["shirt", "t-shirt", "tee", "jeans", "jacket", "dress"];

function textFor(product: any) {
  return `${product?.name || ""} ${product?.brand || ""} ${product?.category || ""}`.toLowerCase();
}

function hasAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

export function getPopularDemoProducts(limit = 10) {
  return [...DEMO_PRODUCTS]
    .sort((a, b) => b.viewCount + b.purchaseCount - (a.viewCount + a.purchaseCount))
    .slice(0, limit);
}

export function getWishlistDemoRecommendations(wishlistItems: any[], limit = 10) {
  const wishlistProducts = wishlistItems.map((item) => item.productId || item);
  const wishlistTexts = wishlistProducts.map(textFor);
  const wantsShoes = wishlistTexts.some((text) => hasAny(text, SHOE_TERMS));
  const wantsClothes = wishlistTexts.some((text) => hasAny(text, CLOTHING_TERMS));
  const wishlistIds = new Set(wishlistProducts.map((product) => product?._id).filter(Boolean));

  const scored = DEMO_PRODUCTS.filter((product) => !wishlistIds.has(product._id)).map((product) => {
    const text = textFor(product);
    let score = product.viewCount + product.purchaseCount;
    if (wantsShoes && hasAny(text, SHOE_TERMS)) score += 2500;
    if (wantsClothes && hasAny(text, CLOTHING_TERMS)) score += 1600;
    return { product, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.product);
}

export function mergeUniqueProducts(products: any[], fallbackProducts = DEMO_PRODUCTS, limit?: number) {
  const seen = new Set<string>();
  const merged = [...products, ...fallbackProducts].filter((product) => {
    if (!product?._id || seen.has(product._id)) return false;
    seen.add(product._id);
    return true;
  });

  return typeof limit === "number" ? merged.slice(0, limit) : merged;
}

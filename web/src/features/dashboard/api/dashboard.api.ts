export interface Product {
  id: string;
  name: string;
  category: string;
  tags: string[];
  price: string;
  originalPrice: string;
  rating: number;
  reviews: number;
  image: string;
  discount: string;
  stock?: number;
  tag?: string;      // New field from mobile
  benefits?: string; // New field from mobile
  delivery?: string; // New field from mobile
}

let MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Floral Summer Dress",
    category: "Dress",
    tags: ["summer", "floral", "casual", "woman"],
    price: "₹1,299",
    originalPrice: "₹2,499",
    rating: 4.7,
    reviews: 412,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80",
    discount: "48% OFF",
    stock: 25,
    tag: "Best Seller",
    benefits: "Floral print • Breathable",
  },
  {
    id: "2",
    name: "High-Waist Skinny Jeans",
    category: "Jeans",
    tags: ["denim", "blue", "casual", "woman"],
    price: "₹1,499",
    originalPrice: "₹2,999",
    rating: 4.8,
    reviews: 523,
    image: "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=500&q=80",
    discount: "50% OFF",
    stock: 12,
    tag: "Trending",
    benefits: "Stretchable • High Rise",
  },
  {
    id: "3",
    name: "Elegant Party Gown",
    category: "Dress",
    tags: ["party", "formal", "elegant", "woman"],
    price: "₹2,999",
    originalPrice: "₹5,999",
    rating: 4.9,
    reviews: 287,
    image: "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=500&q=80",
    discount: "50% OFF",
    stock: 8,
    tag: "Luxury",
    benefits: "Premium Silk • Hand-stitched",
  },
  {
    id: "4",
    name: "Casual Crop Top",
    category: "Tops",
    tags: ["casual", "summer", "white", "woman"],
    price: "₹499",
    originalPrice: "₹999",
    rating: 4.4,
    reviews: 134,
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&q=80",
    discount: "50% OFF",
    stock: 45,
    tag: "Budget Friendly",
    benefits: "100% Cotton • Loose Fit",
  },
];

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const dashboardApi = {
  getProducts: async (): Promise<Product[]> => {
    await delay(600);
    return [...MOCK_PRODUCTS];
  },

  createProduct: async (product: Omit<Product, "id">): Promise<Product> => {
    await delay(1000);
    const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) };
    MOCK_PRODUCTS = [newProduct, ...MOCK_PRODUCTS];
    return newProduct;
  },

  updateProduct: async (id: string, updates: Partial<Product>): Promise<Product> => {
    await delay(1000);
    const index = MOCK_PRODUCTS.findIndex((p) => p.id === id);
    if (index === -1) throw new Error("Product not found");
    MOCK_PRODUCTS[index] = { ...MOCK_PRODUCTS[index], ...updates };
    return MOCK_PRODUCTS[index];
  },

  deleteProduct: async (id: string): Promise<void> => {
    await delay(600);
    MOCK_PRODUCTS = MOCK_PRODUCTS.filter((p) => p.id !== id);
  },
};

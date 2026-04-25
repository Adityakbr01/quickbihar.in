import { Product } from "../../home/lib/mockData";

export interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export const INITIAL_CART: CartItem[] = [
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
    quantity: 1,
    selectedSize: "M",
    selectedColor: "Floral Pink"
  },
  {
    id: "3",
    name: "High-Waist Skinny Jeans",
    category: "Jeans",
    tags: ["denim", "blue", "casual", "woman"],
    price: "₹1,499",
    originalPrice: "₹2,999",
    rating: 4.8,
    reviews: 523,
    image: "https://images.unsplash.com/photo-1582418702059-97ebafb35d09?w=500&q=80",
    discount: "50% OFF",
    quantity: 2,
    selectedSize: "32",
    selectedColor: "Indigo Blue"
  }
];

import { IProduct } from "../../types/product.types";

// ─── MOCK PRODUCT (Fallback for testing) ────────────────────
export const MOCK_PRODUCT: Partial<IProduct> = {
  title: "Men's Classic Winter Jacket",
  brand: "QuickBihar Outfitters",
  price: 999,
  originalPrice: 1699,
  discountPercentage: 41,
  description:
    "Elevate your winter wardrobe with this meticulously crafted jacket. Featuring a robust build designed to keep you warm without sacrificing style. Made with premium quality materials for lasting comfort.",
  images: [
    {
      url: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800",
      fileId: "1",
    },
    {
      url: "https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=800",
      fileId: "2",
    },
  ],
  variants: [
    { size: "S", color: "Black", stock: 9, sku: "S-BLK" },
    { size: "M", color: "Navy Blue", stock: 3, sku: "M-NVY" },
    { size: "L", color: "Navy Blue", stock: 0, sku: "L-NVY" },
    { size: "XL", color: "Black", stock: 5, sku: "XL-BLK" },
  ],
  ratings: { average: 4.3, count: 124 },
  details: {
    fit: "Regular Fit",
    pattern: "Solid",
    sleeve: "Full Sleeve",
    washCare: "Machine Wash",
  },
  deliveryInfo: { estimatedDays: 3, isExpressAvailable: true, isCodAvailable: true },
  tags: ["Winter", "Jacket"],
};

// ─── MOCK REVIEWS ─────────────────────────────────────────────
export const MOCK_REVIEWS = [
  {
    id: "r1",
    user: "Aisha S.",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    rating: 5,
    date: "12 Oct 2025",
    title: "Perfect fit!",
    comment:
      "Absolutely love the quality! The fabric feels premium and it fits perfectly. Will definitely order again.",
    images: [
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300",
    ],
    helpful: 24,
  },
  {
    id: "r2",
    user: "Rahul V.",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
    rating: 4,
    date: "05 Oct 2025",
    title: "Good value for money",
    comment:
      "Great product at this price point. Delivery was slightly delayed but the quality makes up for it.",
    images: [],
    helpful: 12,
  },
  {
    id: "r3",
    user: "Priya M.",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150&h=150",
    rating: 5,
    date: "28 Sep 2025",
    title: "Exceeded expectations",
    comment:
      "Looks exactly like the pictures. Color is vibrant and stitching is neat. Highly recommended!",
    images: [
      "https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=300",
    ],
    helpful: 18,
  },
];

// ─── TRUST POLICY ICONS ──────────────────────────────────────
export const TRUST_POLICIES = [
  { icon: "refresh-outline" as const, label: "7 Day\nReturns" },
  { icon: "shield-checkmark-outline" as const, label: "Genuine\nProduct" },
  { icon: "card-outline" as const, label: "Secure\nPayment" },
];

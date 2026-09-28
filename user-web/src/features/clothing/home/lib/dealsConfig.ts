import type { LucideIcon } from "lucide-react";
import {
  Shirt,
  Smartphone,
  Glasses,
  House,
  Sparkles,
  User,
  Smile,
  Tag,
  Gift,
  StarHalf,
} from "lucide-react";
import heartImg from "@/assets/images/campaigns/heart.webp";
import bagImg from "@/assets/images/campaigns/bag.webp";
import discountTagImg from "@/assets/images/campaigns/DiscountTag.webp";
import deliveryCarImg from "@/assets/images/campaigns/DeliveryCar.webp";
import bellImg from "@/assets/images/campaigns/bell.webp";

export const CAMPAIGNS = [
  {
    id: "1",
    title: "For You",
    image: heartImg,
  },
  {
    id: "2",
    title: "What's New",
    image: bagImg,
  },
  {
    id: "3",
    title: "Deal of the Day",
    image: discountTagImg,
  },
  {
    id: "4",
    title: "Express Delivery",
    image: deliveryCarImg,
  },
  {
    id: "5",
    title: "Get Notify",
    image: bellImg,
  },
];

export const CATEGORY_OPTIONS: { title: string; icon: LucideIcon }[] = [
  { title: "Topwear", icon: Shirt },
  { title: "Tech Wear", icon: Smartphone },
  { title: "Accessories", icon: Glasses },
  { title: "Loungewear", icon: House },
  { title: "Ethnic", icon: Sparkles },
];

export const GENDER_OPTIONS: { title: string; icon: LucideIcon }[] = [
  { title: "Men", icon: User },
  { title: "Women", icon: User },
  { title: "Unisex", icon: User },
  { title: "Kids", icon: Smile },
];

export const FILTERS: { title: string; icon: LucideIcon | false }[] = [
  { title: "Gender", icon: false },
  { title: "Categories", icon: false },
  { title: "₹1000 and above", icon: false },
  { title: "₹500 - ₹999", icon: false },
  { title: "₹200 - ₹499", icon: false },
  { title: "Under ₹199", icon: false },
  { title: "Rising Star", icon: Tag },
  { title: "Top Brand", icon: Gift },
  { title: "Top Rated", icon: StarHalf },
];

export const DEAL_PRODUCTS = [
  {
    id: "1",
    title: "Reimagined Silk Maxi Dress",
    benefits: "Floral print • Breathable",
    rating: 4.8,
    reviews: 124,
    price: "₹899",
    originalPrice: "₹1,999",
    discount: "55% OFF",
    tag: "Best Seller",
    delivery: "Express delivery",
    image:
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&q=80",
  },
  {
    id: "2",
    title: "Men's Urban Street Jacket",
    benefits: "Water-resistant • Deep Pockets",
    rating: 4.5,
    reviews: 89,
    price: "₹1,499",
    originalPrice: "₹2,999",
    discount: "50% OFF",
    tag: "Trending",
    delivery: "2 Day delivery",
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&q=80",
  },
  {
    id: "3",
    title: "Oversized Cotton T-Shirt",
    benefits: "100% Cotton • Relaxed Fit",
    rating: 4.9,
    reviews: 432,
    price: "₹349",
    originalPrice: "₹499",
    discount: "30% OFF",
    tag: "New Arrival",
    delivery: "Next Day Delivery",
    image:
      "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=500&q=80",
  },
  {
    id: "4",
    title: "Vintage Denim Jeans",
    benefits: "Stretchable • High Rise",
    rating: 4.6,
    reviews: 210,
    price: "₹1,199",
    originalPrice: "₹2,499",
    discount: "52% OFF",
    tag: "Limited Stock",
    delivery: "",
    image:
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80",
  },
];

export type DealProduct = (typeof DEAL_PRODUCTS)[0];

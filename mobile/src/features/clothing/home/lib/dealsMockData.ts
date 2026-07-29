import {
  DiscountIcon,
  StarHalfIcon,
  GiftIcon,
  Shirt01Icon,
  SmartPhone01Icon,
  GlassesIcon,
  Home01Icon,
  SparklesIcon,
  ManIcon,
  WomanIcon,
  UserIcon,
  KidIcon,
} from "@hugeicons/core-free-icons";

export const CAMPAIGNS = [
  {
    id: "1",
    title: "For You",
    image: require("@/assets/images/campaigns/heart.png"),
  },
  {
    id: "2",
    title: "What's New",
    image: require("@/assets/images/campaigns/bag.png"),
  },
  {
    id: "3",
    title: "Deal of the Day",
    image: require("@/assets/images/campaigns/DiscountTag.png"),
  },
  {
    id: "4",
    title: "Express Delivery",
    image: require("@/assets/images/campaigns/DeliveryCar.png"),
  },
  {
    id: "5",
    title: "Get Notify",
    image: require("@/assets/images/campaigns/bell.png"),
  },
];

export const CATEGORY_OPTIONS = [
  { title: "Topwear", icon: Shirt01Icon },
  { title: "Tech Wear", icon: SmartPhone01Icon },
  { title: "Accessories", icon: GlassesIcon },
  { title: "Loungewear", icon: Home01Icon },
  { title: "Ethnic", icon: SparklesIcon },
];

export const GENDER_OPTIONS = [
  { title: "Men", icon: ManIcon },
  { title: "Women", icon: WomanIcon },
  { title: "Unisex", icon: UserIcon },
  { title: "Kids", icon: KidIcon },
];

export const FILTERS = [
  { title: "Gender", icon: false },
  { title: "Categories", icon: false },
  { title: "₹1000 and above", icon: false },
  { title: "₹500 - ₹999", icon: false },
  { title: "₹200 - ₹499", icon: false },
  { title: "Under ₹199", icon: false },
  { title: "Rising Star", icon: DiscountIcon },
  { title: "Top Brand", icon: GiftIcon },
  { title: "Top Rated", icon: StarHalfIcon },
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

import React, { useState } from "react";
import { useTheme } from "@/theme/Provider/ThemeProvider";
import { triggerHaptic } from "@/lib/haptics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Flame,
  Star,
  Clock,
  Plus,
  Utensils,
  Search,
  Check,
  Sparkles,
} from "lucide-react";

interface FoodItem {
  id: string;
  title: string;
  category: string;
  rating: string;
  reviews: number;
  price: number;
  originalPrice: number;
  time: string;
  isVeg: boolean;
  image: string;
  description: string;
}

const FOOD_CATEGORIES = [
  "All",
  "Bihari Special",
  "Biryani & Rice",
  "North Indian",
  "Breakfast & Snacks",
  "Sweets & Desserts",
];

const MOCK_FOOD_ITEMS: FoodItem[] = [
  {
    id: "f1",
    title: "Special Litti Chokha Thali",
    category: "Bihari Special",
    rating: "4.9",
    reviews: 1420,
    price: 120,
    originalPrice: 160,
    time: "18 mins",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&q=80",
    description: "Authentic roasted sattu littis served with spicy baingan chokha, aloo chokha, ghee, and mint chutney.",
  },
  {
    id: "f2",
    title: "Champaran Ahuna Handi Mutton",
    category: "Bihari Special",
    rating: "4.9",
    reviews: 980,
    price: 360,
    originalPrice: 420,
    time: "25 mins",
    isVeg: false,
    image: "https://images.unsplash.com/photo-1545247181-516773cae754?w=500&q=80",
    description: "Slow-cooked mutton in sealed earthen clay pots with whole garlic cloves and mustard oil.",
  },
  {
    id: "f3",
    title: "Special Sattu Paratha with Dahi",
    category: "Breakfast & Snacks",
    rating: "4.8",
    reviews: 730,
    price: 90,
    originalPrice: 120,
    time: "15 mins",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&q=80",
    description: "2 large ghee-tossed sattu parathas served with thick sweet curd, mixed pickle, and green chili.",
  },
  {
    id: "f4",
    title: "Hyderabadi Dum Chicken Biryani",
    category: "Biryani & Rice",
    rating: "4.9",
    reviews: 2150,
    price: 280,
    originalPrice: 340,
    time: "20 mins",
    isVeg: false,
    image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80",
    description: "Fragrant long-grain basmati rice layered with tender marinated chicken pieces and served with mirchi ka salan.",
  },
  {
    id: "f5",
    title: "Paneer Butter Masala & Naan",
    category: "North Indian",
    rating: "4.7",
    reviews: 840,
    price: 240,
    originalPrice: 290,
    time: "20 mins",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&q=80",
    description: "Rich and creamy tomato butter gravy with soft cottage cheese cubes, served with 2 butter naans.",
  },
  {
    id: "f6",
    title: "Silao Khaja & Thekua Box",
    category: "Sweets & Desserts",
    rating: "4.9",
    reviews: 620,
    price: 150,
    originalPrice: 190,
    time: "15 mins",
    isVeg: true,
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&q=80",
    description: "Crispy multi-layered sweet Silao Khaja and homemade jaggery Thekua directly from Nalanda bakers.",
  },
];

export const FoodPage: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [cartItems, setCartItems] = useState<Record<string, number>>({});

  const filteredItems =
    selectedCategory === "All"
      ? MOCK_FOOD_ITEMS
      : MOCK_FOOD_ITEMS.filter((item) => item.category === selectedCategory);

  const handleAddToCart = (item: FoodItem) => {
    triggerHaptic("medium");
    setCartItems((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
    toast.success(`Added ${item.title} to cart!`, {
      description: `₹${item.price} • Hot & fresh meal added.`,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Food Hero Banner */}
      <section
        className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all ${
          isDark
            ? "bg-[rgba(225,29,72,0.12)] border-[rgba(225,29,72,0.3)] text-rose-100"
            : "bg-[#FFF1F2] border-[#FECDD3] text-rose-950"
        }`}
      >
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E11D48] text-white text-xs font-bold shadow-xs">
            <Flame className="w-3.5 h-3.5 fill-white" />
            <span>QuickBihar Food Market • 20 Min Doorstep Delivery</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Delicious Local Bihari Delicacies & Fresh Meals 🍔
          </h1>

          <p className="text-sm opacity-90 leading-relaxed">
            Order authentic Champaran Ahuna Handi, hot Sattu Litti Chokha, aromatic Biryanis, and North Indian favorites prepared by trusted local chefs in Patna.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#E11D48]" /> Average 18-24 mins
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#E11D48]" /> No Minimum Order
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-[#EAB308] fill-[#EAB308]" /> 4.8+ Rated Quality
            </span>
          </div>
        </div>
      </section>

      {/* Category Pills Filter */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Explore Food Categories</h2>
          <span className="text-xs text-muted-foreground">{filteredItems.length} dishes available</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {FOOD_CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  triggerHaptic("selection");
                  setSelectedCategory(cat);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#E11D48] text-white shadow-sm scale-105"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* Food Items Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Utensils className="w-4 h-4 text-[#E11D48]" />
            <h2 className="text-lg font-bold tracking-tight">Popular Meals Near You</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const qty = cartItems[item.id] || 0;

            return (
              <Card
                key={item.id}
                className="overflow-hidden group border hover:border-[#E11D48]/50 hover:shadow-lg transition-all duration-300 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  {/* Image & Badges */}
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span
                        className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center p-0.5 bg-background shadow-xs ${
                          item.isVeg ? "border-green-600" : "border-red-600"
                        }`}
                        title={item.isVeg ? "Pure Veg" : "Non-Veg"}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.isVeg ? "bg-green-600" : "bg-red-600"
                          }`}
                        />
                      </span>
                      <Badge className="bg-background/90 text-foreground backdrop-blur text-[10px] font-bold">
                        {item.category}
                      </Badge>
                    </div>

                    <div className="absolute bottom-3 right-3 bg-background/95 backdrop-blur px-2 py-0.5 rounded-lg flex items-center gap-1 text-[11px] font-bold shadow-xs">
                      <Clock className="w-3 h-3 text-[#E11D48]" />
                      <span>{item.time}</span>
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm text-foreground group-hover:text-[#E11D48] transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded text-xs font-bold">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{item.rating}</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </CardContent>
                </div>

                {/* Footer Price & Add Button */}
                <div className="p-4 pt-0 flex items-center justify-between border-t border-border/40 mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-extrabold text-[#E11D48]">₹{item.price}</span>
                    <span className="text-xs text-muted-foreground line-through">₹{item.originalPrice}</span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleAddToCart(item)}
                    className="rounded-xl bg-[#E11D48] hover:bg-[#E11D48]/90 text-white font-bold text-xs h-8 px-3 cursor-pointer shadow-xs"
                  >
                    {qty > 0 ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Added ({qty})
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Plus className="w-3.5 h-3.5" /> Add
                      </span>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default FoodPage;

import React, { useState } from "react";
import { useColors } from "@/features/Jewelery/hooks/useColors";
import { triggerHaptic } from "@/lib/haptics";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Sparkles,
  Heart,
  ShieldCheck,
  Award,
  Truck,
  RotateCcw,
  Star,
  ShoppingBag,
} from "lucide-react";

interface JeweleryItem {
  id: string;
  name: string;
  subtitle: string;
  metal: string;
  purity: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  image: string;
  collection: string;
}

const JEWELERY_COLLECTIONS = [
  "All Collections",
  "Heritage Gold",
  "Kundan & Polki",
  "Solitaire Diamonds",
  "Bridal Sets",
  "Silver & Everyday",
];

const MOCK_JEWELERY: JeweleryItem[] = [
  {
    id: "j1",
    name: "Aadya Temple Gold Choker",
    subtitle: "Handcrafted Antique Finish",
    metal: "Yellow Gold",
    purity: "22KT BIS Hallmarked",
    price: 84500,
    originalPrice: 92000,
    rating: 4.9,
    reviews: 148,
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&q=80",
    collection: "Heritage Gold",
  },
  {
    id: "j2",
    name: "Royal Meenakari Jhumkas",
    subtitle: "Ruby & Emerald Enamel Accents",
    metal: "Yellow Gold",
    purity: "22KT BIS Hallmarked",
    price: 36200,
    originalPrice: 41000,
    rating: 5.0,
    reviews: 215,
    image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?w=600&q=80",
    collection: "Kundan & Polki",
  },
  {
    id: "j3",
    name: "Eternity Diamond Solitaire Ring",
    subtitle: "IGI Certified VVS1 Clarity",
    metal: "Rose Gold",
    purity: "18KT Gold • 0.75ct Diamond",
    price: 58900,
    originalPrice: 65000,
    rating: 4.8,
    reviews: 94,
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
    collection: "Solitaire Diamonds",
  },
  {
    id: "j4",
    name: "Padmavati Bridal Kundan Necklace",
    subtitle: "Complete Bridal Necklace with Matching Earrings",
    metal: "Gold Plated Silver",
    purity: "Heritage Polki Stones",
    price: 49500,
    originalPrice: 56000,
    rating: 4.9,
    reviews: 182,
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",
    collection: "Bridal Sets",
  },
  {
    id: "j5",
    name: "Ananya Diamond Pendant & Chain",
    subtitle: "Minimalist Everyday Luxury",
    metal: "White Gold",
    purity: "18KT Gold • SI IJ Diamond",
    price: 24800,
    originalPrice: 28500,
    rating: 4.7,
    reviews: 130,
    image: "https://images.unsplash.com/photo-1598560917505-59a3ad559071?w=600&q=80",
    collection: "Silver & Everyday",
  },
  {
    id: "j6",
    name: "Navratna Traditional Gold Kada",
    subtitle: "9 Gemstones Embedded Bangle",
    metal: "Yellow Gold",
    purity: "22KT BIS Hallmarked",
    price: 68000,
    originalPrice: 74000,
    rating: 5.0,
    reviews: 77,
    image: "https://images.unsplash.com/photo-1611591475879-16629ecaa825?w=600&q=80",
    collection: "Heritage Gold",
  },
];

export const JeweleryPage: React.FC = () => {
  const colors = useColors();
  const [selectedCollection, setSelectedCollection] = useState("All Collections");
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [cartIds, setCartIds] = useState<string[]>([]);

  const filteredItems =
    selectedCollection === "All Collections"
      ? MOCK_JEWELERY
      : MOCK_JEWELERY.filter((item) => item.collection === selectedCollection);

  const toggleWishlist = (id: string, name: string) => {
    triggerHaptic("selection");
    setWishlist((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        toast.info(`Removed ${name} from Wishlist`);
        return prev.filter((item) => item !== id);
      } else {
        toast.success(`Saved ${name} to Wishlist!`);
        return [...prev, id];
      }
    });
  };

  const handleAddToCart = (item: JeweleryItem) => {
    triggerHaptic("success");
    setCartIds((prev) => [...prev, item.id]);
    toast.success(`Added ${item.name} to Cart`, {
      description: `₹${item.price.toLocaleString("en-IN")} • Insured delivery included.`,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Luxury Announcement Bar */}
      <div
        className="py-2.5 px-4 text-center text-xs font-bold tracking-wider uppercase rounded-xl flex items-center justify-center gap-3"
        style={{
          backgroundColor: colors.emerald || "#1C3A2F",
          color: colors.champagne || "#F0E4CC",
        }}
      >
        <Sparkles className="w-3.5 h-3.5 text-[#D4A85A]" />
        <span>100% Certified 22KT Gold • IGI Certified Diamonds • Zero Making Charges on First Order</span>
        <Sparkles className="w-3.5 h-3.5 text-[#D4A85A]" />
      </div>

      {/* Hero Showcase Banner */}
      <section
        className="p-8 sm:p-12 rounded-3xl border relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
        style={{
          backgroundColor: colors.pearl || "#EDE8DF",
          borderColor: colors.border || "#C4BDB4",
          color: colors.text || "#1A1614",
        }}
      >
        <div className="max-w-xl space-y-4">
          <Badge
            className="text-xs uppercase tracking-widest font-extrabold px-3 py-1"
            style={{ backgroundColor: colors.gold || "#B8924A", color: "#ffffff" }}
          >
            Timeless Heritage Collection
          </Badge>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Exquisite Jewellery Crafted For Royalty
          </h1>

          <p className="text-sm opacity-85 leading-relaxed">
            Discover Bihar’s finest collection of certified 22KT Gold necklaces, antique Temple ornaments, Polki bridal sets, and ethically sourced solitaire diamonds.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs font-bold border-t border-black/10 dark:border-white/10">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#B8924A]" />
              <span>BIS Hallmarked</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#B8924A]" />
              <span>IGI Certified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-[#B8924A]" />
              <span>Insured Transit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-[#B8924A]" />
              <span>15-Day Exchange</span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-80 h-64 sm:h-80 rounded-2xl overflow-hidden shadow-xl border-4 border-white/80 dark:border-black/40 shrink-0">
          <img
            src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80"
            alt="Heritage Jewelry"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* Collection Filters */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight">Curated Collections</h2>
          <span className="text-xs text-muted-foreground">{filteredItems.length} timeless designs</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {JEWELERY_COLLECTIONS.map((col) => {
            const isActive = selectedCollection === col;
            return (
              <button
                key={col}
                onClick={() => {
                  triggerHaptic("selection");
                  setSelectedCollection(col);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#B8924A] text-white shadow-sm scale-105"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {col}
              </button>
            );
          })}
        </div>
      </section>

      {/* Jewelry Catalog Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const isLiked = wishlist.includes(item.id);
          const inCart = cartIds.includes(item.id);

          return (
            <Card
              key={item.id}
              className="overflow-hidden group border hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col justify-between"
              style={{
                backgroundColor: colors.card || undefined,
                borderColor: colors.border || undefined,
              }}
            >
              <div>
                {/* Product Image */}
                <div className="relative aspect-square w-full overflow-hidden bg-muted">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <button
                    onClick={() => toggleWishlist(item.id, item.name)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/90 backdrop-blur flex items-center justify-center shadow-sm cursor-pointer transition-transform hover:scale-110"
                    title="Add to Wishlist"
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        isLiked ? "fill-rose-500 text-rose-500" : "text-muted-foreground"
                      }`}
                    />
                  </button>

                  <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider text-[#B8924A] shadow-xs">
                    {item.purity}
                  </div>
                </div>

                {/* Details */}
                <CardContent className="p-5 space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    {item.collection}
                  </span>
                  <h3 className="font-extrabold text-base text-foreground group-hover:text-[#B8924A] transition-colors line-clamp-1">
                    {item.name}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {item.subtitle}
                  </p>

                  <div className="flex items-center gap-1.5 pt-1">
                    <div className="flex text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-foreground">({item.reviews})</span>
                  </div>
                </CardContent>
              </div>

              {/* Price & Action */}
              <div className="p-5 pt-0 flex items-center justify-between border-t border-border/40 mt-2">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-[#B8924A]">
                      ₹{item.price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-muted-foreground line-through">
                      ₹{item.originalPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                    Save ₹{(item.originalPrice - item.price).toLocaleString("en-IN")}
                  </span>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleAddToCart(item)}
                  className="rounded-xl bg-[#B8924A] hover:bg-[#B8924A]/90 text-white font-bold text-xs h-9 px-4 cursor-pointer shadow-xs"
                >
                  <ShoppingBag className="w-4 h-4 mr-1.5" />
                  {inCart ? "In Bag" : "Add to Bag"}
                </Button>
              </div>
            </Card>
          );
        })}
      </section>
    </div>
  );
};

export default JeweleryPage;

import React, { useEffect, useState } from "react";
import { useTheme } from "@/src/theme/Provider/ThemeProvider";
import HomeHeader from "@/src/features/clothing/home/components/HomeHeader";
import { Flame, Pizza, Sandwich, Star, UtensilsCrossed } from "lucide-react";

const MOCK_FOOD_ITEMS = [
  { id: "1", title: "Litti Chokha Special", category: "Bihari Delicacy", rating: "4.9", price: "₹120", icon: Sandwich },
  { id: "2", title: "Paneer Butter Masala", category: "North Indian", rating: "4.7", price: "₹240", icon: Pizza },
  { id: "3", title: "Sattu Paratha & Dahi", category: "Breakfast", rating: "4.8", price: "₹90", icon: UtensilsCrossed },
  { id: "4", title: "Special Chicken Biryani", category: "Biryani", rating: "4.9", price: "₹280", icon: Flame },
];

export const FoodHomeScreen = () => {
  const theme = useTheme() as any;
  const isDark = theme.isDark ?? theme.text === "#ffffff";
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setIsReady(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <HomeHeader />
      <div className="overflow-auto">
        <div className="flex flex-col gap-4 p-4">
          <div
            className="flex flex-row items-center gap-4 rounded-2xl border p-4"
            style={
              isDark
                ? { backgroundColor: "rgba(225,29,72,0.14)", borderColor: "rgba(225,29,72,0.40)" }
                : { backgroundColor: "#FFF1F2", borderColor: "#FECDD3" }
            }
          >
            <Sandwich size={40} color="#E11D48" />
            <div className="flex-1">
              <h1
                className="text-lg font-extrabold"
                style={{ color: isDark ? "#FDA4AF" : "#9F1239" }}
              >
                Quick Bihar Food Market 🍔
              </h1>
              <p
                className="mt-0.5 text-[13px]"
                style={{ color: isDark ? "#FB7185" : "#BE123C" }}
              >
                Hot & fresh meals delivered in 20 mins
              </p>
            </div>
          </div>

          <h2 className="text-lg font-extrabold" style={{ color: theme.text }}>
            Popular Near You
          </h2>

          {!isReady ? (
            <div className="flex items-center justify-center py-10">
              <span
                className="block h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
                style={{ borderColor: "rgba(225,29,72,0.25)", borderTopColor: "#E11D48" }}
              />
            </div>
          ) : (
            <div className="flex flex-row flex-wrap gap-3">
              {MOCK_FOOD_ITEMS.map((item) => (
                <div
                  key={item.id}
                  className="flex w-[48%] flex-col gap-2 rounded-2xl border p-3"
                  style={{
                    backgroundColor: theme.secondaryBackground,
                    borderColor: theme.border,
                  }}
                >
                  <div
                    className="flex h-[90px] items-center justify-center rounded-xl"
                    style={{ backgroundColor: isDark ? "rgba(225,29,72,0.18)" : "#FFE4E6" }}
                  >
                    <item.icon size={28} color="#E11D48" />
                  </div>
                  <p className="text-sm font-bold" style={{ color: theme.text }}>
                    {item.title}
                  </p>
                  <p className="text-xs" style={{ color: theme.tertiaryText }}>
                    {item.category}
                  </p>
                  <div className="mt-1 flex flex-row items-center justify-between">
                    <span className="text-[15px] font-extrabold text-[#E11D48]">
                      {item.price}
                    </span>
                    <div className="flex flex-row items-center gap-1">
                      <Star size={12} color="#EAB308" fill="#EAB308" />
                      <span className="text-xs font-bold">{item.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

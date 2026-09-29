import React from "react";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import { IProduct } from "../../../types/product.types";

interface SimilarProductsProps {
  products: IProduct[];
  theme: any;
}

export const SimilarProducts = ({ products, theme }: SimilarProductsProps) => {
  const navigate = useNavigate();

  if (!products || products.length === 0) return null;

  return (
    <section className="py-4" style={{ backgroundColor: theme.background }}>
      <h2 className="px-4 text-[13px] font-bold tracking-[0.8px]" style={{ color: theme.text }}>
        SIMILAR PRODUCTS
      </h2>
      <div className="mt-3 flex flex-row gap-3 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
        {products.map((item) => (
          <button
            key={item._id}
            type="button"
            onClick={() =>
              goTo(navigate, {
                pathname: "/product/[id]",
                params: { id: (item as any).slug || item._id },
              })
            }
            className="w-[150px] shrink-0 cursor-pointer overflow-hidden rounded-[10px] border text-left"
            style={{ backgroundColor: theme.background, borderColor: theme.border }}
          >
            <img
              src={item.images?.[0]?.url}
              alt={item.title}
              className="h-[180px] w-full object-cover"
            />
            <span className="block gap-1 p-2.5">
              <span className="block truncate text-[11px] font-bold tracking-wide uppercase" style={{ color: theme.secondaryText }}>
                {item.brand}
              </span>
              <span className="line-clamp-2 block text-xs leading-4" style={{ color: theme.text }}>
                {item.title}
              </span>
              <span className="mt-1 flex flex-row items-baseline gap-1">
                <span className="text-[13px] font-extrabold" style={{ color: theme.text }}>
                  ₹{item.price?.toLocaleString()}
                </span>
                {item.originalPrice && item.originalPrice > item.price && (
                  <span className="text-[11px] line-through" style={{ color: theme.tertiaryText }}>
                    ₹{item.originalPrice.toLocaleString()}
                  </span>
                )}
              </span>
              {item.ratings && item.ratings.count > 0 && (
                <span className="mt-1 flex flex-row items-center gap-1">
                  <span className="flex flex-row items-center gap-0.5 rounded bg-[#34C759] px-1 py-px">
                    <span className="text-[10px] font-extrabold text-white">
                      {item.ratings.average}
                    </span>
                    <Star size={9} color="#fff" fill="#fff" />
                  </span>
                  <span className="text-[10px]" style={{ color: theme.tertiaryText }}>
                    ({item.ratings.count})
                  </span>
                </span>
              )}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};

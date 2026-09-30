import { Heart, Image as ImageIcon, Star } from "lucide-react";
import * as Haptics from "@/lib/haptics";
import { Link, useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";
import React from "react";
import { cn } from "@/src/lib/utils";
import { useWindowWidth } from "@/src/utils/responsive";

import { useCart } from "@/src/features/Jewelery/context/CartContext";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";
import { Product } from "@/src/features/Jewelery/data/products";
import { useColors } from "@/src/features/Jewelery/hooks/useColors";
import { APP_CURRENCY } from "@/src/constants";

interface ProductCardProps {
  product: Product;
  style?: React.CSSProperties;
}

function resolveSrc(source: any): string | undefined {
  if (!source) return undefined;
  if (typeof source === "string") return source;
  if (typeof source === "object" && typeof source.uri === "string") return source.uri;
  return source as any;
}

function Stars({ rating }: { rating: number }) {
  const colors = useColors();
  return (
    <div className="flex flex-row">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={9} color={s <= Math.round(rating) ? colors.gold : colors.midGray} className="mr-[1px]" />
      ))}
    </div>
  );
}

export function ProductCard({ product, style }: ProductCardProps) {
  const navigate = useNavigate();
  const colors = useColors();
  // Live viewport width — a module-level Dimensions.get() goes stale on
  // resize/device-emulation/rotation and makes grid cards overflow the page.
  const windowWidth = useWindowWidth();
  const cardWidth = (windowWidth - 48) / 2;
  const { toggleWishlist, isWishlisted, addToCart } = useCart();
  const wishlisted = isWishlisted(product.id);
  const [justAdded, setJustAdded] = React.useState(false);
  const addedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    [],
  );

  const { isAuthenticated } = useAuthStore();
  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleWishlist(product);
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await addToCart(product);
    if (!ok) return;
    setJustAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setJustAdded(false), 1500);
  };

  const handlePress = () => {
    goTo(navigate, `/jewelery/product/${product.id}` as any);
  };

  const src = resolveSrc(product.image);
  const productHref = `/jewelery/product/${product.id}`;

  return (
    <div
      role="link"
      tabIndex={0}
      aria-label={product.name}
      onClick={handlePress}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handlePress();
        }
      }}
      className={cn("mb-4 cursor-pointer overflow-hidden rounded-[2px] transition-opacity active:opacity-92")}
      style={{ backgroundColor: colors.pearl, width: cardWidth, ...style }}
    >
      {/* Crawlable anchors (audit: no-outgoing-links) — outer div keeps UX. */}
      <div className="relative aspect-[3/4]">
        <Link
          to={productHref}
          aria-label={product.name}
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 block"
        >
          {src ? (
            <img
              src={src}
              alt={`${product.name} - Shop Online in Bihar`}
              title={`${product.name} | QuickBihar Jewellery`}
              className="h-full w-full object-cover"
              draggable={false}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ backgroundColor: colors.champagne }}
            >
              <ImageIcon size={28} color={colors.gold} />
            </div>
          )}
        </Link>
        {product.badge && (
          <div
            className="absolute top-2 left-2 rounded-[1px] px-[7px] py-[3px]"
            style={{ backgroundColor: colors.gold }}
          >
            <span
              className="text-[8px] tracking-[1.2px]"
              style={{ color: colors.onBrand }}
            >
              {product.badge.toUpperCase()}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
          className="absolute top-2 right-2 flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(247,243,236,0.85)" }}
        >
          <Heart
            size={16}
            color={wishlisted ? colors.gold : colors.warmGray}
            style={wishlisted ? { opacity: 1 } : { opacity: 0.7 }}
          />
        </button>
        {product.inStock <= 5 && (
          <div
            className="absolute bottom-2 left-2 rounded-[1px] px-1.5 py-0.5"
            style={{ backgroundColor: colors.maroon }}
          >
            <span
              className="text-[8px] tracking-[0.5px]"
              style={{ color: "#fff" }}
            >
              Only {product.inStock} left
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-[3px] p-2.5">
        <Link
          to={productHref}
          onClick={(e) => e.stopPropagation()}
          className="line-clamp-1 text-[15px] leading-[19px] underline-offset-2 hover:underline"
          style={{ color: colors.ink, fontFamily: "CormorantGaramond_500Medium_Italic" }}
        >
          {product.name}
        </Link>
        <span
          className="line-clamp-1 text-[11px] tracking-[0.2px]"
          style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
        >
          {product.metal}{product.stone ? ` · ${product.stone}` : ""}
        </span>
        <div className="mt-0.5 flex flex-row items-center gap-1">
          <Stars rating={product.rating} />
          <span
            className="text-[10px]"
            style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
          >
            ({product.reviewCount})
          </span>
        </div>
        <div className="mt-0.5 flex flex-row items-center gap-1.5">
          <span
            className="text-sm"
            style={{ color: colors.ink, fontFamily: "DMSans_500Medium" }}
          >
            {APP_CURRENCY}{product.price.toLocaleString("en-IN")}
          </span>
          {product.originalPrice && (
            <span
              className="text-[11px] line-through"
              style={{ color: colors.warmGray, fontFamily: "DMSans_400Regular" }}
            >
              {APP_CURRENCY}{product.originalPrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          className="mt-1.5 cursor-pointer rounded-[1px] border py-[7px] text-center transition-colors active:opacity-90"
          style={{
            borderColor: colors.gold,
            backgroundColor:
              justAdded ? colors.champagne : "transparent",
          }}
        >
          <span
            className="text-[10px] tracking-[1.5px]"
            style={{ color: justAdded ? colors.ink : colors.gold, fontFamily: "DMSans_400Regular" }}
          >
            {justAdded ? "Added ✓" : "Add to Bag"}
          </span>
        </button>
      </div>
    </div>
  );
}

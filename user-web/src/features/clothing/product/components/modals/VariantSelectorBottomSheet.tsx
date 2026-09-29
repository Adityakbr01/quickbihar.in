import React, { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, CircleX, Expand, Palette, ShoppingBag, Zap } from "lucide-react";
import { AppSheet } from "@/src/components/common/AppSheet";
import { Theme } from "@/src/theme/Provider/ThemeProvider";
import { IProduct } from "../../types/product.types";
import { useCartStore } from "@/src/features/common/cart/store/cartStore";
import * as Haptics from "@/lib/haptics";
import { useNavigate } from "react-router-dom";
import { goTo } from "@/src/utils/navigation";

import SizeChartModal from "./SizeChartModal";
import { useSizeChart, useSizeCharts } from "@/src/features/clothing/sizeChart/hooks/useSizeCharts";

interface VariantSelectorBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  product: IProduct | any;
  theme: Theme | any;
}

export const VariantSelectorBottomSheet = ({
  visible,
  onClose,
  product,
  theme,
}: VariantSelectorBottomSheetProps) => {
  const navigate = useNavigate();
  const { addItem, isLoading: isAddingToCart, items: cartItems } = useCartStore();

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizeChart, setShowSizeChart] = useState(false);

  // ── Backend Size Chart Resolution ──
  const sizeChartIdString =
    typeof product.sizeChartId === "string" ? product.sizeChartId : undefined;
  const { data: fetchedSizeChart } = useSizeChart(sizeChartIdString || "");
  const { data: allBackendSizeCharts } = useSizeCharts();

  const activeSizeChart = useMemo(() => {
    if (
      product.sizeChartId &&
      typeof product.sizeChartId === "object" &&
      product.sizeChartId.data
    ) {
      return product.sizeChartId;
    }
    if (fetchedSizeChart && fetchedSizeChart.data) {
      return fetchedSizeChart;
    }
    if (allBackendSizeCharts && allBackendSizeCharts.length > 0) {
      const categoryMatch = allBackendSizeCharts.find(
        (c: any) =>
          c.category?.toLowerCase() === product.subCategory?.toLowerCase() ||
          c.category?.toLowerCase() === product.category?.toLowerCase() ||
          c.name
            ?.toLowerCase()
            .includes(product.category?.toLowerCase() || ""),
      );
      if (categoryMatch) return categoryMatch;
      const globalChart = allBackendSizeCharts.find(
        (c: any) =>
          c.category?.toLowerCase() === "clothing" || c.scope === "GLOBAL",
      );
      if (globalChart) return globalChart;
    }
    return null;
  }, [
    product.sizeChartId,
    fetchedSizeChart,
    allBackendSizeCharts,
    product.category,
    product.subCategory,
  ]);

  // ── Derived State ──
  const uniqueColors = useMemo(() => {
    if (!product.variants) return [];
    return Array.from(
      new Set(
        product.variants.map((v: any) =>
          v?.color ? String(v.color).trim() : "",
        ).filter(Boolean),
      ),
    ) as string[];
  }, [product.variants]);

  // Set default color — intentional product→state sync when variants load.
  useEffect(() => {
    if (uniqueColors.length > 0 && !selectedColor) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedColor(uniqueColors[0]);
    }
  }, [uniqueColors, selectedColor]);

  // Sizes available for the selected color
  const sizesForColor = useMemo(() => {
    if (!product.variants || !selectedColor) return [];
    return product.variants.filter(
      (v: any) =>
        (v?.color ? String(v.color).trim() : "") === selectedColor,
    );
  }, [product.variants, selectedColor]);

  // Auto-select size if there's only one option; reset when color changes.
  // Intentional variant→state sync.
  useEffect(() => {
    if (sizesForColor.length === 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedSize(sizesForColor[0].size);
    } else {
      setSelectedSize(null);
    }
  }, [sizesForColor]);

  const selectedVariant = useMemo(() => {
    return product.variants?.find(
      (v: any) =>
        (!selectedColor ||
          (v?.color ? String(v.color).trim() : "") === selectedColor) &&
        (!selectedSize || String(v?.size || "") === String(selectedSize)),
    );
  }, [product.variants, selectedColor, selectedSize]);

  // Cart logic
  const hasSizes = sizesForColor.length > 0;
  const hasColors = uniqueColors.length > 0;
  const isSelectionComplete =
    (!hasSizes || selectedSize !== null) &&
    (!hasColors || selectedColor !== null);

  const isInCart = useMemo(() => {
    if (!isSelectionComplete || !selectedVariant) return false;
    return cartItems.some((item) => item.sku === selectedVariant.sku && (item.module ?? "clothing") === "clothing");
  }, [isSelectionComplete, selectedVariant, cartItems]);

  const isOutOfStock = useMemo(() => {
    if ((product.totalStock ?? 0) <= 0) return true;
    if (
      selectedSize &&
      selectedVariant &&
      (selectedVariant.stock ?? 0) <= 0
    )
      return true;
    return false;
  }, [product.totalStock, selectedSize, selectedVariant]);

  const handleConfirm = async () => {
    if (isInCart) {
      onClose();
      goTo(navigate, "/clothing/cart");
      return;
    }

    if (!selectedSize && sizesForColor.length > 0) {
      // Haptic-only validation — the size row is visible in this sheet.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const variant = selectedVariant || product.variants?.[0];
    const sku = variant?.sku || "default-sku";

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await addItem(product, sku, 1, "clothing");
      onClose();
    } catch {
      // silent — haptics already fired
    }
  };

  const discount =
    product.discountPercentage ||
    (product.originalPrice && product.price
      ? Math.floor((1 - product.price / product.originalPrice) * 100)
      : 0);

  const productPrice = product.isGstApplicable
    ? product.price * (1 + product.gstPercentage / 100)
    : product.price;

  const buttonDisabled =
    isAddingToCart ||
    !isSelectionComplete ||
    (isOutOfStock && !isInCart);

  let buttonText = "ADD TO BAG";
  let ButtonIcon: LucideIcon = ShoppingBag;

  if (isInCart) {
    buttonText = "GO TO CART";
    ButtonIcon = ArrowRight;
  } else if (isOutOfStock) {
    buttonText = "OUT OF STOCK";
    ButtonIcon = CircleX;
  } else if (!isSelectionComplete) {
    if (hasColors && !selectedColor) {
      buttonText = "SELECT COLOR";
      ButtonIcon = Palette;
    } else if (hasSizes && !selectedSize) {
      buttonText = "SELECT SIZE";
      ButtonIcon = Expand;
    }
  }

  const footer = (
    <button
      type="button"
      onClick={handleConfirm}
      disabled={buttonDisabled}
      className="flex h-12 w-full cursor-pointer flex-row items-center justify-center gap-2 rounded-lg"
      style={{
        backgroundColor: isInCart
          ? theme.primary
          : buttonDisabled
            ? theme.secondaryText || "#9ca3af"
            : theme.primary,
        opacity: isAddingToCart ? 0.7 : 1,
      }}
    >
      {isAddingToCart ? (
        <span className="block h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      ) : (
        <>
          <ButtonIcon size={20} color="#fff" />
          <span className="text-[15px] font-extrabold tracking-wide text-white">{buttonText}</span>
        </>
      )}
    </button>
  );

  return (
    <>
      <AppSheet
        visible={visible}
        onClose={onClose}
        label="Select variant"
        footer={footer}
      >
          {/* Product Header (custom header — has image + price) */}
          <div
            className="flex flex-row items-center border-b px-5 pt-1 pb-4"
            style={{ borderBottomColor: theme.border }}
          >
            <img
              src={product.images?.[0]?.url || product.image}
              alt={product.title}
              className="h-[85px] w-[70px] rounded-lg border object-cover"
              style={{ borderColor: theme.border }}
            />
            <div className="mr-2 ml-4 flex flex-1 flex-col justify-center">
              <p className="truncate text-xs font-bold tracking-wide uppercase" style={{ color: theme.secondaryText }}>
                {product.brand || "Brand"}
              </p>
              <p className="mt-0.5 line-clamp-2 text-sm leading-[18px] font-semibold" style={{ color: theme.text }}>
                {product.title}
              </p>
              <div className="mt-1.5 flex flex-row items-baseline gap-2">
                <span className="text-base font-extrabold" style={{ color: theme.text }}>
                  ₹{productPrice?.toLocaleString()}
                </span>
                {product.originalPrice &&
                  product.originalPrice > product.price && (
                    <>
                      <span className="text-xs line-through" style={{ color: theme.tertiaryText }}>
                        ₹{product.originalPrice.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-[#FF3B30]">
                        {Math.round(discount)}% OFF
                      </span>
                    </>
                  )}
              </div>
            </div>
          </div>

          <div className="px-5 pt-4 pb-5">
            {/* Color Selection */}
            {uniqueColors.length > 0 && (
              <div className="mb-5">
                <p className="mb-3 text-[13px] font-bold" style={{ color: theme.text }}>
                  COLOR:{" "}
                  <span style={{ color: theme.secondaryText, fontWeight: "normal" }}>
                    {selectedColor}
                  </span>
                </p>
                <div className="flex flex-row flex-wrap gap-2.5">
                  {uniqueColors.map((color) => {
                    const active = selectedColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          setSelectedColor(color);
                          setSelectedSize(null);
                        }}
                        className="cursor-pointer rounded-lg border px-4 py-2.5"
                        style={{
                          borderColor: active ? theme.primary : theme.border,
                          backgroundColor: active ? theme.primary + "1A" : theme.background,
                        }}
                      >
                        <span
                          className="text-[13px] font-semibold"
                          style={{ color: active ? theme.primary : theme.text }}
                        >
                          {color}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {sizesForColor.length > 0 && (
              <div className="mb-5">
                <div className="mb-3 flex flex-row items-center justify-between">
                  <p className="text-[13px] font-bold" style={{ color: theme.text }}>
                    SELECT SIZE
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowSizeChart(true);
                    }}
                    className="flex cursor-pointer flex-row items-center gap-1"
                  >
                    <Expand size={14} color={theme.primary} />
                    <span className="text-xs font-bold" style={{ color: theme.primary }}>
                      SIZE GUIDE
                    </span>
                  </button>
                </div>
                <div className="flex flex-row flex-wrap gap-3">
                  {sizesForColor.map((v: any) => {
                    const active = selectedSize === v.size;
                    const oos = v.stock === 0;
                    return (
                      <button
                        key={v.sku}
                        type="button"
                        disabled={oos}
                        onClick={() => setSelectedSize(v.size)}
                        className="relative flex h-12 min-w-12 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-3xl border px-3.5"
                        style={{
                          borderColor: active ? theme.primary : theme.border,
                          backgroundColor: active ? theme.primary : theme.background,
                          opacity: oos ? 0.6 : 1,
                          borderStyle: oos ? "dashed" : "solid",
                        }}
                      >
                        <span
                          className="block truncate text-center text-[13px] font-bold"
                          style={{
                            color: active ? "#fff" : oos ? theme.tertiaryText : theme.text,
                            textDecoration: oos ? "line-through" : undefined,
                          }}
                        >
                          {v.size}
                        </span>
                        {oos && (
                          <span
                            className="absolute h-px w-[140%] -rotate-45"
                            style={{ backgroundColor: theme.tertiaryText }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Low Stock Warning */}
                {selectedSize &&
                  sizesForColor.find((v: any) => v.size === selectedSize)
                    ?.stock! <= 5 && (
                    <div className="mt-2.5 flex flex-row items-center gap-1.5">
                      <Zap size={14} color={theme.warning} />
                      <span className="text-xs font-semibold" style={{ color: theme.warning }}>
                        Only{" "}
                        {
                          sizesForColor.find(
                            (v: any) => v.size === selectedSize,
                          )?.stock
                        }{" "}
                        items left!
                      </span>
                    </div>
                  )}
              </div>
            )}
          </div>
      </AppSheet>

      <SizeChartModal
        visible={showSizeChart}
        onClose={() => setShowSizeChart(false)}
        sizeChart={activeSizeChart}
        selectedSize={selectedSize}
        category={product?.category || product?.subCategory}
        theme={theme}
      />
    </>
  );
};

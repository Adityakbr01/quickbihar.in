import React from "react";
import { View, Platform, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Skeleton from "@/src/components/common/Skeleton";
import { styles as s, SCREEN_WIDTH } from "../styles";

interface ProductDetailSkeletonProps {
  theme: any;
  onBack?: () => void;
}

const ProductDetailSkeleton: React.FC<ProductDetailSkeletonProps> = ({ theme, onBack }) => {
  const isDark = theme.text === "#ffffff" || theme.background === "#0f0f0f";
  const galleryHeight = SCREEN_WIDTH * 1.2;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {/* ── Image Gallery Placeholder ── */}
      <View style={[s.galleryContainer, { height: galleryHeight, backgroundColor: theme.tertiaryBackground }]}>
        <Skeleton
          width="100%"
          height="100%"
          borderRadius={0}
          style={{ backgroundColor: theme.border }}
        />

        {/* Floating nav skeleton (matches real button size + position) */}
        <View style={s.galleryNav}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={[
                s.navBtn,
                {
                  backgroundColor: isDark ? "rgba(30, 30, 32, 0.85)" : "rgba(255, 255, 255, 0.9)",
                  borderColor: isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.08)",
                },
              ]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-back" size={20} color={isDark ? "#ffffff" : "#111827"} />
            </TouchableOpacity>
          ) : (
            <Skeleton
              width={40}
              height={40}
              borderRadius={20}
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)" }}
            />
          )}
          <View style={s.navRight}>
            <Skeleton
              width={40}
              height={40}
              borderRadius={20}
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)" }}
            />
            <Skeleton
              width={40}
              height={40}
              borderRadius={20}
              style={{ backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)" }}
            />
          </View>
        </View>

        {/* Image counter pill placeholder */}
        <View style={s.counterPill}>
          <Skeleton
            width={46}
            height={14}
            borderRadius={7}
            style={{ backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }}
          />
        </View>
      </View>

      {/* ── Info Section ── */}
      <View style={[s.infoSection, { backgroundColor: theme.background }]}>
        {/* Brand */}
        <Skeleton
          width={120}
          height={14}
          borderRadius={4}
          style={{ marginBottom: 10, backgroundColor: theme.border }}
        />
        {/* Title (2 lines) */}
        <Skeleton
          width="90%"
          height={14}
          borderRadius={4}
          style={{ marginBottom: 6, backgroundColor: theme.border }}
        />
        <Skeleton
          width="60%"
          height={14}
          borderRadius={4}
          style={{ marginBottom: 14, backgroundColor: theme.border }}
        />
        {/* Rating chip placeholder */}
        <View style={s.ratingChip}>
          <Skeleton
            width={42}
            height={18}
            borderRadius={4}
            style={{ backgroundColor: theme.border }}
          />
          <Skeleton
            width={1}
            height={14}
            borderRadius={1}
            style={{ marginHorizontal: 8, backgroundColor: theme.border }}
          />
          <Skeleton
            width={70}
            height={12}
            borderRadius={4}
            style={{ backgroundColor: theme.border }}
          />
        </View>
        {/* Price row */}
        <View style={s.priceBlock}>
          <Skeleton
            width={90}
            height={22}
            borderRadius={5}
            style={{ backgroundColor: theme.border }}
          />
          <Skeleton
            width={70}
            height={14}
            borderRadius={4}
            style={{ backgroundColor: theme.border }}
          />
          <Skeleton
            width={56}
            height={18}
            borderRadius={4}
            style={{ backgroundColor: theme.border }}
          />
        </View>
        {/* Tax info */}
        <Skeleton
          width={150}
          height={11}
          borderRadius={4}
          style={{ marginTop: 8, backgroundColor: theme.border }}
        />
      </View>

      {/* Divider */}
      <View style={[s.sectionDivider, { backgroundColor: theme.tertiaryBackground }]} />

      {/* ── Color Section ── */}
      <View style={[s.selectionSection, { backgroundColor: theme.background }]}>
        <Skeleton
          width={80}
          height={13}
          borderRadius={4}
          style={{ marginBottom: 14, backgroundColor: theme.border }}
        />
        <View style={s.colorRow}>
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={`c-${i}`}
              width={86}
              height={36}
              borderRadius={18}
              style={{ backgroundColor: theme.border }}
            />
          ))}
        </View>
      </View>

      {/* Divider */}
      <View style={[s.sectionDivider, { backgroundColor: theme.tertiaryBackground }]} />

      {/* ── Size Section ── */}
      <View style={[s.selectionSection, { backgroundColor: theme.background }]}>
        <View style={s.sizeHeader}>
          <Skeleton
            width={110}
            height={13}
            borderRadius={4}
            style={{ backgroundColor: theme.border }}
          />
          <Skeleton
            width={80}
            height={12}
            borderRadius={4}
            style={{ backgroundColor: theme.border }}
          />
        </View>
        <View style={s.sizeRow}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton
              key={`s-${i}`}
              width={48}
              height={48}
              borderRadius={24}
              style={{ backgroundColor: theme.border }}
            />
          ))}
        </View>
      </View>

      {/* Divider */}
      <View style={[s.sectionDivider, { backgroundColor: theme.tertiaryBackground }]} />

      {/* ── Delivery Section ── */}
      <View style={[s.deliverySection, { backgroundColor: theme.background }]}>
        <Skeleton
          width={140}
          height={13}
          borderRadius={4}
          style={{ marginBottom: 14, backgroundColor: theme.border }}
        />
        <View style={s.deliveryCards}>
          <View
            style={[
              s.deliveryCard,
              { backgroundColor: theme.tertiaryBackground, borderColor: theme.border },
            ]}
          >
            <Skeleton
              width={22}
              height={22}
              borderRadius={11}
              style={{ backgroundColor: theme.border }}
            />
            <View style={s.deliveryCardText}>
              <Skeleton
                width={"70%"}
                height={12}
                borderRadius={4}
                style={{ marginBottom: 6, backgroundColor: theme.border }}
              />
              <Skeleton
                width={"90%"}
                height={10}
                borderRadius={4}
                style={{ backgroundColor: theme.border }}
              />
            </View>
          </View>
        </View>

        {/* Policies row */}
        <View style={s.policiesRow}>
          {[0, 1, 2, 3].map((i) => (
            <View key={`p-${i}`} style={s.policyItem}>
              <Skeleton
                width={42}
                height={42}
                borderRadius={21}
                style={{ backgroundColor: theme.border }}
              />
              <Skeleton
                width={50}
                height={10}
                borderRadius={4}
                style={{ backgroundColor: theme.border }}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Divider */}
      <View style={[s.sectionDivider, { backgroundColor: theme.tertiaryBackground }]} />

      {/* ── Expandable Sections ── */}
      <View style={[s.expandableSectionWrap, { backgroundColor: theme.background }]}>
        {[0, 1, 2].map((i) => (
          <View key={`exp-${i}`}>
            <View style={s.expandableHeader}>
              <Skeleton
                width={180}
                height={14}
                borderRadius={4}
                style={{ backgroundColor: theme.border }}
              />
              <Skeleton
                width={16}
                height={16}
                borderRadius={4}
                style={{ backgroundColor: theme.border }}
              />
            </View>
            {/* Content preview (only for the first one which is open by default) */}
            {i === 0 && (
              <View style={{ paddingBottom: 16 }}>
                <Skeleton
                  width="100%"
                  height={11}
                  borderRadius={4}
                  style={{ marginBottom: 6, backgroundColor: theme.border }}
                />
                <Skeleton
                  width="95%"
                  height={11}
                  borderRadius={4}
                  style={{ marginBottom: 6, backgroundColor: theme.border }}
                />
                <Skeleton
                  width="80%"
                  height={11}
                  borderRadius={4}
                  style={{ marginBottom: 16, backgroundColor: theme.border }}
                />

                {/* Spec rows */}
                {[0, 1, 2, 3, 4].map((j) => (
                  <View
                    key={`spec-${j}`}
                    style={[
                      s.specTableRow,
                      { borderBottomColor: theme.border },
                    ]}
                  >
                    <Skeleton
                      width={"30%"}
                      height={12}
                      borderRadius={4}
                      style={{ backgroundColor: theme.border }}
                    />
                    <Skeleton
                      width={"45%"}
                      height={12}
                      borderRadius={4}
                      style={{ marginLeft: "auto", backgroundColor: theme.border }}
                    />
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Divider */}
      <View style={[s.sectionDivider, { backgroundColor: theme.tertiaryBackground }]} />

      {/* ── Reviews Section Skeleton ── */}
      <View style={[s.expandableSectionWrap, { backgroundColor: theme.background }]}>
        <View style={s.expandableHeader}>
          <Skeleton
            width={170}
            height={14}
            borderRadius={4}
            style={{ backgroundColor: theme.border }}
          />
          <Skeleton
            width={16}
            height={16}
            borderRadius={4}
            style={{ backgroundColor: theme.border }}
          />
        </View>
        <View style={{ paddingBottom: 16 }}>
          {/* Rating overview */}
          <View style={s.ratingOverview}>
            <View style={s.ratingLeft}>
              <Skeleton
                width={56}
                height={36}
                borderRadius={6}
                style={{ marginBottom: 6, backgroundColor: theme.border }}
              />
              <Skeleton
                width={80}
                height={12}
                borderRadius={4}
                style={{ marginBottom: 4, backgroundColor: theme.border }}
              />
              <Skeleton
                width={70}
                height={10}
                borderRadius={4}
                style={{ backgroundColor: theme.border }}
              />
            </View>
            <View style={s.ratingRight}>
              {[0, 1, 2, 3, 4].map((i) => (
                <View key={`rb-${i}`} style={s.ratingBarRow}>
                  <Skeleton
                    width={12}
                    height={10}
                    borderRadius={3}
                    style={{ backgroundColor: theme.border }}
                  />
                  <Skeleton
                    width={"100%"}
                    height={5}
                    borderRadius={3}
                    style={{ backgroundColor: theme.border }}
                  />
                  <Skeleton
                    width={22}
                    height={10}
                    borderRadius={3}
                    style={{ backgroundColor: theme.border }}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Sample review card */}
          <View
            style={[
              s.reviewCard,
              { borderBottomColor: theme.border, paddingTop: 12 },
            ]}
          >
            <View style={s.reviewTopRow}>
              <Skeleton
                width={32}
                height={16}
                borderRadius={4}
                style={{ backgroundColor: theme.border }}
              />
              <Skeleton
                width={"60%"}
                height={14}
                borderRadius={4}
                style={{ backgroundColor: theme.border }}
              />
            </View>
            <Skeleton
              width="100%"
              height={11}
              borderRadius={4}
              style={{ marginTop: 8, marginBottom: 6, backgroundColor: theme.border }}
            />
            <Skeleton
              width="92%"
              height={11}
              borderRadius={4}
              style={{ marginBottom: 6, backgroundColor: theme.border }}
            />
            <Skeleton
              width="70%"
              height={11}
              borderRadius={4}
              style={{ marginBottom: 12, backgroundColor: theme.border }}
            />
            <View style={s.reviewerRow}>
              <Skeleton
                width={26}
                height={26}
                borderRadius={13}
                style={{ backgroundColor: theme.border }}
              />
              <Skeleton
                width={80}
                height={12}
                borderRadius={4}
                style={{ backgroundColor: theme.border }}
              />
              <View style={{ flex: 1 }} />
              <Skeleton
                width={40}
                height={22}
                borderRadius={4}
                style={{ backgroundColor: theme.border }}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Bottom spacer matching the real screen (for the sticky action bar) */}
      <View style={{ height: 100 }} />
    </View>
  );
};

export default ProductDetailSkeleton;

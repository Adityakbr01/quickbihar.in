import type { Product } from "@/src/features/Jewelery/data/products";
import type { Collection } from "@/src/features/Jewelery/data/collections";
import React from "react";

export interface HeroSlide {
  id: string;
  image?: any;
  label: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaRoute: string;
  secondaryCta?: string;
}

export interface SectionHeaderProps {
  label: string;
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
}

export interface CollectionCardProps {
  collection: Collection;
  large?: boolean;
  style?: React.CSSProperties;
}

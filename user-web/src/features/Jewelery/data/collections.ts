import { Gift, Heart, Music, Star, Sun } from "lucide-react";

/**
 * Collection UI shape. Collections come from the server category tree
 * (?vertical=JEWELERY) — mapped in screens, no mock items here.
 */
export interface Collection {
  id: string;
  name: string;
  tagline: string;
  mood: string;
  pieceCount: number;
  image: any;
}

export const occasions = [
  { id: "bridal", label: "Bridal & Wedding", icon: Heart },
  { id: "festive", label: "Festivals & Puja", icon: Star },
  { id: "gifting", label: "Gifting", icon: Gift },
  { id: "daily", label: "Everyday Wear", icon: Sun },
  { id: "party", label: "Parties & Events", icon: Music },
  { id: "self", label: "Self-Love", icon: Star },
];

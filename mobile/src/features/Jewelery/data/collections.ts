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
  { id: "bridal", label: "Bridal & Wedding", icon: "heart" },
  { id: "festive", label: "Festivals & Puja", icon: "star" },
  { id: "gifting", label: "Gifting", icon: "gift" },
  { id: "daily", label: "Everyday Wear", icon: "sun" },
  { id: "party", label: "Parties & Events", icon: "music" },
  { id: "self", label: "Self-Love", icon: "star" },
];

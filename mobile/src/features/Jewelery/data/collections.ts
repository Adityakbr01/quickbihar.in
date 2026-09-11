export interface Collection {
  id: string;
  name: string;
  tagline: string;
  mood: string;
  pieceCount: number;
  image: any;
}

export const collections: Collection[] = [
  {
    id: "bridal",
    name: "Bridal",
    tagline: "Because you've imagined this moment since you were seven.",
    mood: "Sacred, heirloom, forever",
    pieceCount: 48,
    image: null, // jewelery inactive — asset removed, see git history
  },
  {
    id: "everyday",
    name: "Everyday Luxury",
    tagline: "The piece you forget you're wearing — until someone asks.",
    mood: "Quiet, wearable, modern",
    pieceCount: 62,
    image: null,
  },
  {
    id: "festive",
    name: "Festive Edit",
    tagline: "For the nights that smell like agarbatti and feel like magic.",
    mood: "Celebratory, warm, alive",
    pieceCount: 35,
    image: null,
  },
  {
    id: "statement",
    name: "Statement Pieces",
    tagline: "Not subtle. Not sorry.",
    mood: "Bold, artistic, confident",
    pieceCount: 27,
    image: null,
  },
  {
    id: "contemporary",
    name: "Contemporary Ethnic",
    tagline: "Your grandmother's craft. Your generation's confidence.",
    mood: "Fashion-forward, hybrid",
    pieceCount: 41,
    image: null,
  },
];

export const occasions = [
  { id: "bridal", label: "Bridal & Wedding", icon: "heart" },
  { id: "festive", label: "Festivals & Puja", icon: "star" },
  { id: "gifting", label: "Gifting", icon: "gift" },
  { id: "daily", label: "Everyday Wear", icon: "sun" },
  { id: "party", label: "Parties & Events", icon: "music" },
  { id: "self", label: "Self-Love", icon: "star" },
];

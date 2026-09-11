import { ProductTryOnConfig } from "@/src/features/Jewelery/utils/tryOn";

export interface Product {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  badge?: "New" | "Bestseller" | "Limited";
  collection: string;
  metal: string;
  stone?: string;
  weight?: string;
  purity?: string;
  occasions: string[];
  description: string;
  craftDetail: string;
  image: any;
  images: any[];
  inStock: number;
  tryOn?: ProductTryOnConfig;
}

// Jewelery module inactive: product images removed from assets (see git history
// mobile/assets/images/jewelery/). Restore the PNGs and these requires to reactivate.
const img1: any = null;
const img2: any = null;
const img3: any = null;
const img4: any = null;

export const products: Product[] = [
  {
    id: "p1",
    name: "Mira Pendant Necklace",
    subtitle: "22K Gold · Handcrafted",
    price: 28500,
    rating: 4.9,
    reviewCount: 214,
    badge: "Bestseller",
    collection: "Everyday Luxury",
    metal: "22K Yellow Gold",
    weight: "4.2g",
    purity: "22K BIS Hallmarked",
    occasions: ["Daily Wear", "Gifting", "Parties & Events"],
    description:
      "A whisper of gold that settles at the collarbone like it was always meant to be there. Hand-formed by karigar families in Jaipur.",
    craftDetail:
      "Hand-formed by karigar families in Jaipur. Each pendant individually finished.",
    image: img1,
    images: [img1, img3, img2, img4],
    inStock: 8,
  },
  {
    id: "p2",
    name: "Ananya Jhumka Earrings",
    subtitle: "22K Gold · Filigree Work",
    price: 34200,
    rating: 4.8,
    reviewCount: 186,
    badge: "New",
    collection: "Contemporary Ethnic",
    metal: "22K Yellow Gold",
    stone: "Ruby",
    weight: "6.8g",
    purity: "22K BIS Hallmarked",
    occasions: ["Festive & Puja", "Parties & Events", "Bridal & Wedding"],
    description:
      "Contemporary jhumkas with traditional Jaipur filigree — light enough for evening, bold enough to be remembered.",
    craftDetail:
      "Traditional Jaipur filigree technique, each wire drawn by hand.",
    image: img2,
    images: [img2, img4, img1, img3],
    inStock: 5,
    tryOn: {
      jewelryType: "earring",
      modelUrl: "/models/one_ring/scene.gltf",
      variants: [
        {
          id: "ring-model",
          label: "Ring (Local GLTF)",
          modelUrl: "/models/one_ring/scene.gltf",
          metal: "Gold",
          stone: "None",
        },
        {
          id: "yellow-gold",
          label: "Jhumka Gold",
          modelUrl: "mock://jhumka/gold",
          metal: "22K Yellow Gold",
          stone: "Ruby",
        },
        {
          id: "rose-gold",
          label: "Jhumka Rose",
          modelUrl: "mock://jhumka/roseGold",
          metal: "22K Rose Gold",
          stone: "Ruby",
        },
      ],
    },
  },
  {
    id: "p3",
    name: "Zara Floral Ring",
    subtitle: "18K Gold · Diamond",
    price: 52800,
    originalPrice: 61000,
    rating: 4.9,
    reviewCount: 312,
    badge: "Bestseller",
    collection: "Everyday Luxury",
    metal: "18K Yellow Gold",
    stone: "Diamond · 0.18ct",
    weight: "3.1g",
    purity: "18K BIS Hallmarked",
    occasions: ["Daily Wear", "Parties & Events", "Gifting", "Self-Love"],
    description:
      "A garden in miniature. Floral petal setting with ethically sourced diamonds — worn daily, remembered always.",
    craftDetail:
      "Pave-set diamonds, hand-finished milgrain border by master goldsmiths in Thrissur.",
    image: img3,
    images: [img3, img1, img4, img2],
    inStock: 12,
    tryOn: {
      jewelryType: "earring",
      modelUrl: "mock://hoop/gold",
      variants: [
        {
          id: "gold-hoop",
          label: "Gold Hoop",
          modelUrl: "mock://hoop/gold",
          metal: "18K Yellow Gold",
        },
      ],
    },
  },
  {
    id: "p4",
    name: "Saheli Meenakari Bangle",
    subtitle: "22K Gold · Meenakari Enamel",
    price: 67000,
    rating: 4.7,
    reviewCount: 98,
    badge: "Limited",
    collection: "Festive Edit",
    metal: "22K Yellow Gold",
    stone: "Meenakari Enamel",
    weight: "15.4g",
    purity: "22K BIS Hallmarked",
    occasions: ["Festive & Puja", "Bridal & Wedding", "Parties & Events"],
    description:
      "For the nights that smell like agarbatti and feel like magic. Hand-painted Meenakari — every bangle unique.",
    craftDetail:
      "Traditional Rajasthani meenakari enamelling — a craft passed down over 16 generations.",
    image: img4,
    images: [img4, img2, img3, img1],
    inStock: 3,
    tryOn: {
      jewelryType: "earring",
      modelUrl: "mock://drop/gold",
      variants: [
        {
          id: "gold-drop",
          label: "Gold Drop",
          modelUrl: "mock://drop/gold",
          metal: "22K Yellow Gold",
          stone: "Emerald",
        },
      ],
    },
  },
  {
    id: "p5",
    name: "Priya Choker Set",
    subtitle: "22K Gold · Kundan",
    price: 125000,
    rating: 5.0,
    reviewCount: 44,
    badge: "Limited",
    collection: "Bridal",
    metal: "22K Yellow Gold",
    stone: "Uncut Kundan",
    weight: "38.2g",
    purity: "22K BIS Hallmarked",
    occasions: ["Bridal & Wedding", "Festive & Puja"],
    description:
      "Because you've imagined this moment since you were seven. A choker that carries the weight of tradition and the lightness of love.",
    craftDetail:
      "Kundan setting by master artisans of the Banarasi atelier — each stone hand-placed.",
    image: img1,
    images: [img1, img4, img2, img3],
    inStock: 2,
  },
  {
    id: "p6",
    name: "Kavya Statement Earrings",
    subtitle: "22K Gold · Polki",
    price: 89500,
    rating: 4.8,
    reviewCount: 67,
    badge: "New",
    collection: "Statement Pieces",
    metal: "22K Yellow Gold",
    stone: "Uncut Polki Diamond",
    weight: "22.1g",
    purity: "22K BIS Hallmarked",
    occasions: ["Parties & Events", "Bridal & Wedding", "Festive & Puja"],
    description:
      "Not subtle. Not sorry. Polki diamonds in a geometric setting — for the woman who walks in and owns the room.",
    craftDetail:
      "Polki diamond setting using traditional lac backing technique, Jaipur.",
    image: img2,
    images: [img2, img3, img1, img4],
    inStock: 4,
    tryOn: {
      jewelryType: "earring",
      modelUrl: "mock://stud/gold",
      variants: [
        {
          id: "polki",
          label: "Polki",
          modelUrl: "mock://stud/gold",
          metal: "22K Yellow Gold",
          stone: "Uncut Polki Diamond",
        },
        {
          id: "antique",
          label: "Antique",
          modelUrl: "mock://stud/antique",
          metal: "Antique Gold",
          stone: "Polki",
        },
      ],
    },
  },
  {
    id: "p7",
    name: "Leela Delicate Chain",
    subtitle: "18K Gold · Minimal",
    price: 16800,
    rating: 4.6,
    reviewCount: 423,
    badge: "Bestseller",
    collection: "Everyday Luxury",
    metal: "18K Yellow Gold",
    weight: "2.3g",
    purity: "18K BIS Hallmarked",
    occasions: ["Daily Wear", "Self-Love", "Gifting"],
    description:
      "The piece you forget you're wearing — until someone asks. A whisper of gold for every day.",
    craftDetail:
      "Machine-finished with hand-polished clasp, certified 18K gold.",
    image: img3,
    images: [img3, img2, img4, img1],
    inStock: 20,
  },
  {
    id: "p8",
    name: "Radha Temple Earrings",
    subtitle: "22K Gold · Temple Jewellery",
    price: 43200,
    rating: 4.9,
    reviewCount: 156,
    badge: "New",
    collection: "Contemporary Ethnic",
    metal: "22K Yellow Gold",
    stone: "Ruby · Emerald",
    weight: "9.3g",
    purity: "22K BIS Hallmarked",
    occasions: ["Festive & Puja", "Bridal & Wedding", "Parties & Events"],
    description:
      "Temple architecture reimagined for the modern wearer. South Indian craftsmanship — globally elevated.",
    craftDetail:
      "Traditional Kerala temple jewellery craft, artisans of Thrissur.",
    image: img4,
    images: [img4, img1, img3, img2],
    inStock: 6,
    tryOn: {
      jewelryType: "earring",
      modelUrl: "mock://temple/gold",
      variants: [
        {
          id: "ruby-emerald",
          label: "Ruby + Emerald",
          modelUrl: "mock://temple/gold",
          metal: "22K Yellow Gold",
          stone: "Ruby + Emerald",
        },
        {
          id: "ruby",
          label: "Ruby",
          modelUrl: "mock://temple/gold",
          metal: "22K Yellow Gold",
          stone: "Ruby",
        },
      ],
    },
  },
];

export const getProductById = (id: string): Product | undefined =>
  products.find((p) => p.id === id);

export const getProductsByCollection = (collection: string): Product[] =>
  products.filter((p) => p.collection === collection);

export const getBestsellers = (): Product[] =>
  products.filter((p) => p.badge === "Bestseller");

export const getNewArrivals = (): Product[] =>
  products.filter((p) => p.badge === "New");

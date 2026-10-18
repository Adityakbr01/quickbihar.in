/**
 * Curated artwork for jewellery collection tiles.
 *
 * Server collection rows carry generic clothing artwork; this mapper swaps
 * known-clothing or empty images for the hand-picked jewellery shots below,
 * keyed by collection slug.
 */
export const JEWELERY_COLLECTION_IMAGES: Record<string, string> = {
  jewellery:
    "https://ik.imagekit.io/k2n57ywshu/categories/jewelry/jewelry_collection_showcase_1789811067982_KRVoN6-Ls6.jpg",
  necklace:
    "https://ik.imagekit.io/k2n57ywshu/products/jewelry/jewelry_pear_ruby_pendant_1789811050387_6l5vvgrn4r.jpg",
  ring: "https://ik.imagekit.io/k2n57ywshu/products/jewelry/jewelry_solitaire_diamond_ring_1789811055760_0Iahnr6TDz.jpg",
  earrings:
    "https://ik.imagekit.io/k2n57ywshu/products/jewelry/jewelry_peacock_temple_jhumkas_1789811057899_dLFgtSO4C.jpg",
  bangle:
    "https://ik.imagekit.io/k2n57ywshu/products/jewelry/jewelry_royal_gold_bangles_1789811053311_o1ORm92lY.jpg",
  pendant:
    "https://ik.imagekit.io/k2n57ywshu/products/jewelry/jewelry_laxmi_temple_coin_pendant_1789811062952_VSOBuVmmqn.jpg",
  "bridal-set":
    "https://ik.imagekit.io/k2n57ywshu/products/jewelry/jewelry_royal_kundan_bridal_set_1789811060450_aFO15AgH_J.jpg",
  chain:
    "https://ik.imagekit.io/k2n57ywshu/products/jewelry/jewelry_solid_gold_curb_chain_1789811065544_yPAVEqRfy.jpg",
};

/** Resolves a server collection row to its jewellery artwork URL. */
export function resolveJeweleryCollectionImage(c: any): string {
  const slug = (
    c?.slug ||
    c?.title?.toLowerCase()?.replace(/\s+/g, "-") ||
    ""
  ).trim();
  const raw = c?.image || "";
  if (
    !raw ||
    raw.includes("ethnic") ||
    raw.includes("shirts") ||
    raw.includes("kurtis") ||
    raw.includes("jeans") ||
    raw.includes("kids") ||
    raw.includes("sarees")
  ) {
    return (
      JEWELERY_COLLECTION_IMAGES[slug] || JEWELERY_COLLECTION_IMAGES.jewellery
    );
  }
  return raw;
}

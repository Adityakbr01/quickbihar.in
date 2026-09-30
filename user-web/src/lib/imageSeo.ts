/**
 * @file src/lib/imageSeo.ts
 * Single source of truth for image alt/title text (SEO + a11y).
 *
 * Patterns match the established catalog convention:
 *   alt   "<Name> - Shop Online in Bihar" / "<Name> - Shopping Mall in <Place>"
 *   title "<Name> | QuickBihar"
 *
 * Every content <img> must have a meaningful alt. Decorative images
 * (icons, placeholders) use alt="" + aria-hidden instead.
 */

function clean(value: unknown, fallback: string): string {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

export interface ImgSeo {
  alt: string;
  title: string;
}

/** Product photo (clothing + jewellery PDPs, cards, cart, orders). */
export function productImgSeo(title: unknown): ImgSeo {
  const name = clean(title, "Fashion Product");
  return {
    alt: `${name} - Shop Online in Bihar`,
    title: `${name} | QuickBihar`,
  };
}

/** Category tile. */
export function categoryImgSeo(title: unknown): ImgSeo {
  const name = clean(title, "Fashion Category");
  return {
    alt: `${name} - Shop Online in Bihar`,
    title: `${name} | QuickBihar`,
  };
}

/** Mall / store photo. */
export function mallImgSeo(name: unknown, location?: unknown): ImgSeo {
  const mall = clean(name, "Shopping Mall");
  const place = String(location ?? "").replace(/\s+/g, " ").trim();
  return {
    alt: place ? `${mall} - Shopping Mall in ${place}` : `${mall} - Shopping Mall in Bihar`,
    title: `${mall} | QuickBihar Local Mall`,
  };
}

/** Promo banner / deal creative. */
export function bannerImgSeo(title: unknown): ImgSeo {
  const name = clean(title, "QuickBihar Fashion Sale Banner");
  return {
    alt: name,
    title: `${name} | QuickBihar Deals`,
  };
}

/** Site logo. */
export function logoImgSeo(): ImgSeo {
  return {
    alt: "QuickBihar logo - Online Shopping in Bihar",
    title: "QuickBihar - Online Shopping in Bihar",
  };
}

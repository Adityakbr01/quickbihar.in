import { describe, expect, it } from "vitest";
import {
  getSiteOrigin,
  getCanonicalUrl,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_LOCALE,
} from "../seo/site";

describe("SEO Site & Canonical URL Utilities", () => {
  it("exports correct brand constants", () => {
    expect(SITE_NAME).toBe("QuickBihar");
    expect(SITE_ORIGIN).toBe("https://quickbihar.in");
    expect(SITE_LOCALE).toBe("en_IN");
  });

  it("returns apex origin consistently", () => {
    expect(getSiteOrigin()).toBe("https://quickbihar.in");
  });

  describe("getCanonicalUrl", () => {
    it("handles root path without appending trailing slash", () => {
      expect(getCanonicalUrl("/")).toBe("https://quickbihar.in/");
      expect(getCanonicalUrl("")).toBe("https://quickbihar.in/");
    });

    it("generates clean canonical path for internal routes", () => {
      expect(getCanonicalUrl("/clothing/home")).toBe(
        "https://quickbihar.in/clothing/home",
      );
      expect(getCanonicalUrl("malls")).toBe("https://quickbihar.in/malls");
    });

    it("strips trailing slashes from subpaths", () => {
      expect(getCanonicalUrl("/product/saree-banarasi/")).toBe(
        "https://quickbihar.in/product/saree-banarasi",
      );
    });

    it("strips query parameters and URL fragments", () => {
      expect(
        getCanonicalUrl("/clothing/search?q=jeans&sort=asc#results"),
      ).toBe("https://quickbihar.in/clothing/search");
    });
  });
});

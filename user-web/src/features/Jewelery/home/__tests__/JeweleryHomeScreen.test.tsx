import React from "react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import JeweleryHomeScreen from "../screens/JeweleryHomeScreen";
import { FaqSection } from "../sections/FaqSection";
import { NewsletterSection } from "../sections/NewsletterSection";
import { BrandPillars } from "../sections/BrandPillars";
import { OccasionsSection } from "../sections/OccasionsSection";
import { HeritageSection } from "../sections/HeritageSection";
import { FestiveCampaign } from "../sections/FestiveCampaign";
import { GiftingSection } from "../sections/GiftingSection";
import axiosInstance from "@/src/api/axiosInstance";

// Mock Embla carousel for JSDOM
vi.mock("@/src/components/common/EmblaCarousel", () => ({
  default: ({ data, renderItem }: any) => (
    <div data-testid="embla-carousel">
      {data?.map((item: any, i: number) => (
        <div key={item.id ?? i} data-testid={`carousel-slide-${i}`}>
          {renderItem({ item, index: i })}
        </div>
      ))}
    </div>
  ),
}));

// Mock haptics
vi.mock("@/lib/haptics", () => ({
  notificationAsync: vi.fn(),
  impactAsync: vi.fn(),
  NotificationFeedbackType: { Success: "success", Error: "error", Warning: "warning" },
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

// Mock catalog hooks
vi.mock("@/src/features/Jewelery/hooks/useJeweleryCatalog", () => ({
  useJeweleryBestsellers: vi.fn().mockReturnValue({
    data: [
      {
        id: "jewel-1",
        name: "22K Royal Gold Necklace",
        price: 45000,
        subtitle: "Handcrafted filigree",
        image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f",
      },
    ],
    isLoading: false,
  }),
  useJeweleryNewArrivals: vi.fn().mockReturnValue({
    data: [
      {
        id: "jewel-2",
        name: "Diamond Solitaire Ring",
        price: 25000,
        subtitle: "18K Rose Gold",
        image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e",
      },
    ],
    isLoading: false,
  }),
  useJeweleryCategories: vi.fn().mockReturnValue({
    data: [
      { _id: "cat-1", title: "Necklaces", slug: "necklace" },
      { _id: "cat-2", title: "Rings", slug: "ring" },
    ],
    isLoading: false,
  }),
}));

describe("Jewellery Home Module — Behavior-Preserving Modular Screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the main screen with crawlable H1 and brand elements", () => {
    renderWithProviders(<JeweleryHomeScreen />);

    // H1 heading
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(/Buy Jewellery Online in Buxar, Bihar/i);

    // Announcement bar
    expect(
      screen.getByText(/Free shipping above/i),
    ).toBeInTheDocument();

    // Brand Pillars
    expect(screen.getAllByText(/Hallmark/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Handcrafted/i).length).toBeGreaterThan(0);

    // Sections present
    expect(screen.getByText("Our Collections")).toBeInTheDocument();
    expect(screen.getByText("New Arrivals")).toBeInTheDocument();
    expect(screen.getByText("Shop by Occasion")).toBeInTheDocument();
    expect(screen.getByText("Bestsellers")).toBeInTheDocument();
    expect(screen.getByText("Jewellery FAQs")).toBeInTheDocument();
    expect(screen.getByText("Be the first to know.")).toBeInTheDocument();
  });

  it("renders BrandPillars with 4 trust badges", () => {
    renderWithProviders(<BrandPillars />);
    expect(screen.getByText(/Hallmark/i)).toBeInTheDocument();
    expect(screen.getByText(/Handcrafted/i)).toBeInTheDocument();
    expect(screen.getByText(/Free Returns/i)).toBeInTheDocument();
    expect(screen.getByText(/Try Before/i)).toBeInTheDocument();
  });

  it("renders OccasionsSection with occasion chips", () => {
    renderWithProviders(<OccasionsSection />);
    expect(screen.getByText("Shop by Occasion")).toBeInTheDocument();
    expect(screen.getByText(/Bridal/i)).toBeInTheDocument();
  });

  it("renders HeritageSection with storytelling copy", () => {
    renderWithProviders(<HeritageSection />);
    expect(
      screen.getByText(/Every piece holds the memory of hands that shaped it/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Explore Our Craft →/i)).toBeInTheDocument();
  });

  it("renders FestiveCampaign with CTA button", () => {
    renderWithProviders(<FestiveCampaign />);
    expect(screen.getByText(/Shop Festive Edit/i)).toBeInTheDocument();
  });

  it("renders GiftingSection with luxury box guarantee", () => {
    renderWithProviders(<GiftingSection />);
    expect(screen.getByText(/Explore Gifting →/i)).toBeInTheDocument();
  });

  it("toggles FAQ accordion items correctly", () => {
    renderWithProviders(<FaqSection />);
    const firstFaqQuestion = screen.getByText(/Is your gold BIS hallmarked\?/i);
    expect(firstFaqQuestion).toBeInTheDocument();

    // First FAQ item is open by default
    const firstAnswer = screen.getByText(/Yes — every gold piece is BIS hallmarked/i);
    expect(firstAnswer).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(firstFaqQuestion.closest("button")!);
    expect(
      screen.queryByText(/Yes — every gold piece is BIS hallmarked/i),
    ).not.toBeInTheDocument();

    // Click again to reopen
    fireEvent.click(firstFaqQuestion.closest("button")!);
    expect(
      screen.getByText(/Yes — every gold piece is BIS hallmarked/i),
    ).toBeInTheDocument();
  });

  it("validates newsletter email input and executes subscription", async () => {
    const postSpy = vi.spyOn(axiosInstance, "post").mockResolvedValueOnce({
      data: { message: "You're on the list. Welcome to the Circle!" },
    });

    renderWithProviders(<NewsletterSection />);

    const input = screen.getByPlaceholderText("Your email");
    const submitBtn = screen.getByRole("button", { name: /Join the Circle/i });

    // Try submitting empty -> should show error
    fireEvent.click(submitBtn);
    expect(
      await screen.findByText(/Please enter a valid email address/i),
    ).toBeInTheDocument();

    // Fill valid email
    fireEvent.change(input, { target: { value: "test@quickbihar.in" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith("/newsletter/subscribe", {
        email: "test@quickbihar.in",
        vertical: "JEWELERY",
        source: "jewelery-home-newsletter",
      });
    });

    expect(
      await screen.findByText(/You're on the list\. Welcome to the Circle!/i),
    ).toBeInTheDocument();
  });
});

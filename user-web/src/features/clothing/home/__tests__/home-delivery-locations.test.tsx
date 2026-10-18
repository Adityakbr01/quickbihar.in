import React from "react";
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/src/test/test-utils";
import HomeDeliveryLocations from "@/src/features/clothing/home/components/HomeDeliveryLocations";

describe("HomeDeliveryLocations — Regression", () => {
  it("renders the delivery hub section with heading and instant-delivery label", () => {
    renderWithProviders(<HomeDeliveryLocations />);

    expect(screen.getByText("INSTANT DELIVERY")).toBeInTheDocument();
    expect(screen.getByText("Fast Delivery in Buxar & Bihar")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Order fashion & clothing online with doorstep delivery across 26+ PIN codes",
      ),
    ).toBeInTheDocument();
  });

  it("renders all priority town chips with name, PIN and timing", () => {
    renderWithProviders(<HomeDeliveryLocations />);

    const towns = [
      { name: "Buxar City", pin: "802101", timing: "60-120 min", slug: "buxar-city" },
      { name: "Dumraon", pin: "802119", timing: "60-120 min", slug: "dumraon" },
      { name: "Chausa", pin: "802114", timing: "Same Day", slug: "chausa" },
      { name: "Itarhi", pin: "802123", timing: "Same Day", slug: "itarhi" },
      { name: "Rajpur", pin: "802113", timing: "Same Day", slug: "rajpur" },
      { name: "Brahampur", pin: "802112", timing: "Same Day", slug: "brahampur" },
      { name: "Nawanagar", pin: "802129", timing: "Same Day", slug: "nawanagar" },
      { name: "Simri", pin: "802118", timing: "Same Day", slug: "simri" },
    ];

    for (const { name, pin, timing, slug } of towns) {
      const chip = screen.getByRole("link", {
        name: new RegExp(`Shop clothing & fashion in ${name}, Buxar PIN ${pin}`, "i"),
      });
      expect(chip).toHaveAttribute("href", `/locations/bihar/buxar/${slug}`);
      expect(chip).toHaveTextContent(name);
      expect(chip).toHaveTextContent(`PIN ${pin}`);
      expect(chip).toHaveTextContent(timing);
    }
  });

  it("renders a link to explore all Buxar hubs", () => {
    renderWithProviders(<HomeDeliveryLocations />);

    const link = screen.getByRole("link", {
      name: /Explore Buxar District Delivery Hub/i,
    });
    expect(link).toHaveAttribute("href", "/locations/bihar/buxar");
  });

  it("renders each town chip as a link to its location page", () => {
    renderWithProviders(<HomeDeliveryLocations />);

    expect(screen.getByRole("link", { name: /Shop clothing & fashion in Buxar City, Buxar PIN 802101/i }))
      .toHaveAttribute("href", "/locations/bihar/buxar/buxar-city");
    expect(screen.getByRole("link", { name: /Delivery in Buxar City/i })).toBeInTheDocument();
  });

  it("renders the Buxar blocks SEO link list", () => {
    renderWithProviders(<HomeDeliveryLocations />);

    expect(screen.getByText("Serving Buxar Sadar & Dumraon Subdivisions:")).toBeInTheDocument();
  });
});

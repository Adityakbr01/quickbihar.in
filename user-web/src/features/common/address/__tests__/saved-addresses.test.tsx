import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders, LocationDisplay } from "@/src/test/test-utils";
import SavedAddressesScreen from "@/src/features/common/address/screen/SavedAddressesScreen";
import { useAddresses, useAddressActions } from "../hooks/useAddress";

vi.mock("../hooks/useAddress", () => ({
  useAddresses: vi.fn(),
  useAddressActions: vi.fn(() => ({
    deleteAddress: { mutateAsync: vi.fn() },
    setDefaultAddress: { mutateAsync: vi.fn() },
    isPending: false,
  })),
}));

const mockAddresses = [
  {
    _id: "addr-1",
    fullName: "Rahul Kumar",
    phone: "9876543210",
    street: "Station Road",
    city: "Buxar",
    state: "Bihar",
    pincode: "802101",
    isDefault: true,
    isPhoneVerified: true,
    latitude: 25.57,
    longitude: 84.0,
  },
];

describe("Saved Addresses — Regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Add New Address button enabled when there are no saved addresses", async () => {
    vi.mocked(useAddresses).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    renderWithProviders(
      <>
        <LocationDisplay />
        <SavedAddressesScreen />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByText("No Saved Addresses")).toBeInTheDocument();
    });

    const addButton = screen.getByRole("button", { name: /Add New Address/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).not.toBeDisabled();

    // Opening the address creation flow navigates to /account/address-form.
    fireEvent.click(addButton);
    await waitFor(() => {
      expect(screen.getByText("/account/address-form")).toBeInTheDocument();
    });
  });

  it("renders saved addresses", async () => {
    vi.mocked(useAddresses).mockReturnValue({
      data: mockAddresses,
      isLoading: false,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    renderWithProviders(
      <>
        <LocationDisplay />
        <SavedAddressesScreen />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByText("Rahul Kumar")).toBeInTheDocument();
      expect(screen.getByText("Station Road, Buxar, Bihar - 802101")).toBeInTheDocument();
    });

    const addButton = screen.getByRole("button", { name: /Add New Address/i });
    expect(addButton).toBeInTheDocument();
    expect(addButton).not.toBeDisabled();
  });

  it("shows loading skeletons while addresses are fetching", async () => {
    vi.mocked(useAddresses).mockReturnValue({
      data: [],
      isLoading: true,
      refetch: vi.fn(),
      isFetching: true,
    } as any);

    const { container } = renderWithProviders(<SavedAddressesScreen />);

    await waitFor(() => {
      expect(container.querySelector(".animate-pulse")).not.toBeNull();
    });
  });

  it("shows the empty state (no error) when there are no addresses", async () => {
    vi.mocked(useAddresses).mockReturnValue({
      data: [],
      isLoading: false,
      refetch: vi.fn(),
      isFetching: false,
    } as any);

    renderWithProviders(<SavedAddressesScreen />);

    expect(screen.queryByText(/Failed to load/i)).not.toBeInTheDocument();
    expect(screen.getByText("No Saved Addresses")).toBeInTheDocument();
  });
});

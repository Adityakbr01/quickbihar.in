import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import { renderWithProviders, LocationDisplay } from "@/src/test/test-utils";
import ProfileInfoScreen from "@/src/features/common/profileInfo/screen/ProfileInfoScreen";

vi.mock("@/src/features/common/profileInfo/hooks/useProfile", () => ({
  useProfile: vi.fn(),
}));

vi.mock("@/src/features/common/auth/store/authStore", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("@/lib/haptics", () => ({
  notificationAsync: vi.fn(),
  impactAsync: vi.fn(),
  NotificationFeedbackType: { Success: "success", Error: "error" },
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));

vi.mock("@/src/features/common/profileInfo/components/ProfileAvatar", () => ({
  default: () => <div data-testid="profile-avatar">Avatar</div>,
}));
vi.mock("@/src/features/common/profileInfo/components/ProfileDetailsView", () => ({
  default: () => <div data-testid="profile-details">Details View</div>,
}));
vi.mock("@/src/features/common/profileInfo/components/ProfileEditForm", () => ({
  default: () => <div data-testid="profile-edit-form">Edit Form</div>,
}));
vi.mock("@/src/features/common/address/components/PhoneOtpSheet", () => ({
  default: () => null,
}));
vi.mock("@/src/components/ui/IOSAlertDialog", () => ({
  default: () => null,
}));

import { useProfile } from "@/src/features/common/profileInfo/hooks/useProfile";
import { useAuthStore } from "@/src/features/common/auth/store/authStore";

const mockUser = {
  _id: "user-1",
  username: "rahul_k",
  email: "rahul@example.com",
  fullName: "Rahul Kumar",
  phone: "9876543210",
  role: { name: "USER" },
  avatar: { url: "https://example.com/avatar.jpg" },
  isPhoneVerified: true,
  createdAt: "2024-01-01T00:00:00Z",
};

describe("Profile Navigation — Regression", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders profile information on the profile route", async () => {
    vi.mocked(useProfile).mockReturnValue({
      profile: mockUser,
      isLoading: false,
      updateProfile: { mutateAsync: vi.fn() },
      updateAvatar: { mutateAsync: vi.fn(), isPending: false },
      isUpdating: false,
    } as any);
    vi.mocked(useAuthStore).mockReturnValue({ user: mockUser } as any);

    renderWithProviders(
      <>
        <LocationDisplay />
        <ProfileInfoScreen />
      </>,
      { initialEntries: ["/account/profile-info"] },
    );

    await waitFor(() => {
      expect(screen.getByText("Rahul Kumar")).toBeInTheDocument();
      expect(screen.getByText("@rahul_k")).toBeInTheDocument();
      expect(screen.getByText("USER")).toBeInTheDocument();
    });

    expect(screen.getByText("QuickBihar ID: user-1")).toBeInTheDocument();
  });

  it("renders the details view by default on the profile route", async () => {
    vi.mocked(useProfile).mockReturnValue({
      profile: mockUser,
      isLoading: false,
      updateProfile: { mutateAsync: vi.fn() },
      updateAvatar: { mutateAsync: vi.fn(), isPending: false },
      isUpdating: false,
    } as any);
    vi.mocked(useAuthStore).mockReturnValue({ user: mockUser } as any);

    renderWithProviders(<ProfileInfoScreen />, {
      initialEntries: ["/account/profile"],
    });

    await waitFor(() => {
      expect(screen.getByTestId("profile-details")).toBeInTheDocument();
      expect(screen.queryByTestId("profile-edit-form")).not.toBeInTheDocument();
    });
  });

  it("shows a loading state while the profile is being fetched", async () => {
    vi.mocked(useProfile).mockReturnValue({
      profile: null,
      isLoading: true,
      updateProfile: { mutateAsync: vi.fn() },
      updateAvatar: { mutateAsync: vi.fn(), isPending: false },
      isUpdating: false,
    } as any);
    vi.mocked(useAuthStore).mockReturnValue({ user: null } as any);

    renderWithProviders(<ProfileInfoScreen />, {
      initialEntries: ["/account/profile-info"],
    });

    expect(screen.queryByText(/Rahul Kumar/)).not.toBeInTheDocument();
    expect(screen.queryByText(/USER/)).not.toBeInTheDocument();
  });
});

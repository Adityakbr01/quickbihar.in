import { describe, expect, it } from "bun:test";
import {
  loginSchema,
  registerSchema,
  googleAuthSchema,
} from "../features/auth/schemas/auth.schema";

describe("Dashboard Auth Zod Validation Schemas", () => {
  describe("loginSchema", () => {
    it("validates well-formed email and minimum 8-char password", () => {
      const valid = { email: "admin@quickbihar.in", password: "securepassword123" };
      expect(loginSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects invalid email addresses", () => {
      const invalid = { email: "not-an-email", password: "password123" };
      const result = loginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("valid email");
      }
    });

    it("rejects short passwords (< 8 chars)", () => {
      const invalid = { email: "seller@quickbihar.in", password: "12345" };
      const result = loginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least 8 characters");
      }
    });
  });

  describe("registerSchema", () => {
    it("allows USER registration without phone number", () => {
      const customer = {
        email: "customer@quickbihar.in",
        password: "customerpassword123",
        fullName: "Ramesh Kumar",
        role: "USER" as const,
      };
      expect(registerSchema.safeParse(customer).success).toBe(true);
    });

    it("strictly requires phone number for SELLER registration", () => {
      const sellerNoPhone = {
        email: "seller@quickbihar.in",
        password: "sellerpassword123",
        fullName: "Maa Durga Garments",
        role: "SELLER" as const,
      };
      const result = registerSchema.safeParse(sellerNoPhone);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          "Phone number is required for seller and rider",
        );
      }
    });

    it("accepts valid phone numbers for SELLER and RIDER", () => {
      const sellerWithPhone = {
        email: "seller@quickbihar.in",
        password: "sellerpassword123",
        fullName: "Maa Durga Garments",
        role: "SELLER" as const,
        phone: "+919876543210",
      };
      expect(registerSchema.safeParse(sellerWithPhone).success).toBe(true);

      const riderWithPhone = {
        email: "rider@quickbihar.in",
        password: "riderpassword123",
        fullName: "Sonu Sharma",
        role: "RIDER" as const,
        phone: "9876543210",
      };
      expect(registerSchema.safeParse(riderWithPhone).success).toBe(true);
    });

    it("rejects invalid phone formatting", () => {
      const badPhone = {
        email: "seller@quickbihar.in",
        password: "sellerpassword123",
        fullName: "Shop Name",
        role: "SELLER" as const,
        phone: "12345", // too short
      };
      const result = registerSchema.safeParse(badPhone);
      expect(result.success).toBe(false);
    });
  });

  describe("googleAuthSchema", () => {
    it("validates standard Google ID tokens", () => {
      const valid = { idToken: "valid_google_jwt_id_token_from_client" };
      expect(googleAuthSchema.safeParse(valid).success).toBe(true);
    });

    it("rejects missing or truncated ID token", () => {
      expect(googleAuthSchema.safeParse({ idToken: "short" }).success).toBe(false);
      expect(googleAuthSchema.safeParse({}).success).toBe(false);
    });
  });
});

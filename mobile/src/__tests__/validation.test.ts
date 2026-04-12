import {
  isValidEmail,
  evaluatePasswordStrength,
  validatePassword,
} from "../utils/validation";

describe("Validation Logic", () => {
  describe("isValidEmail", () => {
    it("returns true for valid emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name+tag@domain.co.uk")).toBe(true);
    });

    it("returns false for invalid emails", () => {
      expect(isValidEmail("test@example")).toBe(false);
      expect(isValidEmail("test.com")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("test@.com")).toBe(false);
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("evaluatePasswordStrength", () => {
    it("returns Weak for empty or short passwords", () => {
      const result = evaluatePasswordStrength("");
      expect(result.label).toBe("Weak");
      expect(result.score).toBe(0);

      const result2 = evaluatePasswordStrength("short");
      expect(result2.label).toBe("Weak");
      expect(result2.score).toBe(1); // lowercase only
    });

    it("returns Fair for passwords with some mixed characters", () => {
      const result = evaluatePasswordStrength("Password");
      expect(result.label).toBe("Fair");
      expect(result.score).toBe(2);
    });

    it("returns Good for passwords with letters and numbers", () => {
      const result = evaluatePasswordStrength("Password123");
      expect(result.label).toBe("Good");
      expect(result.score).toBe(3);
    });

    it("returns Strong for passwords with letters, numbers, and symbols", () => {
      const result = evaluatePasswordStrength("Password123!");
      expect(result.label).toBe("Strong");
      expect(result.score).toBe(4);
    });
  });

  describe("validatePassword", () => {
    it("returns error if password is empty", () => {
      expect(validatePassword("")).toBe("Password is required");
    });

    it("returns error if password is too short", () => {
      expect(validatePassword("short")).toBe(
        "Password must be at least 8 characters",
      );
    });

    it("returns null if password is valid", () => {
      expect(validatePassword("Password123")).toBe(null);
    });
  });
});

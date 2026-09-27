export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const evaluatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (!password) return { score: 0, label: 'Weak', color: '#ff4d4f' };
  
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  if (score < 2) return { score: 1, label: 'Weak', color: '#ff4d4f' };
  if (score < 4) return { score: 2, label: 'Fair', color: '#faad14' };
  if (score < 5) return { score: 3, label: 'Good', color: '#52c41a' };
  return { score: 4, label: 'Strong', color: '#13c2c2' };
};

export const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  return null;
};

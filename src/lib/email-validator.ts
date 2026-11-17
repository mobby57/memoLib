// Validation d'email robuste (pas de RFC 5322 complet, mais 99% des cas réels)
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  // Regex simple mais fiable : x@y.z
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

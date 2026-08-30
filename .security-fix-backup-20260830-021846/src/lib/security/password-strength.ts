/**
 * Password strength validation — zxcvbn-inspired, zero-dependency
 * Enforces: min 12 chars, uppercase, lowercase, digit, special char, no common patterns
 */

export interface PasswordStrengthResult {
  score: number; // 0-4
  valid: boolean;
  errors: string[];
  suggestions: string[];
}

const COMMON_PATTERNS = [
  /^(.)\1+$/, // all same char
  /^(012|123|234|345|456|567|678|789|890|987|876|765|654|543|432|321|210)/,
  /^(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i,
  /^(qwerty|azerty|qwertz|password|motdepasse|mdp|admin|letmein|welcome|memolib)/i,
];

const KEYBOARD_SEQUENCES = ['qwerty', 'azerty', 'qwertz', '12345', 'abcde'];

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Length
  if (password.length < 12) {
    errors.push('Le mot de passe doit contenir au moins 12 caractères');
  } else if (password.length >= 16) {
    score += 2;
  } else {
    score += 1;
  }

  // Uppercase
  if (!/[A-Z]/.test(password)) {
    errors.push('Au moins une lettre majuscule requise');
  } else {
    score += 1;
  }

  // Lowercase
  if (!/[a-z]/.test(password)) {
    errors.push('Au moins une lettre minuscule requise');
  } else {
    score += 0.5;
  }

  // Digit
  if (!/\d/.test(password)) {
    errors.push('Au moins un chiffre requis');
  } else {
    score += 1;
  }

  // Special char
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Au moins un caractère spécial requis (!@#$%^&*...)');
  } else {
    score += 1;
  }

  // Common patterns
  const lower = password.toLowerCase();
  for (const pattern of COMMON_PATTERNS) {
    if (pattern.test(lower)) {
      errors.push('Le mot de passe contient un motif trop prévisible');
      score -= 1;
      break;
    }
  }

  // Keyboard sequences
  for (const seq of KEYBOARD_SEQUENCES) {
    if (lower.includes(seq)) {
      suggestions.push('Évitez les séquences de clavier (qwerty, 12345...)');
      score -= 0.5;
      break;
    }
  }

  // Variety bonus
  const charTypes = [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  if (charTypes === 4 && password.length >= 14) score += 0.5;

  const finalScore = Math.max(0, Math.min(4, Math.round(score)));

  if (finalScore <= 1) suggestions.push('Utilisez une phrase de passe avec des mots aléatoires');
  if (finalScore === 2) suggestions.push('Ajoutez plus de variété de caractères');

  return {
    score: finalScore,
    valid: errors.length === 0,
    errors,
    suggestions,
  };
}

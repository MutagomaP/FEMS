/**
 * Shared field validation patterns (used by class-validator @Matches on DTOs).
 */
export const FIELD_PATTERNS = {
  /** First or last name — letters only, no digits; 2–100 chars */
  PERSON_NAME_PART: /^[A-Za-zÀ-ÖØ-öø-ÿ]{2,100}$|^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)+$/,
  /** Full legal name — same rules, up to 255 chars */
  FULL_NAME:
    /^[A-Za-zÀ-ÖØ-öø-ÿ]{2,255}$|^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)+$/,
  NATIONAL_ID: /^[A-Za-z0-9][A-Za-z0-9-]{2,48}[A-Za-z0-9]$|^[A-Za-z0-9]{4,50}$/,
  PHONE: /^\+?[0-9][0-9\s()-]{6,18}[0-9]$/,
  ADDRESS: /^(?=.*[A-Za-zÀ-ÖØ-öø-ÿ])(?=.*[0-9]).{10,500}$|^(?=.*[A-Za-zÀ-ÖØ-öø-ÿ]).{15,500}$/,
  SERIAL_NUMBER: /^[A-Za-z0-9][A-Za-z0-9./_\s-]{2,98}[A-Za-z0-9]$/,
  LOCATION: /^(?=.*[A-Za-zÀ-ÖØ-öø-ÿ]).{3,255}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
} as const;

export const FIELD_MESSAGES = {
  PERSON_NAME_PART:
    'Must be 2–100 characters, letters only (no numbers). Spaces, hyphens, and apostrophes allowed between name parts.',
  FULL_NAME:
    'Must be a real name: letters only (no numbers), at least 2 characters. Use spaces for first and last name.',
  NATIONAL_ID:
    'National ID must be 4–50 letters or numbers (hyphens allowed, not at the start or end).',
  PHONE: 'Enter a valid phone number (7–20 digits; may start with +).',
  ADDRESS:
    'Address must be at least 10 characters and include letters; prefer street name and number.',
  SERIAL_NUMBER:
    'Serial number must be 4–100 alphanumeric characters (may include - _ / and spaces).',
  LOCATION: 'Location must be at least 3 characters and include a letter.',
  PASSWORD:
    'Password must be 8–128 characters with uppercase, lowercase, and a number.',
  EMAIL: 'Enter a valid email address.',
} as const;

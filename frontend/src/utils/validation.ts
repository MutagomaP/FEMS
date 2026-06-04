/** Keep in sync with packages/shared/src/validation/field-patterns.ts */

const PERSON_NAME_PART_RE =
  /^[A-Za-zÀ-ÖØ-öø-ÿ]{2,100}$|^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)+$/;
const FULL_NAME_RE =
  /^[A-Za-zÀ-ÖØ-öø-ÿ]{2,255}$|^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)+$/;
const NATIONAL_ID_RE = /^[A-Za-z0-9][A-Za-z0-9-]{2,48}[A-Za-z0-9]$|^[A-Za-z0-9]{4,50}$/;
const PHONE_RE = /^\+?[0-9][0-9\s()-]{6,18}[0-9]$/;
const ADDRESS_RE =
  /^(?=.*[A-Za-zÀ-ÖØ-öø-ÿ])(?=.*[0-9]).{10,500}$|^(?=.*[A-Za-zÀ-ÖØ-öø-ÿ]).{15,500}$/;
const SERIAL_NUMBER_RE = /^[A-Za-z0-9][A-Za-z0-9./_\s-]{2,98}[A-Za-z0-9]$/;
const LOCATION_RE = /^(?=.*[A-Za-zÀ-ÖØ-öø-ÿ]).{3,255}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function hasDigits(value: string): boolean {
  return /\d/.test(value);
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required';
  if (trimmed.length > 255) return 'Email must be at most 255 characters';
  if (!EMAIL_RE.test(trimmed)) return 'Enter a valid email address';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (!PASSWORD_RE.test(password)) {
    return 'Password must be 8–128 characters with uppercase, lowercase, and a number';
  }
  return null;
}

export function validateOtp(otp: string): string | null {
  const trimmed = otp.trim();
  if (!trimmed) return 'Verification code is required';
  if (!/^\d{6}$/.test(trimmed)) return 'Enter the 6-digit code from your email';
  return null;
}

export function validateRequired(value: string, label: string): string | null {
  if (!value.trim()) return `${label} is required`;
  return null;
}

/** First or last name (registration, profile) */
export function validateName(value: string, label: string): string | null {
  const trimmed = value.trim();
  const err = validateRequired(trimmed, label);
  if (err) return err;
  if (hasDigits(trimmed)) return `${label} cannot contain numbers`;
  if (!PERSON_NAME_PART_RE.test(trimmed)) {
    return `${label} must use letters only (at least 2 characters). Hyphens and apostrophes are allowed.`;
  }
  return null;
}

/** Customer / display full name */
export function validateFullName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Full name is required';
  if (hasDigits(trimmed)) return 'Full name cannot contain numbers';
  if (!FULL_NAME_RE.test(trimmed)) {
    return 'Enter a real full name using letters only (e.g. Jane Doe)';
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return 'Enter both first and last name (at least two words)';
  }
  for (const part of parts) {
    if (part.length < 2) return 'Each name part must be at least 2 letters';
  }
  return null;
}

export function validateNationalId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'National ID is required';
  if (!NATIONAL_ID_RE.test(trimmed)) {
    return 'National ID must be 4–50 letters or numbers (hyphens allowed)';
  }
  return null;
}

export function validatePhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Phone is required';
  if (!PHONE_RE.test(trimmed)) {
    return 'Enter a valid phone number (7–20 digits; may start with +)';
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    return 'Phone must contain 7–15 digits';
  }
  return null;
}

export function validateAddress(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Address is required';
  if (trimmed.length < 10) return 'Address must be at least 10 characters';
  if (!ADDRESS_RE.test(trimmed)) {
    return 'Address must include letters and preferably a street number';
  }
  return null;
}

export function validateSerialNumber(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Serial number is required';
  if (!SERIAL_NUMBER_RE.test(trimmed)) {
    return 'Serial number must be 4–100 alphanumeric characters';
  }
  return null;
}

export function validateLocation(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Location is required';
  if (!LOCATION_RE.test(trimmed)) {
    return 'Location must be at least 3 characters and include a letter';
  }
  return null;
}

export function validateDescription(value: string, label: string, min = 10): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required`;
  if (trimmed.length < min) return `${label} must be at least ${min} characters`;
  if (trimmed.length > 2000) return `${label} must be at most 2000 characters`;
  return null;
}

export function validateInspectionTime(time: string): string | null {
  if (!TIME_RE.test(time)) return 'Time must be HH:mm (24-hour)';
  return null;
}

export function validateDateNotPast(date: string, label: string): string | null {
  if (!date) return `${label} is required`;
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) return `${label} cannot be in the past`;
  return null;
}

/** Keep in sync with packages/shared/src/validation/extinguisher-dates.ts */
export const EXTINGUISHER_MAX_YEAR = 2026;
export const EXTINGUISHER_MAX_DATE = `${EXTINGUISHER_MAX_YEAR}-12-31`;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function invalidExtinguisherDateMessage(label: string): string {
  return `Enter a valid ${label} (year cannot exceed ${EXTINGUISHER_MAX_YEAR})`;
}

function parseExtinguisherDate(value: string): Date | null {
  const trimmed = value?.trim();
  if (!trimmed || !ISO_DATE_RE.test(trimmed)) return null;
  const [yearStr, monthStr, dayStr] = trimmed.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (year > EXTINGUISHER_MAX_YEAR) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function dayAfterIsoDate(isoDate: string): string | undefined {
  const parsed = parseExtinguisherDate(isoDate);
  if (!parsed) return undefined;
  const next = new Date(parsed);
  next.setDate(next.getDate() + 1);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, '0');
  const d = String(next.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function validateExtinguisherInstallationDate(date: string): string | null {
  if (!date?.trim()) return 'Installation date is required';
  if (!parseExtinguisherDate(date)) {
    return invalidExtinguisherDateMessage('installation date');
  }
  return null;
}

export function validateExtinguisherExpiryDate(
  expiryDate: string,
  installationDate: string,
): string | null {
  if (!expiryDate?.trim()) return 'Expiry date is required';
  const expiry = parseExtinguisherDate(expiryDate);
  if (!expiry) {
    return invalidExtinguisherDateMessage('expiry date');
  }
  const install = parseExtinguisherDate(installationDate);
  if (!install) return null;
  if (expiry.getTime() <= install.getTime()) {
    return 'Expiry date must be later than installation date';
  }
  return null;
}

export function getExtinguisherDateFieldErrors(
  installationDate: string,
  expiryDate: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const installErr = validateExtinguisherInstallationDate(installationDate);
  const expiryErr = validateExtinguisherExpiryDate(expiryDate, installationDate);
  if (installErr) errors.installationDate = installErr;
  if (expiryErr) errors.expiryDate = expiryErr;
  return errors;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateActionTaken(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Action taken is required';
  if (trimmed.length < 5) return 'Action taken must be at least 5 characters';
  if (trimmed.length > 255) return 'Action taken must be at most 255 characters';
  return null;
}

export function validateMaintenanceDate(date: string): string | null {
  if (!date?.trim()) return 'Maintenance date is required';
  if (!parseExtinguisherDate(date)) {
    return 'Enter a valid maintenance date';
  }
  const today = new Date().toISOString().slice(0, 10);
  if (date > today) return 'Maintenance date cannot be in the future';
  return null;
}

/** Maintenance log text fields must be plain strings with letters when provided */
const MAINTENANCE_LOG_TEXT_RE =
  /^[A-Za-zÀ-ÖØ-öø-ÿ0-9\s.,;:!?'()\-/\n\r]{3,5000}$/;

export function validateMaintenanceLogText(
  value: string,
  label: string,
  max = 5000,
): string | null {
  if (typeof value !== 'string') {
    return `${label} must be text`;
  }
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length < 3) {
    return `${label} must be at least 3 characters when provided`;
  }
  if (trimmed.length > max) {
    return `${label} must be at most ${max} characters`;
  }
  if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(trimmed)) {
    return `${label} must include letters (text only, not numbers alone)`;
  }
  if (!MAINTENANCE_LOG_TEXT_RE.test(trimmed)) {
    return `${label} may only contain letters, numbers, spaces, and common punctuation`;
  }
  return null;
}

/** @deprecated Use validateMaintenanceLogText */
export function validateOptionalMaintenanceText(
  value: string,
  label: string,
  max = 5000,
): string | null {
  return validateMaintenanceLogText(value, label, max);
}

export function validateMaintenanceForm(form: {
  extinguisherId: string;
  actionTaken: string;
  maintenanceDate: string;
  issuesIdentified: string;
  notes: string;
  recommendations: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  const extinguisherErr = validateRequired(form.extinguisherId, 'Extinguisher');
  if (extinguisherErr) {
    errors.extinguisherId = extinguisherErr;
  } else if (!UUID_RE.test(form.extinguisherId.trim())) {
    errors.extinguisherId = 'Select a valid extinguisher';
  }

  const actionErr = validateActionTaken(form.actionTaken);
  if (actionErr) errors.actionTaken = actionErr;

  const dateErr = validateMaintenanceDate(form.maintenanceDate);
  if (dateErr) errors.maintenanceDate = dateErr;

  const issuesErr = validateMaintenanceLogText(
    form.issuesIdentified,
    'Issues identified',
  );
  if (issuesErr) errors.issuesIdentified = issuesErr;

  const notesErr = validateMaintenanceLogText(form.notes, 'Notes');
  if (notesErr) errors.notes = notesErr;

  const recErr = validateMaintenanceLogText(
    form.recommendations,
    'Recommendations',
  );
  if (recErr) errors.recommendations = recErr;

  return errors;
}

export function validateCustomerForm(form: {
  fullName: string;
  nationalId: string;
  phone: string;
  email: string;
  address: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const fullName = validateFullName(form.fullName);
  const nationalId = validateNationalId(form.nationalId);
  const phone = validatePhone(form.phone);
  const email = validateEmail(form.email);
  const address = validateAddress(form.address);
  if (fullName) errors.fullName = fullName;
  if (nationalId) errors.nationalId = nationalId;
  if (phone) errors.phone = phone;
  if (email) errors.email = email;
  if (address) errors.address = address;
  return errors;
}

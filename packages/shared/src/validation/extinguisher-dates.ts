/** Latest calendar year allowed for extinguisher installation and expiry dates. */
export const EXTINGUISHER_MAX_YEAR = 2026;
export const EXTINGUISHER_MAX_DATE = `${EXTINGUISHER_MAX_YEAR}-12-31`;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export interface ExtinguisherDateErrors {
  installationDate?: string;
  expiryDate?: string;
}

function invalidDateMessage(label: string): string {
  return `Enter a valid ${label} (year cannot exceed ${EXTINGUISHER_MAX_YEAR})`;
}

export function parseExtinguisherDate(
  value: string,
): { date: Date; iso: string } | null {
  const trimmed = value?.trim();
  if (!trimmed || !ISO_DATE_RE.test(trimmed)) {
    return null;
  }

  const [yearStr, monthStr, dayStr] = trimmed.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (year > EXTINGUISHER_MAX_YEAR) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return { date, iso: trimmed };
}

export function getExtinguisherDateErrors(
  installationDate: string,
  expiryDate: string,
): ExtinguisherDateErrors {
  const errors: ExtinguisherDateErrors = {};

  if (!installationDate?.trim()) {
    errors.installationDate = 'Installation date is required';
  } else if (!parseExtinguisherDate(installationDate)) {
    errors.installationDate = invalidDateMessage('installation date');
  }

  if (!expiryDate?.trim()) {
    errors.expiryDate = 'Expiry date is required';
  } else if (!parseExtinguisherDate(expiryDate)) {
    errors.expiryDate = invalidDateMessage('expiry date');
  }

  if (errors.installationDate || errors.expiryDate) {
    return errors;
  }

  const install = parseExtinguisherDate(installationDate)!;
  const expiry = parseExtinguisherDate(expiryDate)!;

  if (expiry.date.getTime() <= install.date.getTime()) {
    errors.expiryDate = 'Expiry date must be later than installation date';
  }

  return errors;
}

export function getExtinguisherExpiryDateError(
  expiryDate: string,
  installationDate: string,
): string | null {
  const errors = getExtinguisherDateErrors(installationDate, expiryDate);
  return errors.expiryDate ?? errors.installationDate ?? null;
}

export function dayAfterIsoDate(isoDate: string): string | undefined {
  const parsed = parseExtinguisherDate(isoDate);
  if (!parsed) {
    return undefined;
  }
  const next = new Date(parsed.date);
  next.setDate(next.getDate() + 1);
  const y = next.getFullYear();
  const m = String(next.getMonth() + 1).padStart(2, '0');
  const d = String(next.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

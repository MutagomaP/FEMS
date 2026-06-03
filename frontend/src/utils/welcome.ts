import type { User, UserRole } from '@/types';

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  customer: 'Customer',
  inspector: 'Inspector',
};

export function getDisplayName(
  user?: Pick<User, 'fullName' | 'firstName'> | null,
): string {
  if (!user) return 'there';
  const full = user.fullName?.trim();
  if (full) return full;
  const first = user.firstName?.trim();
  if (first) return first;
  return 'there';
}

export function getRoleLabel(role?: UserRole): string {
  if (!role) return '';
  return ROLE_LABELS[role] ?? role;
}

export function getDashboardWelcomeDescription(role?: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Manage customers, extinguishers, compliance, and reports from your admin dashboard.';
    case 'inspector':
      return 'Review extinguishers and complete scheduled inspections.';
    case 'customer':
      return 'Track your extinguishers, schedule inspections, and stay compliant.';
    default:
      return 'Your fire extinguisher safety overview';
  }
}

import { describe, expect, it } from 'vitest';
import {
  validateFullName,
  validateName,
  validateNationalId,
  validatePhone,
} from './validation';

describe('validateName', () => {
  it('rejects names with numbers', () => {
    expect(validateName('Pat1243', 'First name')).toMatch(/numbers/i);
  });

  it('accepts valid names', () => {
    expect(validateName('Patrick', 'First name')).toBeNull();
    expect(validateName("O'Brien", 'Last name')).toBeNull();
    expect(validateName('Mary-Jane', 'First name')).toBeNull();
  });

  it('rejects too short names', () => {
    expect(validateName('A', 'First name')).not.toBeNull();
  });
});

describe('validateFullName', () => {
  it('requires two name parts', () => {
    expect(validateFullName('Pat1243')).toMatch(/numbers|real full name|two words/i);
    expect(validateFullName('Madonna')).toMatch(/two words/i);
  });

  it('accepts proper full names', () => {
    expect(validateFullName('Alice Johnson')).toBeNull();
  });
});

describe('validateNationalId', () => {
  it('accepts alphanumeric ids', () => {
    expect(validateNationalId('NAT-001')).toBeNull();
  });
});

describe('validatePhone', () => {
  it('accepts international format', () => {
    expect(validatePhone('+250788123456')).toBeNull();
  });
});

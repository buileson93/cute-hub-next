import { describe, it, expect } from 'vitest';
import { thongDiepLoi } from '../errors';

describe('thongDiepLoi', () => {
  it('should return string as is', () => {
    expect(thongDiepLoi('Simple error', 'Fallback')).toBe('Simple error');
  });

  it('should return Error.message', () => {
    expect(thongDiepLoi(new Error('Standard error'), 'Fallback')).toBe('Standard error');
  });

  it('should handle PostgrestError (message, details, hint)', () => {
    const postgrest = { message: 'Database error', details: 'Key already exists', hint: 'Use another key' };
    expect(thongDiepLoi(postgrest, 'Fallback')).toBe('Database error — Use another key — Key already exists');
  });

  it('should handle nested error.message', () => {
    const error = { error: { message: 'Nested error message' } };
    expect(thongDiepLoi(error, 'Fallback')).toBe('Nested error message');
  });

  it('should handle nested data.message', () => {
    const error = { data: { message: 'Data error message' } };
    expect(thongDiepLoi(error, 'Fallback')).toBe('Data error message');
  });

  it('should handle nested response.data.message', () => {
    const error = { response: { data: { message: 'Response data error message' } } };
    expect(thongDiepLoi(error, 'Fallback')).toBe('Response data error message');
  });

  it('should return fallback for object without message', () => {
    expect(thongDiepLoi({}, 'Fallback')).toBe('Fallback');
  });

  it('should return fallback for null/undefined', () => {
    expect(thongDiepLoi(null, 'Fallback')).toBe('Fallback');
    expect(thongDiepLoi(undefined, 'Fallback')).toBe('Fallback');
  });
});

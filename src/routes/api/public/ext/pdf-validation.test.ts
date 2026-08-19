import { describe, it, expect } from 'vitest';

describe('PDF Validation Logic', () => {
  it('should validate PDF mime type', () => {
    const isPdf = (mime: string) => mime === 'application/pdf';
    expect(isPdf('application/pdf')).toBe(true);
    expect(isPdf('image/png')).toBe(false);
  });

  it('should sanitize filenames correctly', () => {
    const sanitize = (name: string) => name.replace(/[^a-zA-Z0-9.-]/g, '_');
    expect(sanitize('my file!.pdf')).toBe('my_file_.pdf');
    expect(sanitize('../../etc/passwd')).toBe('.._.._etc_passwd');
  });
});

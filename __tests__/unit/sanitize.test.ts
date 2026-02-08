/**
 * Unit tests for input sanitization functions
 */

import {
  sanitizeHtml,
  sanitizeDisplayName,
  sanitizeEmail,
  sanitizeText,
  sanitizeTimezone,
} from '@/lib/security/sanitize';

describe('Sanitization Functions', () => {
  describe('sanitizeHtml', () => {
    it('should strip all HTML tags', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe('alert("xss")');
      expect(sanitizeHtml('<b>Bold</b> text')).toBe('Bold text');
      expect(sanitizeHtml('<img src=x onerror=alert(1)>')).toBe('');
    });

    it('should handle empty or invalid input', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
      expect(sanitizeHtml(123 as any)).toBe('');
    });

    it('should preserve text content', () => {
      expect(sanitizeHtml('Plain text')).toBe('Plain text');
      expect(sanitizeHtml('Text with <a href="#">link</a>')).toBe('Text with link');
    });
  });

  describe('sanitizeDisplayName', () => {
    it('should sanitize and trim display names', () => {
      expect(sanitizeDisplayName('  John Doe  ')).toBe('John Doe');
      expect(sanitizeDisplayName('Alice')).toBe('Alice');
    });

    it('should strip HTML from display names', () => {
      expect(sanitizeDisplayName('<script>alert(1)</script>Bob')).toBe('alert(1)Bob');
      expect(sanitizeDisplayName('Bob<img src=x>')).toBe('Bob');
    });

    it('should limit display name length to 50 characters', () => {
      const longName = 'a'.repeat(100);
      expect(sanitizeDisplayName(longName)).toHaveLength(50);
    });

    it('should handle empty or invalid input', () => {
      expect(sanitizeDisplayName('')).toBe('');
      expect(sanitizeDisplayName(null)).toBe('');
      expect(sanitizeDisplayName(undefined)).toBe('');
    });
  });

  describe('sanitizeEmail', () => {
    it('should sanitize valid emails', () => {
      expect(sanitizeEmail('user@example.com')).toBe('user@example.com');
      expect(sanitizeEmail('User@Example.COM')).toBe('user@example.com');
      expect(sanitizeEmail('  user@example.com  ')).toBe('user@example.com');
    });

    it('should reject invalid emails', () => {
      expect(sanitizeEmail('notanemail')).toBe('');
      expect(sanitizeEmail('missing@')).toBe('');
      expect(sanitizeEmail('@nodomain.com')).toBe('');
      expect(sanitizeEmail('spaces in@email.com')).toBe('');
    });

    it('should strip HTML from emails', () => {
      expect(sanitizeEmail('<script>user@example.com</script>')).toBe('');
    });

    it('should handle empty or invalid input', () => {
      expect(sanitizeEmail('')).toBe('');
      expect(sanitizeEmail(null)).toBe('');
      expect(sanitizeEmail(undefined)).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('should sanitize text and strip HTML', () => {
      expect(sanitizeText('Plain text')).toBe('Plain text');
      expect(sanitizeText('<b>Bold</b>')).toBe('Bold');
      expect(sanitizeText('  Trimmed  ')).toBe('Trimmed');
    });

    it('should respect max length', () => {
      const longText = 'a'.repeat(100);
      expect(sanitizeText(longText, 50)).toHaveLength(50);
      expect(sanitizeText(longText)).toBe(longText); // No limit when not specified
    });

    it('should handle empty or invalid input', () => {
      expect(sanitizeText('')).toBe('');
      expect(sanitizeText(null)).toBe('');
      expect(sanitizeText(undefined)).toBe('');
    });
  });

  describe('sanitizeTimezone', () => {
    it('should accept valid IANA timezones', () => {
      expect(sanitizeTimezone('America/New_York')).toBe('America/New_York');
      expect(sanitizeTimezone('Europe/London')).toBe('Europe/London');
      expect(sanitizeTimezone('Asia/Tokyo')).toBe('Asia/Tokyo');
      expect(sanitizeTimezone('UTC')).toBe('UTC');
    });

    it('should reject invalid timezones', () => {
      expect(sanitizeTimezone('Invalid/Timezone')).toBe('UTC');
      expect(sanitizeTimezone('<script>alert(1)</script>')).toBe('UTC');
      expect(sanitizeTimezone('America/Fake')).toBe('UTC');
    });

    it('should strip HTML from timezone strings', () => {
      expect(sanitizeTimezone('<b>UTC</b>')).toBe('UTC'); // Should fall back to UTC after stripping
    });

    it('should handle empty or invalid input', () => {
      expect(sanitizeTimezone('')).toBe('UTC');
      expect(sanitizeTimezone(null)).toBe('UTC');
      expect(sanitizeTimezone(undefined)).toBe('UTC');
    });

    it('should reject timezone strings with special characters', () => {
      expect(sanitizeTimezone('America/New_York;DROP TABLE users;')).toBe('UTC');
      expect(sanitizeTimezone('../../etc/passwd')).toBe('UTC');
    });
  });
});

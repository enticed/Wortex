/**
 * Input sanitization utilities to prevent XSS attacks
 * Uses DOMPurify to sanitize user-generated content
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes all potentially dangerous HTML tags and attributes
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
    KEEP_CONTENT: true, // Keep text content
  });
}

/**
 * Sanitize display name
 * - Strips HTML tags
 * - Limits length to 50 characters
 * - Trims whitespace
 */
export function sanitizeDisplayName(name: string | null | undefined): string {
  if (!name || typeof name !== 'string') {
    return '';
  }

  // Strip HTML and trim
  const cleaned = sanitizeHtml(name).trim();

  // Limit length
  const maxLength = 50;
  if (cleaned.length > maxLength) {
    return cleaned.substring(0, maxLength);
  }

  return cleaned;
}

/**
 * Sanitize email address
 * Basic validation and sanitization for email inputs
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  // Strip HTML and trim
  const cleaned = sanitizeHtml(email).trim().toLowerCase();

  // Basic email validation pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(cleaned)) {
    return '';
  }

  return cleaned;
}

/**
 * Sanitize generic text input
 * - Strips HTML tags
 * - Trims whitespace
 * - Optional max length
 */
export function sanitizeText(
  text: string | null | undefined,
  maxLength?: number
): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Strip HTML and trim
  let cleaned = sanitizeHtml(text).trim();

  // Apply max length if specified
  if (maxLength && cleaned.length > maxLength) {
    cleaned = cleaned.substring(0, maxLength);
  }

  return cleaned;
}

/**
 * Sanitize timezone string
 * Only allows valid IANA timezone identifiers
 */
export function sanitizeTimezone(timezone: string | null | undefined): string {
  if (!timezone || typeof timezone !== 'string') {
    return 'UTC';
  }

  // Strip HTML and trim
  const cleaned = sanitizeHtml(timezone).trim();

  // Basic validation - timezone should only contain letters, numbers, /, _, and -
  const timezonePattern = /^[A-Za-z0-9/_-]+$/;
  if (!timezonePattern.test(cleaned)) {
    return 'UTC';
  }

  // Validate against common timezone format
  try {
    // This will throw if timezone is invalid
    new Intl.DateTimeFormat('en-US', { timeZone: cleaned });
    return cleaned;
  } catch {
    return 'UTC';
  }
}

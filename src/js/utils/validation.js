// Input validation helpers
// Implementation: task 2.2

/**
 * Validates a text field — rejects empty strings and whitespace-only strings.
 * @param {string} value
 * @returns {{ valid: boolean, error: string }}
 */
export function validateText(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return { valid: false, error: 'This field is required and cannot be blank.' };
  }
  return { valid: true, error: '' };
}

/**
 * Validates that a value is a non-negative integer (>= 0).
 * Accepts numeric strings as well as actual numbers.
 * @param {string|number} value
 * @returns {{ valid: boolean, error: string }}
 */
export function validateNonNegInt(value) {
  const num = Number(value);
  if (value === '' || value === null || value === undefined) {
    return { valid: false, error: 'This field is required.' };
  }
  if (!Number.isInteger(num) || num < 0) {
    return { valid: false, error: 'Please enter a non-negative whole number (0 or greater).' };
  }
  return { valid: true, error: '' };
}

/**
 * Validates an accuracy value — accepts empty string (optional field) or a
 * number in the range [0, 100].
 * @param {string|number} value
 * @returns {{ valid: boolean, error: string }}
 */
export function validateAccuracy(value) {
  if (value === '' || value === null || value === undefined) {
    // Optional field — empty is fine
    return { valid: true, error: '' };
  }
  const num = Number(value);
  if (isNaN(num) || num < 0 || num > 100) {
    return { valid: false, error: 'Accuracy must be a number between 0 and 100.' };
  }
  return { valid: true, error: '' };
}

/**
 * Validates a CGPA value — must be a number in [0.0, 10.0].
 * @param {string|number} value
 * @returns {{ valid: boolean, error: string }}
 */
export function validateCGPA(value) {
  if (value === '' || value === null || value === undefined) {
    return { valid: false, error: 'CGPA is required.' };
  }
  const num = Number(value);
  if (isNaN(num) || num < 0 || num > 10) {
    return { valid: false, error: 'CGPA must be a number between 0.0 and 10.0.' };
  }
  return { valid: true, error: '' };
}

/**
 * Issues a warning (not a blocking error) when a URL field is non-empty but
 * does not start with "http://" or "https://".
 * @param {string} value
 * @returns {{ warn: boolean, message: string }}
 */
export function warnURL(value) {
  if (typeof value === 'string' && value.length > 0) {
    if (!value.startsWith('http://') && !value.startsWith('https://')) {
      return { warn: true, message: 'URL should start with http:// or https:// for best results.' };
    }
  }
  return { warn: false, message: '' };
}

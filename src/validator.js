/**
 * Simple value validator.
 * @param {*} value
 * @param {Object} rules
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validate(value, rules = {}) {
  const errors = [];

  if (rules.required && (value === null || value === undefined || value === '')) {
    errors.push('Value is required');
    return { valid: false, errors };
  }

  if (rules.type) {
    const t = rules.type === 'array' ? Array.isArray(value) : typeof value === rules.type;
    if (!t) {errors.push(`Expected type '${rules.type}', got '${Array.isArray(value) ? 'array' : typeof value}'`);}
  }

  if (rules.minLength !== undefined && value !== null && value.length !== undefined) {
    if (value.length < rules.minLength) {errors.push(`Minimum length is ${rules.minLength}`);}
  }

  if (rules.maxLength !== undefined && value !== null && value.length !== undefined) {
    if (value.length > rules.maxLength) {errors.push(`Maximum length is ${rules.maxLength}`);}
  }

  if (rules.min !== undefined && typeof value === 'number') {
    if (value < rules.min) {errors.push(`Minimum value is ${rules.min}`);}
  }

  if (rules.max !== undefined && typeof value === 'number') {
    if (value > rules.max) {errors.push(`Maximum value is ${rules.max}`);}
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validate };

// Lightweight DOM helpers
// Feature: placement-prep-tool
// Requirements: 11.2

/**
 * Creates a DOM element with the given tag, attributes, and children.
 *
 * @param {string} tag - The HTML tag name (e.g. 'div', 'button').
 * @param {Object|null} attrs - Key/value pairs to set as attributes or properties.
 *   - Keys starting with 'on' are treated as event listeners (e.g. onClick → 'click').
 *   - 'className' is mapped to element.className.
 *   - All other keys are set via setAttribute.
 * @param {...(Node|string)} children - Child nodes or strings to append.
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs, ...children) {
  const el = document.createElement(tag);

  if (attrs) {
    setAttr(el, attrs);
  }

  for (const child of children) {
    if (child === null || child === undefined) continue;
    if (child instanceof Node) {
      el.appendChild(child);
    } else {
      el.appendChild(document.createTextNode(String(child)));
    }
  }

  return el;
}

/**
 * Removes all child nodes from the given element.
 *
 * @param {Element} el - The element to clear.
 */
export function clearElement(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

/**
 * Sets multiple attributes/properties on a DOM element in bulk.
 *
 * @param {Element} el - The target element.
 * @param {Object} attrs - Key/value pairs to apply.
 *   - Keys starting with 'on' are registered as event listeners (lowercase, without 'on').
 *   - 'className' sets el.className directly.
 *   - 'style' accepts either a string (set via setAttribute) or an object (merged into el.style).
 *   - All other keys are set via setAttribute.
 */
export function setAttr(el, attrs) {
  for (const [key, value] of Object.entries(attrs)) {
    if (key.startsWith('on') && typeof value === 'function') {
      // e.g. onClick → 'click', onChange → 'change'
      const eventName = key.slice(2).toLowerCase();
      el.addEventListener(eventName, value);
    } else if (key === 'className') {
      el.className = value;
    } else if (key === 'style' && typeof value === 'object' && value !== null) {
      Object.assign(el.style, value);
    } else {
      el.setAttribute(key, value);
    }
  }
}

import { jest } from "@jest/globals";
import * as util from 'util';

// ============================================================================
// JSDOM Polyfills
// ============================================================================
// ref: https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
// ref: https://github.com/jsdom/jsdom/issues/2524

Object.defineProperty(window, 'TextEncoder', {
  writable: true,
  value: util.TextEncoder,
});

Object.defineProperty(window, 'TextDecoder', {
  writable: true,
  value: util.TextDecoder,
});

Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
    readText: jest.fn(() => Promise.resolve('')),
  },
});

if (typeof DragEvent === 'undefined') {
  class DragEventPolyfill extends Event {
    clientX: number;
    clientY: number;
    dataTransfer: DataTransfer | null;

    constructor(type: string, init?: DragEventInit) {
      super(type, init);
      this.clientX = init?.clientX ?? 0;
      this.clientY = init?.clientY ?? 0;
      this.dataTransfer = init?.dataTransfer ?? null;
    }
  }
  (global as any).DragEvent = DragEventPolyfill;
}

// ============================================================================
// Obsidian HTMLElement Extensions
// ============================================================================
// These methods are used by Obsidian's components but not part of standard DOM
// We add them here so tests don't fail when code calls el.createEl() etc.

/**
 * createEl: Create and append a new element
 * Usage: el.createEl('div', { text: 'Hello', cls: 'my-class' })
 */
Object.defineProperty(HTMLElement.prototype, 'createEl', {
  value: jest.fn(function(
    tag: string,
    o?: {
      text?: string;
      cls?: string;
      attr?: Record<string, string>;
    }
  ) {
    const el = document.createElement(tag);
    if (o?.text) {
      el.textContent = o.text;
    }
    if (o?.cls) {
      el.className = o.cls;
    }
    if (o?.attr) {
      Object.entries(o.attr).forEach(([key, value]) => {
        el.setAttribute(key, value);
      });
    }
    this.appendChild(el);
    return el;
  }),
  configurable: true,
});

/**
 * empty: Remove all children from element
 * Usage: el.empty()
 */
Object.defineProperty(HTMLElement.prototype, 'empty', {
  value: jest.fn(function() {
    this.innerHTML = '';
    return this;
  }),
  configurable: true,
});

/**
 * addClass: Add CSS class to element
 * Usage: el.addClass('my-class')
 */
Object.defineProperty(HTMLElement.prototype, 'addClass', {
  value: jest.fn(function(cls: string) {
    this.classList.add(cls);
    return this;
  }),
  configurable: true,
});

/**
 * addClasses: Add multiple CSS classes to element
 * Usage: el.addClasses(['my-class', 'other-class'])
 */
Object.defineProperty(HTMLElement.prototype, 'addClasses', {
  value: jest.fn(function(classes: string[]) {
    classes.forEach((cls) => this.classList.add(cls));
    return this;
  }),
  configurable: true,
});

/**
 * removeClass: Remove CSS class from element
 * Usage: el.removeClass('my-class')
 */
Object.defineProperty(HTMLElement.prototype, 'removeClass', {
  value: jest.fn(function(cls: string) {
    this.classList.remove(cls);
    return this;
  }),
  configurable: true,
});

/**
 * toggleClass: Toggle CSS class on element
 * Usage: el.toggleClass('my-class')
 */
Object.defineProperty(HTMLElement.prototype, 'toggleClass', {
  value: jest.fn(function(cls: string, value?: boolean) {
    this.classList.toggle(cls, value);
    return this;
  }),
  configurable: true,
});

/**
 * setText: Set element text content
 * Usage: el.setText('Hello')
 */
Object.defineProperty(HTMLElement.prototype, 'setText', {
  value: jest.fn(function(text: string) {
    this.textContent = text;
    return this;
  }),
  configurable: true,
});

/**
 * getText: Get element text content
 * Usage: el.getText()
 */
Object.defineProperty(HTMLElement.prototype, 'getText', {
  value: jest.fn(function() {
    return this.textContent ?? '';
  }),
  configurable: true,
});

/**
 * hasClass: Check if element has CSS class
 * Usage: el.hasClass('my-class')
 */
Object.defineProperty(HTMLElement.prototype, 'hasClass', {
  value: jest.fn(function(cls: string) {
    return this.classList.contains(cls);
  }),
  configurable: true,
});

/**
 * setAttr: Set HTML attribute
 * Usage: el.setAttr('id', 'my-id')
 */
Object.defineProperty(HTMLElement.prototype, 'setAttr', {
  value: jest.fn(function(attr: string, value: string) {
    this.setAttribute(attr, value);
    return this;
  }),
  configurable: true,
});

/**
 * getAttr: Get HTML attribute
 * Usage: el.getAttr('id')
 */
Object.defineProperty(HTMLElement.prototype, 'getAttr', {
  value: jest.fn(function(attr: string) {
    return this.getAttribute(attr);
  }),
  configurable: true,
});

/**
 * removeAttr: Remove HTML attribute
 * Usage: el.removeAttr('id')
 */
Object.defineProperty(HTMLElement.prototype, 'removeAttr', {
  value: jest.fn(function(attr: string) {
    this.removeAttribute(attr);
    return this;
  }),
  configurable: true,
});

// ============================================================================
// Obsidian Global DOM Helpers
// ============================================================================

(global as any).createEl = function createEl(
  tag: string,
  o?: { text?: string; cls?: string; attr?: Record<string, string> }
) {
  const el = document.createElement(tag);
  if (o?.text) el.textContent = o.text;
  if (o?.cls) el.className = o.cls;
  if (o?.attr) {
    Object.entries(o.attr).forEach(([key, value]) => {
      el.setAttribute(key, value);
    });
  }
  return el;
};

(global as any).createDiv = function createDiv() {
  return (global as any).createEl('div');
};

// ============================================================================
// Canvas Polyfill (jsdom does not implement getContext)
// ============================================================================

HTMLCanvasElement.prototype.getContext = jest.fn(function(
  this: HTMLCanvasElement,
  type: string
) {
  if (type !== '2d') return null;
  return {
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    fillStyle: '',
    fillRect: jest.fn(),
    drawImage: jest.fn(),
    imageSmoothingEnabled: true,
    getImageData: jest.fn(() => ({
      data: new Uint8ClampedArray([255, 0, 0, 255]),
    })),
  };
}) as any;

// ============================================================================
// Global Console Mocking
// ============================================================================
// Reduce test output noise by mocking console methods

global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as any;

import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

Object.defineProperty(window, 'scrollTo', { value: vi.fn(), configurable: true });
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: vi.fn(),
  configurable: true,
});
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
  value(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  },
  configurable: true,
});
Object.defineProperty(HTMLDialogElement.prototype, 'close', {
  value(this: HTMLDialogElement) {
    this.removeAttribute('open');
  },
  configurable: true,
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});

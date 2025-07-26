import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock HTML5 Audio API
const mockAudio = {
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  currentTime: 0,
  duration: 100,
  volume: 1,
  muted: false,
  readyState: 4,
  ended: false,
  paused: true,
  src: '',
  autoplay: false,
  loop: false
};

Object.defineProperty(window, 'HTMLAudioElement', {
  writable: true,
  value: vi.fn().mockImplementation(() => mockAudio)
});

Object.defineProperty(global, 'Audio', {
  writable: true,
  value: vi.fn().mockImplementation(() => mockAudio)
});

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver,
});

// Mock ResizeObserver
const mockResizeObserver = vi.fn();
mockResizeObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: mockResizeObserver,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});

beforeAll(() => {
  // Global test setup
});

afterAll(() => {
  // Global test cleanup
});
import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';
 
// Render portals inline so RTL can query them without document.body tricks
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return { ...actual, createPortal: (children) => children };
});
 
beforeEach(() => {
  global.fetch = vi.fn();
  vi.clearAllMocks();
});
 
afterEach(() => {
  vi.restoreAllMocks();
  sessionStorage.clear();
  localStorage.clear();
  document.body.innerHTML = '';
});
 
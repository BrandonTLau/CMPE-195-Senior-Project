import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

// ── Mock child pages that are complex but not under test here ──
vi.mock('../LandingPage', () => ({
  default: ({ onStart, onSignIn }) => (
    <div>
      <span>LandingPage</span>
      <button onClick={onStart}>Get Started</button>
      <button onClick={onSignIn}>Sign In</button>
    </div>
  ),
}));

vi.mock('../api/ocrClient', () => ({ runOcr: vi.fn().mockResolvedValue({ merged_text: '' }) }));

// ── Fetch helpers ─────────────────────────────────────────────
const mockLoginSuccess = () => {
  global.fetch = vi.fn().mockImplementation((url) => {
    if (url.includes('/api/auth/login'))
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          token: 'mock-jwt',
          user: { fullName: 'Test User', email: 'test@test.com' },
        }),
      });
    if (url.includes('/api/files/trash'))
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    if (url.includes('/api/files'))
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    if (url.includes('/api/folders'))
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
};

const mockRegisterSuccess = () => {
  global.fetch = vi.fn().mockImplementation((url) => {
    if (url.includes('/api/auth/register'))
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ token: 'new-token' }) });
    if (url.includes('/api/files/trash'))
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    if (url.includes('/api/files'))
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    if (url.includes('/api/folders'))
      return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
};

// ── tests ─────────────────────────────────────────────────────
describe('App — Navigation E2E', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('renders landing page by default', () => {
    render(<App />);
    expect(screen.getByText('LandingPage')).toBeInTheDocument();
  });

  it('navigates to LoginPage when Get Started clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Get Started'));
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('navigates to LoginPage when Sign In clicked', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Sign In'));
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('navigates back to landing from login', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('LandingPage')).toBeInTheDocument();
  });

  it('navigates to SignUp from login', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByText('Sign up'));
    expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
  });

  it('navigates back to login from SignUp', () => {
    render(<App />);
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByText('Sign up'));
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('navigates to dashboard after successful login', async () => {
    mockLoginSuccess();
    render(<App />);
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.change(screen.getByPlaceholderText('you@example.com'),    { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'password123'  } });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(
      () => expect(screen.getAllByText('My Notes').length).toBeGreaterThan(0),
      { timeout: 5000 }
    );
  });

  it('redirects to login page after successful registration', async () => {
    // SignUp.jsx calls onBack() on success (redirecting to login), NOT
    // onSignUpSuccess(). It also enforces a 2s minimum overlay via
    // Promise.all([fetch, setTimeout(2000)]), so we use fake timers.
    vi.useFakeTimers();
    mockRegisterSuccess();
    render(<App />);
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.click(screen.getByText('Sign up'));
    fireEvent.change(screen.getByPlaceholderText('John Doe'),               { target: { value: 'Test User'   } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'),        { target: { value: 'new@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Create a password'),      { target: { value: 'secure123'   } });
    fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), { target: { value: 'secure123'   } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Create account/i }));
      await Promise.resolve();
      await Promise.resolve();
      vi.runAllTimers();
    });

    vi.useRealTimers();
    // After registration the component calls onBack() → navigates to login
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });

  it('clears storage and returns to landing on logout', async () => {
    mockLoginSuccess();
    render(<App />);
    fireEvent.click(screen.getByText('Get Started'));
    fireEvent.change(screen.getByPlaceholderText('you@example.com'),    { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: 'password123'  } });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => expect(screen.queryByText('Loading your notes…')).not.toBeInTheDocument(), { timeout: 3000 });
    await waitFor(() => screen.getByText('Settings'));
    fireEvent.click(screen.getByText('Settings'));
    fireEvent.click(screen.getByText('Log out'));

    expect(screen.getByText('LandingPage')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  it('restores screen from sessionStorage on refresh', () => {
    sessionStorage.setItem('screen', 'login');
    render(<App />);
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
  });
});

// ── Edge cases ────────────────────────────────────────────────
describe('App — Edge cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('invalid screen value in sessionStorage defaults gracefully', () => {
    sessionStorage.setItem('screen', 'invalid_screen');
    expect(() => render(<App />)).not.toThrow();
  });

  it('does not redirect unauthenticated user to dashboard automatically', () => {
    render(<App />);
    expect(screen.getByText('LandingPage')).toBeInTheDocument();
    expect(screen.queryByText('My Notes')).not.toBeInTheDocument();
  });
});

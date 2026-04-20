import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '../LoginPage';

// ── helpers ───────────────────────────────────────────────────
const defaultProps = (overrides = {}) => ({
  onBack:         vi.fn(),
  onLoginSuccess: vi.fn(),
  onGoToSignUp:   vi.fn(),
  ...overrides,
});

const fillForm = (email = 'test@example.com', password = 'password123') => {
  fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: email } });
  fireEvent.change(screen.getByPlaceholderText('Enter your password'), { target: { value: password } });
};

const mockLoginSuccess = (userData = {}) => {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7Im5hbWUiOiJUZXN0IiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIn19.sig',
      user: { fullName: 'Test User', email: 'test@example.com', ...userData },
    }),
  });
};

const mockLoginFailure = (msg = 'Invalid credentials') => {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve({ msg }),
  });
};

// ── tests ─────────────────────────────────────────────────────
describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  // ── Rendering ───────────────────────────────────────────────
  describe('Rendering', () => {
    it('renders email and password inputs', () => {
      render(<LoginPage {...defaultProps()} />);
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    it('renders Sign in button', () => {
      render(<LoginPage {...defaultProps()} />);
      expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
    });

    it('renders Remember me checkbox', () => {
      render(<LoginPage {...defaultProps()} />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('renders Sign up link', () => {
      render(<LoginPage {...defaultProps()} />);
      expect(screen.getByText('Sign up')).toBeInTheDocument();
    });
  });

  // ── Form interaction ─────────────────────────────────────────
  describe('Form interaction', () => {
    it('password input is hidden by default', () => {
      render(<LoginPage {...defaultProps()} />);
      expect(screen.getByPlaceholderText('Enter your password')).toHaveAttribute('type', 'password');
    });

    it('toggling eye icon reveals password', () => {
      render(<LoginPage {...defaultProps()} />);
      const pwInput = screen.getByPlaceholderText('Enter your password');
      const eyeBtn  = pwInput.closest('div').querySelector('button[type="button"]');
      fireEvent.click(eyeBtn);
      expect(pwInput).toHaveAttribute('type', 'text');
    });

    it('calls onBack when Back button clicked', () => {
      const onBack = vi.fn();
      render(<LoginPage {...defaultProps({ onBack })} />);
      fireEvent.click(screen.getByText('Back'));
      expect(onBack).toHaveBeenCalled();
    });

    it('calls onGoToSignUp when Sign up link clicked', () => {
      const onGoToSignUp = vi.fn();
      render(<LoginPage {...defaultProps({ onGoToSignUp })} />);
      fireEvent.click(screen.getByText('Sign up'));
      expect(onGoToSignUp).toHaveBeenCalled();
    });
  });

  // ── Authentication ───────────────────────────────────────────
  describe('Authentication', () => {
    it('shows loading state while submitting', async () => {
      global.fetch = vi.fn().mockImplementation(() => new Promise(() => {})); // never resolves
      render(<LoginPage {...defaultProps()} />);
      fillForm();
      fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
      expect(await screen.findByText('Signing in…')).toBeInTheDocument();
    });

    it('calls onLoginSuccess on successful login', async () => {
      const onLoginSuccess = vi.fn();
      mockLoginSuccess();
      render(<LoginPage {...defaultProps({ onLoginSuccess })} />);
      fillForm();
      fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
      await waitFor(() => expect(onLoginSuccess).toHaveBeenCalled());
    });

    it('stores token in sessionStorage when Remember Me is off', async () => {
      mockLoginSuccess();
      render(<LoginPage {...defaultProps()} />);
      // rememberMe defaults to false
      fillForm();
      fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
      await waitFor(() => expect(sessionStorage.getItem('token')).toBeTruthy());
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('stores token in localStorage when Remember Me is checked', async () => {
      mockLoginSuccess();
      render(<LoginPage {...defaultProps()} />);
      fireEvent.click(screen.getByRole('checkbox')); // check Remember me
      fillForm();
      fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
      await waitFor(() => expect(localStorage.getItem('token')).toBeTruthy());
    });

    it('stores userName and userEmail from response', async () => {
      mockLoginSuccess({ fullName: 'Brandon Lau', email: 'b@test.com' });
      render(<LoginPage {...defaultProps()} />);
      fillForm();
      fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
      await waitFor(() => {
        expect(sessionStorage.getItem('userName')).toBe('Brandon Lau');
        expect(sessionStorage.getItem('userEmail')).toBe('b@test.com');
      });
    });

    it('shows error message on failed login', async () => {
      mockLoginFailure('Invalid email or password');
      render(<LoginPage {...defaultProps()} />);
      fillForm();
      fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
      await waitFor(() => expect(screen.getByText('Invalid email or password')).toBeInTheDocument());
    });

    it('shows error on network failure', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));
      render(<LoginPage {...defaultProps()} />);
      fillForm();
      fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
      await waitFor(() => expect(screen.getByText(/SERVER CONNECTION ERROR/)).toBeInTheDocument());
    });

    it('posts correct payload to /api/auth/login', async () => {
      mockLoginSuccess();
      render(<LoginPage {...defaultProps()} />);
      fillForm('user@test.com', 'mypassword');
      fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));
      await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@test.com', password: 'mypassword' }),
        })
      ));
    });
  });
});

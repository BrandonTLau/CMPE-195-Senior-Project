import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SignUp from '../SignUp';

// ── helpers ───────────────────────────────────────────────────
const defaultProps = (overrides = {}) => ({
  onBack:          vi.fn(),
  onSignUpSuccess: vi.fn(),
  ...overrides,
});

const fill = ({ name = '', email = '', password = '', confirm = '' } = {}) => {
  if (name)     fireEvent.change(screen.getByPlaceholderText('John Doe'),               { target: { value: name     } });
  if (email)    fireEvent.change(screen.getByPlaceholderText('you@example.com'),        { target: { value: email    } });
  if (password) fireEvent.change(screen.getByPlaceholderText('Create a password'),      { target: { value: password } });
  if (confirm)  fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), { target: { value: confirm  } });
};

const mockRegisterSuccess = () => {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({ token: 'test-token-123' }),
  });
};

const mockRegisterFailure = (msg = 'Email already exists') => {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve({ msg }),
  });
};

// Helper — fast-forward the mandatory 2s overlay timer that SignUp uses
// via Promise.all([fetch, new Promise(resolve => setTimeout(resolve, 2000))])
const submitAndFlushTimers = async (buttonName = /Create account/i) => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: buttonName }));
    // Flush the fetch microtask queue
    await Promise.resolve();
    await Promise.resolve();
    // Fast-forward the 2 000 ms minimum-loader setTimeout
    vi.runAllTimers();
  });
};

// ── tests ─────────────────────────────────────────────────────
describe('SignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    sessionStorage.clear();
    localStorage.clear();
  });

  // ── Rendering ───────────────────────────────────────────────
  describe('Rendering', () => {
    it('renders all form fields', () => {
      render(<SignUp {...defaultProps()} />);
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Create a password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Re-enter your password')).toBeInTheDocument();
    });

    it('renders Create account button', () => {
      render(<SignUp {...defaultProps()} />);
      expect(screen.getByRole('button', { name: /Create account/i })).toBeInTheDocument();
    });

    it('renders Back button', () => {
      render(<SignUp {...defaultProps()} />);
      expect(screen.getByText('Back')).toBeInTheDocument();
    });

    it('calls onBack when Back button clicked', () => {
      const onBack = vi.fn();
      render(<SignUp {...defaultProps({ onBack })} />);
      fireEvent.click(screen.getByText('Back'));
      expect(onBack).toHaveBeenCalled();
    });

    it('calls onBack when "Sign in" link clicked', () => {
      const onBack = vi.fn();
      render(<SignUp {...defaultProps({ onBack })} />);
      fireEvent.click(screen.getByText('Sign in'));
      expect(onBack).toHaveBeenCalled();
    });

    it('password fields are hidden by default', () => {
      render(<SignUp {...defaultProps()} />);
      expect(screen.getByPlaceholderText('Create a password')).toHaveAttribute('type', 'password');
      expect(screen.getByPlaceholderText('Re-enter your password')).toHaveAttribute('type', 'password');
    });
  });

  // ── Validation ───────────────────────────────────────────────
  describe('Client-side validation', () => {
    const submitForm = () => {
      const form = screen.getByRole('button', { name: /Create account/i }).closest('form');
      fireEvent.submit(form);
    };

    it('shows error when full name is empty', async () => {
      render(<SignUp {...defaultProps()} />);
      fill({ email: 'a@b.com', password: 'pass1234', confirm: 'pass1234' });
      submitForm();
      await waitFor(() => expect(screen.getByText('Please enter your full name.')).toBeInTheDocument());
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('shows error when email is empty', async () => {
      render(<SignUp {...defaultProps()} />);
      fill({ name: 'Test User', password: 'pass1234', confirm: 'pass1234' });
      submitForm();
      await waitFor(() => expect(screen.getByText('Please enter your email address.')).toBeInTheDocument());
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('shows error when password is shorter than 8 characters', async () => {
      render(<SignUp {...defaultProps()} />);
      fill({ name: 'Test User', email: 'a@b.com', password: 'short', confirm: 'short' });
      submitForm();
      await waitFor(() => expect(screen.getByText('Password must be at least 8 characters long.')).toBeInTheDocument());
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('shows error when passwords do not match', async () => {
      render(<SignUp {...defaultProps()} />);
      fill({ name: 'Test User', email: 'a@b.com', password: 'pass1234', confirm: 'pass5678' });
      submitForm();
      await waitFor(() => expect(screen.getByText('Passwords do not match.')).toBeInTheDocument());
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  // ── Registration ─────────────────────────────────────────────
  describe('Registration flow', () => {
    it('calls /api/auth/register with correct payload', async () => {
      mockRegisterSuccess();
      render(<SignUp {...defaultProps()} />);
      fill({ name: 'Brandon Lau', email: 'b@test.com', password: 'secure123', confirm: 'secure123' });
      fireEvent.click(screen.getByRole('button', { name: /Create account/i }));
      await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/register',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ fullName: 'Brandon Lau', email: 'b@test.com', password: 'secure123' }),
        })
      ));
    });

    it('redirects to login (calls onBack) after successful registration', async () => {
      // SignUp intentionally calls onBack() on success — not onSignUpSuccess().
      // The component shows a 2s overlay via Promise.all([fetch, setTimeout(2000)])
      // so we use fake timers to fast-forward past it.
      vi.useFakeTimers();
      const onBack = vi.fn();
      mockRegisterSuccess();
      render(<SignUp {...defaultProps({ onBack })} />);
      fill({ name: 'Brandon Lau', email: 'b@test.com', password: 'secure123', confirm: 'secure123' });
      await submitAndFlushTimers();
      expect(onBack).toHaveBeenCalled();
    });

    it('does not store token in sessionStorage on success', async () => {
      // By design, SignUp does not persist the token — the user must log in
      // manually after registering. This test documents that intentional decision.
      vi.useFakeTimers();
      mockRegisterSuccess();
      render(<SignUp {...defaultProps()} />);
      fill({ name: 'Test User', email: 'a@b.com', password: 'pass1234', confirm: 'pass1234' });
      await submitAndFlushTimers();
      expect(sessionStorage.getItem('token')).toBeNull();
    });

    it('shows backend error message on duplicate email', async () => {
      mockRegisterFailure('Email already exists');
      render(<SignUp {...defaultProps()} />);
      fill({ name: 'Test User', email: 'dup@test.com', password: 'pass1234', confirm: 'pass1234' });
      fireEvent.click(screen.getByRole('button', { name: /Create account/i }));
      await waitFor(() => expect(screen.getByText('Email already exists')).toBeInTheDocument(), { timeout: 5000 });
    });

    it('shows connection error when server is unreachable', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Failed to fetch'));
      render(<SignUp {...defaultProps()} />);
      fill({ name: 'Test User', email: 'a@b.com', password: 'pass1234', confirm: 'pass1234' });
      fireEvent.click(screen.getByRole('button', { name: /Create account/i }));
      await waitFor(() => expect(screen.getByText(/Could not connect to server/)).toBeInTheDocument(), { timeout: 5000 });
    });
  });
});

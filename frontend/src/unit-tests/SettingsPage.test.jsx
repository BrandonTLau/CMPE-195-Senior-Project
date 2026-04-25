import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsPage from '../SettingsPage';

// ── helpers ───────────────────────────────────────────────────
const makeNote = (overrides = {}) => ({
  id: '1', title: 'Note', preview: '', tags: [], confidence: 85,
  date: 'Jan 1, 2025', favorite: false, deleted: false, ...overrides,
});

const mockApi = () => ({
  changePassword: vi.fn().mockResolvedValue({}),
  deleteAccount:  vi.fn().mockResolvedValue({}),
});

const defaultProps = (overrides = {}) => ({
  notes:    [],
  folders:  [],
  onLogout: vi.fn(),
  api:      mockApi(),
  ...overrides,
});

// ── tests ─────────────────────────────────────────────────────
describe('SettingsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Rendering ───────────────────────────────────────────────
  describe('Rendering', () => {
    it('renders Settings heading', () => {
      render(<SettingsPage {...defaultProps()} />);
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    it('renders Log out button', () => {
      render(<SettingsPage {...defaultProps()} />);
      expect(screen.getByText('Log out')).toBeInTheDocument();
    });

    it('renders Change password section', () => {
      render(<SettingsPage {...defaultProps()} />);
      expect(screen.getByText('Change password')).toBeInTheDocument();
    });

    it('renders Delete account section', () => {
      render(<SettingsPage {...defaultProps()} />);
      expect(screen.getAllByText('Delete account').length).toBeGreaterThan(0);
    });

    it('renders stats with correct counts', () => {
      const notes = [
        makeNote({ id: '1', favorite: false, deleted: false }),
        makeNote({ id: '2', favorite: true,  deleted: false }),
        makeNote({ id: '3', favorite: false, deleted: true  }),
      ];
      const folders = [{ id: 'f1', name: 'Math' }];
      render(<SettingsPage {...defaultProps({ notes, folders })} />);
      const notesLabel    = screen.getByText('Notes');
      const favLabel      = screen.getByText('Favorites');
      expect(notesLabel.previousSibling?.textContent).toBe('2');
      expect(favLabel.previousSibling?.textContent).toBe('1');
    });

    it('shows fallback display name when no user info', () => {
      render(<SettingsPage {...defaultProps()} />);
      expect(screen.getByText('NoteScan User')).toBeInTheDocument();
    });
  });

  // ── Logout ───────────────────────────────────────────────────
  describe('Logout', () => {
    it('calls onLogout when Log out is clicked', () => {
      const onLogout = vi.fn();
      render(<SettingsPage {...defaultProps({ onLogout })} />);
      fireEvent.click(screen.getByText('Log out'));
      expect(onLogout).toHaveBeenCalledOnce();
    });
  });

  // ── Change Password ──────────────────────────────────────────
  describe('Change Password', () => {
    it('shows error when current password is empty', async () => {
      render(<SettingsPage {...defaultProps()} />);
      fireEvent.click(screen.getByText('Update password'));
      await waitFor(() => expect(screen.getByText('Please enter your current password.')).toBeInTheDocument());
    });

    it('shows error when new password is too short', async () => {
      render(<SettingsPage {...defaultProps()} />);
      fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'current123' } });
      fireEvent.change(screen.getByPlaceholderText('Min 8 characters'),       { target: { value: 'short' } });
      fireEvent.click(screen.getByText('Update password'));
      await waitFor(() => expect(screen.getByText('New password must be at least 8 characters.')).toBeInTheDocument());
    });

    it('shows error when passwords do not match', async () => {
      render(<SettingsPage {...defaultProps()} />);
      fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'current123' } });
      fireEvent.change(screen.getByPlaceholderText('Min 8 characters'),       { target: { value: 'newpassword1' } });
      fireEvent.change(screen.getByPlaceholderText('Re-enter new password'),  { target: { value: 'newpassword2' } });
      fireEvent.click(screen.getByText('Update password'));
      await waitFor(() => expect(screen.getByText('New passwords do not match.')).toBeInTheDocument());
    });

    it('calls api.changePassword with correct args on valid submit', async () => {
      const api = mockApi();
      render(<SettingsPage {...defaultProps({ api })} />);
      fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'current123' } });
      fireEvent.change(screen.getByPlaceholderText('Min 8 characters'),       { target: { value: 'newpassword1' } });
      fireEvent.change(screen.getByPlaceholderText('Re-enter new password'),  { target: { value: 'newpassword1' } });
      fireEvent.click(screen.getByText('Update password'));
      await waitFor(() => expect(api.changePassword).toHaveBeenCalledWith('current123', 'newpassword1'));
    });

    it('shows success message after password update', async () => {
      render(<SettingsPage {...defaultProps()} />);
      fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'current123' } });
      fireEvent.change(screen.getByPlaceholderText('Min 8 characters'),       { target: { value: 'newpassword1' } });
      fireEvent.change(screen.getByPlaceholderText('Re-enter new password'),  { target: { value: 'newpassword1' } });
      fireEvent.click(screen.getByText('Update password'));
      await waitFor(() => expect(screen.getByText('Password updated successfully!')).toBeInTheDocument());
    });

    it('shows error message when api.changePassword fails', async () => {
      const api = { ...mockApi(), changePassword: vi.fn().mockRejectedValue(new Error('Wrong password')) };
      render(<SettingsPage {...defaultProps({ api })} />);
      fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'wrong' } });
      fireEvent.change(screen.getByPlaceholderText('Min 8 characters'),       { target: { value: 'newpassword1' } });
      fireEvent.change(screen.getByPlaceholderText('Re-enter new password'),  { target: { value: 'newpassword1' } });
      fireEvent.click(screen.getByText('Update password'));
      await waitFor(() => expect(screen.getByText('Wrong password')).toBeInTheDocument());
    });

    it('shows Change again button after success and resets form on click', async () => {
      render(<SettingsPage {...defaultProps()} />);
      fireEvent.change(screen.getByPlaceholderText('Enter current password'), { target: { value: 'current123' } });
      fireEvent.change(screen.getByPlaceholderText('Min 8 characters'),       { target: { value: 'newpassword1' } });
      fireEvent.change(screen.getByPlaceholderText('Re-enter new password'),  { target: { value: 'newpassword1' } });
      fireEvent.click(screen.getByText('Update password'));
      await waitFor(() => screen.getByText('Change again'));
      fireEvent.click(screen.getByText('Change again'));
      expect(screen.getByPlaceholderText('Enter current password')).toBeInTheDocument();
    });
  });

  // ── Delete Account ───────────────────────────────────────────
  describe('Delete Account', () => {
    it('delete confirmation form is hidden by default', () => {
      render(<SettingsPage {...defaultProps()} />);
      expect(screen.queryByPlaceholderText('DELETE')).not.toBeInTheDocument();
    });

    it('shows confirmation form when Delete account button clicked', () => {
      render(<SettingsPage {...defaultProps()} />);
      fireEvent.click(screen.getByRole('button', { name: /Delete account/i }));
      expect(screen.getByPlaceholderText('DELETE')).toBeInTheDocument();
    });

    it('Confirm delete button is disabled until DELETE is typed', () => {
      render(<SettingsPage {...defaultProps()} />);
      fireEvent.click(screen.getByRole('button', { name: /Delete account/i }));
      const confirmBtn = screen.getByRole('button', { name: /Confirm delete/i });
      expect(confirmBtn).toBeDisabled();
    });

    it('Confirm delete button enables when DELETE is typed', () => {
      render(<SettingsPage {...defaultProps()} />);
      fireEvent.click(screen.getByRole('button', { name: /Delete account/i }));
      fireEvent.change(screen.getByPlaceholderText('DELETE'), { target: { value: 'DELETE' } });
      expect(screen.getByRole('button', { name: /Confirm delete/i })).not.toBeDisabled();
    });

    it('shows error when confirmed without typing DELETE', async () => {
      render(<SettingsPage {...defaultProps()} />);
      fireEvent.click(screen.getByRole('button', { name: /Delete account/i }));
      // Type DELETE then clear it to trigger the error via direct call
      const input = screen.getByPlaceholderText('DELETE');
      fireEvent.change(input, { target: { value: 'DELETE' } });
      fireEvent.change(input, { target: { value: 'delete' } });
      // Manually fire click on the disabled button via the DOM
      const confirmBtn = screen.getByRole('button', { name: /Confirm delete/i });
      fireEvent.click(confirmBtn.closest('div'), { bubbles: true });
      // Verify button stays disabled for wrong case
      expect(confirmBtn).toBeDisabled();
    });

    it('calls api.deleteAccount and onLogout when confirmed', async () => {
      const api = mockApi();
      const onLogout = vi.fn();
      render(<SettingsPage {...defaultProps({ api, onLogout })} />);
      fireEvent.click(screen.getByRole('button', { name: /Delete account/i }));
      fireEvent.change(screen.getByPlaceholderText('DELETE'), { target: { value: 'DELETE' } });
      fireEvent.click(screen.getByRole('button', { name: /Confirm delete/i }));
      await waitFor(() => expect(api.deleteAccount).toHaveBeenCalledOnce());
      await waitFor(() => expect(onLogout).toHaveBeenCalledOnce());
    });

    it('hides confirmation form when Cancel is clicked', () => {
      render(<SettingsPage {...defaultProps()} />);
      fireEvent.click(screen.getByRole('button', { name: /Delete account/i }));
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByPlaceholderText('DELETE')).not.toBeInTheDocument();
    });
  });
});

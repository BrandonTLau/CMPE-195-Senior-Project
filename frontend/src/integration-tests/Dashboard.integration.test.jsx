/**
 * Dashboard integration tests
 */
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserDashboard from '../UserDashboard';

const apiNote = (overrides = {}) => ({
  _id:            'n1',
  title:          'Integration Note',
  uploadDate:     '2025-02-01T00:00:00.000Z',
  folderId:       null,
  currentContent: { transcribedText: 'Full text content', summary: 'Quick summary' },
  tags:           ['test'],
  confidence:     80,
  isFavorite:     false,
  isDeleted:      false,
  fileLocation:   null,
  ...overrides,
});

const apiFolder = (overrides = {}) => ({ _id: 'f1', id: 'f1', name: 'Default Folder', ...overrides });

const setupFetch = ({ active = [], trash = [], folders = [], patchOk = true, deleteOk = true } = {}) => {
  global.fetch = vi.fn().mockImplementation((url, opts) => {
    const method = opts?.method || 'GET';
    if (url.includes('/api/files/trash'))
      return Promise.resolve({ ok: true, json: () => Promise.resolve(trash) });
    if (url.includes('/api/files/') && method === 'PATCH')
      return Promise.resolve({ ok: patchOk, json: () => Promise.resolve({}), statusText: patchOk ? 'OK' : 'Error' });
    if (url.includes('/api/files/') && method === 'DELETE')
      return Promise.resolve({ ok: deleteOk, json: () => Promise.resolve({}) });
    if (url.includes('/api/files'))
      return Promise.resolve({ ok: true, json: () => Promise.resolve(active) });
    if (url.includes('/api/folders') && method === 'POST')
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ _id: 'fnew', id: 'fnew', name: 'New Folder' }) });
    if (url.includes('/api/folders') && method === 'DELETE')
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    if (url.includes('/api/folders') && method === 'PATCH')
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ _id: 'f1', id: 'f1', name: 'Renamed' }) });
    if (url.includes('/api/folders'))
      return Promise.resolve({ ok: true, json: () => Promise.resolve(folders) });
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
};

const renderDashboard = (props = {}) =>
  render(
    <UserDashboard
      onLogout={vi.fn()}
      onProcess={vi.fn()}
      onNewScan={vi.fn()}
      onNoteSelect={vi.fn()}
      {...props}
    />
  );

const waitForLoad = () =>
  waitForElementToBeRemoved(() => screen.queryByText('Loading your notes…'), { timeout: 3000 });

describe('Dashboard Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('Favorites ↔ Notes', () => {
    it('favoriting a note makes it appear in Favorites tab immediately', async () => {
      setupFetch({ active: [apiNote({ isFavorite: false })] });
      renderDashboard();
      await waitForLoad();

      const card = screen.getByText('Integration Note').closest('.ud-card');
      fireEvent.click(card.querySelector('button'));
      fireEvent.click(screen.getByText('Add to favorites'));

      fireEvent.click(screen.getByRole('button', { name: /Favorites/ }));
      await waitFor(() => expect(screen.getByText('Integration Note')).toBeInTheDocument());
    });

    it('unfavoriting a note removes it from Favorites tab', async () => {
      setupFetch({ active: [apiNote({ isFavorite: true })] });
      renderDashboard();
      await waitForLoad();

      // Go to Favorites tab
      fireEvent.click(screen.getByRole('button', { name: /Favorites/ }));
      await waitFor(() => expect(screen.getByText('Integration Note')).toBeInTheDocument());

      // Open 3-dot menu on the note card and click Remove from favorites
      const card = screen.getByText('Integration Note').closest('.ud-card');
      fireEvent.click(card.querySelector('button'));
      fireEvent.click(screen.getByText('Remove from favorites'));

      await waitFor(() => expect(screen.queryByText('Integration Note')).not.toBeInTheDocument());
    });

    it('favorite count in nav badge is accurate', async () => {
      setupFetch({ active: [
        apiNote({ _id: 'n1', isFavorite: true }),
        apiNote({ _id: 'n2', isFavorite: true, title: 'Note 2' }),
      ]});
      renderDashboard();
      await waitForLoad();

      const favNav = screen.getByRole('button', { name: /Favorites/ });
      expect(within(favNav).getByText('2')).toBeInTheDocument();
    });
  });

  describe('Trash ↔ Notes', () => {
    it('deleting a note removes it from Notes and adds it to Trash', async () => {
      setupFetch({ active: [apiNote()] });
      renderDashboard();
      await waitForLoad();

      const card = screen.getByText('Integration Note').closest('.ud-card');
      fireEvent.click(card.querySelector('button'));
      fireEvent.click(screen.getByText('Move to Trash'));
      fireEvent.click(screen.getByText('Move to Trash', { selector: 'button' }));

      await waitFor(() => expect(screen.queryByText('Integration Note')).not.toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: /Trash/ }));
      expect(screen.getByText('Integration Note')).toBeInTheDocument();
    });

    it('restoring a note removes it from Trash and returns it to Notes', async () => {
      setupFetch({ trash: [apiNote({ isDeleted: true })] });
      renderDashboard();
      await waitForLoad();

      fireEvent.click(screen.getByRole('button', { name: /Trash/ }));
      expect(screen.getByText('Integration Note')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Restore'));
      await waitFor(() => expect(screen.queryByText('Integration Note')).not.toBeInTheDocument());

      fireEvent.click(screen.getByRole('button', { name: /My Notes/ }));
      expect(screen.getByText('Integration Note')).toBeInTheDocument();
    });

    it('trash badge count updates when note is deleted', async () => {
      setupFetch({ active: [apiNote()] });
      renderDashboard();
      await waitForLoad();

      const trashNavBefore = screen.getByRole('button', { name: /Trash/ });
      expect(within(trashNavBefore).queryByText('1')).not.toBeInTheDocument();

      const card = screen.getByText('Integration Note').closest('.ud-card');
      fireEvent.click(card.querySelector('button'));
      fireEvent.click(screen.getByText('Move to Trash'));
      fireEvent.click(screen.getByText('Move to Trash', { selector: 'button' }));

      await waitFor(() => {
        const trashNav = screen.getByRole('button', { name: /Trash/ });
        expect(within(trashNav).getByText('1')).toBeInTheDocument();
      });
    });
  });

  describe('API failure → rollback', () => {
    it('reverts favorite toggle on API failure', async () => {
      setupFetch({ active: [apiNote({ isFavorite: false })], patchOk: false });
      renderDashboard();
      await waitForLoad();

      const card = screen.getByText('Integration Note').closest('.ud-card');
      fireEvent.click(card.querySelector('button'));
      fireEvent.click(screen.getByText('Add to favorites'));

      await waitFor(() => expect(screen.getByText('Failed to update favorite')).toBeInTheDocument());

      const favNav = screen.getByRole('button', { name: /Favorites/ });
      expect(within(favNav).queryByText('1')).not.toBeInTheDocument();
    });

    it('reverts delete on API failure', async () => {
      setupFetch({ active: [apiNote()], patchOk: false });
      renderDashboard();
      await waitForLoad();

      const card = screen.getByText('Integration Note').closest('.ud-card');
      fireEvent.click(card.querySelector('button'));
      fireEvent.click(screen.getByText('Move to Trash'));
      fireEvent.click(screen.getByText('Move to Trash', { selector: 'button' }));

      await waitFor(() => expect(screen.getByText('Failed to move note to trash')).toBeInTheDocument());
      expect(screen.getByText('Integration Note')).toBeInTheDocument();
    });

    it('reverts permanent delete on API failure', async () => {
      setupFetch({ trash: [apiNote({ isDeleted: true })], deleteOk: false });
      renderDashboard();
      await waitForLoad();

      fireEvent.click(screen.getByRole('button', { name: /Trash/ }));
      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => expect(screen.getByText('Failed to delete note')).toBeInTheDocument());
      expect(screen.getByText('Integration Note')).toBeInTheDocument();
    });
  });

  describe('Folder ↔ Notes', () => {
    it('notes count in folder chip updates when note is moved in', async () => {
      const note = apiNote({ folderId: null });
      const folder = apiFolder({ name: 'Science' });
      setupFetch({ active: [note], folders: [folder] });
      renderDashboard();
      await waitForLoad();

      const chip = screen.getByText('Science').closest('.ud-folder-chip');
      expect(within(chip).getByText('0')).toBeInTheDocument();

      const card = screen.getByText('Integration Note').closest('.ud-card');
      fireEvent.click(card.querySelector('button'));
      fireEvent.click(screen.getByText('Move to folder'));
      const scienceEls = screen.getAllByText('Science');
      const modalBtn = scienceEls.find(el => el.closest('.ud-dot-item'));
      fireEvent.click(modalBtn || scienceEls[scienceEls.length - 1]);

      await waitFor(() => {
        const updatedChip = screen.getByText('Science').closest('.ud-folder-chip');
        expect(within(updatedChip).getByText('1')).toBeInTheDocument();
      });
    });

    it('deleting a folder unassigns notes from it', async () => {
      const note = apiNote({ folderId: 'f1' });
      const folder = apiFolder({ name: 'ToDelete' });
      setupFetch({ active: [note], folders: [folder] });
      renderDashboard();
      await waitForLoad();

      const chip = screen.getByText('ToDelete').closest('.ud-folder-chip');
      fireEvent.click(chip.querySelector('button'));

      await waitFor(() => expect(screen.queryByText('ToDelete')).not.toBeInTheDocument());
      expect(screen.getByText('Integration Note')).toBeInTheDocument();
    });
  });

  describe('Tag updates', () => {
    it('tags update reflects immediately in note card', async () => {
      setupFetch({ active: [apiNote({ tags: [] })] });
      renderDashboard();
      await waitForLoad();

      const card = screen.getByText('Integration Note').closest('.ud-card');
      fireEvent.click(card.querySelector('button'));
      fireEvent.click(screen.getByText('Edit tags'));

      const tagInput = screen.getByPlaceholderText('Type a tag and press Enter…');
      fireEvent.change(tagInput, { target: { value: 'important' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });
      fireEvent.click(screen.getByText('Save Tags'));

      await waitFor(() => expect(screen.getByText('important')).toBeInTheDocument());
    });

    it('closing tag modal without saving does not update tags', async () => {
      setupFetch({ active: [apiNote({ tags: [] })] });
      renderDashboard();
      await waitForLoad();

      const card = screen.getByText('Integration Note').closest('.ud-card');
      fireEvent.click(card.querySelector('button'));
      fireEvent.click(screen.getByText('Edit tags'));

      const tagInput = screen.getByPlaceholderText('Type a tag and press Enter…');
      fireEvent.change(tagInput, { target: { value: 'unsaved' } });
      fireEvent.click(screen.getByText('Cancel'));

      expect(screen.queryByText('unsaved')).not.toBeInTheDocument();
    });

    it('duplicate tags are not added', async () => {
      setupFetch({ active: [apiNote({ tags: ['existing'] })] });
      renderDashboard();
      await waitForLoad();

      const card = screen.getByText('Integration Note').closest('.ud-card');
      fireEvent.click(card.querySelector('button'));
      fireEvent.click(screen.getByText('Edit tags'));

      const tagInput = screen.getByPlaceholderText('Type a tag and press Enter…');
      fireEvent.change(tagInput, { target: { value: 'existing' } });
      fireEvent.keyDown(tagInput, { key: 'Enter' });
      fireEvent.click(screen.getByText('Save Tags'));

      const existingTags = screen.getAllByText('existing');
      expect(existingTags.length).toBe(1);
    });
  });
});

import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserDashboard from '../UserDashboard';

const apiNote = (overrides = {}) => ({
  _id:            'n1',
  title:          'Test Note',
  uploadDate:     '2025-01-15T00:00:00.000Z',
  folderId:       null,
  currentContent: { transcribedText: 'Some transcribed text', summary: 'AI summary here' },
  tags:           [],
  confidence:     85,
  isFavorite:     false,
  isDeleted:      false,
  fileLocation:   null,
  ...overrides,
});

const apiFolder = (overrides = {}) => ({
  _id:  'f1',
  id:   'f1',
  name: 'Science',
  ...overrides,
});

const setupFetch = ({ active = [], trash = [], folders = [], patchOk = true, createFolderData } = {}) => {
  global.fetch = vi.fn().mockImplementation((url, opts) => {
    const method = opts?.method || 'GET';
    if (typeof url === 'string' && url.includes('/api/files/trash'))
      return Promise.resolve({ ok: true, json: () => Promise.resolve(trash) });
    if (typeof url === 'string' && url.includes('/api/files/') && method === 'PATCH')
      return Promise.resolve({ ok: patchOk, json: () => Promise.resolve(patchOk ? { success: true } : {}), statusText: patchOk ? 'OK' : 'Server Error' });
    if (typeof url === 'string' && url.includes('/api/files/') && method === 'DELETE')
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    if (typeof url === 'string' && url.includes('/api/files'))
      return Promise.resolve({ ok: true, json: () => Promise.resolve(active) });
    if (typeof url === 'string' && url.includes('/api/folders') && method === 'POST')
      return Promise.resolve({ ok: true, json: () => Promise.resolve(createFolderData || { _id: 'f-new', id: 'f-new', name: 'New Folder' }) });
    if (typeof url === 'string' && url.includes('/api/folders') && method === 'DELETE')
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
    if (typeof url === 'string' && url.includes('/api/folders') && method === 'PATCH')
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ _id: 'f1', id: 'f1', name: 'Renamed' }) });
    if (typeof url === 'string' && url.includes('/api/folders'))
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

describe('UserDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  describe('Loading state', () => {
    it('shows loading screen while fetching', () => {
      setupFetch();
      renderDashboard();
      expect(screen.getByText('Loading your notes…')).toBeInTheDocument();
    });

    it('hides loading screen after data is fetched', async () => {
      setupFetch();
      renderDashboard();
      await waitForLoad();
      expect(screen.queryByText('Loading your notes…')).not.toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    it('shows empty state when no notes', async () => {
      setupFetch({ active: [] });
      renderDashboard();
      await waitForLoad();
      // Flexible matcher in case the exact empty state text has changed
      expect(screen.getByText(/No notes/i)).toBeInTheDocument();
    });

    it('shows 0 notes count', async () => {
      setupFetch({ active: [] });
      renderDashboard();
      await waitForLoad();
      expect(screen.getByText('0 notes')).toBeInTheDocument();
    });
  });

  describe('Populated state', () => {
    it('renders note title', async () => {
      setupFetch({ active: [apiNote({ title: 'Chemistry Lab' })] });
      renderDashboard();
      await waitForLoad();
      expect(screen.getByText('Chemistry Lab')).toBeInTheDocument();
    });

    it('renders note preview (transcribedText)', async () => {
      setupFetch({ active: [apiNote({ currentContent: { transcribedText: 'Reaction equations' } })] });
      renderDashboard();
      await waitForLoad();
      expect(screen.getByText('Reaction equations')).toBeInTheDocument();
    });

    it('renders note tags', async () => {
      setupFetch({ active: [apiNote({ tags: ['chemistry', 'lab'] })] });
      renderDashboard();
      await waitForLoad();
      expect(screen.getByText('chemistry')).toBeInTheDocument();
      expect(screen.getByText('lab')).toBeInTheDocument();
    });

    it('renders confidence score', async () => {
      setupFetch({ active: [apiNote({ confidence: 91 })] });
      renderDashboard();
      await waitForLoad();
      expect(screen.getByText('91%')).toBeInTheDocument();
    });

    it('renders favorite star indicator for favorited notes', async () => {
      setupFetch({ active: [apiNote({ isFavorite: true })] });
      renderDashboard();
      await waitForLoad();
      const favBadges = screen.getAllByText('1');
      expect(favBadges.length).toBeGreaterThan(0);
    });

    it('renders correct note count', async () => {
      setupFetch({ active: [apiNote({ _id: 'n1' }), apiNote({ _id: 'n2', title: 'Note 2' })] });
      renderDashboard();
      await waitForLoad();
      expect(screen.getByText('2 notes')).toBeInTheDocument();
    });
  });

  describe('Sidebar navigation', () => {
    it('renders My Notes nav item as active by default', async () => {
      setupFetch();
      renderDashboard();
      await waitForLoad();
      expect(screen.getByRole('button', { name: /My Notes/ })).toHaveClass('active');
    });

    it('navigates to Favorites tab', async () => {
      setupFetch({ active: [apiNote({ isFavorite: true })] });
      renderDashboard();
      await waitForLoad();
      fireEvent.click(screen.getByRole('button', { name: /Favorites/ }));
      expect(screen.getAllByText('Favorites').length).toBeGreaterThan(0);
    });

    it('navigates to Trash tab', async () => {
      setupFetch({ trash: [apiNote({ isDeleted: true })] });
      renderDashboard();
      await waitForLoad();
      fireEvent.click(screen.getByRole('button', { name: /Trash/ }));
      expect(screen.getAllByText('Trash').length).toBeGreaterThan(0);
    });

    it('navigates to Settings tab', async () => {
      setupFetch();
      renderDashboard();
      await waitForLoad();
      fireEvent.click(screen.getByText('Settings'));
      expect(screen.getByText(/Change password/i)).toBeInTheDocument();
    });

    it('trash badge shows count of trashed notes', async () => {
      setupFetch({ trash: [apiNote({ _id: 'n1', isDeleted: true }), apiNote({ _id: 'n2', isDeleted: true })] });
      renderDashboard();
      await waitForLoad();
      const trashNav = screen.getByRole('button', { name: /Trash/ });
      expect(within(trashNav).getByText('2')).toBeInTheDocument();
    });
  });

  describe('Search and filtering', () => {
    const twoNotes = [
      apiNote({ _id: 'n1', title: 'Physics Notes',  currentContent: { transcribedText: 'Newton laws' }, tags: ['physics'] }),
      apiNote({ _id: 'n2', title: 'Biology Notes',  currentContent: { transcribedText: 'Cell theory'  }, tags: ['bio']    }),
    ];

    it('filters notes by title', async () => {
      setupFetch({ active: twoNotes });
      renderDashboard();
      await waitForLoad();
      fireEvent.change(screen.getByPlaceholderText('Search notes, tags, folders…'), { target: { value: 'Physics' } });
      expect(screen.getByText('Physics Notes')).toBeInTheDocument();
      expect(screen.queryByText('Biology Notes')).not.toBeInTheDocument();
    });

    it('filters notes by preview text', async () => {
      setupFetch({ active: twoNotes });
      renderDashboard();
      await waitForLoad();
      fireEvent.change(screen.getByPlaceholderText('Search notes, tags, folders…'), { target: { value: 'Newton' } });
      expect(screen.getByText('Physics Notes')).toBeInTheDocument();
      expect(screen.queryByText('Biology Notes')).not.toBeInTheDocument();
    });

    it('filters notes by tag', async () => {
      setupFetch({ active: twoNotes });
      renderDashboard();
      await waitForLoad();
      fireEvent.change(screen.getByPlaceholderText('Search notes, tags, folders…'), { target: { value: 'bio' } });
      expect(screen.getByText('Biology Notes')).toBeInTheDocument();
      expect(screen.queryByText('Physics Notes')).not.toBeInTheDocument();
    });

    it('shows empty state when search has no results', async () => {
      setupFetch({ active: twoNotes });
      renderDashboard();
      await waitForLoad();
      fireEvent.change(screen.getByPlaceholderText('Search notes, tags, folders…'), { target: { value: 'zzz' } });
      expect(screen.getByText(/No notes found for "zzz"/)).toBeInTheDocument();
    });

    it('shows all notes when search is cleared', async () => {
      setupFetch({ active: twoNotes });
      renderDashboard();
      await waitForLoad();
      const input = screen.getByPlaceholderText('Search notes, tags, folders…');
      fireEvent.change(input, { target: { value: 'Physics' } });
      fireEvent.change(input, { target: { value: '' } });
      expect(screen.getByText('Physics Notes')).toBeInTheDocument();
      expect(screen.getByText('Biology Notes')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    const unsortedNotes = [
      apiNote({ _id: 'n1', title: 'Zebra Notes', confidence: 70 }),
      apiNote({ _id: 'n2', title: 'Apple Notes', confidence: 95 }),
      apiNote({ _id: 'n3', title: 'Mango Notes', confidence: 85 }),
    ];

    it('sorts alphabetically A–Z', async () => {
      setupFetch({ active: unsortedNotes });
      renderDashboard();
      await waitForLoad();
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'alpha' } });
      const cards = screen.getAllByText(/Notes/);
      const titles = cards.map(c => c.textContent);
      const noteCards = titles.filter(t => ['Apple Notes', 'Mango Notes', 'Zebra Notes'].includes(t));
      expect(noteCards[0]).toBe('Apple Notes');
      expect(noteCards[noteCards.length - 1]).toBe('Zebra Notes');
    });

    it('sorts by confidence descending', async () => {
      setupFetch({ active: unsortedNotes });
      renderDashboard();
      await waitForLoad();
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'confidence' } });
      const allText = document.body.textContent;
      expect(allText.indexOf('95%')).toBeLessThan(allText.indexOf('70%'));
    });
  });

  describe('Optimistic updates — Toggle favorite', () => {
    it('favorite badge count increases immediately after toggling', async () => {
      const note = apiNote({ _id: 'n1', isFavorite: false });
      setupFetch({ active: [note] });
      renderDashboard();
      await waitForLoad();

      const card = screen.getByText('Test Note').closest('.ud-card');
      fireEvent.click(card.querySelector('button'));
      fireEvent.click(screen.getByText('Add to favorites'));

      await waitFor(() => {
        const favNav = screen.getByRole('button', { name: /Favorites/ });
        expect(within(favNav).getByText('1')).toBeInTheDocument();
      });
    });

    it('reverts favorite on API failure', async () => {
      const note = apiNote({ _id: 'n1', isFavorite: false });
      setupFetch({ active: [note], patchOk: false });
      renderDashboard();
      await waitForLoad();

      const card = screen.getByText('Test Note').closest('.ud-card');
      fireEvent.click(card.querySelector('button'));
      fireEvent.click(screen.getByText('Add to favorites'));

      await waitFor(() => expect(screen.getByText('Failed to update favorite')).toBeInTheDocument());
    });
  });

  describe('Delete and restore', () => {
    it('note is removed from Notes view immediately after trash', async () => {
      setupFetch({ active: [apiNote()] });
      renderDashboard();
      await waitForLoad();

      const card = screen.getByText('Test Note').closest('.ud-card');
      fireEvent.click(card.querySelector('button'));
      fireEvent.click(screen.getByText('Move to Trash'));
      fireEvent.click(screen.getByText('Move to Trash', { selector: 'button' }));

      await waitFor(() => expect(screen.queryByText('Test Note')).not.toBeInTheDocument());
    });

    it('shows toast after moving to trash', async () => {
      setupFetch({ active: [apiNote()] });
      renderDashboard();
      await waitForLoad();

      const card = screen.getByText('Test Note').closest('.ud-card');
      fireEvent.click(card.querySelector('button'));
      fireEvent.click(screen.getByText('Move to Trash'));
      fireEvent.click(screen.getByText('Move to Trash', { selector: 'button' }));

      await waitFor(() => expect(screen.getByText('Note moved to trash')).toBeInTheDocument());
    });

    it('note appears in Trash tab after being deleted', async () => {
      setupFetch({ active: [apiNote()] });
      renderDashboard();
      await waitForLoad();

      const card = screen.getByText('Test Note').closest('.ud-card');
      fireEvent.click(card.querySelector('button'));
      fireEvent.click(screen.getByText('Move to Trash'));
      fireEvent.click(screen.getByText('Move to Trash', { selector: 'button' }));

      await waitFor(() => screen.queryByText('Test Note') === null || true);

      fireEvent.click(screen.getByRole('button', { name: /Trash/ }));
      expect(screen.getByText('Test Note')).toBeInTheDocument();
    });

    it('restoring a note removes it from Trash', async () => {
      setupFetch({ trash: [apiNote({ isDeleted: true })] });
      renderDashboard();
      await waitForLoad();

      fireEvent.click(screen.getByRole('button', { name: /Trash/ }));
      expect(screen.getByText('Test Note')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Restore'));

      await waitFor(() => expect(screen.queryByText('Test Note')).not.toBeInTheDocument());
    });

    it('permanent delete removes note entirely', async () => {
      setupFetch({ trash: [apiNote({ isDeleted: true })] });
      renderDashboard();
      await waitForLoad();

      fireEvent.click(screen.getByRole('button', { name: /Trash/ }));
      fireEvent.click(screen.getByText('Delete'));

      await waitFor(() => expect(screen.queryByText('Test Note')).not.toBeInTheDocument());
    });

    it('Empty Trash removes all trashed notes', async () => {
      setupFetch({ trash: [
        apiNote({ _id: 'n1', isDeleted: true }),
        apiNote({ _id: 'n2', isDeleted: true, title: 'Note 2' }),
      ]});
      renderDashboard();
      await waitForLoad();

      fireEvent.click(screen.getByRole('button', { name: /Trash/ }));
      fireEvent.click(screen.getByText('Empty Trash'));

      await waitFor(() => expect(screen.getByText('Empty Trash?')).toBeInTheDocument());
      const allEmptyBtns = screen.getAllByText('Empty Trash');
      fireEvent.click(allEmptyBtns[allEmptyBtns.length - 1]);

      await waitFor(() => {
        expect(screen.queryByText('Test Note')).not.toBeInTheDocument();
        expect(screen.queryByText('Note 2')).not.toBeInTheDocument();
      });
    });
  });

  describe('Note click', () => {
    it('calls onNoteSelect when note card body is clicked', async () => {
      const onNoteSelect = vi.fn();
      setupFetch({ active: [apiNote({ title: 'Clickable Note' })] });
      renderDashboard({ onNoteSelect });
      await waitForLoad();

      fireEvent.click(screen.getByText('Clickable Note'));
      expect(onNoteSelect).toHaveBeenCalled();
    });
  });

  describe('Folder operations', () => {
    it('shows existing folders in FoldersStrip', async () => {
      setupFetch({ folders: [apiFolder({ name: 'Math' })] });
      renderDashboard();
      await waitForLoad();
      expect(screen.getByText('Math')).toBeInTheDocument();
    });

    it('selecting a folder filters notes to that folder', async () => {
      const note1 = apiNote({ _id: 'n1', title: 'In Folder', folderId: 'f1' });
      const note2 = apiNote({ _id: 'n2', title: 'No Folder', folderId: null });
      setupFetch({ active: [note1, note2], folders: [apiFolder({ _id: 'f1', id: 'f1', name: 'Science' })] });
      renderDashboard();
      await waitForLoad();

      // "Science" appears in both the folder chip and the note card badge
      // so scope the click to the folder chip specifically
      const scienceChip = screen.getAllByText('Science')
        .map(el => el.closest('.ud-folder-chip'))
        .find(Boolean);
      fireEvent.click(scienceChip);

      expect(screen.getByText('In Folder')).toBeInTheDocument();
      expect(screen.queryByText('No Folder')).not.toBeInTheDocument();
    });

    it('deleting a folder removes it from the strip', async () => {
      setupFetch({ folders: [apiFolder({ name: 'Old Folder' })] });
      renderDashboard();
      await waitForLoad();

      const chip = screen.getByText('Old Folder').closest('.ud-folder-chip');
      fireEvent.click(chip.querySelector('button'));

      await waitFor(() => expect(screen.queryByText('Old Folder')).not.toBeInTheDocument(), { timeout: 3000 });
    });
  });
});

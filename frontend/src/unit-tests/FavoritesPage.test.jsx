import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FavoritesPage from '../FavoritesPage';

// ── helpers ───────────────────────────────────────────────────
const makeNote = (overrides = {}) => ({
  id: '1',
  title: 'Default Note',
  preview: 'Some preview text',
  tags: [],
  confidence: 85,
  date: 'Jan 1, 2025',
  favorite: true,
  ...overrides,
});

const defaultProps = (notes = []) => ({
  notes,
  onNoteSelect: vi.fn(),
  onRemoveFavorite: vi.fn(),
  onNewScan: vi.fn(),
});

// ── tests ─────────────────────────────────────────────────────
describe('FavoritesPage', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── Rendering ───────────────────────────────────────────────
  describe('Rendering', () => {
    it('shows empty state when no notes are favorited', () => {
      render(<FavoritesPage {...defaultProps([])} />);
      expect(screen.getByText('No favorites yet')).toBeInTheDocument();
      expect(screen.getByText(/Star any note from My Notes/)).toBeInTheDocument();
    });

    it('shows only favorited notes', () => {
      const notes = [
        makeNote({ id: '1', title: 'Fav Note', favorite: true }),
        makeNote({ id: '2', title: 'Not Fav', favorite: false }),
      ];
      render(<FavoritesPage {...defaultProps(notes)} />);
      expect(screen.getByText('Fav Note')).toBeInTheDocument();
      expect(screen.queryByText('Not Fav')).not.toBeInTheDocument();
    });

    it('shows correct favorite count — singular', () => {
      render(<FavoritesPage {...defaultProps([makeNote()])} />);
      expect(screen.getByText('1 favorited note')).toBeInTheDocument();
    });

    it('shows correct favorite count — plural', () => {
      const notes = [makeNote({ id: '1' }), makeNote({ id: '2' })];
      render(<FavoritesPage {...defaultProps(notes)} />);
      expect(screen.getByText('2 favorited notes')).toBeInTheDocument();
    });

    it('renders note title and preview', () => {
      const note = makeNote({ title: 'Physics Notes', preview: 'Newton laws' });
      render(<FavoritesPage {...defaultProps([note])} />);
      expect(screen.getByText('Physics Notes')).toBeInTheDocument();
      expect(screen.getByText('Newton laws')).toBeInTheDocument();
    });

    it('renders tags', () => {
      const note = makeNote({ tags: ['physics', 'science'] });
      render(<FavoritesPage {...defaultProps([note])} />);
      expect(screen.getByText('physics')).toBeInTheDocument();
      expect(screen.getByText('science')).toBeInTheDocument();
    });

    it('renders confidence score', () => {
      const note = makeNote({ confidence: 92 });
      render(<FavoritesPage {...defaultProps([note])} />);
      expect(screen.getByText('92%')).toBeInTheDocument();
    });

    it('renders note date', () => {
      const note = makeNote({ date: 'Mar 15, 2025' });
      render(<FavoritesPage {...defaultProps([note])} />);
      expect(screen.getByText('Mar 15, 2025')).toBeInTheDocument();
    });
  });

  // ── Search ──────────────────────────────────────────────────
  describe('Search filtering', () => {
    const notes = [
      makeNote({ id: '1', title: 'Math Notes',    preview: 'Algebra basics',  tags: ['math'] }),
      makeNote({ id: '2', title: 'Biology Notes', preview: 'Cell structure',  tags: ['bio'] }),
    ];

    it('filters by title', () => {
      render(<FavoritesPage {...defaultProps(notes)} />);
      fireEvent.change(screen.getByPlaceholderText('Search favorites…'), { target: { value: 'Math' } });
      expect(screen.getByText('Math Notes')).toBeInTheDocument();
      expect(screen.queryByText('Biology Notes')).not.toBeInTheDocument();
    });

    it('filters by preview', () => {
      render(<FavoritesPage {...defaultProps(notes)} />);
      fireEvent.change(screen.getByPlaceholderText('Search favorites…'), { target: { value: 'Algebra' } });
      expect(screen.getByText('Math Notes')).toBeInTheDocument();
      expect(screen.queryByText('Biology Notes')).not.toBeInTheDocument();
    });

    it('filters by tag', () => {
      render(<FavoritesPage {...defaultProps(notes)} />);
      fireEvent.change(screen.getByPlaceholderText('Search favorites…'), { target: { value: 'bio' } });
      expect(screen.getByText('Biology Notes')).toBeInTheDocument();
      expect(screen.queryByText('Math Notes')).not.toBeInTheDocument();
    });

    it('is case-insensitive', () => {
      render(<FavoritesPage {...defaultProps(notes)} />);
      fireEvent.change(screen.getByPlaceholderText('Search favorites…'), { target: { value: 'MATH' } });
      expect(screen.getByText('Math Notes')).toBeInTheDocument();
    });

    it('shows all notes when search is empty', () => {
      render(<FavoritesPage {...defaultProps(notes)} />);
      const input = screen.getByPlaceholderText('Search favorites…');
      fireEvent.change(input, { target: { value: 'Math' } });
      fireEvent.change(input, { target: { value: '' } });
      expect(screen.getByText('Math Notes')).toBeInTheDocument();
      expect(screen.getByText('Biology Notes')).toBeInTheDocument();
    });

    it('shows no-results message when nothing matches', () => {
      render(<FavoritesPage {...defaultProps(notes)} />);
      fireEvent.change(screen.getByPlaceholderText('Search favorites…'), { target: { value: 'zzzzz' } });
      expect(screen.getByText(/No favorites found for "zzzzz"/)).toBeInTheDocument();
    });

    it('whitespace-only search shows all notes', () => {
      render(<FavoritesPage {...defaultProps(notes)} />);
      fireEvent.change(screen.getByPlaceholderText('Search favorites…'), { target: { value: '   ' } });
      // trim().toLowerCase() → '' → all pass
      expect(screen.getByText('Math Notes')).toBeInTheDocument();
      expect(screen.getByText('Biology Notes')).toBeInTheDocument();
    });

    it('special characters do not break filtering', () => {
      render(<FavoritesPage {...defaultProps(notes)} />);
      expect(() =>
        fireEvent.change(screen.getByPlaceholderText('Search favorites…'), { target: { value: '.*[]+?' } })
      ).not.toThrow();
    });
  });

  // ── Interactions ────────────────────────────────────────────
  describe('Interactions', () => {
    it('calls onNoteSelect with the note when card is clicked', () => {
      const onNoteSelect = vi.fn();
      const note = makeNote({ title: 'Clickable' });
      render(<FavoritesPage notes={[note]} onNoteSelect={onNoteSelect} onRemoveFavorite={vi.fn()} onNewScan={vi.fn()} />);
      fireEvent.click(screen.getByText('Clickable'));
      expect(onNoteSelect).toHaveBeenCalledWith(note);
    });

    it('calls onNoteSelect when Open button is clicked', () => {
      const onNoteSelect = vi.fn();
      const note = makeNote();
      render(<FavoritesPage notes={[note]} onNoteSelect={onNoteSelect} onRemoveFavorite={vi.fn()} onNewScan={vi.fn()} />);
      fireEvent.click(screen.getByText('Open →'));
      expect(onNoteSelect).toHaveBeenCalledWith(note);
    });

    it('calls onRemoveFavorite with note id when remove button clicked', () => {
      const onRemoveFavorite = vi.fn();
      const note = makeNote({ id: 'note-42' });
      render(<FavoritesPage notes={[note]} onNoteSelect={vi.fn()} onRemoveFavorite={onRemoveFavorite} onNewScan={vi.fn()} />);
      fireEvent.click(screen.getByTitle('Remove from favorites'));
      expect(onRemoveFavorite).toHaveBeenCalledWith('note-42');
    });

    it('does not call onNoteSelect when remove button clicked', () => {
      const onNoteSelect = vi.fn();
      render(<FavoritesPage notes={[makeNote()]} onNoteSelect={onNoteSelect} onRemoveFavorite={vi.fn()} onNewScan={vi.fn()} />);
      fireEvent.click(screen.getByTitle('Remove from favorites'));
      expect(onNoteSelect).not.toHaveBeenCalled();
    });
  });
});

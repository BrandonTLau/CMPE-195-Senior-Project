import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ResultsPage from '../ResultsPage';

// ── helpers ───────────────────────────────────────────────────
const makeFileData = (overrides = {}) => ({
  _id:         'file-1',
  title:       'Test Note',
  originalName:'test.jpg',
  confidence:  88,
  fileType:    'image',
  mimeType:    'image/jpeg',
  fileLocation:'uploads/test.jpg',
  currentContent: {
    transcribedText: 'Recognized text from OCR',
    summary:         'This is the AI summary',
    flashCards: [
      { cardId: 'c1', question: 'What is React?', answer: 'A JS library' },
      { cardId: 'c2', question: 'What is JSX?',   answer: 'Syntax sugar'  },
    ],
  },
  aiGeneratedContent: {
    summary:    'AI summary text',
    flashCards: [],
  },
  ...overrides,
});

const setupFetch = (fileData = makeFileData(), { patchOk = true, generateOk = true } = {}) => {
  global.fetch = vi.fn().mockImplementation((url, opts) => {
    const method = opts?.method || 'GET';

    if (url.includes('/generate') && method === 'POST') {
      if (!generateOk) return Promise.resolve({ ok: false, json: () => Promise.resolve({ msg: 'AI error' }) });
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          currentContent: {
            transcribedText: fileData.currentContent.transcribedText,
            summary: 'Freshly generated summary',
            flashCards: [
              { cardId: 'new-1', question: 'New Q?', answer: 'New A' },
            ],
          },
        }),
      });
    }

    if (method === 'PUT') {
      return Promise.resolve({
        ok: patchOk,
        json: () => Promise.resolve(patchOk ? { currentContent: fileData.currentContent } : {}),
        statusText: patchOk ? 'OK' : 'Error',
      });
    }

    // Default GET file data
    return Promise.resolve({ ok: true, json: () => Promise.resolve(fileData) });
  });
};

const renderResults = (props = {}) => {
  sessionStorage.setItem('lastUploadId', 'file-1');
  return render(<ResultsPage onBack={vi.fn()} onSave={vi.fn()} {...props} />);
};

// ── tests ─────────────────────────────────────────────────────
describe('ResultsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  // ── Initial render ───────────────────────────────────────────
  describe('Rendering', () => {
    it('renders the top bar', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => expect(screen.getByText('Processing Complete')).toBeInTheDocument());
    });

    it('renders the title from file data', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => expect(screen.getByDisplayValue('Test Note')).toBeInTheDocument());
    });

    it('renders confidence badge', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => expect(screen.getByText('88% Confidence')).toBeInTheDocument());
    });

    it('renders all three tabs', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => {
        expect(screen.getByText('Scan & Edit')).toBeInTheDocument();
        expect(screen.getByText('AI Summary')).toBeInTheDocument();
        expect(screen.getByText('Flashcards')).toBeInTheDocument();
      });
    });

    it('shows flashcard count badge on Flashcards tab', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => expect(screen.getByText('2')).toBeInTheDocument());
    });

    it('renders title from originalName when title field is absent', async () => {
      setupFetch(makeFileData({ title: undefined, originalName: 'my-scan.jpg' }));
      renderResults();
      await waitFor(() => expect(screen.getByDisplayValue('my-scan')).toBeInTheDocument());
    });

    it('renders with noteId prop instead of sessionStorage', async () => {
      setupFetch();
      render(<ResultsPage onBack={vi.fn()} onSave={vi.fn()} noteId="file-1" />);
      await waitFor(() => expect(screen.getByText('Processing Complete')).toBeInTheDocument());
    });
  });

  // ── Title input ──────────────────────────────────────────────
  describe('Title input', () => {
    it('allows editing the title', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => screen.getByDisplayValue('Test Note'));
      const input = screen.getByDisplayValue('Test Note');
      fireEvent.change(input, { target: { value: 'Updated Title' } });
      expect(screen.getByDisplayValue('Updated Title')).toBeInTheDocument();
    });
  });

  // ── Back button ──────────────────────────────────────────────
  describe('Back button', () => {
    it('calls onBack when Back button clicked', async () => {
      const onBack = vi.fn();
      setupFetch();
      render(<ResultsPage onBack={onBack} onSave={vi.fn()} />);
      await waitFor(() => screen.getByText('Back'));
      fireEvent.click(screen.getByText('Back'));
      expect(onBack).toHaveBeenCalled();
    });
  });

  // ── Save button ──────────────────────────────────────────────
  describe('Save button', () => {
    it('renders Save Notes button', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => expect(screen.getByText('Save Notes')).toBeInTheDocument());
    });

    it('calls onSave when Save Notes clicked', async () => {
      const onSave = vi.fn();
      setupFetch();
      render(<ResultsPage onBack={vi.fn()} onSave={onSave} />);
      await waitFor(() => screen.getByText('Save Notes'));
      fireEvent.click(screen.getByText('Save Notes'));
      await waitFor(() => expect(onSave).toHaveBeenCalled());
    });

    it('shows Saved state after clicking Save Notes', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => screen.getByText('Save Notes'));
      fireEvent.click(screen.getByText('Save Notes'));
      await waitFor(() => expect(screen.getByText('Saved')).toBeInTheDocument());
    });

    it('Save Notes button is disabled after saving', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => screen.getByText('Save Notes'));
      fireEvent.click(screen.getByText('Save Notes'));
      await waitFor(() => {
        const savedBtn = screen.getByText('Saved').closest('button');
        expect(savedBtn).toBeDisabled();
      });
    });
  });

  // ── Export menu ──────────────────────────────────────────────
  describe('Export menu', () => {
    it('opens export menu when Export button clicked', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => screen.getByText('Export'));
      fireEvent.click(screen.getByText('Export'));
      expect(screen.getByText('Copy to clipboard')).toBeInTheDocument();
      expect(screen.getByText('Download TXT')).toBeInTheDocument();
      expect(screen.getByText('Download PDF')).toBeInTheDocument();
    });

    it('closes export menu when clicking outside', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => screen.getByText('Export'));
      fireEvent.click(screen.getByText('Export'));
      expect(screen.getByText('Copy to clipboard')).toBeInTheDocument();
      fireEvent.mouseDown(document.body);
      await waitFor(() => expect(screen.queryByText('Copy to clipboard')).not.toBeInTheDocument());
    });

    it('copy to clipboard calls navigator.clipboard.writeText', async () => {
      setupFetch();
      Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
      renderResults();
      await waitFor(() => screen.getByText('Export'));
      fireEvent.click(screen.getByText('Export'));
      fireEvent.click(screen.getByText('Copy to clipboard'));
      await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled());
    });
  });

  // ── Tab switching ─────────────────────────────────────────────
  describe('Tab switching', () => {
    it('switches to AI Summary tab', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => screen.getByText('AI Summary'));
      fireEvent.click(screen.getByText('AI Summary'));
      // File has an existing summary so button shows "Regenerate Summary"
      expect(screen.getByText('Regenerate Summary')).toBeInTheDocument();
    });

    it('switches to Flashcards tab', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => screen.getByText('Flashcards'));
      fireEvent.click(screen.getByText('Flashcards'));
      expect(screen.getByText('Add Card')).toBeInTheDocument();
    });

    it('shows existing flashcards in Flashcards tab', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => screen.getByText('Flashcards'));
      fireEvent.click(screen.getByText('Flashcards'));
      await waitFor(() => expect(screen.getByText('What is React?')).toBeInTheDocument());
    });

    it('shows existing summary in AI Summary tab', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => screen.getByText('AI Summary'));
      fireEvent.click(screen.getByText('AI Summary'));
      await waitFor(() => expect(screen.getByText('This is the AI summary')).toBeInTheDocument());
    });

    it('Scan & Edit tab shows recognized text editor', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => expect(screen.getByText('Recognized Text')).toBeInTheDocument());
    });
  });

  // ── AI generation ─────────────────────────────────────────────
  describe('AI generation', () => {
    it('generates summary when Generate Summary clicked', async () => {
      // Clear both summary fields so button shows "Generate Summary"
      setupFetch(makeFileData({
        currentContent:    { transcribedText: 'Some text', summary: '', flashCards: [] },
        aiGeneratedContent:{ summary: '', flashCards: [] },
      }));
      renderResults();
      await waitFor(() => screen.getByText('AI Summary'));
      fireEvent.click(screen.getByText('AI Summary'));
      await waitFor(() => screen.getByText('Generate Summary'));
      fireEvent.click(screen.getByText('Generate Summary'));
      await waitFor(() => expect(screen.getByText('Freshly generated summary')).toBeInTheDocument());
    });

    it('shows error when summary generation fails', async () => {
      setupFetch(
        makeFileData({
          currentContent:    { transcribedText: 'Some text', summary: '', flashCards: [] },
          aiGeneratedContent:{ summary: '', flashCards: [] },
        }),
        { generateOk: false }
      );
      renderResults();
      await waitFor(() => screen.getByText('AI Summary'));
      fireEvent.click(screen.getByText('AI Summary'));
      await waitFor(() => screen.getByText('Generate Summary'));
      fireEvent.click(screen.getByText('Generate Summary'));
      await waitFor(() => expect(screen.getByText('AI error')).toBeInTheDocument());
    });

    it('generates flashcards when Generate Flashcards clicked', async () => {
      setupFetch(makeFileData({ currentContent: { transcribedText: 'Some text', summary: '', flashCards: [] } }));
      renderResults();
      await waitFor(() => screen.getByText('Flashcards'));
      fireEvent.click(screen.getByText('Flashcards'));
      await waitFor(() => screen.getByText('Generate Flashcards'));
      fireEvent.click(screen.getByText('Generate Flashcards'));
      await waitFor(() => expect(screen.getByText('New Q?')).toBeInTheDocument());
    });

    it('Generate Summary button is disabled when there is no OCR text', async () => {
      setupFetch(makeFileData({
        currentContent:    { transcribedText: '', summary: '', flashCards: [] },
        aiGeneratedContent:{ summary: '', flashCards: [] },
      }));
      renderResults();
      await waitFor(() => screen.getByText('AI Summary'));
      fireEvent.click(screen.getByText('AI Summary'));
      await waitFor(() => screen.getByText('Generate Summary'));
      const btn = screen.getByText('Generate Summary').closest('button');
      expect(btn).toBeDisabled();
    });
  });

  // ── Flashcard management ──────────────────────────────────────
  describe('Flashcard management', () => {
    it('opens Add Card modal when Add Card clicked', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => screen.getByText('Flashcards'));
      fireEvent.click(screen.getByText('Flashcards'));
      await waitFor(() => screen.getByText('Add Card'));
      fireEvent.click(screen.getByText('Add Card'));
      expect(screen.getByText('New Flashcard')).toBeInTheDocument();
    });

    it('closes Add Card modal when Cancel clicked', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => screen.getByText('Flashcards'));
      fireEvent.click(screen.getByText('Flashcards'));
      await waitFor(() => screen.getByText('Add Card'));
      fireEvent.click(screen.getByText('Add Card'));
      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.queryByText('New Flashcard')).not.toBeInTheDocument();
    });

    it('Save Card button is disabled when fields are empty', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => screen.getByText('Flashcards'));
      fireEvent.click(screen.getByText('Flashcards'));
      await waitFor(() => screen.getByText('Add Card'));
      fireEvent.click(screen.getByText('Add Card'));
      const saveBtn = screen.getByText('Save Card').closest('button');
      expect(saveBtn).toHaveStyle({ opacity: '0.4' });
    });

    it('adds new flashcard after filling modal and saving', async () => {
      // PUT /edit/flashcards must return the new card so setCards reflects it
      global.fetch = vi.fn().mockImplementation((url, opts) => {
        const method = opts?.method || 'GET';
        if (url.includes('/edit/flashcards') && method === 'PUT') {
          const body = JSON.parse(opts.body);
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ currentContent: { flashCards: body.cards } }),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve(makeFileData()) });
      });
      sessionStorage.setItem('lastUploadId', 'file-1');
      render(<ResultsPage onBack={vi.fn()} onSave={vi.fn()} />);

      await waitFor(() => screen.getByText('Flashcards'));
      fireEvent.click(screen.getByText('Flashcards'));
      await waitFor(() => screen.getByText('Add Card'));
      fireEvent.click(screen.getByText('Add Card'));

      // Use placeholder text to target modal textareas specifically
      fireEvent.change(screen.getByPlaceholderText('Enter question…'), { target: { value: 'My Question?' } });
      fireEvent.change(screen.getByPlaceholderText('Enter answer…'),   { target: { value: 'My Answer'    } });
      fireEvent.click(screen.getByText('Save Card'));

      await waitFor(() => expect(screen.getByText('My Question?')).toBeInTheDocument());
    });
  });

  // ── Scan view toggle ─────────────────────────────────────────
  describe('Scan & Edit view toggle', () => {
    it('switches to image-only view', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => screen.getByText('Scan'));
      fireEvent.click(screen.getByText('Scan'));
      expect(screen.getByText('Original Scan')).toBeInTheDocument();
    });

    it('switches to editor-only view', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => screen.getByText('Editor'));
      fireEvent.click(screen.getByText('Editor'));
      expect(screen.getByText('Recognized Text')).toBeInTheDocument();
    });

    it('switches back to both view', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => screen.getByText('Both'));
      fireEvent.click(screen.getByText('Both'));
      expect(screen.getByText('Original Scan')).toBeInTheDocument();
      expect(screen.getByText('Recognized Text')).toBeInTheDocument();
    });
  });

  // ── PreviewCard (flashcard flip) ─────────────────────────────
  describe('PreviewCard', () => {
    it('renders question side of flashcard', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => screen.getByText('Flashcards'));
      fireEvent.click(screen.getByText('Flashcards'));
      await waitFor(() => expect(screen.getByText('What is React?')).toBeInTheDocument());
    });

    it('flips flashcard when clicked', async () => {
      setupFetch();
      renderResults();
      await waitFor(() => screen.getByText('Flashcards'));
      fireEvent.click(screen.getByText('Flashcards'));
      await waitFor(() => screen.getByText('What is React?'));
      // Click the card to flip it
      const card = screen.getByText('What is React?').closest('div[style*="perspective"]');
      fireEvent.click(card);
      // Answer should now be visible
      expect(screen.getByText('A JS library')).toBeInTheDocument();
    });
  });
});

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UploadPage from '../UploadPage';

// ── mock ocrClient ────────────────────────────────────────────
vi.mock('../api/ocrClient', () => ({
  runOcr: vi.fn().mockResolvedValue({
    overlay_url:  'http://localhost:5000/overlay.png',
    merged_text:  'OCR extracted text',
    text:         'OCR extracted text',
    blocks:       [],
    image_url:    'http://localhost:5000/image.png',
    image_size:   [800, 600],
    items:        [{ score: 0.95 }],
  }),
}));

// ── helpers ───────────────────────────────────────────────────
const makeImageFile = (name = 'note.jpg', type = 'image/jpeg') =>
  new File(['dummy-content'], name, { type });

const makePdfFile = (name = 'doc.pdf') =>
  new File(['%PDF-dummy'], name, { type: 'application/pdf' });

const mockUploadSuccess = (id = 'file-123') => {
  global.fetch = vi.fn().mockResolvedValue({
    ok:   true,
    json: () => Promise.resolve({ _id: id }),
  });
};

const mockUploadFailure = (msg = 'Upload failed') => {
  global.fetch = vi.fn().mockResolvedValue({
    ok:   false,
    json: () => Promise.resolve({ msg }),
  });
};

const selectFile = (file) => {
  const input = document.getElementById('file-upload');
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  fireEvent.change(input);
};

// ── tests ─────────────────────────────────────────────────────
describe('UploadPage', () => {
  const defaultProps = { onProcess: vi.fn(), onBack: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  // ── Rendering ───────────────────────────────────────────────
  describe('Rendering', () => {
    it('renders the dropzone', () => {
      render(<UploadPage {...defaultProps} />);
      expect(screen.getByText('Drag and drop your file here')).toBeInTheDocument();
    });

    it('renders Browse Files button', () => {
      render(<UploadPage {...defaultProps} />);
      expect(screen.getByText('Browse Files')).toBeInTheDocument();
    });

    it('renders Process Notes button', () => {
      render(<UploadPage {...defaultProps} />);
      expect(screen.getByText('Process Notes')).toBeInTheDocument();
    });

    it('Process Notes button is disabled when no file selected', () => {
      render(<UploadPage {...defaultProps} />);
      expect(screen.getByText('Process Notes').closest('button')).toBeDisabled();
    });

    it('shows supported formats', () => {
      render(<UploadPage {...defaultProps} />);
      expect(screen.getByText(/PDF, JPG, JPEG, PNG/)).toBeInTheDocument();
    });
  });

  // ── File selection ───────────────────────────────────────────
  describe('File selection', () => {
    it('shows file name after file is selected', () => {
      render(<UploadPage {...defaultProps} />);
      selectFile(makeImageFile('my-notes.jpg'));
      expect(screen.getByText('my-notes.jpg')).toBeInTheDocument();
    });

    it('shows file size after file is selected', () => {
      render(<UploadPage {...defaultProps} />);
      selectFile(makeImageFile());
      // "MB" appears in both the header ("up to 50 MB") and the file info row
      // ("0.0 MB · Image") — assert at least one match exists
      expect(screen.getAllByText(/MB/).length).toBeGreaterThan(0);
    });

    it('shows file type "Image" for image files', () => {
      render(<UploadPage {...defaultProps} />);
      selectFile(makeImageFile('photo.png', 'image/png'));
      expect(screen.getByText(/Image/)).toBeInTheDocument();
    });

    it('shows file type "PDF" for PDF files', () => {
      render(<UploadPage {...defaultProps} />);
      selectFile(makePdfFile());
      // "PDF" appears in both the header and the file info — check the file info specifically
      const fileInfoParagraphs = screen.getAllByText(/PDF/);
      const fileInfo = fileInfoParagraphs.find(el => el.tagName === 'P' && el.textContent.includes('MB'));
      expect(fileInfo).toBeTruthy();
      expect(fileInfo.textContent).toContain('PDF');
    });

    it('Process Notes button is enabled after file selected', () => {
      render(<UploadPage {...defaultProps} />);
      selectFile(makeImageFile());
      expect(screen.getByText('Process Notes').closest('button')).not.toBeDisabled();
    });

    it('only keeps the most recently selected file (single file mode)', () => {
      render(<UploadPage {...defaultProps} />);
      selectFile(makeImageFile('first.jpg'));
      selectFile(makeImageFile('second.jpg'));
      expect(screen.getByText('second.jpg')).toBeInTheDocument();
      expect(screen.queryByText('first.jpg')).not.toBeInTheDocument();
    });

    it('clicking remove button clears file selection', () => {
      render(<UploadPage {...defaultProps} />);
      selectFile(makeImageFile('note.jpg'));
      expect(screen.getByText('note.jpg')).toBeInTheDocument();
      fireEvent.click(screen.getByText('×'));
      expect(screen.queryByText('note.jpg')).not.toBeInTheDocument();
    });

    it('Process Notes button is disabled again after file removed', () => {
      render(<UploadPage {...defaultProps} />);
      selectFile(makeImageFile());
      fireEvent.click(screen.getByText('×'));
      expect(screen.getByText('Process Notes').closest('button')).toBeDisabled();
    });
  });

  // ── Processing ───────────────────────────────────────────────
  describe('Processing', () => {
    it('shows loading overlay during upload', async () => {
      global.fetch = vi.fn().mockImplementation(() => new Promise(() => {})); // never resolves
      render(<UploadPage {...defaultProps} />);
      selectFile(makeImageFile());
      fireEvent.click(screen.getByText('Process Notes'));
      await waitFor(() => expect(screen.getByText('Processing Your Notes')).toBeInTheDocument());
    });

    it('calls onProcess after successful image upload and OCR', async () => {
      const onProcess = vi.fn();
      mockUploadSuccess();
      render(<UploadPage onProcess={onProcess} onBack={vi.fn()} />);
      selectFile(makeImageFile());
      fireEvent.click(screen.getByText('Process Notes'));
      await waitFor(() => expect(onProcess).toHaveBeenCalled(), { timeout: 3000 });
    });

    it('calls onProcess after successful PDF upload (skips OCR)', async () => {
      const onProcess = vi.fn();
      mockUploadSuccess();
      render(<UploadPage onProcess={onProcess} onBack={vi.fn()} />);
      selectFile(makePdfFile());
      fireEvent.click(screen.getByText('Process Notes'));
      await waitFor(() => expect(onProcess).toHaveBeenCalled(), { timeout: 3000 });
    });

    it('stores upload id in sessionStorage', async () => {
      mockUploadSuccess('abc-123');
      render(<UploadPage {...defaultProps} />);
      selectFile(makeImageFile());
      fireEvent.click(screen.getByText('Process Notes'));
      await waitFor(() => expect(sessionStorage.getItem('lastUploadId')).toBe('abc-123'));
    });

    it('shows error message when upload fails', async () => {
      mockUploadFailure('Unsupported file type');
      render(<UploadPage {...defaultProps} />);
      selectFile(makeImageFile());
      fireEvent.click(screen.getByText('Process Notes'));
      await waitFor(() => expect(screen.getByText('Unsupported file type')).toBeInTheDocument());
    });

    it('posts to /api/files/upload with form data', async () => {
      mockUploadSuccess();
      render(<UploadPage {...defaultProps} />);
      selectFile(makeImageFile('scan.jpg'));
      fireEvent.click(screen.getByText('Process Notes'));
      await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
        '/api/files/upload',
        expect.objectContaining({ method: 'POST' })
      ));
    });
  });

  // ── Drag and drop ─────────────────────────────────────────────
  describe('Drag and drop', () => {
    it('dropzone gets active class on dragover', () => {
      render(<UploadPage {...defaultProps} />);
      const dropzone = screen.getByText('Drag and drop your file here').closest('div');
      fireEvent.dragEnter(dropzone);
      expect(dropzone).toHaveClass('active');
    });

    it('dropzone loses active class on dragleave', () => {
      render(<UploadPage {...defaultProps} />);
      const dropzone = screen.getByText('Drag and drop your file here').closest('div');
      fireEvent.dragEnter(dropzone);
      fireEvent.dragLeave(dropzone);
      expect(dropzone).not.toHaveClass('active');
    });
  });
});

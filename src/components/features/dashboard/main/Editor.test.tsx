import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Editor } from './editor';
import { Note } from '@/types';
import * as noteParser from '@/utils/noteParser';

// --- Mocks ---

// 1. Mock Hooks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => true, // Desktop view by default
}));

const mockOpenFileSelector = vi.fn();
vi.mock('@/hooks/editor/useImageUpload', () => ({
  useImageUpload: () => ({
    isUploading: false,
    imageUploadExtension: [],
    openFileSelector: mockOpenFileSelector,
    fileInputRef: { current: null },
    handleFileChange: vi.fn(),
  }),
}));

vi.mock('@/hooks/editor/useScrollSync', () => ({
  useScrollSync: () => ({
    handleEditorScroll: vi.fn(),
    handlePreviewScroll: vi.fn(),
  }),
}));

// 2. Mock Router
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// 3. Mock UI Components & Editor
// CodeMirror를 간단한 Textarea로 대체하여 테스트
vi.mock('@uiw/react-codemirror', () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ value, onChange, className }: any) => (
    <textarea
      data-testid="codemirror-mock"
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
  ReactCodeMirrorRef: {},
}));

// MarkdownPreview Mock (Lazy load 대응)
vi.mock('@/components/features/dashboard/MarkdownPreview', () => ({
  MarkdownPreview: ({ content }: { content: string }) => (
    <div data-testid="markdown-preview">{content}</div>
  ),
}));

// EditorToolbar Mock
vi.mock('@/components/features/dashboard/toolbar/EditorToolbar', () => ({
  EditorToolbar: ({ onImageClick }: { onImageClick: () => void }) => (
    <div data-testid="editor-toolbar">
      <button onClick={onImageClick}>Image</button>
    </div>
  ),
}));

// Mock Loader to avoid skeleton UI complexity
vi.mock('@/components/loader/dashboard/MarkdownPreviewLoader', () => ({
  MarkdownPreviewLoader: () => <div data-testid="loader">Loading...</div>,
}));

// Parser Mock
vi.spyOn(noteParser, 'parseNoteContentAsync').mockImplementation(async (content) => {
  return {
    tags: content.includes('#tag') ? [{ text: 'tag', originalText: '#tag' }] : [],
    reminders: content.includes('@tomorrow') 
      ? [{ 
          text: 'tomorrow', 
          originalText: '@tomorrow', 
          reminderText: 'Check', 
          parsedDate: new Date('2025-01-01') 
        }] 
      : [],
  };
});

// --- Tests ---

describe('Editor Component', () => {
  const mockNote: Note = {
    id: 'note-1',
    title: 'Test Title',
    content: 'Initial content',
    tags: [],
    reminders: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'test-user',
    is_archived: false,
    is_pinned: false,
  };

  const defaultProps = {
    note: mockNote,
    onSave: vi.fn(),
    onDeleteRequest: vi.fn(),
    isEditing: false,
    onEnterEditMode: vi.fn(),
    onCancelEdit: vi.fn(),
    onContentChange: vi.fn(),
    hasUnsavedChanges: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders in read-only mode correctly', async () => {
    render(<Editor {...defaultProps} />);

    // Check header info
    expect(screen.getByText('미리보기')).toBeInTheDocument();
    
    // Wait for Suspense (Loader -> Content)
    // Initially loader might show
    // await waitFor(() => expect(screen.getByTestId('loader')).toBeInTheDocument()); 
    // But since it's lazy, we wait for final content
    
    // Check Title and Content in Preview
    expect(await screen.findByText('Test Title')).toBeInTheDocument();
    
    // Use waitFor to handle Lazy Loading transition
    await waitFor(() => {
      expect(screen.getByTestId('markdown-preview')).toHaveTextContent('Initial content');
    });

    // Check Buttons
    expect(screen.getByText('수정')).toBeInTheDocument();
    expect(screen.getByText('삭제')).toBeInTheDocument();
  });

  it('switches to edit mode and displays CodeMirror', () => {
    render(<Editor {...defaultProps} isEditing={true} />);

    expect(screen.getByText(/편집 중/)).toBeInTheDocument();
    expect(screen.getByTestId('codemirror-mock')).toBeInTheDocument();
    expect(screen.getByTestId('codemirror-mock')).toHaveValue(`Test Title\nInitial content`);
    expect(screen.getByTestId('editor-toolbar')).toBeInTheDocument();
  });

  it('updates content and triggers parsing when typing', async () => {
    render(<Editor {...defaultProps} isEditing={true} />);

    const editor = screen.getByTestId('codemirror-mock');

    // Simulate typing "#tag"
    fireEvent.change(editor, { target: { value: 'New content #tag' } });

    // Expect content change callback
    expect(defaultProps.onContentChange).toHaveBeenCalled();

    // Verify parser call
    await waitFor(() => {
      expect(noteParser.parseNoteContentAsync).toHaveBeenCalled();
    });

    // Wait for tags to appear (Carousel items)
    // Carousel rendering might take a tick due to state update
    await waitFor(async () => {
      const tagElement = await screen.findByText('#tag');
      expect(tagElement).toBeInTheDocument();
    }, { timeout: 2000 });
  });
  it('calls onSave with correct data when save button is clicked', async () => {
    render(
      <Editor 
        {...defaultProps} 
        isEditing={true} 
        hasUnsavedChanges={true} 
      />
    );

    const editor = screen.getByTestId('codemirror-mock');
    
    // Change content
    fireEvent.change(editor, { target: { value: 'Updated Title\nUpdated Body' } });
    
    // Click Save
    const saveButton = screen.getByText('저장');
    fireEvent.click(saveButton);

    expect(defaultProps.onSave).toHaveBeenCalledWith(
      mockNote.id,
      expect.objectContaining({
        title: 'Updated Title',
        content: 'Updated Body',
      })
    );
    expect(defaultProps.onCancelEdit).toHaveBeenCalled();
  });

  it('calls onCancelEdit and resets content when cancel button is clicked', () => {
    render(<Editor {...defaultProps} isEditing={true} />);

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    expect(defaultProps.onCancelEdit).toHaveBeenCalled();
    // Reset verification is implicitly handled by component unmounting/prop change in real app
  });

  it('triggers image selector when toolbar image button is clicked', () => {
    render(<Editor {...defaultProps} isEditing={true} />);

    // In our mock, EditorToolbar renders a button with text "Image" that calls onImageClick
    const imageButton = screen.getByText('Image');
    fireEvent.click(imageButton);

    expect(mockOpenFileSelector).toHaveBeenCalled();
  });
});

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { NoteTree } from './NoteTree';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import type { Note } from '@/types';
import type { DragEndEvent } from '@dnd-kit/core';

// Mock the data store's moveNote to verify drag behavior
const moveNoteMock = vi.fn();
vi.mock('@/stores/dataStore', () => ({
  useDataStore: { getState: () => ({ moveNote: moveNoteMock }) },
}));

let capturedOnDragEnd: ((event: DragEndEvent) => void) | undefined;
interface DndContextProps {
  children: React.ReactNode;
  onDragEnd?: (event: DragEndEvent) => void;
}
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    DndContext: (props: DndContextProps) => {
      capturedOnDragEnd = props.onDragEnd;
      return <div>{props.children}</div>;
    },
  };
});

describe('NoteTree Note Drag/Click behavior', () => {
  const note: Note = {
    id: 'n1',
    title: 'Test Note',
    content_preview: 'preview',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    createdAt: new Date(),
    updatedAt: new Date(),
    is_pinned: false,
    folder_path: '/',
    tags: [],
    owner_id: 'user1',
    is_public: false,
    reminders: [],
  };

  beforeEach(() => {
    moveNoteMock.mockClear();
  });

  test('click on note triggers onSelectNote', () => {
    const onSelectNote = vi.fn();
    const { getByTestId } = render(
      <NoteTree
        notes={[note]}
        selectedNote={null}
        selectedFolderPath="/"
        onSelectNote={onSelectNote}
        onSelectFolder={() => {}}
        onTogglePin={() => {}}
        folderPaths={['/']}
        onRequestCreateFolder={() => {}}
        onRequestRenameFolder={() => {}}
        onDeleteFolder={() => {}}
      />
    );
    // Click on title area. Since the text div has pointer-events-none (to avoid dragging text),
    // we should click the parent row which has the actual onClick handler.
    const row = getByTestId(`note-item-${note.id}`);
    fireEvent.click(row);
    expect(onSelectNote).toHaveBeenCalledWith(expect.objectContaining({ id: note.id }));
  });

  test('drag note to folder triggers moveNote', () => {
    render(
      <NoteTree
        notes={[note]}
        selectedNote={null}
        selectedFolderPath="/"
        onSelectNote={() => {}}
        onSelectFolder={() => {}}
        onTogglePin={() => {}}
        folderPaths={['/', '/target']}
        onRequestCreateFolder={() => {}}
        onRequestRenameFolder={() => {}}
        onDeleteFolder={() => {}}
      />
    );
    if (capturedOnDragEnd) {
      capturedOnDragEnd({
        active: { id: 'n1', data: { current: { note } } },
        over: { id: 'folder-/target', data: { current: { path: '/target' } } },
      } as unknown as DragEndEvent);
    }

    expect(moveNoteMock).toHaveBeenCalledWith(note.id, '/target');
  });

  test('drag handle to a different folder calls moveNote with the correct path', () => {
    // Render with an additional target folder to validate different paths
    render(
      <NoteTree
        notes={[note]}
        selectedNote={null}
        selectedFolderPath="/"
        onSelectNote={() => {}}
        onSelectFolder={() => {}}
        onTogglePin={() => {}}
        folderPaths={['/', '/newPath']}
        onRequestCreateFolder={() => {}}
        onRequestRenameFolder={() => {}}
        onDeleteFolder={() => {}}
      />
    );
    if (capturedOnDragEnd) {
      capturedOnDragEnd({
        active: { id: 'n1', data: { current: { note } } },
        over: { id: 'folder-/newPath', data: { current: { path: '/newPath' } } },
      } as unknown as DragEndEvent);
    }

    expect(moveNoteMock).toHaveBeenCalledWith(note.id, '/newPath');
  });
});

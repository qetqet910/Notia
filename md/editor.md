# `forwardRef`와 `useImperativeHandle` 이해하기

React에서 부모 컴포넌트가 자식 컴포넌트의 DOM 노드나 인스턴스에 직접 접근해야 할 때가 있습니다. 이때 `ref`를 사용하는데, 함수형 컴포넌트에서는 기본적으로 `ref`를 직접 전달할 수 없습니다. 이 문제를 해결하기 위해 `forwardRef`와 `useImperativeHandle` 훅을 사용합니다.

## 1. `forwardRef`

`forwardRef`는 부모 컴포넌트가 자식 함수형 컴포넌트에 `ref`를 전달할 수 있도록 해주는 React 유틸리티입니다. `forwardRef`로 감싸진 컴포넌트는 두 번째 인자로 `ref`를 받게 됩니다.

**사용 목적:**
- 부모가 자식의 DOM 노드에 직접 접근해야 할 때 (예: `<input>`에 포커스 설정)
- 부모가 자식 컴포넌트 내부의 특정 메서드를 호출해야 할 때 (예: 비디오 플레이어의 `play()` 메서드 호출)

**예시 (`Editor` 컴포넌트 적용):**

```typescript
// src/components/features/dashboard/main/editor.tsx
import React, { forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react';
import { Note } from '@/types';

interface EditorProps {
  note: Note;
  onSave: (note: Note) => void;
  onDeleteRequest: () => void;
  isEditing: boolean;
  onEnterEditMode: () => void;
  onCancelEdit: () => void;
}

// 부모가 접근할 수 있는 메서드의 타입을 정의합니다.
interface EditorRef {
  save: () => void; // save 메서드를 노출할 것입니다.
}

// forwardRef를 사용하여 ref를 두 번째 인자로 받습니다.
export const Editor = forwardRef<EditorRef, EditorProps>(
  (
    { note, onSave, onDeleteRequest, isEditing, onEnterEditMode, onCancelEdit },
    ref, // <-- ref가 여기에 전달됩니다.
  ) => {
    const [title, setTitle] = useState(note.title);
    const [content, setContent] = useState(note.content);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
      setTitle(note.title);
      setContent(note.content);
      setIsDirty(false);
    }, [note]);

    const handleSave = useCallback(() => {
      // 노트 저장 로직
      const noteToSave: Note = {
        ...note,
        title,
        content,
        updatedAt: new Date(),
      };
      onSave(noteToSave);
      setIsDirty(false);
      onCancelEdit();
      // toast 메시지 등
    }, [note, title, content, onSave, onCancelEdit]);

    // ... (나머지 Editor 컴포넌트 ��직)

    return (
      // ... (JSX 내용)
      <div>
        {/* 에디터 UI */}
      </div>
    );
  },
);
```

위 코드에서 `Editor` 컴포넌트는 `forwardRef`로 감싸져 `ref`를 두 번째 인자로 받습니다. 하지만 이 `ref`는 아직 아무런 기능도 하지 않습니다. `ref`를 통해 부모가 접근할 수 있는 특정 메서드를 정의하려면 `useImperativeHandle`을 사용해야 합니다.

## 2. `useImperativeHandle`

`useImperativeHandle` 훅은 `forwardRef`와 함께 사용되어, 부모 컴포넌트에 노출할 자식 컴포넌트의 인스턴스 값을 사용자 정의할 수 있게 해줍니다. 즉, 부모가 `ref.current`를 통해 접근할 때 어떤 메서드나 속성을 사용할 수 있게 할지 명시적으로 지정합니다.

**사용 목적:**
- 자식 컴포넌트의 내부 상태나 DOM 노드에 직접 접근하는 것을 제한하고, 특정 기능(메서드)만 노출하여 컴포넌트의 캡슐화를 유지할 때 유용합니다.
- 부모가 자식의 특정 액션을 트리거해야 할 때 사용합니다.

**예시 (`Editor` 컴포넌트 적용):**

```typescript
// src/components/features/dashboard/main/editor.tsx (계속)
import React, { forwardRef, useImperativeHandle, useState, useEffect, useCallback } from 'react';
// ... (기존 import 및 interface 정의)

export const Editor = forwardRef<EditorRef, EditorProps>(
  (
    { note, onSave, onDeleteRequest, isEditing, onEnterEditMode, onCancelEdit },
    ref,
  ) => {
    // ... (기존 useState, useEffect, handleSave 로직)

    // useImperativeHandle을 사용하여 ref에 handleSave 메서드를 노출합니다.
    useImperativeHandle(ref, () => ({
      save: handleSave, // 부모가 editorRef.current.save()를 호출할 수 있게 됩니다.
    }), [handleSave]); // handleSave가 변경될 때만 이 객체를 다시 생성합니다.

    // ... (나머지 Editor 컴포넌트 로직)

    return (
      // ... (JSX 내용)
      <div>
        {/* 에디터 UI */}
      </div>
    );
  },
);
```

위 코드에서 `useImperativeHandle(ref, () => ({ save: handleSave }), [handleSave]);` 라인은 `editorRef.current`가 `{ save: handleSave }` 객체를 참조하도록 만듭니다. 이제 부모 컴포넌트에서는 `editorRef.current.save()`를 호출하여 `Editor` 컴포넌트 내부의 `handleSave` 함수를 실행할 수 있게 됩니다.

## 3. 부모 컴포넌트에서의 사용 (`Dashboard` 컴포넌트 적용)

이제 `Editor` 컴포넌트가 `save` 메서드를 노출하도록 설정되었으므로, 부모 컴포넌트인 `Dashboard`에서 이를 ���용할 수 있습니다.

```typescript
// src/pages/dashboard/index.tsx
import React, { useRef, useCallback, useEffect, Suspense, lazy } from 'react';
// ... (기존 import)

// Editor 컴포넌트의 타입을 임포트합니다.
import { Editor } from '@/components/features/dashboard/main/editor'; // Editor 컴포넌트가 forwardRef로 감싸져 있으므로 직접 임포트 가능

// EditorRef 인터페이스도 임포트합니다.
import { EditorRef } from '@/components/features/dashboard/main/editor';

const EditorComponent = lazy(() =>
  import('@/components/features/dashboard/main/editor').then((module) => ({
    default: module.Editor,
  })),
);

export const Dashboard: React.FC = () => {
  // ... (기존 상태 및 훅)

  // EditorRef 타입을 사용하여 ref를 생성합니다.
  const editorRef = useRef<EditorRef | null>(null);

  // ... (기존 핸들러 함수들)

  const handleKeyboardShortcuts = useCallback(
    (e: KeyboardEvent) => {
      const isCtrlCmd = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;

      const isInputElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInputElement && !(isCtrlCmd && e.key.toLowerCase() === 's')) {
        if (e.key !== 'Tab') return;
      }

      const key = e.key === 'Tab' ? 'Tab' : e.key.toLowerCase();

      const shortcuts: { [key: string]: (isCtrlCmd?: boolean) => void } = {
        // ... (다른 단축키)
        s: (isCtrlCmd) => {
          if (isCtrlCmd && isEditing && editorRef.current) {
            editorRef.current.save(); // <-- 여기에서 editorRef.current.save()를 호출합니다.
          }
        },
        // ... (다른 단축키)
      };

      const handler = shortcuts[key];
      if (handler) {
        e.preventDefault();
        handler(isCtrlCmd);
      }
    },
    [
      // ... (의존성 배열)
      isEditing, // isEditing 상태가 변경될 때마다 handleKeyboardShortcuts를 다시 생성
    ],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () =>
      document.removeEventListener('keydown', handleKeyboardShortcuts);
  }, [handleKeyboardShortcuts]);

  // ... (renderMainContent 함수 내에서 Editor 컴포넌트에 ref 전달)
  return (
    // ...
    <Suspense fallback={<EditorLoader />}>
      {isNoteContentLoading ? (
        <EditorLoader />
      ) : selectedNote ? (
        <EditorComponent // lazy 로드된 컴포넌트 사용
          ref={editorRef} // <-- ref를 Editor 컴포넌트에 전달합니다.
          key={selectedNote.id}
          note={selectedNote}
          onSave={handleUpdateNote}
          onDeleteRequest={() => setIsDeleteDialogOpen(true)}
          isEditing={isEditing}
          onEnterEditMode={handleEnterEditMode}
          onCancelEdit={handleCancelEdit}
        />
      ) : (
        <EmptyNoteState handleCreateNote={handleCreateNote} />
      )}
    </Suspense>
    // ...
  );
};
```

이러한 방식으로 `forwardRef`와 `useImperativeHandle`을 사용하면, 자식 컴포넌트의 내부 구현을 노출하지 않으면서도 부모 컴포넌트가 자식의 특정 기능을 제어할 수 있게 됩니다. 이는 컴포넌트 간의 결합도를 낮추고 재사용성을 높이는 데 도움이 됩니다.

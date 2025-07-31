# `forwardRef`와 `useImperativeHandle`을 이용한 에디터 컴포넌트 제어

React에서 부모 컴포넌트가 자식 컴포넌트의 DOM 노드나 특정 메서드에 접근해야 할 때 `ref`를 사용합니다. 하지만 함수형 컴포넌트에서는 기본적으로 `ref`를 직접 전달할 수 없으며, 특정 메서드를 노출해야 할 때는 `useImperativeHandle` 훅을 함께 사용합니다.

## `forwardRef`란?

`forwardRef`는 부모 컴포넌트로부터 전달받은 `ref`를 함수형 자식 컴포넌트가 받을 수 있도록 해주는 React 유틸리티입니다. 이를 통해 부모는 자식 컴포넌트 내부의 DOM 노드나 다른 React 컴포넌트 인스턴스에 접근할 수 있게 됩니다.

**기본 사용법:**

```typescript
import React, { forwardRef } from 'react';

const MyComponent = forwardRef((props, ref) => {
  return <input ref={ref} {...props} />;
});

export default MyComponent;
```

## `useImperativeHandle`이란?

`useImperativeHandle`은 `forwardRef`와 함께 사용되어, `ref`를 통해 부모 컴포넌트에 노출될 인스턴스 값을 사용자 정의할 수 있게 해주는 훅입니다. 이는 부모가 자식 컴포넌트의 특정 DOM 노드에 직접 접근하는 대신, 자식 컴포넌트가 정의한 특정 메서드나 속성에만 접근하도록 제한할 때 유용합니다. 이는 컴포넌트의 캡슐화를 유지하면서 필요한 기능만 노출할 수 있게 합니다.

**기본 사용법:**

```typescript
import React, { forwardRef, useImperativeHandle, useRef } from 'react';

const MyInput = forwardRef((props, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    clear: () => {
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }));

  return <input ref={inputRef} {...props} />;
});

export default MyInput;
```

## 에디터 컴포넌트 예시

`Notia` 프로젝트의 `src/components/features/dashboard/main/editor.tsx`와 같은 에디터 컴포넌트에서 `forwardRef`와 `useImperativeHandle`을 사용하여 부모 컴포넌트가 에디터의 특정 기능을 제어하도록 할 수 있습니다. 예를 들어, 부모 컴포넌트에서 에디터의 내용을 설정하거나, 특정 위치로 포커스하거나, 저장 기능을 트리거하는 등의 작업을 수행할 수 있습니다.

**시나리오:**

우리는 `Editor` 컴포넌트가 다음과 같은 메서드를 부모에게 노출하기를 원합니다:
- `setContent(content: string)`: 에디터의 내용을 설정합니다.
- `focusEditor()`: 에디터에 포커스합니다.
- `saveContent()`: 에디터의 현재 내용을 저장하는 로직을 실행합니다.

**`src/components/features/dashboard/main/editor.tsx` (가상의 예시):**

```typescript
// src/components/features/dashboard/main/editor.tsx
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

interface EditorProps {
  initialContent?: string;
}

export interface EditorRef {
  setContent: (content: string) => void;
  focusEditor: () => void;
  saveContent: () => void;
}

const Editor = forwardRef<EditorRef, EditorProps>(({ initialContent = '' }, ref) => {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // useImperativeHandle을 사용하여 부모에게 노출할 메서드를 정의합니다.
  useImperativeHandle(ref, () => ({
    setContent: (newContent: string) => {
      setContent(newContent);
    },
    focusEditor: () => {
      textareaRef.current?.focus();
    },
    saveContent: () => {
      // 여기에 에디터 내용을 저장하는 실제 로직을 구현합니다.
      console.log('Saving content:', content);
      alert('Content saved! Check console for details.');
    },
  }));

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(event.target.value);
  };

  return (
    <div className="editor-container">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        placeholder="Start writing your note..."
        className="w-full h-96 p-4 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="text-sm text-gray-500 mt-2">Current content length: {content.length}</p>
    </div>
  );
});

export default Editor;
```

**부모 컴포넌트에서 `Editor` 사용하기 (가상의 예시):**

```typescript
// src/pages/dashboard/index.tsx (또는 다른 부모 컴포넌트)
import React, { useRef } from 'react';
import Editor, { EditorRef } from '../../components/features/dashboard/main/editor';
import { Button } from '../../components/ui/button';

const DashboardPage: React.FC = () => {
  const editorRef = useRef<EditorRef>(null);

  const handleLoadContent = () => {
    if (editorRef.current) {
      editorRef.current.setContent('Hello from parent! This is new content.');
    }
  };

  const handleFocusEditor = () => {
    if (editorRef.current) {
      editorRef.current.focusEditor();
    }
  };

  const handleSave = () => {
    if (editorRef.current) {
      editorRef.current.saveContent();
    }
  };

  return (
    <div className="dashboard-layout p-4">
      <h1>My Dashboard</h1>
      <div className="flex space-x-2 mb-4">
        <Button onClick={handleLoadContent}>Load New Content</Button>
        <Button onClick={handleFocusEditor}>Focus Editor</Button>
        <Button onClick={handleSave}>Save Editor Content</Button>
      </div>
      <Editor ref={editorRef} initialContent="Initial note content." />
    </div>
  );
};

export default DashboardPage;
```

이 예시에서 `Editor` 컴포넌트는 `forwardRef`를 사용하여 `ref`를 받을 수 있게 되었고, `useImperativeHandle`을 통해 `setContent`, `focusEditor`, `saveContent` 메서드를 `editorRef`를 통해 부모 컴포넌트에 노출합니다. 이렇게 함으로써 부모는 에디터의 내부 구현에 직접 접근하지 않고도 정의된 인터페이스를 통해 에디터를 제어할 수 있게 됩니다.
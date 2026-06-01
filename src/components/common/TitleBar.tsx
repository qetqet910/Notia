import React, { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import MinusIcon from 'lucide-react/dist/esm/icons/minus';
import Maximize2Icon from 'lucide-react/dist/esm/icons/maximize-2';
import Minimize2Icon from 'lucide-react/dist/esm/icons/minimize-2';
import XIcon from 'lucide-react/dist/esm/icons/x';
import { isTauri } from '@/utils/isTauri';

export const TitleBar: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isTauri()) return;

    const appWindow = getCurrentWindow();
    appWindow.isMaximized().then(setIsMaximized);

    let unlisten: (() => void) | undefined;
    appWindow.onResized(() => {
      appWindow.isMaximized().then(setIsMaximized);
    }).then((f) => { unlisten = f; });

    return () => { unlisten?.(); };
  }, []);

  if (!isTauri()) return null;

  const appWindow = getCurrentWindow();

  return (
    <div
      data-tauri-drag-region
      className="h-8 w-full flex items-center justify-end select-none flex-shrink-0 bg-background border-b border-border"
      style={{ zIndex: 9999 }}
    >
      <div className="flex items-center h-full">
        {/* 최소화 */}
        <button
          onClick={() => appWindow.minimize()}
          className="h-8 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="최소화"
        >
          <MinusIcon className="h-3.5 w-3.5" />
        </button>

        {/* 최대화 / 복원 */}
        <button
          onClick={() => appWindow.toggleMaximize()}
          className="h-8 w-11 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={isMaximized ? '복원' : '최대화'}
        >
          {isMaximized
            ? <Minimize2Icon className="h-3.5 w-3.5" />
            : <Maximize2Icon className="h-3.5 w-3.5" />}
        </button>

        {/* 닫기 */}
        <button
          onClick={() => appWindow.close()}
          className="h-8 w-11 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-red-500 transition-colors"
          aria-label="닫기"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

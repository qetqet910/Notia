import {
  EditorView,
  Decoration,
  DecorationSet,
  WidgetType,
  ViewPlugin,
  ViewUpdate,
  MatchDecorator,
} from '@codemirror/view';

class CheckboxWidget extends WidgetType {
  constructor(readonly checked: boolean) {
    super();
  }

  eq(other: CheckboxWidget) {
    return other.checked === this.checked;
  }

  toDOM(view: EditorView) {
    const wrap = document.createElement('span');
    wrap.className = 'cm-checkbox-widget';
    wrap.style.display = 'inline-flex';
    wrap.style.alignItems = 'center';
    wrap.style.cursor = 'pointer';
    wrap.style.userSelect = 'none';
    wrap.style.marginRight = '4px';
    wrap.style.verticalAlign = 'middle';
    
    // 실제 체크박스
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = this.checked;
    
    // 체크 아이콘 SVG (흰색)
    const checkIcon = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>');
    
    // Tailwind 스타일 적용: Notion 스타일 (appearance-none 사용)
    // 체크되지 않았을 때: 회색 테두리
    // 체크되었을 때: 초록색 배경 + 흰색 체크 아이콘
    input.className = `
      appearance-none 
      h-4 w-4 
      border-2 border-muted-foreground/30 
      rounded-[4px] 
      bg-transparent 
      cursor-pointer 
      checked:bg-green-600 
      checked:border-green-600 
      transition-all 
      mr-2 
      align-middle
      relative
    `;
    
    // 체크 표시를 위한 배경 이미지 설정
    if (this.checked) {
      input.style.backgroundImage = `url("data:image/svg+xml,${checkIcon}")`;
      input.style.backgroundSize = '100% 100%';
      input.style.backgroundPosition = 'center';
      input.style.backgroundRepeat = 'no-repeat';
    }

    // 클릭 이벤트 핸들링
    wrap.onmousedown = (e) => {
        // 커서 이동 방지 및 기본 동작 제어
        e.preventDefault();
        
        const pos = view.posAtDOM(wrap);
        if (pos === null) return;

        // 클릭 시 토글
        // 위젯이 대체하고 있는 텍스트는 "- [ ]" (5글자) 형태라고 가정
        // 실제 변경해야 할 문자는 대괄호 안의 공백 또는 x
        // 매치된 텍스트의 시작점(pos)에서 3번째 인덱스: "- [" 다음
        
        const changePos = pos + 3;
        const newChar = this.checked ? ' ' : 'x';
        
        view.dispatch({
            changes: { from: changePos, to: changePos + 1, insert: newChar }
        });
    };

    wrap.appendChild(input);
    return wrap;
  }

  ignoreEvent() {
    return false;
  }
}

// 매치 데코레이터 설정
const checkboxMatcher = new MatchDecorator({
  // 정규식: "- [ ]" 또는 "- [x]" (공백 포함)
  // 단순화를 위해 "- "로 시작하는 경우만 매칭
  regexp: /- \[([ x])\]/g,
  decoration: (match) => {
    const checked = match[1] === 'x';
    return Decoration.replace({
      widget: new CheckboxWidget(checked),
    });
  },
});

export const checkboxPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;
    constructor(view: EditorView) {
      this.decorations = checkboxMatcher.createDeco(view);
    }
    update(update: ViewUpdate) {
      this.decorations = checkboxMatcher.updateDeco(update, this.decorations);
    }
  },
  {
    decorations: (v) => v.decorations,
    provide: (plugin) =>
      EditorView.atomicRanges.of((view) => {
        return view.plugin(plugin)?.decorations || Decoration.none;
      }),
  }
);

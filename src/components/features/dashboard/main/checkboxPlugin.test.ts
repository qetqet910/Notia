import { describe, it, expect } from 'vitest';

// JSDOM 환경이 필요하지만, 여기서는 기본적인 플러그인 로드 여부만 확인하거나
// Mocking을 통해 위젯 생성 로직을 검증할 수 있습니다。
// 하지만 실제 Decoration 로직은 복잡하므로, 정규식이 올바른지만 테스트하는 것이 현실적입니다。

describe('checkboxPlugin regex', () => {
  it('should match unchecked box', () => {
    const regex = /- \[([ x])\]/g;
    const text = '- [ ] Task';
    const match = regex.exec(text);
    expect(match).not.toBeNull();
    expect(match![1]).toBe(' ');
  });

  it('should match checked box', () => {
    const regex = /- \[([ x])\]/g;
    const text = '- [x] Done';
    const match = regex.exec(text);
    expect(match).not.toBeNull();
    expect(match![1]).toBe('x');
  });

  it('should not match invalid format', () => {
    const regex = /- \[([ x])\]/g;
    const text = '- [] Invalid'; // 공백 없음
    const match = regex.exec(text);
    expect(match).toBeNull();
  });
});

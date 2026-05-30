import React from 'react';
import logoImage from '@/assets/images/Logo.png';

const NAV_ITEMS: [string, boolean][] = [
  ['노트', true],
  ['리마인더', false],
  ['캘린더', false],
];

const TAGS: [string, number][] = [
  ['업무', 12],
  ['회의록', 5],
];

const NOTES = [
  { title: '프로젝트 회의 메모', tags: ['업무', '회의록'], selected: true },
  { title: '아이디어 브레인스토밍', tags: ['아이디어'], selected: false },
  { title: '독서 메모 — 클린 코드', tags: ['독서'], selected: false },
];

export const AppPreview: React.FC = () => (
  <div
    style={{
      background: '#fff',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,.13)',
      border: '1px solid #E5E8EB',
      width: '100%',
      maxWidth: 480,
      fontSize: 12,
      userSelect: 'none',
    }}
  >
    {/* Header */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        borderBottom: '1px solid #E5E8EB',
        background: '#fff',
      }}
    >
      <img src={logoImage} height={18} alt="Notia" />
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span
          style={{
            background: '#e0f5f4',
            color: '#5cb8b2',
            padding: '2px 8px',
            borderRadius: 99,
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          + 새 노트
        </span>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: '#68C7C1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 10,
          }}
        >
          K
        </div>
      </div>
    </div>

    {/* Body */}
    <div style={{ display: 'flex', height: 280 }}>
      {/* Sidebar */}
      <div
        style={{
          width: 130,
          background: '#F9FAFB',
          borderRight: '1px solid #E5E8EB',
          padding: 8,
        }}
      >
        {NAV_ITEMS.map(([label, active]) => (
          <div
            key={label}
            style={{
              padding: '5px 8px',
              borderRadius: 8,
              background: active ? '#68C7C1' : 'transparent',
              color: active ? '#fff' : '#4E5968',
              fontWeight: active ? 600 : 400,
              fontSize: 11,
              marginBottom: 2,
            }}
          >
            {label}
          </div>
        ))}
        <div
          style={{
            marginTop: 10,
            borderTop: '1px solid #E5E8EB',
            paddingTop: 8,
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: '#8B95A1',
              marginBottom: 4,
              padding: '0 8px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            인기 태그
          </div>
          {TAGS.map(([tag, count]) => (
            <div
              key={tag}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '3px 8px',
                fontSize: 10,
                color: '#4E5968',
              }}
            >
              <span>#{tag}</span>
              <span
                style={{
                  background: '#E5E8EB',
                  borderRadius: 99,
                  padding: '0 5px',
                  fontSize: 9,
                }}
              >
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Note List */}
      <div style={{ width: 145, borderRight: '1px solid #E5E8EB' }}>
        <div
          style={{
            padding: '6px 8px',
            borderBottom: '1px solid #E5E8EB',
          }}
        >
          <div
            style={{
              background: '#F9FAFB',
              borderRadius: 7,
              padding: '3px 6px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: '#8B95A1',
              fontSize: 10,
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            노트 검색...
          </div>
        </div>
        {NOTES.map((note) => (
          <div
            key={note.title}
            style={{
              padding: 8,
              borderBottom: '1px solid #F9FAFB',
              background: note.selected ? '#e0f5f4' : '#fff',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                color: '#191F28',
                fontSize: 10,
                marginBottom: 3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {note.title}
            </div>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    background: '#e0f5f4',
                    color: '#5cb8b2',
                    padding: '1px 5px',
                    borderRadius: 99,
                    fontSize: 9,
                    fontWeight: 600,
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Editor Preview */}
      <div style={{ flex: 1, padding: 12, overflow: 'hidden' }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 13,
            color: '#191F28',
            marginBottom: 6,
            letterSpacing: '-0.02em',
          }}
        >
          프로젝트 회의 메모
        </div>
        <div
          style={{
            fontSize: 11,
            color: '#4E5968',
            lineHeight: 1.8,
          }}
        >
          오늘 회의에서 논의한 내용을 정리합니다.
          <br />
          <span style={{ color: '#68C7C1', fontWeight: 600 }}>
            #업무 #회의록
          </span>
          <br />
          <br />
          <strong style={{ color: '#191F28', fontSize: 11 }}>## 주요 안건</strong>
          <br />
          - UI 개선: 대시보드 최적화
          <br />
          - 백엔드 API 성능 리뷰
          <br />
          -{' '}
          <span
            style={{
              color: '#C2410C',
              background: '#FFF7ED',
              padding: '1px 4px',
              borderRadius: 3,
            }}
          >
            @내일 오후 3시 클라이언트 미팅.
          </span>
          <br />
          <br />
          <strong style={{ color: '#191F28', fontSize: 11 }}>## 다음 스프린트</strong>
          <br />
          - 모바일 반응형 작업 시작
        </div>
      </div>
    </div>
  </div>
);

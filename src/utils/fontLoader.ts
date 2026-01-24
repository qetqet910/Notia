type FontFaceSource = {
  href: string;
  weight?: string;
  style?: string;
};

type FontSource =
  | { type: 'css'; href: string }
  | { type: 'faces'; faces: FontFaceSource[] };

const FONT_ALIASES: Record<string, string> = {
  'Noto Sans KR': 'NotoSansKR',
  'NotoSansKR': 'NotoSansKR',
  'S-CoreDream': 'SCoreDream',
  'SCoreDream': 'SCoreDream',
  'ChosunGulim': 'ChosunGulim',
  'Nanum Gothic': 'NanumGothic',
  'NanumGothic': 'NanumGothic',
  'ISaManRu': 'ISaManRu',
  'Keris Kedu': 'KerisKedu',
  'KerisKedu': 'KerisKedu',
  'Gmarket Sans': 'GmarketSans',
  'GmarketSans': 'GmarketSans',
};

export const normalizeFontFamily = (family: string): string => {
  return FONT_ALIASES[family] ?? family;
};

const FONT_SOURCES: Record<string, FontSource> = {
  NotoSansKR: {
    type: 'css',
    href: 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-kr@5.2.5/index.css',
  },
  SCoreDream: {
    type: 'faces',
    faces: [
      {
        href: '/fonts/S-CoreDream-4Regular.woff',
        weight: '400',
      },
    ],
  },
  ChosunGulim: {
    type: 'faces',
    faces: [
      {
        href: '/fonts/ChosunGulim.ttf',
        weight: '400',
      },
    ],
  },
  NanumGothic: {
    type: 'faces',
    faces: [
      {
        href: '/fonts/NanumGothic-Regular.ttf',
        weight: '400',
      },
    ],
  },
  ISaManRu: {
    type: 'faces',
    faces: [
      {
        href: '/fonts/ISaManRu-Medium.ttf',
        weight: '400',
      },
    ],
  },
  KerisKedu: {
    type: 'faces',
    faces: [
      {
        href: '/fonts/KERISKEDU_Line.ttf',
        weight: '400',
      },
    ],
  },
  GmarketSans: {
    type: 'faces',
    faces: [
      {
        href: '/fonts/GmarketSansLight.woff',
        weight: '300',
      },
    ],
  },
};

const loadedFonts = new Set<string>();

const getFontFormat = (href: string): 'woff2' | 'woff' | 'truetype' | 'opentype' => {
  const lower = href.toLowerCase();
  if (lower.endsWith('.woff2')) {
    return 'woff2';
  }
  if (lower.endsWith('.woff')) {
    return 'woff';
  }
  if (lower.endsWith('.otf')) {
    return 'opentype';
  }
  return 'truetype';
};

export const loadFont = (family: string): Promise<void> => {
  const normalizedFamily = normalizeFontFamily(family);
  const source = FONT_SOURCES[normalizedFamily];
  if (!source || typeof document === 'undefined') {
    return Promise.resolve();
  }

  if (loadedFonts.has(normalizedFamily)) {
    return Promise.resolve();
  }

  if (source.type === 'css') {
    const existing = document.querySelector(`link[data-font-family="${normalizedFamily}"]`);
    if (existing) {
      loadedFonts.add(normalizedFamily);
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = source.href;
      link.setAttribute('data-font-family', normalizedFamily);
      link.onload = () => {
        loadedFonts.add(normalizedFamily);
        resolve();
      };
      link.onerror = () => reject(new Error(`Failed to load font CSS: ${normalizedFamily}`));
      document.head.appendChild(link);
    });
  }

  const existing = document.querySelector(`style[data-font-family="${normalizedFamily}"]`);
  if (existing) {
    loadedFonts.add(normalizedFamily);
    return Promise.resolve();
  }

  const style = document.createElement('style');
  style.setAttribute('data-font-family', normalizedFamily);
  style.textContent = source.faces
    .map((face) => {
      const fontWeight = face.weight ?? '400';
      const fontStyle = face.style ?? 'normal';
      const fontFormat = getFontFormat(face.href);
      return `
@font-face {
  font-family: '${normalizedFamily}';
  src: url('${face.href}') format('${fontFormat}');
  font-weight: ${fontWeight};
  font-style: ${fontStyle};
  font-display: swap;
}
`;
    })
    .join('\n');
  document.head.appendChild(style);
  loadedFonts.add(normalizedFamily);
  return Promise.resolve();
};

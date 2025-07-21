
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: ["dist", "node_modules", ".vite-cache", ".devcontainer", ".vscode", "public"]
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: { 
      globals: {
        ...globals.browser,
        ...globals.node
      } 
    },
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{jsx,tsx}'],
    plugins: {
      react: pluginReact,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...pluginReact.configs.recommended.rules,
      'react/prop-types': 'off', // TypeScript를 사용하므로 prop-types는 필요 없습니다.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/react-in-jsx-scope': 'off'
    },
  }
);

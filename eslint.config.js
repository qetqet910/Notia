import { defineConfig } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';
import { reactHooks } from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';

export default defineConfig([
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'],
    plugins: { reactHooks, js },
    extends: ['airbnb-base', 'prettier'],
    rules: {
      'react-hooks/rules-of-hooks': 'error', // Checks rules of Hooks
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
]);

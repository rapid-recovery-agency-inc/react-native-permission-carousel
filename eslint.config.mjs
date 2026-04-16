import js from '@eslint/js';
import globals from 'globals';
import tseslint from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import pluginReact from 'eslint-plugin-react';

let rraEslintPlugin = null;

try {
  const maybeModule = await import('@rapid-recovery-agency-inc/eslint-plugin-rra');
  rraEslintPlugin = maybeModule?.default ?? maybeModule;
} catch {
  rraEslintPlugin = null;
}

export default [
  ...(rraEslintPlugin?.configs?.react ?? []),
  {
    ignores: ['public/**', '.cache/**', 'node_modules/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: {
      js,
    },
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        JSX: 'readonly',
        React: 'readonly',
        NodeJS: 'readonly',
      },
    },
  },
  {
    files: ['**/*.{ts,mts,cts,tsx}'],
    plugins: {
      '@typescript-eslint': tseslint,
    },
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      'no-console': 'error',
      'no-nested-ternary': 'error',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'rra-conventions/filename-convention': 'off',
      'rra-conventions/react-naming-convention': 'off',
      'rra-conventions/react-logic-restriction': 'off',
      '@typescript-eslint/no-extra-semi': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/no-duplicate-enum-values': 'off',
    },
  },
  pluginReact.configs.flat.recommended,
  {
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    rules: {
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx,js,jsx}', '**/*.spec.{ts,tsx,js,jsx}', '**/__tests__/**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: {
        vi: 'readonly',
        jest: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        test: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        waitFor: 'readonly',
      },
    },
    rules: {},
  },
  {
    files: ['**/*.test.{ts,tsx}', '**/*.tests.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      'rra-conventions/filename-convention': 'error',
      'rra-conventions/react-naming-convention': 'error',
      'rra-conventions/react-logic-restriction': 'error',
    },
  },
];

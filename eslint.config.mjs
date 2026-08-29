/**
 * ESLint flat config — eslintrc is not supported by ESLint 10 at all, so this
 * migration came with the upgrade rather than by choice.
 *
 * Flat config has no `--ext`. The `files` patterns below are what make
 * `eslint src` look at TypeScript at all; without them the run matches only the
 * default JS extensions and reports success having linted nothing.
 */
import js from '@eslint/js';
import globals from 'globals';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

const SOURCE = ['**/*.{ts,tsx}'];

export default [
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },

  { files: SOURCE, ...js.configs.recommended },
  ...tsPlugin.configs['flat/recommended'].map((c) => ({ ...c, files: SOURCE })),
  { files: SOURCE, ...reactPlugin.configs.flat.recommended },
  { files: SOURCE, ...jsxA11y.flatConfigs.recommended },
  { files: SOURCE, ...importPlugin.flatConfigs.recommended },

  {
    files: SOURCE,
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 12,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.node, ...globals.es2020 }
    },
    // react-hooks is still v4, which ships no flat config export — register the
    // plugin by hand and spread its recommended rules, which are a plain object.
    plugins: { 'react-hooks': reactHooks },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: { alwaysTryTypes: true },
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] }
      }
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      'react/jsx-uses-react': 0,
      'react/react-in-jsx-scope': 0,
      'react/prop-types': 0,
      'import/no-unresolved': [
        'error',
        {
          ignore: [
            '^@reduxjs/toolkit$',
            '^@sentry/react$',
            'dompurify',
            '^@reduxjs/toolkit/query$',
            '^@reduxjs/toolkit/query/react$',
            'recharts',
            // exports-field package the node resolver can't parse (e2e isn't in
            // the typescript-resolver tsconfig); same treatment as the above.
            '^@axe-core/playwright$',
            // exports-field package: resolves locally but Codacy's no-install
            // sandbox can't parse it (same class as the entries above).
            '^react-hook-form$',
            // katex/dist/katex.min.css (#207): the CSS subpath resolves through
            // katex's conditional `exports` map, which Codacy's no-install
            // no-unresolved resolver can't follow. Local lint passes off `main`.
            '^katex/'
          ]
        }
      ]
    }
  },

  { files: SOURCE, ...prettierRecommended },

  {
    // Root-level build configs are CommonJS by design — webpack-cli, jest and
    // babel all load them through require(). The TypeScript rule steering code
    // toward `import` does not apply. Both rule names are listed because local
    // typescript-eslint calls it `no-require-imports` while Codacy bundles an
    // older plugin that still calls it `no-var-requires`; setting an absent
    // rule to "off" is a no-op.
    files: ['webpack.config.js', 'jest.config.js', 'babel.config.test.js'],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off'
    }
  }
];

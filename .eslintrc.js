module.exports = {
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['@typescript-eslint'],
  overrides: [
    {
      // Root-level build configs are CommonJS by design — webpack-cli, jest and
      // babel all load them through require(). The TypeScript rule steering code
      // toward `import` does not apply to them.
      //
      // Both rule names are listed on purpose: local typescript-eslint reports
      // this as `no-require-imports`, while Codacy bundles an older plugin that
      // still calls it `no-var-requires`. Setting an absent rule to "off" is a
      // no-op, so each tool matches whichever name it knows. Local lint never
      // sees these files (`eslint src --ext .ts,.tsx`); Codacy lints .js too.
      files: ['webpack.config.js', 'jest.config.js', 'babel.config.test.js'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off',
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ],
  rules: {
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
  },
  settings: {
    react: {
      version: 'detect'
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx']
      }
    }
  }
};

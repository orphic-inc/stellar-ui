module.exports = {
  env: {
    browser: true,
    es2020: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:@typescript-eslint/recommended'
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
          'dompurify',
          '^@reduxjs/toolkit/query$',
          '^@reduxjs/toolkit/query/react$'
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

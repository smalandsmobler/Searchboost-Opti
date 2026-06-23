module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // No console.log in production
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    // Enforce explicit return types on exported functions
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    // No unused vars (except _-prefixed)
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    // Avoid `any`
    '@typescript-eslint/no-explicit-any': 'warn',
    // React 17+ no need to import React
    'react/react-in-jsx-scope': 'off',
    // Immutable updates: warn on mutation patterns
    'no-param-reassign': ['error', { props: true }],
    // Anti-slop: large files signal refactor
    'max-lines': ['warn', { max: 400, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['warn', { max: 80, skipBlankLines: true }],
    // Hooks deps strict
    'react-hooks/exhaustive-deps': 'warn',
  },
  ignorePatterns: ['.next/', 'node_modules/', 'public/', 'out/'],
};

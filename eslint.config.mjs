import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...nextCoreWebVitals,
  {
    rules: {
      // Catch variables used where they aren't defined (e.g. `t` from
      // useTranslation used in a component that never called the hook),
      // which otherwise only shows up as a client-side crash in production.
      'no-undef': 'error',
      // React Compiler advisory rules (new in eslint-plugin-react-hooks v6).
      // Surfaced as warnings so they can be cleaned up gradually without
      // blocking CI; real bugs (rules-of-hooks, jsx-no-undef, ...) stay errors.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-hooks/refs': 'warn',
      'react/display-name': 'warn',
      '@next/next/no-assign-module-variable': 'warn',
      // Apostrophes/quotes in JSX text render fine
      'react/no-unescaped-entities': 'off',
    },
  },
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'build/**',
      'public/**',
      '_to_delete/**',
      'backups/**',
      'Claude outputs/**',
      'test-fixtures/**',
    ],
  },
];

export default eslintConfig;

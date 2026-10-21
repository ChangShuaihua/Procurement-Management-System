import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', 'pnpm-lock.yaml'],
  },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    files: ['packages/db/src/database.ts'],
    rules: {
      // Supabase only accepts this generated shape. Interface rows and Record
      // views collapse inserts to `never`.
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
    },
  },
)

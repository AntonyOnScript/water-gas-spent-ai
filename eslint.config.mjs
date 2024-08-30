import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        rules: {
            semi: ['error', 'never'],
            'no-unused-vars': ['error'],
            'no-prototype-builtins': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            quotes: ['error', 'single', { avoidEscape: true }],
        },
    },
    eslintConfigPrettier
)

import { zLintReactDefaultConfig } from '@zenflux/eslint';

const config = zLintReactDefaultConfig( [ "**/*.{ts,tsx}" ], [ "." ], { tsconfigRootDir: import.meta.dirname } );

export default config;

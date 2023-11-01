import { defaults, tests } from "@zenflux/eslint";

/** @type {import("eslint").Linter.FlatConfig[]} */
const config = [
    ...defaults,
    ...tests,
];

export default config;

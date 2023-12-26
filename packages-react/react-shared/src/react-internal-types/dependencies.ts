/* eslint-disable no-restricted-imports */
import type { ContextDependency } from "./context";
import type { Lanes } from "./lanes";

export type Dependencies = {
    lanes: Lanes;
    firstContext: ContextDependency<unknown> | null;
};

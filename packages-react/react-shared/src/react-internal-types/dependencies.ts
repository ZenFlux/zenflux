
import type { ContextDependency } from "@zenflux/react-shared/src/react-internal-types/context";
import type { Lanes } from "@zenflux/react-shared/src/react-internal-types/lanes";

export type Dependencies = {
    lanes: Lanes;
    firstContext: ContextDependency<unknown> | null;
};

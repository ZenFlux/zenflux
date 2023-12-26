/* eslint-disable no-restricted-imports */

import type { Transition, TransitionAbort } from "./transition";
import type { PendingBoundaries } from "./boundaries";

import type { TracingMarkerTag } from "@zenflux/react-shared/src/react-internal-constants/transition";

// TODO: Is there a way to not include the tag or name here?
export type TracingMarkerInstance = {
    tag?: TracingMarkerTag;
    transitions: Set<Transition> | null;
    pendingBoundaries: PendingBoundaries | null;
    aborts: Array<TransitionAbort> | null;
    name: string | null;
};

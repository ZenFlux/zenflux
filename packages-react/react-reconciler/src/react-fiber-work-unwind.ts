import { resetContextDependencies } from "@zenflux/react-reconciler/src/react-fiber-new-context";
import { resetHooksOnUnwind } from "@zenflux/react-reconciler/src/react-fiber-hooks-unwind";
import { resetChildReconcilerOnUnwind } from "@zenflux/react-reconciler/src/react-fiber-child-rest-reconciler-on-unwind";

import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

export function resetSuspendedWorkLoopOnUnwind( fiber: Fiber ) {
    // Reset module-level state that was set during the render phase.
    resetContextDependencies();
    resetHooksOnUnwind( fiber );
    resetChildReconcilerOnUnwind();
}


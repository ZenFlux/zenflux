
import { ConcurrentRoot } from "@zenflux/react-shared/src/react-internal-constants/root-tags";

import { attachPingListener } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-ping";
import { renderDidSuspendDelayIfPossible } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-render-did";

import type { Wakeable } from "@zenflux/react-shared/src/react-types";
import type { FiberRoot, Lanes } from "@zenflux/react-shared/src/react-internal-types";

export function handleSuspenseNoBoundary(
    root: FiberRoot,
    wakeable: Wakeable,
    rootRenderLanes: Lanes,
) {
    let result;

    // No boundary was found. Unless this is a sync update, this is OK.
    // We can suspend and wait for more data to arrive.
    if ( root.tag === ConcurrentRoot ) {
        // In a concurrent root, suspending without a Suspense boundary is
        // allowed. It will suspend indefinitely without committing.
        //
        // TODO: Should we have different behavior for discrete updates? What
        // about flushSync? Maybe it should put the tree into an inert state,
        // and potentially log a warning. Revisit this for a future release.
        attachPingListener( root, wakeable, rootRenderLanes );
        renderDidSuspendDelayIfPossible();
    } else {
        // In a legacy root, suspending without a boundary is always an error.
        result = new Error( "A component suspended while responding to synchronous input. This " + "will cause the UI to be replaced with a loading indicator. To " + "fix, updates that suspend should be wrapped " + "with startTransition." );
    }

    return result;
}

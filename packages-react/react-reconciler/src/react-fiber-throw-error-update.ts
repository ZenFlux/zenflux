import { SyncLane } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { CaptureUpdate, createUpdate } from "@zenflux/react-reconciler/src/react-fiber-class-update-queue";

import { logCapturedError } from "@zenflux/react-reconciler/src/react-fiber-error-logger";
import { markFailedErrorBoundaryForHotReloading } from "@zenflux/react-reconciler/src/react-fiber-hot-reloading-error-boundray";
import { markLegacyErrorBoundaryAsFailed } from "@zenflux/react-reconciler/src/react-fiber-work-legacy-error-boundary";
import { includesSomeLane } from "@zenflux/react-reconciler/src/react-fiber-lane";
import { onUncaughtError } from "@zenflux/react-reconciler/src/react-fiber-throw-uncaught-error";
import reactGetComponentNameFromFiber from "@zenflux/react-reconciler/src/react-get-component-name-from-fiber";

import type { CapturedValue } from "@zenflux/react-reconciler/src/react-captured-value";
import type { Fiber, FiberUpdate, Lane } from "@zenflux/react-shared/src/react-internal-types";

export function createRootErrorUpdate( fiber: Fiber, errorInfo: CapturedValue<unknown>, lane: Lane ): FiberUpdate<unknown> {
    const update = createUpdate( lane );
    // Unmount the root by rendering null.
    update.tag = CaptureUpdate;
    // Caution: React DevTools currently depends on this property
    // being called "element".
    update.payload = {
        element: null
    };
    const error = errorInfo.value;

    update.callback = () => {
        onUncaughtError( error );
        logCapturedError( fiber, errorInfo );
    };

    return update;
}

export function createClassErrorUpdate( fiber: Fiber, errorInfo: CapturedValue<unknown>, lane: Lane ): FiberUpdate<unknown> {
    const update = createUpdate( lane );
    update.tag = CaptureUpdate;
    const getDerivedStateFromError = fiber.type.getDerivedStateFromError;

    if ( typeof getDerivedStateFromError === "function" ) {
        const error = errorInfo.value;

        update.payload = () => {
            return getDerivedStateFromError( error );
        };

        update.callback = () => {
            if ( __DEV__ ) {
                markFailedErrorBoundaryForHotReloading( fiber );
            }

            logCapturedError( fiber, errorInfo );
        };
    }

    const inst = fiber.stateNode;

    if ( inst !== null && typeof inst.componentDidCatch === "function" ) {
        // $FlowFixMe[missing-this-annot]
        update.callback = function callback() {
            if ( __DEV__ ) {
                markFailedErrorBoundaryForHotReloading( fiber );
            }

            logCapturedError( fiber, errorInfo );

            if ( typeof getDerivedStateFromError !== "function" ) {
                // To preserve the preexisting retry behavior of error boundaries,
                // we keep track of which ones already failed during this batch.
                // This gets reset before we yield back to the browser.
                // TODO: Warn in strict mode if getDerivedStateFromError is
                // not defined.
                markLegacyErrorBoundaryAsFailed( this );
            }

            const error = errorInfo.value;
            const stack = errorInfo.stack;
            // @ts-ignore
            this.componentDidCatch?.( /*<Error>*/ error, {
                componentStack: stack !== null ? stack : ""
            } );

            if ( __DEV__ ) {
                if ( typeof getDerivedStateFromError !== "function" ) {
                    // If componentDidCatch is the only error boundary method defined,
                    // then it needs to call setState to recover from errors.
                    // If no state update is scheduled then the boundary will swallow the error.
                    if ( ! includesSomeLane( fiber.lanes, ( SyncLane as Lane ) ) ) {
                        console.error( "%s: Error boundaries should implement getDerivedStateFromError(). " + "In that method, return a state update to display an error message or fallback UI.", reactGetComponentNameFromFiber( fiber ) || "Unknown" );
                    }
                }
            }
        };
    }

    return update;
}

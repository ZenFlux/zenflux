import { enableAsyncActions, enableFormActions } from "@zenflux/react-shared/src/react-feature-flags";

import { readContext } from "@zenflux/react-reconciler/src/react-fiber-new-context";
import { HostTransitionContext } from "@zenflux/react-reconciler/src/react-fiber-host-context";

import type { TransitionStatus } from "@zenflux/react-shared/src/react-internal-types/transition";

export function useHostTransitionStatus(): TransitionStatus {
    if ( ! ( enableFormActions && enableAsyncActions ) ) {
        throw new Error( "Not implemented." );
    }

    const status: TransitionStatus | null = readContext( HostTransitionContext );
    return status !== null ? status : globalThis.__RECONCILER__CONFIG__.NotPendingTransition;
}

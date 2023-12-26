import { enableAsyncActions, enableFormActions } from "@zenflux/react-shared/src/react-feature-flags";

import ReactSharedInternals from "@zenflux/react-shared/src/react-shared-internals";

import type { Dispatcher } from "@zenflux/react-shared/src/react-internal-types";

const ReactCurrentDispatcher = ReactSharedInternals.ReactCurrentDispatcher;
type FormStatusNotPending = {
    pending: false;
    data: null;
    method: null;
    action: null;
};
type FormStatusPending = {
    pending: true;
    data: FormData;
    method: string;
    action: string | ( ( arg0: FormData ) => void | Promise<void> );
};
export type FormStatus = FormStatusPending | FormStatusNotPending;
// Since the "not pending" value is always the same, we can reuse the
// same object across all transitions.
const sharedNotPendingObject = {
    pending: false,
    data: null,
    method: null,
    action: null
};
// @ts-ignore
export const NotPending: FormStatus = __DEV__ ? Object.freeze( sharedNotPendingObject ) : sharedNotPendingObject;

function resolveDispatcher() {
    // Copied from react/src/ReactHooks.js. It's the same thing but in a
    // different package.
    const dispatcher = ReactCurrentDispatcher.current;

    if ( __DEV__ ) {
        if ( dispatcher === null ) {
            console.error( "Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for" + " one of the following reasons:\n" + "1. You might have mismatching versions of React and the renderer (such as React DOM)\n" + "2. You might be breaking the Rules of Hooks\n" + "3. You might have more than one copy of React in the same app\n" + "See https://reactjs.org/link/invalid-hook-call for tips about how to debug and fix this problem." );
        }
    }

    // Will result in a null access error if accessed outside render phase. We
    // intentionally don't throw our own error because this is in a hot path.
    // Also helps ensure this is inlined.
    return ( ( dispatcher as any ) as Dispatcher );
}

export function useFormStatus(): FormStatus {
    if ( ! ( enableFormActions && enableAsyncActions ) ) {
        throw new Error( "Not implemented." );
    } else {
        const dispatcher = resolveDispatcher();
        // $FlowFixMe[not-a-function] We know this exists because of the feature check above.
        // @ts-ignore
        return dispatcher.useHostTransitionStatus();
    }
}

export function useFormState<S, P>( action: ( arg0: Awaited<S>, arg1: P ) => S, initialState: Awaited<S>, permalink?: string ): [ Awaited<S>, ( arg0: P ) => void ] {
    if ( ! ( enableFormActions && enableAsyncActions ) ) {
        throw new Error( "Not implemented." );
    } else {
        const dispatcher = resolveDispatcher();
        // $FlowFixMe[not-a-function] This is unstable, thus optional
        // @ts-ignore
        return dispatcher.useFormState( action, initialState, permalink );
    }
}

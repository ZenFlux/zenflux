
import { NoLane } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { requestTransitionLane } from "@zenflux/react-reconciler/src/react-fiber-root-scheduler";

import type {
    FulfilledThenable,
    PendingThenable,
    RejectedThenable,
    Thenable
} from "@zenflux/react-shared/src/react-types";
import type { Lane } from "@zenflux/react-shared/src/react-internal-types";

// If there are multiple, concurrent async actions, they are entangled. All
// transition updates that occur while the async action is still in progress
// are treated as part of the action.
//
// The ideal behavior would be to treat each async function as an independent
// action. However, without a mechanism like AsyncContext, we can't tell which
// action an update corresponds to. So instead, we entangle them all into one.
// The listeners to notify once the entangled scope completes.
let currentEntangledListeners: Array<() => unknown> | null = null;
// The number of pending async actions in the entangled scope.
let currentEntangledPendingCount: number = 0;
// The transition lane shared by all updates in the entangled scope.
let currentEntangledLane: Lane = NoLane;

export function requestAsyncActionContext<S>( actionReturnValue: Thenable<any>, // If this is provided, this resulting thenable resolves to this value instead
    // of the return value of the action. This is a perf trick to avoid composing
    // an extra async function.
    overrideReturnValue: S | null ): Thenable<S> {
    // This is an async action.
    //
    // Return a thenable that resolves once the action scope (i.e. the async
    // function passed to startTransition) has finished running.
    const thenable: Thenable<S> = ( actionReturnValue as any );
    let entangledListeners;

    if ( currentEntangledListeners === null ) {
        // There's no outer async action scope. Create a new one.
        entangledListeners = currentEntangledListeners = [];
        currentEntangledPendingCount = 0;
        currentEntangledLane = requestTransitionLane();
    } else {
        entangledListeners = currentEntangledListeners;
    }

    currentEntangledPendingCount++;
    // Create a thenable that represents the result of this action, but doesn't
    // resolve until the entire entangled scope has finished.
    //
    // Expressed using promises:
    //   const [thisResult] = await Promise.all([thisAction, entangledAction]);
    //   return thisResult;
    const resultThenable = createResultThenable<S>( entangledListeners );
    let resultStatus = "pending";
    let resultValue: S;
    let rejectedReason: unknown;
    thenable.then( ( value: S ) => {
        resultStatus = "fulfilled";
        resultValue = overrideReturnValue !== null ? overrideReturnValue : value;
        pingEngtangledActionScope();
    }, error => {
        resultStatus = "rejected";
        rejectedReason = error;
        pingEngtangledActionScope();
    } );
    // Attach a listener to fill in the result.
    entangledListeners.push( () => {
        switch ( resultStatus ) {
            case "fulfilled": {
                const fulfilledThenable: FulfilledThenable<S> = ( resultThenable as any );
                fulfilledThenable.status = "fulfilled";
                fulfilledThenable.value = resultValue;
                break;
            }

            case "rejected": {
                const rejectedThenable: RejectedThenable<S> = ( resultThenable as any );
                rejectedThenable.status = "rejected";
                rejectedThenable.reason = rejectedReason;
                break;
            }

            case "pending":
            default: {
                // The listener above should have been called first, so `resultStatus`
                // should already be set to the correct value.
                throw new Error( "Thenable should have already resolved. This " + "is a bug in React." );
            }
        }
    } );
    return resultThenable;
}

export function requestSyncActionContext<S>( actionReturnValue: any, // If this is provided, this resulting thenable resolves to this value instead
    // of the return value of the action. This is a perf trick to avoid composing
    // an extra async function.
    overrideReturnValue: S | null ): Thenable<S> | S {
    const resultValue: S = overrideReturnValue !== null ? overrideReturnValue : ( actionReturnValue as any );

    // This is not an async action, but it may be part of an outer async action.
    if ( currentEntangledListeners === null ) {
        return resultValue;
    } else {
        // Return a thenable that does not resolve until the entangled actions
        // have finished.
        const entangledListeners = currentEntangledListeners;
        const resultThenable = createResultThenable<S>( entangledListeners );
        entangledListeners.push( () => {
            const fulfilledThenable: FulfilledThenable<S> = ( resultThenable as any );
            fulfilledThenable.status = "fulfilled";
            fulfilledThenable.value = resultValue;
        } );
        return resultThenable;
    }
}

function pingEngtangledActionScope() {
    if ( currentEntangledListeners !== null && --currentEntangledPendingCount === 0 ) {
        // All the actions have finished. Close the entangled async action scope
        // and notify all the listeners.
        const listeners = currentEntangledListeners;
        currentEntangledListeners = null;
        currentEntangledLane = NoLane;

        for ( let i = 0 ; i < listeners.length ; i++ ) {
            const listener = listeners[ i ];
            listener();
        }
    }
}

function createResultThenable<S>( entangledListeners: Array<() => unknown> ): Thenable<S> {
    // Waits for the entangled async action to complete, then resolves to the
    // result of an individual action.
    const resultThenable: PendingThenable<S> = {
        status: "pending",

        // TODO: This is a mistake?
        // value: null,
        // reason: null,

        then( resolve: ( arg0: S ) => unknown ) {
            // This is a bit of a cheat. `resolve` expects a value of type `S` to be
            // passed, but because we're instrumenting the `status` field ourselves,
            // and we know this thenable will only be used by React, we also know
            // the value isn't actually needed. So we add the resolve function
            // directly to the entangled listeners.
            //
            // This is also why we don't need to check if the thenable is still
            // pending; the Suspense implementation already performs that check.
            const ping: () => unknown = ( resolve as any );
            entangledListeners.push( ping );
        }

    };
    return resultThenable;
}

export function peekEntangledActionLane(): Lane {
    return currentEntangledLane;
}

import { mountWorkInProgressHook, updateWorkInProgressHook } from "@zenflux/react-reconciler/src/react-fiber-hooks-infra";
import { isExecutionContextRenderDeactivate } from "@zenflux/react-reconciler/src/react-fiber-work-excution-context";
import { useEffectEventImpl } from "@zenflux/react-reconciler/src/react-fiber-hooks-use-effect";

function isInvalidExecutionContextForEventFunction(): boolean {
    // Used to throw if certain APIs are called from the wrong context.
    return isExecutionContextRenderDeactivate();
}

export function mountEvent<T extends Function>( callback: T ): T {
    const hook = mountWorkInProgressHook();
    const ref = {
        impl: callback
    };
    hook.memoizedState = ref;
    // $FlowIgnore[incompatible-return]
    return function eventFn() {
        if ( isInvalidExecutionContextForEventFunction() ) {
            throw new Error( "A function wrapped in useEffectEvent can't be called during rendering." );
        }

        return ref.impl.apply( undefined, arguments );
    } as unknown as T;
}

export function updateEvent<T extends Function>( callback: T ): T {
    const hook = updateWorkInProgressHook();
    const ref = hook.memoizedState;
    useEffectEventImpl( {
        ref,
        nextImpl: callback as any
    } );
    // $FlowIgnore[incompatible-return]
    return function eventFn() {
        if ( isInvalidExecutionContextForEventFunction() ) {
            throw new Error( "A function wrapped in useEffectEvent can't be called during rendering." );
        }

        return ref.impl.apply( undefined, arguments );
    } as unknown as T;
}

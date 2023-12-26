import { getWorkInProgressRoot } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";

import { isHydrating } from "@zenflux/react-reconciler/src/react-fiber-hydration-is-hydrating";
import { getTreeId } from "@zenflux/react-reconciler/src/react-fiber-tree-context";
import { ReactFiberHooksCurrent, ReactFiberHooksGlobals } from "@zenflux/react-reconciler/src/react-fiber-hooks-shared";
import {
    mountWorkInProgressHook,
    updateWorkInProgressHook
} from "@zenflux/react-reconciler/src/react-fiber-hooks-infra";

import type { FiberRoot } from "@zenflux/react-shared/src/react-internal-types";

export function mountId(): string {
    const hook = mountWorkInProgressHook();
    const root = ( ( getWorkInProgressRoot() as any ) as FiberRoot );
    // TODO: In Fizz, id generation is specific to each server config. Maybe we
    // should do this in Fiber, too? Deferring this decision for now because
    // there's no other place to store the prefix except for an internal field on
    // the public createRoot object, which the fiber tree does not currently have
    // a reference to.
    const identifierPrefix = root.identifierPrefix;
    let id;

    if ( isHydrating() ) {
        const treeId = getTreeId();
        // Use a captial R prefix for server-generated ids.
        id = ":" + identifierPrefix + "R" + treeId;
        // Unless this is the first id at this level, append a number at the end
        // that represents the position of this useId hook among all the useId
        // hooks for this fiber.
        const localId = ReactFiberHooksCurrent.localIdCounter++;

        if ( localId > 0 ) {
            id += "H" + localId.toString( 32 );
        }

        id += ":";
    } else {
        // Use a lowercase r prefix for client-generated ids.
        const globalClientId = ReactFiberHooksGlobals.clientIdCounter++;
        id = ":" + identifierPrefix + "r" + globalClientId.toString( 32 ) + ":";
    }

    hook.memoizedState = id;
    return id;
}

export function updateId(): string {
    const hook = updateWorkInProgressHook();
    const id: string = hook.memoizedState;
    return id;
}

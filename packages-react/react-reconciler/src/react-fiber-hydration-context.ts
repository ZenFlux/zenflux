import {
    enableClientRenderFallbackOnTextMismatch,
    enableHostSingletons
} from "@zenflux/react-shared/src/react-feature-flags";

import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";
import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";
import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import { restoreSuspendedTreeContext } from "@zenflux/react-reconciler/src/react-fiber-tree-context";

import { createFiberFromHostInstanceForDeletion } from "@zenflux/react-reconciler/src/react-fiber";

import {
    freeHydrating,
    isHydrating,
    markHydrating
} from "@zenflux/react-reconciler/src/react-fiber-hydration-is-hydrating";
import {
    clearDidThrowWhileHydratingDEV,
    didntSuspendOrErrorWhileHydratingDEV,
} from "@zenflux/react-reconciler/src/react-fiber-hydration-did-suspend-on-error";
import {
    clearHydrationErrors,
    getHydrationErrorsSafe,
    hasHydrationErrors
} from "@zenflux/react-reconciler/src/react-fiber-hydration-error";
import {
    clearHydrationParentFiber,
    getHydrationParentFiber,
    getHydrationParentFiberSafe,
    hasHydrationParentFiber,
    setHydrationParentFiber
} from "@zenflux/react-reconciler/src/react-fiber-hydration-context-parent";
import {
    clearNextHydratableInstance,
    getNextHydratableInstance,
    hasNextHydratableInstance,
    setNextHydratableInstance
} from "@zenflux/react-reconciler/src/react-fiber-hydration-context-next-instance";
import {
    clearRootOrSingletonContextFlag,
    setRootOrSingletonContextFlag
} from "@zenflux/react-reconciler/src/react-fiber-hydration-context-root-or-singleton";
import {
    shouldClientRenderOnMismatch,
    throwOnHydrationMismatch
} from "@zenflux/react-reconciler/src/react-fiber-hydration-context-mismatch";
import { queueRecoverableErrors } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";

import type { SuspenseInstance } from "@zenflux/react-shared/src/react-internal-types/suspense";

import type { TreeContext } from "@zenflux/react-reconciler/src/react-fiber-tree-context";

import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";
import type { SuspenseState } from "@zenflux/react-reconciler/src/react-fiber-suspense-component";
import type {
    Container,
    HostContext,
    HydratableInstance,
    Instance,
    TextInstance
} from "@zenflux/react-reconciler/src/react-fiber-config";

const {
    didNotHydrateInstance,
    didNotHydrateInstanceWithinContainer,
    didNotHydrateInstanceWithinSuspenseInstance,
    didNotMatchHydratedContainerTextInstance,
    didNotMatchHydratedTextInstance,
    getFirstHydratableChildWithinContainer,
    getFirstHydratableChildWithinSuspenseInstance,
    getNextHydratableInstanceAfterSuspenseInstance,
    getNextHydratableSibling,
    hydrateInstance,
    hydrateSuspenseInstance,
    hydrateTextInstance,
    shouldDeleteUnhydratedTailInstances,
    shouldSetTextContent,
    supportsHydration,
    supportsSingletons
} = globalThis.__RECONCILER__CONFIG__;

function warnIfHydrating() {
    if ( __DEV__ ) {
        if ( isHydrating() ) {
            console.error( "We should not be hydrating here. This is a bug in React. Please file a bug." );
        }
    }
}

function enterHydrationState( fiber: Fiber ): boolean {
    if ( ! supportsHydration ) {
        return false;
    }

    const parentInstance: Container = fiber.stateNode.containerInfo;

    setNextHydratableInstance( getFirstHydratableChildWithinContainer( parentInstance ) );
    setHydrationParentFiber( fiber );
    markHydrating();
    clearHydrationErrors();
    clearDidThrowWhileHydratingDEV();
    setRootOrSingletonContextFlag();

    return true;
}

function reenterHydrationStateFromDehydratedSuspenseInstance( fiber: Fiber, suspenseInstance: SuspenseInstance, treeContext: TreeContext | null ): boolean {
    if ( ! supportsHydration ) {
        return false;
    }

    setNextHydratableInstance( getFirstHydratableChildWithinSuspenseInstance( suspenseInstance ) );
    setHydrationParentFiber( fiber );
    markHydrating();
    clearHydrationErrors();
    clearDidThrowWhileHydratingDEV();
    clearRootOrSingletonContextFlag();

    if ( treeContext !== null ) {
        restoreSuspendedTreeContext( fiber, treeContext );
    }

    return true;
}

function warnUnhydratedInstance( returnFiber: Fiber, instance: HydratableInstance ) {
    if ( __DEV__ ) {
        switch ( returnFiber.tag ) {
            case WorkTag.HostRoot: {
                didNotHydrateInstanceWithinContainer( returnFiber.stateNode.containerInfo, instance );
                break;
            }

            case WorkTag.HostSingleton:
            case WorkTag.HostComponent: {
                const isConcurrentMode = ( returnFiber.mode & TypeOfMode.ConcurrentMode ) !== TypeOfMode.NoMode;
                didNotHydrateInstance(
                    returnFiber.type,
                    returnFiber.memoizedProps,
                    returnFiber.stateNode,
                    instance, // TODO: Delete this argument when we remove the legacy root API.
                    isConcurrentMode
                );
                break;
            }

            case WorkTag.SuspenseComponent: {
                const suspenseState: SuspenseState = returnFiber.memoizedState;
                if ( suspenseState.dehydrated !== null ) didNotHydrateInstanceWithinSuspenseInstance( suspenseState.dehydrated, instance );
                break;
            }
        }
    }
}

export function deleteHydratableInstance( returnFiber: Fiber, instance: HydratableInstance ) {
    warnUnhydratedInstance( returnFiber, instance );
    const childToDelete = createFiberFromHostInstanceForDeletion();
    childToDelete.stateNode = instance;
    childToDelete.return = returnFiber;
    const deletions = returnFiber.deletions;

    if ( deletions === null ) {
        returnFiber.deletions = [ childToDelete ];
        returnFiber.flags |= FiberFlags.ChildDeletion;
    } else {
        deletions.push( childToDelete );
    }
}

function prepareToHydrateHostInstance( fiber: Fiber, hostContext: HostContext ): void {
    if ( ! supportsHydration ) {
        throw new Error( "Expected prepareToHydrateHostInstance() to never be called. " + "This error is likely caused by a bug in React. Please file an issue." );
    }

    const instance: Instance = fiber.stateNode;
    const shouldWarnIfMismatchDev = didntSuspendOrErrorWhileHydratingDEV();
    hydrateInstance( instance, fiber.type, fiber.memoizedProps, hostContext, fiber, shouldWarnIfMismatchDev );
}

function prepareToHydrateHostTextInstance( fiber: Fiber ): boolean {
    if ( ! supportsHydration ) {
        throw new Error( "Expected prepareToHydrateHostTextInstance() to never be called. " + "This error is likely caused by a bug in React. Please file an issue." );
    }

    const textInstance: TextInstance = fiber.stateNode;
    const textContent: string = fiber.memoizedProps;
    const shouldWarnIfMismatchDev = didntSuspendOrErrorWhileHydratingDEV();
    const shouldUpdate = hydrateTextInstance( textInstance, textContent, fiber, shouldWarnIfMismatchDev );

    if ( shouldUpdate ) {
        // We assume that prepareToHydrateHostTextInstance is called in a context where the
        // hydration parent is the parent host component of this host text.
        const returnFiber = getHydrationParentFiber();

        if ( returnFiber !== null ) {
            switch ( returnFiber.tag ) {
                case WorkTag.HostRoot: {
                    const parentContainer = returnFiber.stateNode.containerInfo;
                    const isConcurrentMode = ( returnFiber.mode & TypeOfMode.ConcurrentMode ) !== TypeOfMode.NoMode;
                    didNotMatchHydratedContainerTextInstance( parentContainer, textInstance, textContent, // TODO: Delete this argument when we remove the legacy root API.
                        isConcurrentMode, shouldWarnIfMismatchDev );

                    if ( isConcurrentMode && enableClientRenderFallbackOnTextMismatch ) {
                        // In concurrent mode we never update the mismatched text,
                        // even if the error was ignored.
                        return false;
                    }

                    break;
                }

                case WorkTag.HostSingleton:
                case WorkTag.HostComponent: {
                    const parentType = returnFiber.type;
                    const parentProps = returnFiber.memoizedProps;
                    const parentInstance = returnFiber.stateNode;
                    const isConcurrentMode = ( returnFiber.mode & TypeOfMode.ConcurrentMode ) !== TypeOfMode.NoMode;
                    didNotMatchHydratedTextInstance( parentType, parentProps, parentInstance, textInstance, textContent, // TODO: Delete this argument when we remove the legacy root API.
                        isConcurrentMode, shouldWarnIfMismatchDev );

                    if ( isConcurrentMode && enableClientRenderFallbackOnTextMismatch ) {
                        // In concurrent mode we never update the mismatched text,
                        // even if the error was ignored.
                        return false;
                    }

                    break;
                }
            }
        }
    }

    return shouldUpdate;
}

function prepareToHydrateHostSuspenseInstance( fiber: Fiber ): void {
    if ( ! supportsHydration ) {
        throw new Error( "Expected prepareToHydrateHostSuspenseInstance() to never be called. " + "This error is likely caused by a bug in React. Please file an issue." );
    }

    const suspenseState: null | SuspenseState = fiber.memoizedState;
    const suspenseInstance: null | SuspenseInstance = suspenseState !== null ? suspenseState.dehydrated : null;

    if ( ! suspenseInstance ) {
        throw new Error( "Expected to have a hydrated suspense instance. " + "This error is likely caused by a bug in React. Please file an issue." );
    }

    hydrateSuspenseInstance( suspenseInstance, fiber );
}

function skipPastDehydratedSuspenseInstance( fiber: Fiber ): null | HydratableInstance {
    if ( ! supportsHydration ) {
        throw new Error( "Expected skipPastDehydratedSuspenseInstance() to never be called. " + "This error is likely caused by a bug in React. Please file an issue." );
    }

    const suspenseState: null | SuspenseState = fiber.memoizedState;
    const suspenseInstance: null | SuspenseInstance = suspenseState !== null ? suspenseState.dehydrated : null;

    if ( ! suspenseInstance ) {
        throw new Error( "Expected to have a hydrated suspense instance. " + "This error is likely caused by a bug in React. Please file an issue." );
    }

    return getNextHydratableInstanceAfterSuspenseInstance( suspenseInstance );
}

function popToNextHostParent( fiber: Fiber ): void {
    setHydrationParentFiber( fiber.return );

    while ( hasHydrationParentFiber() ) {
        switch ( getHydrationParentFiberSafe().tag ) {
            case WorkTag.HostRoot:
            case WorkTag.HostSingleton:
                setRootOrSingletonContextFlag();
                return;

            case WorkTag.HostComponent:
            case WorkTag.SuspenseComponent:
                clearRootOrSingletonContextFlag();
                return;

            default:
                setHydrationParentFiber( getHydrationParentFiberSafe().return );
        }
    }
}

function popHydrationState( fiber: Fiber ): boolean {
    if ( ! supportsHydration ) {
        return false;
    }

    if ( fiber !== getHydrationParentFiber() ) {
        // We're deeper than the current hydration context, inside an inserted
        // tree.
        return false;
    }

    if ( ! isHydrating ) {
        // If we're not currently hydrating but we're in a hydration context, then
        // we were an insertion and now need to pop up reenter hydration of our
        // siblings.
        popToNextHostParent( fiber );
        markHydrating();
        return false;
    }

    let shouldClear = false;

    if ( enableHostSingletons && supportsSingletons ) {
        // With float we never clear the Root, or Singleton instances. We also do not clear Instances
        // that have singleton text content
        if ( fiber.tag !== WorkTag.HostRoot && fiber.tag !== WorkTag.HostSingleton && ! ( fiber.tag === WorkTag.HostComponent && ( ! shouldDeleteUnhydratedTailInstances( fiber.type ) || shouldSetTextContent( fiber.type, fiber.memoizedProps ) ) ) ) {
            shouldClear = true;
        }
    } else {
        // If we have any remaining hydratable nodes, we need to delete them now.
        // We only do this deeper than head and body since they tend to have random
        // other nodes in them. We also ignore components with pure text content in
        // side of them. We also don't delete anything inside the root container.
        if ( fiber.tag !== WorkTag.HostRoot && ( fiber.tag !== WorkTag.HostComponent || shouldDeleteUnhydratedTailInstances( fiber.type ) && ! shouldSetTextContent( fiber.type, fiber.memoizedProps ) ) ) {
            shouldClear = true;
        }
    }

    if ( shouldClear ) {
        let nextInstance = getNextHydratableInstance();

        if ( nextInstance ) {
            if ( shouldClientRenderOnMismatch( fiber ) ) {
                warnIfUnhydratedTailNodes( fiber );
                throwOnHydrationMismatch( fiber );
            } else {
                while ( nextInstance ) {
                    deleteHydratableInstance( fiber, nextInstance );
                    nextInstance = getNextHydratableSibling( nextInstance );
                }
            }
        }
    }

    popToNextHostParent( fiber );

    if ( fiber.tag === WorkTag.SuspenseComponent ) {
        setNextHydratableInstance( skipPastDehydratedSuspenseInstance( fiber ) );
    } else {
        setNextHydratableInstance( getHydrationParentFiber() ? getNextHydratableSibling( fiber.stateNode ) : null );
    }

    return true;
}

function hasUnhydratedTailNodes(): boolean {
    return isHydrating() && hasNextHydratableInstance();
}

function warnIfUnhydratedTailNodes( fiber: Fiber ) {
    let nextInstance = getNextHydratableInstance();

    while ( nextInstance ) {
        warnUnhydratedInstance( fiber, nextInstance );
        nextInstance = getNextHydratableSibling( nextInstance );
    }
}

function resetHydrationState(): void {
    if ( ! supportsHydration ) {
        return;
    }

    clearHydrationParentFiber();
    clearNextHydratableInstance();
    freeHydrating();
    clearDidThrowWhileHydratingDEV();
}

export function upgradeHydrationErrorsToRecoverable(): void {
    if ( hasHydrationErrors() ) {
        // Successfully completed a forced client render. The errors that occurred
        // during the hydration attempt are now recovered. We will log them in
        // commit phase, once the entire tree has finished.
        queueRecoverableErrors( getHydrationErrorsSafe() );
        clearHydrationErrors();
    }
}

export {
    warnIfHydrating,
    enterHydrationState,
    reenterHydrationStateFromDehydratedSuspenseInstance,
    resetHydrationState,
    prepareToHydrateHostInstance,
    prepareToHydrateHostTextInstance,
    prepareToHydrateHostSuspenseInstance,
    popHydrationState,
    hasUnhydratedTailNodes,
    warnIfUnhydratedTailNodes
};

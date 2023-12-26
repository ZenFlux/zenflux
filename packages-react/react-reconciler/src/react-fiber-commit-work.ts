import {
    enableFloat,
    enableHostSingletons,
    enableProfilerCommitHooks,
    enableProfilerTimer,
    enableScopeAPI,
    enableUpdaterTracking
} from "@zenflux/react-shared/src/react-feature-flags";

import { clearCaughtError, invokeGuardedCallback } from "@zenflux/react-shared/src/react-error-utils";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import reactGetComponentNameFromFiber from "@zenflux/react-reconciler/src/react-get-component-name-from-fiber";

import { addFiberToLanesMap } from "@zenflux/react-reconciler/src/react-fiber-lane";

import { recordLayoutEffectDuration, startLayoutEffectTimer, } from "@zenflux/react-reconciler/src/react-profile-timer";

import { isDevToolsPresent } from "@zenflux/react-reconciler/src/react-fiber-dev-tools-hook";

import { isExecutionContextCommitDeactivate } from "@zenflux/react-reconciler/src/react-fiber-work-excution-context";

import {
    getCurrentHoistableRoot,
    getCurrentHoistableRootSafe,
    setCurrentHoistableRoot
} from "@zenflux/react-reconciler/src/react-fiber-commit-current-hoistable-root";

import type { Container, Instance } from "@zenflux/react-reconciler/src/react-fiber-config";
import type { SuspenseState } from "@zenflux/react-reconciler/src/react-fiber-suspense-component";
import type { Fiber, FiberRoot, Lanes } from "@zenflux/react-shared/src/react-internal-types";
import type { OffscreenState } from "@zenflux/react-shared/src/react-internal-types/offscreen";

const {
    appendChild,
    appendChildToContainer,
    getHoistableRoot,
    getPublicInstance,
    insertBefore,
    insertInContainerBefore,
    resetTextContent,
    supportsMutation,
    supportsResources,
    supportsSingletons,
    suspendInstance,
    suspendResource,
} = globalThis.__RECONCILER__CONFIG__;

export function shouldProfile( current: Fiber ): boolean {
    return enableProfilerTimer &&
        enableProfilerCommitHooks &&
        ( current.mode & TypeOfMode.ProfileMode ) !== TypeOfMode.NoMode &&
        isExecutionContextCommitDeactivate();
}

export function restorePendingUpdaters( root: FiberRoot, lanes: Lanes ): void {
    if ( enableUpdaterTracking ) {
        if ( isDevToolsPresent ) {
            const memoizedUpdaters = root.memoizedUpdaters;
            memoizedUpdaters.forEach( schedulingFiber => {
                addFiberToLanesMap( root, schedulingFiber, lanes );
            } ); // This function intentionally does not clear memoized updaters.
            // Those may still be relevant to the current commit
            // and a future one (e.g. Suspense).
        }
    }
}

export function reportUncaughtErrorInDEV( error: unknown ) {
    // Wrapping each small part of the commit phase into a guarded
    // callback is a bit too slow (https://github.com/facebook/react/pull/21666).
    // But we rely on it to surface errors to DEV tools like overlays
    // (https://github.com/facebook/react/issues/21712).
    // As a compromise, rethrow only caught errors in a guard.
    if ( __DEV__ ) {
        invokeGuardedCallback( null, () => {
            throw error;
        } );
        clearCaughtError();
    }
}

export function commitAttachRef( finishedWork: Fiber ) {
    const ref = finishedWork.ref;

    if ( ref !== null ) {
        const instance = finishedWork.stateNode;
        let instanceToUse;

        switch ( finishedWork.tag ) {
            case WorkTag.HostHoistable:
            case WorkTag.HostSingleton:
            case WorkTag.HostComponent:
                instanceToUse = getPublicInstance( instance );
                break;

            default:
                instanceToUse = instance;
        }

        // Moved outside to ensure DCE works with this flag
        if ( enableScopeAPI && finishedWork.tag === WorkTag.ScopeComponent ) {
            instanceToUse = instance;
        }

        if ( typeof ref === "function" ) {
            if ( shouldProfile( finishedWork ) ) {
                try {
                    startLayoutEffectTimer();
                    // @ts-ignore
                    finishedWork.refCleanup = ref( instanceToUse );
                } finally {
                    recordLayoutEffectDuration( finishedWork );
                }
            } else {
                // @ts-ignore
                finishedWork.refCleanup = ref( instanceToUse );
            }
        } else {
            if ( __DEV__ ) {
                if ( ! ref.hasOwnProperty( "current" ) ) {
                    console.error( "Unexpected ref object provided for %s. " + "Use either a ref-setter function or React.createRef().", reactGetComponentNameFromFiber( finishedWork ) );
                }
            }

            // $FlowFixMe[incompatible-use] unable to narrow type to the non-function case
            ref.current = instanceToUse;
        }
    }
}

function getHostParentFiber( fiber: Fiber ): Fiber {
    let parent = fiber.return;

    while ( parent !== null ) {
        if ( isHostParent( parent ) ) {
            return parent;
        }

        parent = parent.return;
    }

    throw new Error( "Expected to find a host parent. This error is likely caused by a bug " + "in React. Please file an issue." );
}

function isHostParent( fiber: Fiber ): boolean {
    return fiber.tag === WorkTag.HostComponent || fiber.tag === WorkTag.HostRoot || ( enableFloat && supportsResources ? fiber.tag === WorkTag.HostHoistable : false ) || ( enableHostSingletons && supportsSingletons ? fiber.tag === WorkTag.HostSingleton : false ) || fiber.tag === WorkTag.HostPortal;
}

function getHostSibling( fiber: Fiber ): Instance | null | undefined {
    // We're going to search forward into the tree until we find a sibling host
    // node. Unfortunately, if multiple insertions are done in a row we have to
    // search past them. This leads to exponential search for the next sibling.
    // TODO: Find a more efficient way to do this.
    let node: Fiber = fiber;

    siblings: while ( true ) {
        // If we didn't find anything, let's try the next sibling.
        while ( node.sibling === null ) {
            if ( node.return === null || isHostParent( node.return ) ) {
                // If we pop out of the root or hit the parent the fiber we are the
                // last sibling.
                return null;
            }

            // $FlowFixMe[incompatible-type] found when upgrading Flow
            node = node.return;
        }

        node.sibling.return = node.return;
        node = node.sibling;

        while ( node.tag !== WorkTag.HostComponent && node.tag !== WorkTag.HostText && ( ! ( enableHostSingletons && supportsSingletons ) ? true : node.tag !== WorkTag.HostSingleton ) && node.tag !== WorkTag.DehydratedFragment ) {
            // If it is not host node and, we might have a host node inside it.
            // Try to search down until we find one.
            if ( node.flags & FiberFlags.Placement ) {
                // If we don't have a child, try the siblings instead.
                continue siblings;
            }

            // If we don't have a child, try the siblings instead.
            // We also skip portals because they are not part of this host tree.
            if ( node.child === null || node.tag === WorkTag.HostPortal ) {
                continue siblings;
            } else {
                node.child.return = node;
                node = node.child;
            }
        }

        // Check if this host node is stable or about to be placed.
        if ( ! ( node.flags & FiberFlags.Placement ) ) {
            // Found it!
            return node.stateNode;
        }
    }
}

export function commitPlacement( finishedWork: Fiber ): void {
    if ( ! supportsMutation ) {
        return;
    }

    if ( enableHostSingletons && supportsSingletons ) {
        if ( finishedWork.tag === WorkTag.HostSingleton ) {
            // Singletons are already in the Host and don't need to be placed
            // Since they operate somewhat like Portals though their children will
            // have Placement and will get placed inside them
            return;
        }
    }

    // Recursively insert all host nodes into the parent.
    const parentFiber = getHostParentFiber( finishedWork );

    switch ( parentFiber.tag ) {
        case WorkTag.HostSingleton: {
            if ( enableHostSingletons && supportsSingletons ) {
                const parent: Instance = parentFiber.stateNode;
                const before = getHostSibling( finishedWork );
                // We only have the top Fiber that was inserted but we need to recurse down its
                // children to find all the terminal nodes.
                insertOrAppendPlacementNode( finishedWork, before, parent );
                break;
            } // Fall through

        }

        case WorkTag.HostComponent: {
            const parent: Instance = parentFiber.stateNode;

            if ( parentFiber.flags & FiberFlags.ContentReset ) {
                // Reset the text content of the parent before doing any insertions
                resetTextContent( parent );
                // Clear ContentReset from the effect tag
                parentFiber.flags &= ~FiberFlags.ContentReset;
            }

            const before = getHostSibling( finishedWork );
            // We only have the top Fiber that was inserted but we need to recurse down its
            // children to find all the terminal nodes.
            insertOrAppendPlacementNode( finishedWork, before, parent );
            break;
        }

        case WorkTag.HostRoot:
        case WorkTag.HostPortal: {
            const parent: Container = parentFiber.stateNode.containerInfo;
            const before = getHostSibling( finishedWork );
            insertOrAppendPlacementNodeIntoContainer( finishedWork, before, parent );
            break;
        }

        default:
            throw new Error( "Invalid host parent fiber. This error is likely caused by a bug " + "in React. Please file an issue." );
    }
}

function insertOrAppendPlacementNodeIntoContainer( node: Fiber, before: Instance | null | undefined, parent: Container ): void {
    const {
        tag
    } = node;
    const isHost = tag === WorkTag.HostComponent || tag === WorkTag.HostText;

    if ( isHost ) {
        const stateNode = node.stateNode;

        if ( before ) {
            insertInContainerBefore( parent, stateNode, before );
        } else {
            appendChildToContainer( parent, stateNode );
        }
    } else if ( tag === WorkTag.HostPortal || ( enableHostSingletons && supportsSingletons ? tag === WorkTag.HostSingleton : false ) ) {// If the insertion itself is a portal, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
        // If the insertion is a HostSingleton then it will be placed independently
    } else {
        const child = node.child;

        if ( child !== null ) {
            insertOrAppendPlacementNodeIntoContainer( child, before, parent );
            let sibling = child.sibling;

            while ( sibling !== null ) {
                insertOrAppendPlacementNodeIntoContainer( sibling, before, parent );
                sibling = sibling.sibling;
            }
        }
    }
}

function insertOrAppendPlacementNode( node: Fiber, before: Instance | null | undefined, parent: Instance ): void {
    const {
        tag
    } = node;
    const isHost = tag === WorkTag.HostComponent || tag === WorkTag.HostText;

    if ( isHost ) {
        const stateNode = node.stateNode;

        if ( before ) {
            insertBefore( parent, stateNode, before );
        } else {
            appendChild( parent, stateNode );
        }
    } else if ( tag === WorkTag.HostPortal || ( enableHostSingletons && supportsSingletons ? tag === WorkTag.HostSingleton : false ) ) {// If the insertion itself is a portal, then we don't want to traverse
        // down its children. Instead, we'll get insertions from each child in
        // the portal directly.
        // If the insertion is a HostSingleton then it will be placed independently
    } else {
        const child = node.child;

        if ( child !== null ) {
            insertOrAppendPlacementNode( child, before, parent );
            let sibling = child.sibling;

            while ( sibling !== null ) {
                insertOrAppendPlacementNode( sibling, before, parent );
                sibling = sibling.sibling;
            }
        }
    }
}

// This function detects when a Suspense boundary goes from visible to hidden.
// It returns false if the boundary is already hidden.
// TODO: Use an effect tag.
export function isSuspenseBoundaryBeingHidden( current: Fiber | null, finishedWork: Fiber ): boolean {
    if ( current !== null ) {
        const oldState: SuspenseState | null = current.memoizedState;

        if ( oldState === null || oldState.dehydrated !== null ) {
            const newState: SuspenseState | null = finishedWork.memoizedState;
            return newState !== null && newState.dehydrated === null;
        }
    }

    return false;
}

// If we're inside a brand new tree, or a tree that was already visible, then we
// should only suspend host components that have a ShouldSuspendCommit flag.
// Components without it haven't changed since the last commit, so we can skip
// over those.
//
// When we enter a tree that is being revealed (going from hidden -> visible),
// we need to suspend _any_ component that _may_ suspend. Even if they're
// already in the "current" tree. Because their visibility has changed, the
// browser may not have prerendered them yet. So we check the MaySuspendCommit
// flag instead.
let suspenseyCommitFlag = FiberFlags.ShouldSuspendCommit;

export function accumulateSuspenseyCommit( finishedWork: Fiber ): void {
    accumulateSuspenseyCommitOnFiber( finishedWork );
}

function recursivelyAccumulateSuspenseyCommit( parentFiber: Fiber ): void {
    if ( parentFiber.subtreeFlags & suspenseyCommitFlag ) {
        let child = parentFiber.child;

        while ( child !== null ) {
            accumulateSuspenseyCommitOnFiber( child );
            child = child.sibling;
        }
    }
}

function accumulateSuspenseyCommitOnFiber( fiber: Fiber ) {
    switch ( fiber.tag ) {
        case WorkTag.HostHoistable: {
            recursivelyAccumulateSuspenseyCommit( fiber );

            if ( fiber.flags & suspenseyCommitFlag ) {
                if ( fiber.memoizedState !== null ) {
                    suspendResource(
                        // This should always be set by visiting HostRoot first
                        getCurrentHoistableRootSafe(),
                        fiber.memoizedState,
                        fiber.memoizedProps
                    );
                } else {
                    const type = fiber.type;
                    const props = fiber.memoizedProps;
                    suspendInstance( type, props );
                }
            }

            break;
        }

        case WorkTag.HostComponent: {
            recursivelyAccumulateSuspenseyCommit( fiber );

            if ( fiber.flags & suspenseyCommitFlag ) {
                const type = fiber.type;
                const props = fiber.memoizedProps;
                suspendInstance( type, props );
            }

            break;
        }

        case WorkTag.HostRoot:
        case WorkTag.HostPortal: {
            if ( enableFloat && supportsResources ) {
                const previousHoistableRoot = getCurrentHoistableRoot();
                const container: Container = fiber.stateNode.containerInfo;
                setCurrentHoistableRoot( getHoistableRoot( container ) );
                recursivelyAccumulateSuspenseyCommit( fiber );
                setCurrentHoistableRoot( previousHoistableRoot );
            } else {
                recursivelyAccumulateSuspenseyCommit( fiber );
            }

            break;
        }

        case WorkTag.OffscreenComponent: {
            const isHidden = ( fiber.memoizedState as OffscreenState | null ) !== null;

            if ( isHidden ) {// Don't suspend in hidden trees
            } else {
                const current = fiber.alternate;
                const wasHidden = current !== null && ( current.memoizedState as OffscreenState | null ) !== null;

                if ( wasHidden ) {
                    // This tree is being revealed. Visit all newly visible suspensey
                    // instances, even if they're in the current tree.
                    const prevFlags = suspenseyCommitFlag;
                    suspenseyCommitFlag = FiberFlags.MaySuspendCommit;
                    recursivelyAccumulateSuspenseyCommit( fiber );
                    suspenseyCommitFlag = prevFlags;
                } else {
                    recursivelyAccumulateSuspenseyCommit( fiber );
                }
            }

            break;
        }

        default: {
            recursivelyAccumulateSuspenseyCommit( fiber );
        }
    }
}

import { unstable_now as now } from "@zenflux/react-scheduler";
import {
    enableCache,
    enableFloat,
    enableHostSingletons,
    enableLegacyHidden,
    enableProfilerTimer,
    enableScopeAPI,
    enableSuspenseCallback,
    enableTransitionTracing,
    passChildrenWhenCloningPersistedNodes
} from "@zenflux/react-shared/src/react-feature-flags";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";

import {
    includesOnlyNonUrgentLanes,
    NoLanes,
    OffscreenLane,
    SomeRetryLane
} from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";

import { resetChildFibers } from "@zenflux/react-reconciler/src/react-fiber-child";
import { isOffscreenManual } from "@zenflux/react-reconciler/src/react-fiber-activity-component";
import { popCacheProvider } from "@zenflux/react-reconciler/src/react-fiber-cache-component-provider";
import {
    hasUnhydratedTailNodes,
    popHydrationState,
    prepareToHydrateHostInstance,
    prepareToHydrateHostSuspenseInstance,
    prepareToHydrateHostTextInstance,
    resetHydrationState,
    upgradeHydrationErrorsToRecoverable,
    warnIfUnhydratedTailNodes
} from "@zenflux/react-reconciler/src/react-fiber-hydration-context";

import { isHydrating } from "@zenflux/react-reconciler/src/react-fiber-hydration-is-hydrating";

import { getWorkInProgressRootRenderLanes, getWorkInProgressTransitions } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress";
import { renderHasNotSuspendedYet } from "@zenflux/react-reconciler/src/react-fiber-work-in-progress-ping";

import { shouldRemainOnPreviousScreen } from "@zenflux/react-reconciler/src/react-fiber-work-loop-should-on-previous-screen";
import {
    isContextProvider as isLegacyContextProvider,
    popContext as popLegacyContext,
    popTopLevelContextObject as popTopLevelLegacyContextObject
} from "@zenflux/react-reconciler/src/react-fiber-context";

import { popHiddenContext } from "@zenflux/react-reconciler/src/react-fiber-hidden-context";
import {
    getHostContext,
    getRootHostContainer,
    popHostContainer,
    popHostContext
} from "@zenflux/react-reconciler/src/react-fiber-host-context";
import {
    claimNextRetryLane,
    includesSomeLane,
    mergeLanes,
} from "@zenflux/react-reconciler/src/react-fiber-lane";
import { popProvider } from "@zenflux/react-reconciler/src/react-fiber-new-context";
import { createScopeInstance } from "@zenflux/react-reconciler/src/react-fiber-scope";
import { findFirstSuspended } from "@zenflux/react-reconciler/src/react-fiber-suspense-component";
import {
    ForceSuspenseFallback,
    popSuspenseHandler,
    popSuspenseListContext,
    pushSuspenseListContext,
    setDefaultShallowSuspenseListContext,
    setShallowSuspenseListContext,
    suspenseStackCursor
} from "@zenflux/react-reconciler/src/react-fiber-suspense-context";
import { suspendCommit } from "@zenflux/react-reconciler/src/react-fiber-thenable";
import { popMarkerInstance, popRootMarkerInstance } from "@zenflux/react-reconciler/src/react-fiber-tracing-marker-component";
import { popRootTransition, popTransition } from "@zenflux/react-reconciler/src/react-fiber-transition";
import { popTreeContext } from "@zenflux/react-reconciler/src/react-fiber-tree-context";
import {
    getRenderTargetTime,
} from "@zenflux/react-reconciler/src/react-fiber-work-loop";
import { transferActualDuration } from "@zenflux/react-reconciler/src/react-profile-timer";

import type { Cache, Lane, Lanes , Fiber, FiberRoot } from "@zenflux/react-shared/src/react-internal-types";

import type { ChildSet, Container, Instance, Props, Resource, Type } from "@zenflux/react-reconciler/src/react-fiber-config";
import type { RootState } from "@zenflux/react-reconciler/src/react-fiber-root";
import type {
    SuspenseListRenderState,
    SuspenseState
} from "@zenflux/react-reconciler/src/react-fiber-suspense-component";
import type { ReactContext, ReactScopeInstance } from "@zenflux/react-shared/src/react-types";
import type { TracingMarkerInstance } from "@zenflux/react-shared/src/react-internal-types/tracing";
import type { OffscreenQueue, OffscreenState } from "@zenflux/react-shared/src/react-internal-types/offscreen";

import type { RetryQueue } from "@zenflux/react-shared/src/react-internal-types/queue";

const {
    appendChildToContainerChildSet,
    appendInitialChild,
    cloneHiddenInstance,
    cloneHiddenTextInstance,
    cloneInstance,
    createContainerChildSet,
    createInstance,
    createTextInstance,
    finalizeContainerChildren,
    finalizeInitialChildren,
    mayResourceSuspendCommit,
    maySuspendCommit,
    preloadInstance,
    preloadResource,
    preparePortalMount,
    prepareScopeUpdate,
    resolveSingletonInstance,
    supportsMutation,
    supportsPersistence,
    supportsResources,
    supportsSingletons
} = globalThis.__RECONCILER__CONFIG__;

function markUpdate( workInProgress: Fiber ) {
    // Tag the fiber with an update effect. This turns a Placement into
    // a PlacementAndUpdate.
    workInProgress.flags |= FiberFlags.Update;
}

function markRef( workInProgress: Fiber ) {
    workInProgress.flags |= FiberFlags.Ref | FiberFlags.RefStatic;
}

function hadNoMutationsEffects( current: null | Fiber, completedWork: Fiber ) {
    const didBailout = current !== null && current.child === completedWork.child;

    if ( didBailout ) {
        return true;
    }

    if ( ( completedWork.flags & FiberFlags.ChildDeletion ) !== FiberFlags.NoFlags ) {
        return false;
    }

    // TODO: If we move the `hadNoMutationsEffects` call after `bubbleProperties`
    // then we only have to check the `completedWork.subtreeFlags`.
    let child = completedWork.child;

    while ( child !== null ) {
        if ( ( child.flags & FiberFlags.MutationMask ) !== FiberFlags.NoFlags || ( child.subtreeFlags & FiberFlags.MutationMask ) !== FiberFlags.NoFlags ) {
            return false;
        }

        child = child.sibling;
    }

    return true;
}

function appendAllChildren( parent: Instance, workInProgress: Fiber, needsVisibilityToggle: boolean, isHidden: boolean ) {
    if ( supportsMutation ) {
        // We only have the top Fiber that was created but we need recurse down its
        // children to find all the terminal nodes.
        let node = workInProgress.child;

        while ( node !== null ) {
            if ( node.tag === WorkTag.HostComponent || node.tag === WorkTag.HostText ) {
                appendInitialChild( parent, node.stateNode );
            } else if ( node.tag === WorkTag.HostPortal || ( enableHostSingletons && supportsSingletons ? node.tag === WorkTag.HostSingleton : false ) ) {// If we have a portal child, then we don't want to traverse
                // down its children. Instead, we'll get insertions from each child in
                // the portal directly.
                // If we have a HostSingleton it will be placed independently
            } else if ( node.child !== null ) {
                node.child.return = node;
                node = node.child;
                continue;
            }

            if ( node === workInProgress ) {
                return;
            }

            // $FlowFixMe[incompatible-use] found when upgrading Flow
            while ( node.sibling === null ) {
                // $FlowFixMe[incompatible-use] found when upgrading Flow
                if ( node.return === null || node.return === workInProgress ) {
                    return;
                }

                node = node.return;
            }

            // $FlowFixMe[incompatible-use] found when upgrading Flow
            node.sibling.return = node.return;
            node = node.sibling;
        }
    } else if ( supportsPersistence ) {
        // We only have the top Fiber that was created but we need recurse down its
        // children to find all the terminal nodes.
        let node = workInProgress.child;

        while ( node !== null ) {
            if ( node.tag === WorkTag.HostComponent ) {
                let instance = node.stateNode;

                if ( needsVisibilityToggle && isHidden ) {
                    // This child is inside a timed out tree. Hide it.
                    const props = node.memoizedProps;
                    const type = node.type;
                    instance = cloneHiddenInstance( instance, type, props );
                }

                appendInitialChild( parent, instance );
            } else if ( node.tag === WorkTag.HostText ) {
                let instance = node.stateNode;

                if ( needsVisibilityToggle && isHidden ) {
                    // This child is inside a timed out tree. Hide it.
                    const text = node.memoizedProps;
                    instance = cloneHiddenTextInstance( instance, text );
                }

                appendInitialChild( parent, instance );
            } else if ( node.tag === WorkTag.HostPortal ) {// If we have a portal child, then we don't want to traverse
                // down its children. Instead, we'll get insertions from each child in
                // the portal directly.
            } else if ( node.tag === WorkTag.OffscreenComponent && node.memoizedState !== null ) {
                // The children in this boundary are hidden. Toggle their visibility
                // before appending.
                const child = node.child;

                if ( child !== null ) {
                    child.return = node;
                }

                appendAllChildren( parent, node,
                    /* needsVisibilityToggle */
                    true,
                    /* isHidden */
                    true );
            } else if ( node.child !== null ) {
                node.child.return = node;
                node = node.child;
                continue;
            }

            node = ( node as Fiber );

            if ( node === workInProgress ) {
                return;
            }

            // $FlowFixMe[incompatible-use] found when upgrading Flow
            while ( node.sibling === null ) {
                // $FlowFixMe[incompatible-use] found when upgrading Flow
                if ( node.return === null || node.return === workInProgress ) {
                    return;
                }

                node = node.return;
            }

            // $FlowFixMe[incompatible-use] found when upgrading Flow
            node.sibling.return = node.return;
            node = node.sibling;
        }
    }
}

// An unfortunate fork of appendAllChildren because we have two different parent types.
function appendAllChildrenToContainer( containerChildSet: ChildSet, workInProgress: Fiber, needsVisibilityToggle: boolean, isHidden: boolean ) {
    if ( supportsPersistence ) {
        // We only have the top Fiber that was created but we need recurse down its
        // children to find all the terminal nodes.
        let node = workInProgress.child;

        while ( node !== null ) {
            // eslint-disable-next-line no-labels
            if ( node.tag === WorkTag.HostComponent ) {
                let instance = node.stateNode;

                if ( needsVisibilityToggle && isHidden ) {
                    // This child is inside a timed out tree. Hide it.
                    const props = node.memoizedProps;
                    const type = node.type;
                    instance = cloneHiddenInstance( instance, type, props );
                }

                appendChildToContainerChildSet( containerChildSet, instance );
            } else if ( node.tag === WorkTag.HostText ) {
                let instance = node.stateNode;

                if ( needsVisibilityToggle && isHidden ) {
                    // This child is inside a timed out tree. Hide it.
                    const text = node.memoizedProps;
                    instance = cloneHiddenTextInstance( instance, text );
                }

                appendChildToContainerChildSet( containerChildSet, instance );
            } else if ( node.tag === WorkTag.HostPortal ) {// If we have a portal child, then we don't want to traverse
                // down its children. Instead, we'll get insertions from each child in
                // the portal directly.
            } else if ( node.tag === WorkTag.OffscreenComponent && node.memoizedState !== null ) {
                // The children in this boundary are hidden. Toggle their visibility
                // before appending.
                const child = node.child;

                if ( child !== null ) {
                    child.return = node;
                }

                // If Offscreen is not in manual mode, detached tree is hidden from user space.
                const _needsVisibilityToggle = ! isOffscreenManual( node );

                appendAllChildrenToContainer( containerChildSet, node,
                    /* needsVisibilityToggle */
                    _needsVisibilityToggle,
                    /* isHidden */
                    true );
            } else if ( node.child !== null ) {
                node.child.return = node;
                node = node.child;
                continue;
            }

            node = ( node as Fiber );

            if ( node === workInProgress ) {
                return;
            }

            // $FlowFixMe[incompatible-use] found when upgrading Flow
            while ( node.sibling === null ) {
                // $FlowFixMe[incompatible-use] found when upgrading Flow
                if ( node.return === null || node.return === workInProgress ) {
                    return;
                }

                node = node.return;
            }

            // $FlowFixMe[incompatible-use] found when upgrading Flow
            node.sibling.return = node.return;
            node = node.sibling;
        }
    }
}

function updateHostContainer( current: null | Fiber, workInProgress: Fiber ) {
    if ( supportsPersistence ) {
        const portalOrRoot: {
            containerInfo: Container;
            pendingChildren: ChildSet;
        } = workInProgress.stateNode;
        const childrenUnchanged = hadNoMutationsEffects( current, workInProgress );

        if ( childrenUnchanged ) {// No changes, just reuse the existing instance.
        } else {
            const container = portalOrRoot.containerInfo;
            const newChildSet = createContainerChildSet();
            // If children might have changed, we have to add them all to the set.
            appendAllChildrenToContainer( newChildSet, workInProgress,
                /* needsVisibilityToggle */
                false,
                /* isHidden */
                false );
            portalOrRoot.pendingChildren = newChildSet;
            // Schedule an update on the container to swap out the container.
            markUpdate( workInProgress );
            finalizeContainerChildren( container, newChildSet );
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function updateHostComponent( current: Fiber, workInProgress: Fiber, type: Type, newProps: Props, renderLanes: Lanes ) {
    if ( supportsMutation ) {
        // If we have an alternate, that means this is an update and we need to
        // schedule a side effect to do the updates.
        const oldProps = current.memoizedProps;

        if ( oldProps === newProps ) {
            // In mutation mode, this is sufficient for a bailout because
            // we won't touch this node even if children changed.
            return;
        }

        markUpdate( workInProgress );
    } else if ( supportsPersistence ) {
        const currentInstance = current.stateNode;
        const oldProps = current.memoizedProps;
        // If there are no effects associated with this node, then none of our children had any updates.
        // This guarantees that we can reuse all of them.
        const childrenUnchanged = hadNoMutationsEffects( current, workInProgress );

        if ( childrenUnchanged && oldProps === newProps ) {
            // No changes, just reuse the existing instance.
            // Note that this might release a previous clone.
            workInProgress.stateNode = currentInstance;
            return;
        }

        const currentHostContext = getHostContext();
        let newChildSet: ChildSet | null = null;

        if ( ! childrenUnchanged && passChildrenWhenCloningPersistedNodes ) {
            newChildSet = createContainerChildSet();
            // If children might have changed, we have to add them all to the set.
            appendAllChildrenToContainer( newChildSet, workInProgress,
                /* needsVisibilityToggle */
                false,
                /* isHidden */
                false );
        }

        const newInstance = cloneInstance( currentInstance, type, oldProps, newProps, childrenUnchanged, newChildSet );

        if ( newInstance === currentInstance ) {
            // No changes, just reuse the existing instance.
            // Note that this might release a previous clone.
            workInProgress.stateNode = currentInstance;
            return;
        }

        // Certain renderers require commit-time effects for initial mount.
        // (eg DOM renderer supports auto-focus for certain elements).
        // Make sure such renderers get scheduled for later work.
        if ( finalizeInitialChildren( newInstance, type, newProps, currentHostContext ) ) {
            markUpdate( workInProgress );
        }

        workInProgress.stateNode = newInstance;

        if ( childrenUnchanged ) {
            // If there are no other effects in this tree, we need to flag this node as having one.
            // Even though we're not going to use it for anything.
            // Otherwise parents won't know that there are new children to propagate upwards.
            markUpdate( workInProgress );
        } else if ( ! passChildrenWhenCloningPersistedNodes ) {
            // If children might have changed, we have to add them all to the set.
            appendAllChildren( newInstance, workInProgress,
                /* needsVisibilityToggle */
                false,
                /* isHidden */
                false );
        }
    }
}

// This function must be called at the very end of the complete phase, because
// it might throw to suspend, and if the resource immediately loads, the work
// loop will resume rendering as if the work-in-progress completed. So it must
// fully complete.
// TODO: This should ideally move to begin phase, but currently the instance is
// not created until the complete phase. For our existing use cases, host nodes
// that suspend don't have children, so it doesn't matter. But that might not
// always be true in the future.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function preloadInstanceAndSuspendIfNeeded( workInProgress: Fiber, type: Type, props: Props, renderLanes: Lanes ) {
    if ( ! maySuspendCommit( type, props ) ) {
        // If this flag was set previously, we can remove it. The flag
        // represents whether this particular set of props might ever need to
        // suspend. The safest thing to do is for maySuspendCommit to always
        // return true, but if the renderer is reasonably confident that the
        // underlying resource won't be evicted, it can return false as a
        // performance optimization.
        workInProgress.flags &= ~FiberFlags.MaySuspendCommit;
        return;
    }

    // Mark this fiber with a flag. This gets set on all host instances
    // that might possibly suspend, even if they don't need to suspend
    // currently. We use this when revealing a prerendered tree, because
    // even though the tree has "mounted", its resources might not have
    // loaded yet.
    workInProgress.flags |= FiberFlags.MaySuspendCommit;
    // Check if we're rendering at a "non-urgent" priority. This is the same
    // check that `useDeferredValue` does to determine whether it needs to
    // defer. This is partly for gradual adoption purposes (i.e. shouldn't start
    // suspending until you opt in with startTransition or Suspense) but it
    // also happens to be the desired behavior for the concrete use cases we've
    // thought of so far, like CSS loading, fonts, images, etc.
    //
    // We check the "root" render lanes here rather than the "subtree" render
    // because during a retry or offscreen prerender, the "subtree" render
    // lanes may include additional "base" lanes that were deferred during
    // a previous render.
    // TODO: We may decide to expose a way to force a fallback even during a
    // sync update.
    const rootRenderLanes = getWorkInProgressRootRenderLanes();

    if ( ! includesOnlyNonUrgentLanes( rootRenderLanes ) ) {// This is an urgent render. Don't suspend or show a fallback. Also,
        // there's no need to preload, because we're going to commit this
        // synchronously anyway.
        // TODO: Could there be benefit to preloading even during a synchronous
        // render? The main thread will be blocked until the commit phase, but
        // maybe the browser would be able to start loading off thread anyway?
        // Likely a micro-optimization either way because typically new content
        // is loaded during a transition, not an urgent render.
    } else {
        // Preload the instance
        const isReady = preloadInstance( type, props );

        if ( ! isReady ) {
            if ( shouldRemainOnPreviousScreen() ) {
                // It's OK to suspend. Mark the fiber so we know to suspend before the
                // commit phase. Then continue rendering.
                workInProgress.flags |= FiberFlags.ShouldSuspendCommit;
            } else {
                // Trigger a fallback rather than block the render.
                suspendCommit();
            }
        }
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function preloadResourceAndSuspendIfNeeded( workInProgress: Fiber, resource: Resource, type: Type, props: Props, renderLanes: Lanes ) {
    // This is a fork of preloadInstanceAndSuspendIfNeeded, but for resources.
    if ( ! mayResourceSuspendCommit( resource ) ) {
        workInProgress.flags &= ~FiberFlags.MaySuspendCommit;
        return;
    }

    workInProgress.flags |= FiberFlags.MaySuspendCommit;
    const rootRenderLanes = getWorkInProgressRootRenderLanes();

    if ( ! includesOnlyNonUrgentLanes( rootRenderLanes ) ) {// This is an urgent render. Don't suspend or show a fallback.
    } else {
        const isReady = preloadResource( resource );

        if ( ! isReady ) {
            if ( shouldRemainOnPreviousScreen() ) {
                workInProgress.flags |= FiberFlags.ShouldSuspendCommit;
            } else {
                suspendCommit();
            }
        }
    }
}

function scheduleRetryEffect( workInProgress: Fiber, retryQueue: RetryQueue | null ) {
    const wakeables = retryQueue;

    if ( wakeables !== null ) {
        // Schedule an effect to attach a retry listener to the promise.
        // TODO: Move to passive phase
        workInProgress.flags |= FiberFlags.Update;
    } else {
        // This boundary suspended, but no wakeables were added to the retry
        // queue. Check if the renderer suspended commit. If so, this means
        // that once the fallback is committed, we can immediately retry
        // rendering again, because rendering wasn't actually blocked. Only
        // the commit phase.
        // TODO: Consider a model where we always schedule an immediate retry, even
        // for normal Suspense. That way the retry can partially render up to the
        // first thing that suspends.
        if ( workInProgress.flags & FiberFlags.ScheduleRetry ) {
            const retryLane = // TODO: This check should probably be moved into claimNextRetryLane
                // I also suspect that we need some further consolidation of offscreen
                // and retry lanes.
                workInProgress.tag !== WorkTag.OffscreenComponent ? claimNextRetryLane() : OffscreenLane;
            workInProgress.lanes = mergeLanes( workInProgress.lanes, retryLane );
        }
    }
}

function updateHostText( current: Fiber, workInProgress: Fiber, oldText: string, newText: string ) {
    if ( supportsMutation ) {
        // If the text differs, mark it as an update. All the work in done in commitWork.
        if ( oldText !== newText ) {
            markUpdate( workInProgress );
        }
    } else if ( supportsPersistence ) {
        if ( oldText !== newText ) {
            // If the text content differs, we'll create a new text instance for it.
            const rootContainerInstance = getRootHostContainer();
            const currentHostContext = getHostContext();
            workInProgress.stateNode = createTextInstance( newText, rootContainerInstance, currentHostContext, workInProgress );
            // We'll have to mark it as having an effect, even though we won't use the effect for anything.
            // This lets the parents know that at least one of their children has changed.
            markUpdate( workInProgress );
        } else {
            workInProgress.stateNode = current.stateNode;
        }
    }
}

function cutOffTailIfNeeded( renderState: SuspenseListRenderState, hasRenderedATailFallback: boolean ) {
    if ( isHydrating() ) {
        // If we're hydrating, we should consume as many items as we can
        // so we don't leave any behind.
        return;
    }

    switch ( renderState.tailMode ) {
        case "hidden": {
            // Any insertions at the end of the tail list after this point
            // should be invisible. If there are already mounted boundaries
            // anything before them are not considered for collapsing.
            // Therefore we need to go through the whole tail to find if
            // there are any.
            let tailNode = renderState.tail;
            let lastTailNode: Fiber | null = null;

            while ( tailNode !== null ) {
                if ( tailNode.alternate !== null ) {
                    lastTailNode = tailNode;
                }

                tailNode = tailNode.sibling;
            }

            // Next we're simply going to delete all insertions after the
            // last rendered item.
            if ( lastTailNode === null ) {
                // All remaining items in the tail are insertions.
                renderState.tail = null;
            } else {
                // Detach the insertion after the last node that was already
                // inserted.
                lastTailNode.sibling = null;
            }

            break;
        }

        case "collapsed": {
            // Any insertions at the end of the tail list after this point
            // should be invisible. If there are already mounted boundaries
            // anything before them are not considered for collapsing.
            // Therefore we need to go through the whole tail to find if
            // there are any.
            let tailNode = renderState.tail;
            let lastTailNode: Fiber | null = null;

            while ( tailNode !== null ) {
                if ( ( tailNode ).alternate !== null ) {
                    lastTailNode = tailNode;
                }

                tailNode = tailNode.sibling;
            }

            // Next we're simply going to delete all insertions after the
            // last rendered item.
            if ( lastTailNode === null ) {
                // All remaining items in the tail are insertions.
                if ( ! hasRenderedATailFallback && renderState.tail !== null ) {
                    // We suspended during the head. We want to show at least one
                    // row at the tail. So we'll keep on and cut off the rest.
                    renderState.tail.sibling = null;
                } else {
                    renderState.tail = null;
                }
            } else {
                // Detach the insertion after the last node that was already
                // inserted.
                lastTailNode.sibling = null;
            }

            break;
        }
    }
}

function bubbleProperties( completedWork: Fiber ) {
    const didBailout = completedWork.alternate !== null && completedWork.alternate.child === completedWork.child;
    let newChildLanes = NoLanes;
    let subtreeFlags = FiberFlags.NoFlags;

    if ( ! didBailout ) {
        // Bubble up the earliest expiration time.
        if ( enableProfilerTimer && ( completedWork.mode & TypeOfMode.ProfileMode ) !== TypeOfMode.NoMode ) {
            // In profiling mode, resetChildExpirationTime is also used to reset
            // profiler durations.
            let actualDuration = completedWork.actualDuration;
            let treeBaseDuration = ( ( completedWork.selfBaseDuration as any ) as number );
            let child = completedWork.child;

            while ( child !== null ) {
                newChildLanes = mergeLanes( newChildLanes, mergeLanes( child.lanes, child.childLanes ) );
                subtreeFlags |= child.subtreeFlags;
                subtreeFlags |= child.flags;
                // When a fiber is cloned, its actualDuration is reset to 0. This value will
                // only be updated if work is done on the fiber (i.e. it doesn't bailout).
                // When work is done, it should bubble to the parent's actualDuration. If
                // the fiber has not been cloned though, (meaning no work was done), then
                // this value will reflect the amount of time spent working on a previous
                // render. In that case it should not bubble. We determine whether it was
                // cloned by comparing the child pointer.
                // $FlowFixMe[unsafe-addition] addition with possible null/undefined value
                // @ts-ignore
                actualDuration += child.actualDuration;
                // $FlowFixMe[unsafe-addition] addition with possible null/undefined value
                // @ts-ignore
                treeBaseDuration += child.treeBaseDuration;
                child = child.sibling;
            }

            completedWork.actualDuration = actualDuration;
            completedWork.treeBaseDuration = treeBaseDuration;
        } else {
            let child = completedWork.child;

            while ( child !== null ) {
                newChildLanes = mergeLanes( newChildLanes, mergeLanes( child.lanes, child.childLanes ) );
                subtreeFlags |= child.subtreeFlags;
                subtreeFlags |= child.flags;
                // Update the return pointer so the tree is consistent. This is a code
                // smell because it assumes the commit phase is never concurrent with
                // the render phase. Will address during refactor to alternate model.
                child.return = completedWork;
                child = child.sibling;
            }
        }

        completedWork.subtreeFlags |= subtreeFlags;
    } else {
        // Bubble up the earliest expiration time.
        if ( enableProfilerTimer && ( completedWork.mode & TypeOfMode.ProfileMode ) !== TypeOfMode.NoMode ) {
            // In profiling mode, resetChildExpirationTime is also used to reset
            // profiler durations.
            let treeBaseDuration = ( ( completedWork.selfBaseDuration as any ) as number );
            let child = completedWork.child;

            while ( child !== null ) {
                newChildLanes = mergeLanes( newChildLanes, mergeLanes( child.lanes, child.childLanes ) );
                // "Static" flags share the lifetime of the fiber/hook they belong to,
                // so we should bubble those up even during a bailout. All the other
                // flags have a lifetime only of a single render + commit, so we should
                // ignore them.
                subtreeFlags |= child.subtreeFlags & FiberFlags.StaticMask;
                subtreeFlags |= child.flags & FiberFlags.StaticMask;
                // $FlowFixMe[unsafe-addition] addition with possible null/undefined value
                // @ts-ignore
                treeBaseDuration += child.treeBaseDuration;
                child = child.sibling;
            }

            completedWork.treeBaseDuration = treeBaseDuration;
        } else {
            let child = completedWork.child;

            while ( child !== null ) {
                newChildLanes = mergeLanes( newChildLanes, mergeLanes( child.lanes, child.childLanes ) );
                // "Static" flags share the lifetime of the fiber/hook they belong to,
                // so we should bubble those up even during a bailout. All the other
                // flags have a lifetime only of a single render + commit, so we should
                // ignore them.
                subtreeFlags |= child.subtreeFlags & FiberFlags.StaticMask;
                subtreeFlags |= child.flags & FiberFlags.StaticMask;
                // FiberFlags.Update the return pointer so the tree is consistent. This is a code
                // smell because it assumes the commit phase is never concurrent with
                // the render phase. Will address during refactor to alternate model.
                child.return = completedWork;
                child = child.sibling;
            }
        }

        completedWork.subtreeFlags |= subtreeFlags;
    }

    completedWork.childLanes = newChildLanes;
    return didBailout;
}

function completeDehydratedSuspenseBoundary( current: Fiber | null, workInProgress: Fiber, nextState: SuspenseState | null ): boolean {
    if ( hasUnhydratedTailNodes() && ( workInProgress.mode & TypeOfMode.ConcurrentMode ) !== TypeOfMode.NoMode && ( workInProgress.flags & FiberFlags.DidCapture ) === FiberFlags.NoFlags ) {
        warnIfUnhydratedTailNodes( workInProgress );
        resetHydrationState();
        workInProgress.flags |= FiberFlags.ForceClientRender | FiberFlags.DidCapture;
        return false;
    }

    const wasHydrated = popHydrationState( workInProgress );

    if ( nextState !== null && nextState.dehydrated !== null ) {
        // We might be inside a hydration state the first time we're picking up this
        // Suspense boundary, and also after we've reentered it for further hydration.
        if ( current === null ) {
            if ( ! wasHydrated ) {
                throw new Error( "A dehydrated suspense component was completed without a hydrated node. " + "This is probably a bug in React." );
            }

            prepareToHydrateHostSuspenseInstance( workInProgress );
            bubbleProperties( workInProgress );

            if ( enableProfilerTimer ) {
                if ( ( workInProgress.mode & TypeOfMode.ProfileMode ) !== TypeOfMode.NoMode ) {
                    const isTimedOutSuspense = nextState !== null;

                    if ( isTimedOutSuspense ) {
                        // Don't count time spent in a timed out Suspense subtree as part of the base duration.
                        const primaryChildFragment = workInProgress.child;

                        if ( primaryChildFragment !== null ) {
                            // $FlowFixMe[unsafe-arithmetic] Flow doesn't support type casting in combination with the -= operator
                            // @ts-ignore
                            workInProgress.treeBaseDuration -= ( ( primaryChildFragment.treeBaseDuration as any ) as number );
                        }
                    }
                }
            }

            return false;
        } else {
            // We might have reentered this boundary to hydrate it. If so, we need to reset the hydration
            // state since we're now exiting out of it. popHydrationState doesn't do that for us.
            resetHydrationState();

            if ( ( workInProgress.flags & FiberFlags.DidCapture ) === FiberFlags.NoFlags ) {
                // This boundary did not suspend so it's now hydrated and unsuspended.
                workInProgress.memoizedState = null;
            }

            // If nothing suspended, we need to schedule an effect to mark this boundary
            // as having hydrated so events know that they're free to be invoked.
            // It's also a signal to replay events and the suspense callback.
            // If something suspended, schedule an effect to attach retry listeners.
            // So we might as well always mark this.
            workInProgress.flags |= FiberFlags.Update;
            bubbleProperties( workInProgress );

            if ( enableProfilerTimer ) {
                if ( ( workInProgress.mode & TypeOfMode.ProfileMode ) !== TypeOfMode.NoMode ) {
                    const isTimedOutSuspense = nextState !== null;

                    if ( isTimedOutSuspense ) {
                        // Don't count time spent in a timed out Suspense subtree as part of the base duration.
                        const primaryChildFragment = workInProgress.child;

                        if ( primaryChildFragment !== null ) {
                            // $FlowFixMe[unsafe-arithmetic] Flow doesn't support type casting in combination with the -= operator
                            // @ts-ignore
                            workInProgress.treeBaseDuration -= ( ( primaryChildFragment.treeBaseDuration as any ) as number );
                        }
                    }
                }
            }

            return false;
        }
    } else {
        // Successfully completed this tree. If this was a forced client render,
        // there may have been recoverable errors during first hydration
        // attempt. If so, add them to a queue so we can log them in the
        // commit phase.
        upgradeHydrationErrorsToRecoverable();
        // Fall through to normal Suspense path
        return true;
    }
}

function completeWork( current: Fiber | null, workInProgress: Fiber, renderLanes: Lanes ): Fiber | null {
    const newProps = workInProgress.pendingProps;
    // Note: This intentionally doesn't check if we're hydrating because comparing
    // to the current tree provider fiber is just as fast and less error-prone.
    // Ideally we would have a special version of the work loop only
    // for hydration.
    popTreeContext( workInProgress );

    switch ( workInProgress.tag ) {
        case WorkTag.IndeterminateComponent:
        case WorkTag.LazyComponent:
        case WorkTag.SimpleMemoComponent:
        case WorkTag.FunctionComponent:
        case WorkTag.ForwardRef:
        case WorkTag.Fragment:
        case WorkTag.Mode:
        case WorkTag.Profiler:
        case WorkTag.ContextConsumer:
        case WorkTag.MemoComponent:
            bubbleProperties( workInProgress );
            return null;

        case WorkTag.ClassComponent: {
            const Component = workInProgress.type;

            if ( isLegacyContextProvider( Component ) ) {
                popLegacyContext( workInProgress );
            }

            bubbleProperties( workInProgress );
            return null;
        }

        case WorkTag.HostRoot: {
            const fiberRoot = ( workInProgress.stateNode as FiberRoot );

            if ( enableTransitionTracing ) {
                const transitions = getWorkInProgressTransitions();

                // We set the Passive flag here because if there are new transitions,
                // we will need to schedule callbacks and process the transitions,
                // which we do in the passive phase
                if ( transitions !== null ) {
                    workInProgress.flags |= FiberFlags.Passive;
                }
            }

            if ( enableCache ) {
                let previousCache: Cache | null = null;

                if ( current !== null ) {
                    previousCache = current.memoizedState.cache;
                }

                const cache: Cache = workInProgress.memoizedState.cache;

                if ( cache !== previousCache ) {
                    // Run passive effects to retain/release the cache.
                    workInProgress.flags |= FiberFlags.Passive;
                }

                popCacheProvider( workInProgress, cache );
            }

            if ( enableTransitionTracing ) {
                popRootMarkerInstance( workInProgress );
            }

            popRootTransition( workInProgress, fiberRoot, renderLanes );
            popHostContainer( workInProgress );
            popTopLevelLegacyContextObject( workInProgress );

            if ( fiberRoot.pendingContext ) {
                fiberRoot.context = fiberRoot.pendingContext;
                fiberRoot.pendingContext = null;
            }

            if ( current === null || current.child === null ) {
                // If we hydrated, pop so that we can delete any remaining children
                // that weren't hydrated.
                const wasHydrated = popHydrationState( workInProgress );

                if ( wasHydrated ) {
                    // If we hydrated, then we'll need to schedule an update for
                    // the commit side effects on the root.
                    markUpdate( workInProgress );
                } else {
                    if ( current !== null ) {
                        const prevState: RootState = current.memoizedState;

                        if ( // Check if this is a client root
                            ! prevState.isDehydrated || // Check if we reverted to client rendering (e.g. due to an error)
                            ( workInProgress.flags & FiberFlags.ForceClientRender ) !== FiberFlags.NoFlags ) {
                            // Schedule an effect to clear this container at the start of the
                            // next commit. This handles the case of React rendering into a
                            // container with previous children. It's also safe to do for
                            // updates too, because current.child would only be null if the
                            // previous render was null (so the container would already
                            // be empty).
                            workInProgress.flags |= FiberFlags.Snapshot;
                            // If this was a forced client render, there may have been
                            // recoverable errors during first hydration attempt. If so, add
                            // them to a queue so we can log them in the commit phase.
                            upgradeHydrationErrorsToRecoverable();
                        }
                    }
                }
            }

            updateHostContainer( current, workInProgress );
            bubbleProperties( workInProgress );

            if ( enableTransitionTracing ) {
                if ( ( workInProgress.subtreeFlags & FiberFlags.Visibility ) !== FiberFlags.NoFlags ) {
                    // If any of our suspense children toggle visibility, this means that
                    // the pending boundaries array needs to be updated, which we only
                    // do in the passive phase.
                    workInProgress.flags |= FiberFlags.Passive;
                }
            }

            return null;
        }

        case WorkTag.HostHoistable: {
            if ( enableFloat && supportsResources ) {
                // The branching here is more complicated than you might expect because
                // a HostHoistable sometimes corresponds to a Resource and sometimes
                // corresponds to an Instance. It can also switch during an update.
                const type = workInProgress.type;
                const nextResource: Resource | null = workInProgress.memoizedState;

                if ( current === null ) {
                    // We are mounting and must Update this Hoistable in this commit
                    // @TODO refactor this block to create the instance here in complete
                    // phase if we are not hydrating.
                    markUpdate( workInProgress );

                    if ( workInProgress.ref !== null ) {
                        markRef( workInProgress );
                    }

                    if ( nextResource !== null ) {
                        // This is a Hoistable Resource
                        // This must come at the very end of the complete phase.
                        bubbleProperties( workInProgress );
                        preloadResourceAndSuspendIfNeeded( workInProgress, nextResource, type, newProps, renderLanes );
                        return null;
                    } else {
                        // This is a Hoistable Instance
                        // This must come at the very end of the complete phase.
                        bubbleProperties( workInProgress );
                        preloadInstanceAndSuspendIfNeeded( workInProgress, type, newProps, renderLanes );
                        return null;
                    }
                } else {
                    // We are updating.
                    const currentResource = current.memoizedState;

                    if ( nextResource !== currentResource ) {
                        // We are transitioning to, from, or between Hoistable Resources
                        // and require an update
                        markUpdate( workInProgress );
                    }

                    if ( current.ref !== workInProgress.ref ) {
                        markRef( workInProgress );
                    }

                    if ( nextResource !== null ) {
                        // This is a Hoistable Resource
                        // This must come at the very end of the complete phase.
                        bubbleProperties( workInProgress );

                        if ( nextResource === currentResource ) {
                            workInProgress.flags &= ~FiberFlags.MaySuspendCommit;
                        } else {
                            preloadResourceAndSuspendIfNeeded( workInProgress, nextResource, type, newProps, renderLanes );
                        }

                        return null;
                    } else {
                        // This is a Hoistable Instance
                        // We may have props to update on the Hoistable instance.
                        if ( supportsMutation ) {
                            const oldProps = current.memoizedProps;

                            if ( oldProps !== newProps ) {
                                markUpdate( workInProgress );
                            }
                        } else {
                            // We use the updateHostComponent path becuase it produces
                            // the update queue we need for Hoistables.
                            updateHostComponent( current, workInProgress, type, newProps, renderLanes );
                        }

                        // This must come at the very end of the complete phase.
                        bubbleProperties( workInProgress );
                        preloadInstanceAndSuspendIfNeeded( workInProgress, type, newProps, renderLanes );
                        return null;
                    }
                }
            } // Fall through

        }

        case WorkTag.HostSingleton: {
            if ( enableHostSingletons && supportsSingletons ) {
                popHostContext( workInProgress );
                const rootContainerInstance = getRootHostContainer();
                const type = workInProgress.type;

                if ( current !== null && workInProgress.stateNode != null ) {
                    if ( supportsMutation ) {
                        const oldProps = current.memoizedProps;

                        if ( oldProps !== newProps ) {
                            markUpdate( workInProgress );
                        }
                    } else {
                        updateHostComponent( current, workInProgress, type, newProps, renderLanes );
                    }

                    if ( current.ref !== workInProgress.ref ) {
                        markRef( workInProgress );
                    }
                } else {
                    if ( ! newProps ) {
                        if ( workInProgress.stateNode === null ) {
                            throw new Error( "We must have new props for new mounts. This error is likely " + "caused by a bug in React. Please file an issue." );
                        }

                        // This can happen when we abort work.
                        bubbleProperties( workInProgress );
                        return null;
                    }

                    const currentHostContext = getHostContext();
                    const wasHydrated = popHydrationState( workInProgress );
                    let instance: Instance;

                    if ( wasHydrated ) {
                        // We ignore the boolean indicating there is an updateQueue because
                        // it is used only to set text children and HostSingletons do not
                        // use them.
                        prepareToHydrateHostInstance( workInProgress, currentHostContext );
                        instance = workInProgress.stateNode;
                    } else {
                        instance = resolveSingletonInstance( type, newProps, rootContainerInstance, currentHostContext, true );
                        workInProgress.stateNode = instance;
                        markUpdate( workInProgress );
                    }

                    if ( workInProgress.ref !== null ) {
                        // If there is a ref on a host node we need to schedule a callback
                        markRef( workInProgress );
                    }
                }

                bubbleProperties( workInProgress );
                return null;
            } // Fall through

        }

        case WorkTag.HostComponent: {
            popHostContext( workInProgress );
            const type = workInProgress.type;

            if ( current !== null && workInProgress.stateNode != null ) {
                updateHostComponent( current, workInProgress, type, newProps, renderLanes );

                if ( current.ref !== workInProgress.ref ) {
                    markRef( workInProgress );
                }
            } else {
                if ( ! newProps ) {
                    if ( workInProgress.stateNode === null ) {
                        throw new Error( "We must have new props for new mounts. This error is likely " + "caused by a bug in React. Please file an issue." );
                    }

                    // This can happen when we abort work.
                    bubbleProperties( workInProgress );
                    return null;
                }

                const currentHostContext = getHostContext();
                // TODO: Move createInstance to beginWork and keep it on a context
                // "stack" as the parent. Then append children as we go in beginWork
                // or completeWork depending on whether we want to add them top->down or
                // bottom->up. Top->down is faster in IE11.
                const wasHydrated = popHydrationState( workInProgress );

                if ( wasHydrated ) {
                    // TODO: Move this and createInstance step into the beginPhase
                    // to consolidate.
                    prepareToHydrateHostInstance( workInProgress, currentHostContext );
                } else {
                    const rootContainerInstance = getRootHostContainer();
                    const instance = createInstance( type, newProps, rootContainerInstance, currentHostContext, workInProgress );
                    // TODO: For persistent renderers, we should pass children as part
                    // of the initial instance creation
                    appendAllChildren( instance, workInProgress, false, false );
                    workInProgress.stateNode = instance;

                    // Certain renderers require commit-time effects for initial mount.
                    // (eg DOM renderer supports auto-focus for certain elements).
                    // Make sure such renderers get scheduled for later work.
                    if ( finalizeInitialChildren( instance, type, newProps, currentHostContext ) ) {
                        markUpdate( workInProgress );
                    }
                }

                if ( workInProgress.ref !== null ) {
                    // If there is a ref on a host node we need to schedule a callback
                    markRef( workInProgress );
                }
            }

            bubbleProperties( workInProgress );
            // This must come at the very end of the complete phase, because it might
            // throw to suspend, and if the resource immediately loads, the work loop
            // will resume rendering as if the work-in-progress completed. So it must
            // fully complete.
            preloadInstanceAndSuspendIfNeeded( workInProgress, workInProgress.type, workInProgress.pendingProps, renderLanes );
            return null;
        }

        case WorkTag.HostText: {
            const newText = newProps;

            if ( current && workInProgress.stateNode != null ) {
                const oldText = current.memoizedProps;
                // If we have an alternate, that means this is an update and we need
                // to schedule a side-effect to do the updates.
                updateHostText( current, workInProgress, oldText, newText );
            } else {
                if ( typeof newText !== "string" ) {
                    if ( workInProgress.stateNode === null ) {
                        throw new Error( "We must have new props for new mounts. This error is likely " + "caused by a bug in React. Please file an issue." );
                    } // This can happen when we abort work.

                }

                const rootContainerInstance = getRootHostContainer();
                const currentHostContext = getHostContext();
                const wasHydrated = popHydrationState( workInProgress );

                if ( wasHydrated ) {
                    if ( prepareToHydrateHostTextInstance( workInProgress ) ) {
                        markUpdate( workInProgress );
                    }
                } else {
                    workInProgress.stateNode = createTextInstance( newText, rootContainerInstance, currentHostContext, workInProgress );
                }
            }

            bubbleProperties( workInProgress );
            return null;
        }

        case WorkTag.SuspenseComponent: {
            popSuspenseHandler( workInProgress );
            const nextState: null | SuspenseState = workInProgress.memoizedState;

            // Special path for dehydrated boundaries. We may eventually move this
            // to its own fiber type so that we can add other kinds of hydration
            // boundaries that aren't associated with a Suspense tree. In anticipation
            // of such a refactor, all the hydration logic is contained in
            // this branch.
            if ( current === null || current.memoizedState !== null && current.memoizedState.dehydrated !== null ) {
                const fallthroughToNormalSuspensePath = completeDehydratedSuspenseBoundary( current, workInProgress, nextState );

                if ( ! fallthroughToNormalSuspensePath ) {
                    if ( workInProgress.flags & FiberFlags.ForceClientRender ) {
                        // Special case. There were remaining unhydrated nodes. We treat
                        // this as a mismatch. Revert to client rendering.
                        return workInProgress;
                    } else {
                        // Did not finish hydrating, either because this is the initial
                        // render or because something suspended.
                        return null;
                    }
                } // Continue with the normal Suspense path.

            }

            if ( ( workInProgress.flags & FiberFlags.DidCapture ) !== FiberFlags.NoFlags ) {
                // Something suspended. Re-render with the fallback children.
                workInProgress.lanes = renderLanes;

                // Do not reset the effect list.
                if ( enableProfilerTimer && ( workInProgress.mode & TypeOfMode.ProfileMode ) !== TypeOfMode.NoMode ) {
                    transferActualDuration( workInProgress );
                }

                // Don't bubble properties in this case.
                return workInProgress;
            }

            const nextDidTimeout = nextState !== null;
            const prevDidTimeout = current !== null && ( current.memoizedState as null | SuspenseState ) !== null;

            if ( enableCache && nextDidTimeout ) {
                const offscreenFiber: Fiber = ( workInProgress.child as any );
                let previousCache: Cache | null = null;

                if ( offscreenFiber.alternate !== null && offscreenFiber.alternate.memoizedState !== null && offscreenFiber.alternate.memoizedState.cachePool !== null ) {
                    previousCache = offscreenFiber.alternate.memoizedState.cachePool.pool;
                }

                let cache: Cache | null = null;

                if ( offscreenFiber.memoizedState !== null && offscreenFiber.memoizedState.cachePool !== null ) {
                    cache = offscreenFiber.memoizedState.cachePool.pool;
                }

                if ( cache !== previousCache ) {
                    // Run passive effects to retain/release the cache.
                    offscreenFiber.flags |= FiberFlags.Passive;
                }
            }

            // If the suspended state of the boundary changes, we need to schedule
            // a passive effect, which is when we process the transitions
            if ( nextDidTimeout !== prevDidTimeout ) {
                if ( enableTransitionTracing ) {
                    const offscreenFiber: Fiber = ( workInProgress.child as any );
                    offscreenFiber.flags |= FiberFlags.Passive;
                }

                // If the suspended state of the boundary changes, we need to schedule
                // an effect to toggle the subtree's visibility. When we switch from
                // fallback -> primary, the inner Offscreen fiber schedules this effect
                // as part of its normal complete phase. But when we switch from
                // primary -> fallback, the inner Offscreen fiber does not have a complete
                // phase. So we need to schedule its effect here.
                //
                // We also use this flag to connect/disconnect the effects, but the same
                // logic applies: when re-connecting, the Offscreen fiber's complete
                // phase will handle scheduling the effect. It's only when the fallback
                // is active that we have to do anything special.
                if ( nextDidTimeout ) {
                    const offscreenFiber: Fiber = ( workInProgress.child as any );
                    offscreenFiber.flags |= FiberFlags.Visibility;
                }
            }

            const retryQueue: RetryQueue | null = ( workInProgress.updateQueue as any );
            scheduleRetryEffect( workInProgress, retryQueue );

            if ( enableSuspenseCallback && workInProgress.updateQueue !== null && workInProgress.memoizedProps.suspenseCallback != null ) {
                // Always notify the callback
                // TODO: Move to passive phase
                workInProgress.flags |= FiberFlags.Update;
            }

            bubbleProperties( workInProgress );

            if ( enableProfilerTimer ) {
                if ( ( workInProgress.mode & TypeOfMode.ProfileMode ) !== TypeOfMode.NoMode ) {
                    if ( nextDidTimeout ) {
                        // Don't count time spent in a timed out Suspense subtree as part of the base duration.
                        const primaryChildFragment = workInProgress.child;

                        if ( primaryChildFragment !== null ) {
                            // $FlowFixMe[unsafe-arithmetic] Flow doesn't support type casting in combination with the -= operator
                            // @ts-ignore
                            workInProgress.treeBaseDuration -= ( ( primaryChildFragment.treeBaseDuration as any ) as number );
                        }
                    }
                }
            }

            return null;
        }

        case WorkTag.HostPortal:
            popHostContainer( workInProgress );
            updateHostContainer( current, workInProgress );

            if ( current === null ) {
                preparePortalMount( workInProgress.stateNode.containerInfo );
            }

            bubbleProperties( workInProgress );
            return null;

        case WorkTag.ContextProvider:
            // Pop provider fiber
            const context: ReactContext<any> = workInProgress.type._context;
            popProvider( context, workInProgress );
            bubbleProperties( workInProgress );
            return null;

        case WorkTag.IncompleteClassComponent: {
            // Same as class component case. I put it down here so that the tags are
            // sequential to ensure this switch is compiled to a jump table.
            const Component = workInProgress.type;

            if ( isLegacyContextProvider( Component ) ) {
                popLegacyContext( workInProgress );
            }

            bubbleProperties( workInProgress );
            return null;
        }

        case WorkTag.SuspenseListComponent: {
            popSuspenseListContext( workInProgress );
            const renderState: null | SuspenseListRenderState = workInProgress.memoizedState;

            if ( renderState === null ) {
                // We're running in the default, "independent" mode.
                // We don't do anything in this mode.
                bubbleProperties( workInProgress );
                return null;
            }

            let didSuspendAlready = ( workInProgress.flags & FiberFlags.DidCapture ) !== FiberFlags.NoFlags;
            const renderedTail = renderState.rendering;

            if ( renderedTail === null ) {
                // We just rendered the head.
                if ( ! didSuspendAlready ) {
                    // This is the first pass. We need to figure out if anything is still
                    // suspended in the rendered set.
                    // If new content unsuspended, but there's still some content that
                    // didn't. Then we need to do a second pass that forces everything
                    // to keep showing their fallbacks.
                    // We might be suspended if something in this render pass suspended, or
                    // something in the previous committed pass suspended. Otherwise,
                    // there's no chance so we can skip the expensive call to
                    // findFirstSuspended.
                    const cannotBeSuspended = renderHasNotSuspendedYet() && ( current === null || ( current.flags & FiberFlags.DidCapture ) === FiberFlags.NoFlags );

                    if ( ! cannotBeSuspended ) {
                        let row = workInProgress.child;

                        while ( row !== null ) {
                            const suspended = findFirstSuspended( row );

                            if ( suspended !== null ) {
                                didSuspendAlready = true;
                                workInProgress.flags |= FiberFlags.DidCapture;
                                cutOffTailIfNeeded( renderState, false );
                                // If this is a newly suspended tree, it might not get committed as
                                // part of the second pass. In that case nothing will subscribe to
                                // its thenables. Instead, we'll transfer its thenables to the
                                // SuspenseList so that it can retry if they resolve.
                                // There might be multiple of these in the list but since we're
                                // going to wait for all of them anyway, it doesn't really matter
                                // which ones gets to ping. In theory we could get clever and keep
                                // track of how many dependencies remain but it gets tricky because
                                // in the meantime, we can add/remove/change items and dependencies.
                                // We might bail out of the loop before finding any but that
                                // doesn't matter since that means that the other boundaries that
                                // we did find already has their listeners attached.
                                const retryQueue: RetryQueue | null = ( suspended.updateQueue as any );
                                workInProgress.updateQueue = retryQueue;
                                scheduleRetryEffect( workInProgress, retryQueue );
                                // Rerender the whole list, but this time, we'll force fallbacks
                                // to stay in place.
                                // Reset the effect flags before doing the second pass since that's now invalid.
                                // Reset the child fibers to their original state.
                                workInProgress.subtreeFlags = FiberFlags.NoFlags;
                                resetChildFibers( workInProgress, renderLanes );
                                // Set up the Suspense List Context to force suspense and
                                // immediately rerender the children.
                                pushSuspenseListContext( workInProgress, setShallowSuspenseListContext( suspenseStackCursor.current, ForceSuspenseFallback ) );
                                // Don't bubble properties in this case.
                                return workInProgress.child;
                            }

                            row = row.sibling;
                        }
                    }

                    if ( renderState.tail !== null && now() > getRenderTargetTime() ) {
                        // We have already passed our CPU deadline but we still have rows
                        // left in the tail. We'll just give up further attempts to render
                        // the main content and only render fallbacks.
                        workInProgress.flags |= FiberFlags.DidCapture;
                        didSuspendAlready = true;
                        cutOffTailIfNeeded( renderState, false );
                        // Since nothing actually suspended, there will nothing to ping this
                        // to get it started back up to attempt the next item. While in terms
                        // of priority this work has the same priority as this current render,
                        // it's not part of the same transition once the transition has
                        // committed. If it's sync, we still want to yield so that it can be
                        // painted. Conceptually, this is really the same as pinging.
                        // We can use any RetryLane even if it's the one currently rendering
                        // since we're leaving it behind on this node.
                        workInProgress.lanes = SomeRetryLane;
                    }
                } else {
                    cutOffTailIfNeeded( renderState, false );
                } // Next we're going to render the tail.

            } else {
                // Append the rendered row to the child list.
                if ( ! didSuspendAlready ) {
                    const suspended = findFirstSuspended( renderedTail );

                    if ( suspended !== null ) {
                        workInProgress.flags |= FiberFlags.DidCapture;
                        didSuspendAlready = true;
                        // Ensure we transfer the update queue to the parent so that it doesn't
                        // get lost if this row ends up dropped during a second pass.
                        const retryQueue: RetryQueue | null = ( suspended.updateQueue as any );
                        workInProgress.updateQueue = retryQueue;
                        scheduleRetryEffect( workInProgress, retryQueue );
                        cutOffTailIfNeeded( renderState, true );

                        // This might have been modified.
                        if ( renderState.tail === null && renderState.tailMode === "hidden" && ! renderedTail.alternate && ! isHydrating() // We don't cut it if we're hydrating.
                        ) {
                            // We're done.
                            bubbleProperties( workInProgress );
                            return null;
                        }
                    } else if ( // The time it took to render last row is greater than the remaining
                        // time we have to render. So rendering one more row would likely
                        // exceed it.
                        now() * 2 - renderState.renderingStartTime > getRenderTargetTime() && renderLanes !== OffscreenLane ) {
                        // We have now passed our CPU deadline and we'll just give up further
                        // attempts to render the main content and only render fallbacks.
                        // The assumption is that this is usually faster.
                        workInProgress.flags |= FiberFlags.DidCapture;
                        didSuspendAlready = true;
                        cutOffTailIfNeeded( renderState, false );
                        // Since nothing actually suspended, there will nothing to ping this
                        // to get it started back up to attempt the next item. While in terms
                        // of priority this work has the same priority as this current render,
                        // it's not part of the same transition once the transition has
                        // committed. If it's sync, we still want to yield so that it can be
                        // painted. Conceptually, this is really the same as pinging.
                        // We can use any RetryLane even if it's the one currently rendering
                        // since we're leaving it behind on this node.
                        workInProgress.lanes = SomeRetryLane;
                    }
                }

                if ( renderState.isBackwards ) {
                    // The effect list of the backwards tail will have been added
                    // to the end. This breaks the guarantee that life-cycles fire in
                    // sibling order but that isn't a strong guarantee promised by React.
                    // Especially since these might also just pop in during future commits.
                    // Append to the beginning of the list.
                    renderedTail.sibling = workInProgress.child;
                    workInProgress.child = renderedTail;
                } else {
                    const previousSibling = renderState.last;

                    if ( previousSibling !== null ) {
                        previousSibling.sibling = renderedTail;
                    } else {
                        workInProgress.child = renderedTail;
                    }

                    renderState.last = renderedTail;
                }
            }

            if ( renderState.tail !== null ) {
                // We still have tail rows to render.
                // Pop a row.
                const next = renderState.tail;
                renderState.rendering = next;
                renderState.tail = next.sibling;
                renderState.renderingStartTime = now();
                next.sibling = null;
                // Restore the context.
                // TODO: We can probably just avoid popping it instead and only
                // setting it the first time we go from not suspended to suspended.
                let suspenseContext = suspenseStackCursor.current;

                if ( didSuspendAlready ) {
                    suspenseContext = setShallowSuspenseListContext( suspenseContext, ForceSuspenseFallback );
                } else {
                    suspenseContext = setDefaultShallowSuspenseListContext( suspenseContext );
                }

                pushSuspenseListContext( workInProgress, suspenseContext );
                // Do a pass over the next row.
                // Don't bubble properties in this case.
                return next;
            }

            bubbleProperties( workInProgress );
            return null;
        }

        case WorkTag.ScopeComponent: {
            if ( enableScopeAPI ) {
                if ( current === null ) {
                    const scopeInstance: ReactScopeInstance = createScopeInstance();
                    workInProgress.stateNode = scopeInstance;
                    prepareScopeUpdate( scopeInstance, workInProgress );

                    if ( workInProgress.ref !== null ) {
                        markRef( workInProgress );
                        markUpdate( workInProgress );
                    }
                } else {
                    if ( workInProgress.ref !== null ) {
                        markUpdate( workInProgress );
                    }

                    if ( current.ref !== workInProgress.ref ) {
                        markRef( workInProgress );
                    }
                }

                bubbleProperties( workInProgress );
                return null;
            }

            break;
        }

        case WorkTag.OffscreenComponent:
        case WorkTag.LegacyHiddenComponent: {
            popSuspenseHandler( workInProgress );
            popHiddenContext( workInProgress );
            const nextState: OffscreenState | null = workInProgress.memoizedState;
            const nextIsHidden = nextState !== null;

            // Schedule a Visibility effect if the visibility has changed
            if ( enableLegacyHidden && workInProgress.tag === WorkTag.LegacyHiddenComponent ) {// LegacyHidden doesn't do any hiding — it only pre-renders.
            } else {
                if ( current !== null ) {
                    const prevState: OffscreenState | null = current.memoizedState;
                    const prevIsHidden = prevState !== null;

                    if ( prevIsHidden !== nextIsHidden ) {
                        workInProgress.flags |= FiberFlags.Visibility;
                    }
                } else {
                    // On initial mount, we only need a Visibility effect if the tree
                    // is hidden.
                    if ( nextIsHidden ) {
                        workInProgress.flags |= FiberFlags.Visibility;
                    }
                }
            }

            if ( ! nextIsHidden || ( workInProgress.mode & TypeOfMode.ConcurrentMode ) === TypeOfMode.NoMode ) {
                bubbleProperties( workInProgress );
            } else {
                // Don't bubble properties for hidden children unless we're rendering
                // at offscreen priority.
                if ( includesSomeLane( renderLanes, ( OffscreenLane as Lane ) ) && // Also don't bubble if the tree suspended
                    ( workInProgress.flags & FiberFlags.DidCapture ) === NoLanes ) {
                    bubbleProperties( workInProgress );

                    // Check if there was an insertion or update in the hidden subtree.
                    // If so, we need to hide those nodes in the commit phase, so
                    // schedule a visibility effect.
                    if ( ( ! enableLegacyHidden || workInProgress.tag !== WorkTag.LegacyHiddenComponent ) && workInProgress.subtreeFlags & ( FiberFlags.Placement | FiberFlags.Update ) ) {
                        workInProgress.flags |= FiberFlags.Visibility;
                    }
                }
            }

            const offscreenQueue: OffscreenQueue | null = ( workInProgress.updateQueue as any );

            if ( offscreenQueue !== null ) {
                const retryQueue = offscreenQueue.retryQueue;
                scheduleRetryEffect( workInProgress, retryQueue );
            }

            if ( enableCache ) {
                let previousCache: Cache | null = null;

                if ( current !== null && current.memoizedState !== null && current.memoizedState.cachePool !== null ) {
                    previousCache = current.memoizedState.cachePool.pool;
                }

                let cache: Cache | null = null;

                if ( workInProgress.memoizedState !== null && workInProgress.memoizedState.cachePool !== null ) {
                    cache = workInProgress.memoizedState.cachePool.pool;
                }

                if ( cache !== previousCache ) {
                    // Run passive effects to retain/release the cache.
                    workInProgress.flags |= FiberFlags.Passive;
                }
            }

            popTransition( workInProgress, current );
            return null;
        }

        case WorkTag.CacheComponent: {
            if ( enableCache ) {
                let previousCache: Cache | null = null;

                if ( current !== null ) {
                    previousCache = current.memoizedState.cache;
                }

                const cache: Cache = workInProgress.memoizedState.cache;

                if ( cache !== previousCache ) {
                    // Run passive effects to retain/release the cache.
                    workInProgress.flags |= FiberFlags.Passive;
                }

                popCacheProvider( workInProgress, cache );
                bubbleProperties( workInProgress );
            }

            return null;
        }

        case WorkTag.TracingMarkerComponent: {
            if ( enableTransitionTracing ) {
                const instance: TracingMarkerInstance | null = workInProgress.stateNode;

                if ( instance !== null ) {
                    popMarkerInstance( workInProgress );
                }

                bubbleProperties( workInProgress );
            }

            return null;
        }
    }

    throw new Error( `Unknown unit of work tag (${ workInProgress.tag }). This error is likely caused by a bug in ` + "React. Please file an issue." );
}

export { completeWork };

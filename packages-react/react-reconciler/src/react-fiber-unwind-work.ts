import { enableCache, enableProfilerTimer, enableTransitionTracing } from "@zenflux/react-shared/src/react-feature-flags";

import { FiberFlags } from "@zenflux/react-shared/src/react-internal-constants/fiber-flags";
import { TypeOfMode } from "@zenflux/react-shared/src/react-internal-constants/type-of-mode";
import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { popMarkerInstance, popRootMarkerInstance } from "@zenflux/react-reconciler/src/react-fiber-tracing-marker-component";

import { popHostContainer, popHostContext } from "@zenflux/react-reconciler/src/react-fiber-host-context";
import { popSuspenseHandler, popSuspenseListContext } from "@zenflux/react-reconciler/src/react-fiber-suspense-context";
import { popHiddenContext } from "@zenflux/react-reconciler/src/react-fiber-hidden-context";
import { resetHydrationState } from "@zenflux/react-reconciler/src/react-fiber-hydration-context";
import { popProvider } from "@zenflux/react-reconciler/src/react-fiber-new-context";
import { transferActualDuration } from "@zenflux/react-reconciler/src/react-profile-timer";
import { popTreeContext } from "@zenflux/react-reconciler/src/react-fiber-tree-context";
import { popRootTransition, popTransition } from "@zenflux/react-reconciler/src/react-fiber-transition";

import {
    isContextProvider as isLegacyContextProvider,
    popContext as popLegacyContext,
    popTopLevelContextObject as popTopLevelLegacyContextObject
} from "@zenflux/react-reconciler/src/react-fiber-context";

import { popCacheProvider } from "@zenflux/react-reconciler/src/react-fiber-cache-component-provider";

import type { ReactContext } from "@zenflux/react-shared/src/react-types";
import type { SuspenseState } from "@zenflux/react-reconciler/src/react-fiber-suspense-component";
import type { Fiber, FiberRoot, Cache, Lanes } from "@zenflux/react-shared/src/react-internal-types";

import type { TracingMarkerInstance } from "@zenflux/react-shared/src/react-internal-types/tracing";

function unwindWork( current: Fiber | null, workInProgress: Fiber, renderLanes: Lanes ): Fiber | null {
    // Note: This intentionally doesn't check if we're hydrating because comparing
    // to the current tree provider fiber is just as fast and less error-prone.
    // Ideally we would have a special version of the work loop only
    // for hydration.
    popTreeContext( workInProgress );

    switch ( workInProgress.tag ) {
        case WorkTag.ClassComponent: {
            const Component = workInProgress.type;

            if ( isLegacyContextProvider( Component ) ) {
                popLegacyContext( workInProgress );
            }

            const flags = workInProgress.flags;

            if ( flags & FiberFlags.ShouldCapture ) {
                workInProgress.flags = flags & ~FiberFlags.ShouldCapture | FiberFlags.DidCapture;

                if ( enableProfilerTimer && ( workInProgress.mode & TypeOfMode.ProfileMode ) !== TypeOfMode.NoMode ) {
                    transferActualDuration( workInProgress );
                }

                return workInProgress;
            }

            return null;
        }

        case WorkTag.HostRoot: {
            const root: FiberRoot = workInProgress.stateNode;

            if ( enableCache ) {
                const cache: Cache = workInProgress.memoizedState.cache;
                popCacheProvider( workInProgress, cache );
            }

            if ( enableTransitionTracing ) {
                popRootMarkerInstance( workInProgress );
            }

            popRootTransition( workInProgress, root, renderLanes );
            popHostContainer( workInProgress );
            popTopLevelLegacyContextObject( workInProgress );
            const flags = workInProgress.flags;

            if ( ( flags & FiberFlags.ShouldCapture ) !== FiberFlags.NoFlags && ( flags & FiberFlags.DidCapture ) === FiberFlags.NoFlags ) {
                // There was an error during render that wasn't captured by a suspense
                // boundary. Do a second pass on the root to unmount the children.
                workInProgress.flags = flags & ~FiberFlags.ShouldCapture | FiberFlags.DidCapture;
                return workInProgress;
            }

            // We unwound to the root without completing it. Exit.
            return null;
        }

        case WorkTag.HostHoistable:
        case WorkTag.HostSingleton:
        case WorkTag.HostComponent: {
            // TODO: popHydrationState
            popHostContext( workInProgress );
            return null;
        }

        case WorkTag.SuspenseComponent: {
            popSuspenseHandler( workInProgress );
            const suspenseState: null | SuspenseState = workInProgress.memoizedState;

            if ( suspenseState !== null && suspenseState.dehydrated !== null ) {
                if ( workInProgress.alternate === null ) {
                    throw new Error( "Threw in newly mounted dehydrated component. This is likely a bug in " + "React. Please file an issue." );
                }

                resetHydrationState();
            }

            const flags = workInProgress.flags;

            if ( flags & FiberFlags.ShouldCapture ) {
                workInProgress.flags = flags & ~FiberFlags.ShouldCapture | FiberFlags.DidCapture;

                // Captured a suspense effect. Re-render the boundary.
                if ( enableProfilerTimer && ( workInProgress.mode & TypeOfMode.ProfileMode ) !== TypeOfMode.NoMode ) {
                    transferActualDuration( workInProgress );
                }

                return workInProgress;
            }

            return null;
        }

        case WorkTag.SuspenseListComponent: {
            popSuspenseListContext( workInProgress );
            // SuspenseList doesn't actually catch anything. It should've been
            // caught by a nested boundary. If not, it should bubble through.
            return null;
        }

        case WorkTag.HostPortal:
            popHostContainer( workInProgress );
            return null;

        case WorkTag.ContextProvider:
            const context: ReactContext<any> = workInProgress.type._context;
            popProvider( context, workInProgress );
            return null;

        case WorkTag.OffscreenComponent:
        case WorkTag.LegacyHiddenComponent: {
            popSuspenseHandler( workInProgress );
            popHiddenContext( workInProgress );
            popTransition( workInProgress, current );
            const flags = workInProgress.flags;

            if ( flags & FiberFlags.ShouldCapture ) {
                workInProgress.flags = flags & ~FiberFlags.ShouldCapture | FiberFlags.DidCapture;

                // Captured a suspense effect. Re-render the boundary.
                if ( enableProfilerTimer && ( workInProgress.mode & TypeOfMode.ProfileMode ) !== TypeOfMode.NoMode ) {
                    transferActualDuration( workInProgress );
                }

                return workInProgress;
            }

            return null;
        }

        case WorkTag.CacheComponent:
            if ( enableCache ) {
                const cache: Cache = workInProgress.memoizedState.cache;
                popCacheProvider( workInProgress, cache );
            }

            return null;

        case WorkTag.TracingMarkerComponent:
            if ( enableTransitionTracing ) {
                if ( workInProgress.stateNode !== null ) {
                    popMarkerInstance( workInProgress );
                }
            }

            return null;

        default:
            return null;
    }
}

function unwindInterruptedWork( current: Fiber | null, interruptedWork: Fiber, renderLanes: Lanes ) {
    // Note: This intentionally doesn't check if we're hydrating because comparing
    // to the current tree provider fiber is just as fast and less error-prone.
    // Ideally we would have a special version of the work loop only
    // for hydration.
    popTreeContext( interruptedWork );

    switch ( interruptedWork.tag ) {
        case WorkTag.ClassComponent: {
            const childContextTypes = interruptedWork.type.childContextTypes;

            if ( childContextTypes !== null && childContextTypes !== undefined ) {
                popLegacyContext( interruptedWork );
            }

            break;
        }

        case WorkTag.HostRoot: {
            const root: FiberRoot = interruptedWork.stateNode;

            if ( enableCache ) {
                const cache: Cache = interruptedWork.memoizedState.cache;
                popCacheProvider( interruptedWork, cache );
            }

            if ( enableTransitionTracing ) {
                popRootMarkerInstance( interruptedWork );
            }

            popRootTransition( interruptedWork, root, renderLanes );
            popHostContainer( interruptedWork );
            popTopLevelLegacyContextObject( interruptedWork );
            break;
        }

        case WorkTag.HostHoistable:
        case WorkTag.HostSingleton:
        case WorkTag.HostComponent: {
            popHostContext( interruptedWork );
            break;
        }

        case WorkTag.HostPortal:
            popHostContainer( interruptedWork );
            break;

        case WorkTag.SuspenseComponent:
            popSuspenseHandler( interruptedWork );
            break;

        case WorkTag.SuspenseListComponent:
            popSuspenseListContext( interruptedWork );
            break;

        case WorkTag.ContextProvider:
            const context: ReactContext<any> = interruptedWork.type._context;
            popProvider( context, interruptedWork );
            break;

        case WorkTag.OffscreenComponent:
        case WorkTag.LegacyHiddenComponent:
            popSuspenseHandler( interruptedWork );
            popHiddenContext( interruptedWork );
            popTransition( interruptedWork, current );
            break;

        case WorkTag.CacheComponent:
            if ( enableCache ) {
                const cache: Cache = interruptedWork.memoizedState.cache;
                popCacheProvider( interruptedWork, cache );
            }

            break;

        case WorkTag.TracingMarkerComponent:
            if ( enableTransitionTracing ) {
                const instance: TracingMarkerInstance | null = interruptedWork.stateNode;

                if ( instance !== null ) {
                    popMarkerInstance( interruptedWork );
                }
            }

            break;

        default:
            break;
    }
}

export { unwindWork, unwindInterruptedWork };

import { enableFloat, enableHostSingletons } from "@zenflux/react-shared/src/react-feature-flags";

import { REACT_FORWARD_REF_TYPE, REACT_LAZY_TYPE, REACT_MEMO_TYPE } from "@zenflux/react-shared/src/react-symbols";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { SyncLane } from "@zenflux/react-shared/src/react-internal-constants/fiber-lane-constants";

import { enqueueConcurrentRenderForLane } from "@zenflux/react-reconciler/src/react-fiber-concurrent-updates";
import { emptyContextObject } from "@zenflux/react-reconciler/src/react-fiber-context";
import {
    hasFailedErrorBoundary,
    hasSpecificFailedErrorBoundarySafe
} from "@zenflux/react-reconciler/src/react-fiber-hot-reloading-error-boundray";

import { isRefreshHandler, refresherHandler } from "@zenflux/react-reconciler/src/react-fiber-hot-reloading-resvole";

import { updateContainer } from "@zenflux/react-reconciler/src/react-fiber-reconciler-contianer";
import { flushSync } from "@zenflux/react-reconciler/src/react-fiber-work-flush-sync";
import { flushPassiveEffects } from "@zenflux/react-reconciler/src/react-fiber-work-passive-effects";
import { scheduleUpdateOnFiber } from "@zenflux/react-reconciler/src/react-fiber-work-schedule-update";

import type { Family, RefreshHandler } from "@zenflux/react-reconciler/src/react-fiber-hot-reloading-resvole";

import type { Instance } from "@zenflux/react-reconciler/src/react-fiber-config";
import type { Fiber, FiberRoot } from "@zenflux/react-shared/src/react-internal-types";
import type { ReactElement } from "@zenflux/react-shared/src/react-element-type";
import type { ReactNodeList } from "@zenflux/react-shared/src/react-types";

const {
    supportsSingletons
} = globalThis.__RECONCILER__CONFIG__;

export type RefreshUpdate = {
    staleFamilies: Set<Family>;
    updatedFamilies: Set<Family>;
};

// Used by React Refresh runtime through DevTools Global Hook.
export type SetRefreshHandler = ( handler: RefreshHandler | null ) => void;
export type ScheduleRefresh = ( root: FiberRoot, update: RefreshUpdate ) => void;
export type ScheduleRoot = ( root: FiberRoot, element: ReactNodeList ) => void;
export type FindHostInstancesForRefresh = ( root: FiberRoot, families: Array<Family> ) => Set<Instance>;

export function isCompatibleFamilyForHotReloading( fiber: Fiber, element: ReactElement ): boolean {
    if ( __DEV__ ) {
        if ( ! isRefreshHandler() ) {
            // Hot reloading is disabled.
            return false;
        }

        const prevType = fiber.elementType;
        const nextType = element.type;
        // If we got here, we know types aren't === equal.
        let needsCompareFamilies = false;
        const $$typeofNextType = typeof nextType === "object" && nextType !== null ? nextType.$$typeof : null;

        switch ( fiber.tag ) {
            case WorkTag.ClassComponent: {
                if ( typeof nextType === "function" ) {
                    needsCompareFamilies = true;
                }

                break;
            }

            case WorkTag.FunctionComponent: {
                if ( typeof nextType === "function" ) {
                    needsCompareFamilies = true;
                } else if ( $$typeofNextType === REACT_LAZY_TYPE ) {
                    // We don't know the inner type yet.
                    // We're going to assume that the lazy inner type is stable,
                    // and so it is sufficient to avoid reconciling it away.
                    // We're not going to unwrap or actually use the new lazy type.
                    needsCompareFamilies = true;
                }

                break;
            }

            case WorkTag.ForwardRef: {
                if ( $$typeofNextType === REACT_FORWARD_REF_TYPE ) {
                    needsCompareFamilies = true;
                } else if ( $$typeofNextType === REACT_LAZY_TYPE ) {
                    needsCompareFamilies = true;
                }

                break;
            }

            case WorkTag.MemoComponent:
            case WorkTag.SimpleMemoComponent: {
                if ( $$typeofNextType === REACT_MEMO_TYPE ) {
                    // TODO: if it was but can no longer be simple,
                    // we shouldn't set this.
                    needsCompareFamilies = true;
                } else if ( $$typeofNextType === REACT_LAZY_TYPE ) {
                    needsCompareFamilies = true;
                }

                break;
            }

            default:
                return false;
        }

        // Check if both types have a family and it's the same one.
        if ( needsCompareFamilies ) {
            // Note: memo() and forwardRef() we'll compare outer rather than inner type.
            // This means both of them need to be registered to preserve state.
            // If we unwrapped and compared the inner types for wrappers instead,
            // then we would risk falsely saying two separate memo(Foo)
            // calls are equivalent because they wrap the same Foo function.
            const prevFamily = refresherHandler( prevType );

            // $FlowFixMe[not-a-function] found when upgrading Flow
            if ( prevFamily !== undefined && prevFamily === refresherHandler( nextType ) ) {
                return true;
            }
        }

        return false;
    } else {
        return false;
    }
}

export const scheduleRefresh: ScheduleRefresh = ( root: FiberRoot, update: RefreshUpdate ): void => {
    if ( __DEV__ ) {
        if ( isRefreshHandler() ) {
            // Hot reloading is disabled.
            return;
        }

        const {
            staleFamilies,
            updatedFamilies
        } = update;
        flushPassiveEffects();
        flushSync( () => {
            scheduleFibersWithFamiliesRecursively( root.current, updatedFamilies, staleFamilies );
        } );
    }
};
export const scheduleRoot: ScheduleRoot = ( root: FiberRoot, element: ReactNodeList ): void => {
    if ( __DEV__ ) {
        if ( root.context !== emptyContextObject ) {
            // Super edge case: root has a legacy _renderSubtree context
            // but we don't know the parentComponent so we can't pass it.
            // Just ignore. We'll delete this with _renderSubtree code path later.
            return;
        }

        flushPassiveEffects();
        flushSync( () => {
            updateContainer( element, root, null, null );
        } );
    }
};

function scheduleFibersWithFamiliesRecursively( fiber: Fiber, updatedFamilies: Set<Family>, staleFamilies: Set<Family> ): void {
    if ( __DEV__ ) {
        const {
            alternate,
            child,
            sibling,
            tag,
            type
        } = fiber;
        let candidateType = null;

        switch ( tag ) {
            case WorkTag.FunctionComponent:
            case WorkTag.SimpleMemoComponent:
            case WorkTag.ClassComponent:
                candidateType = type;
                break;

            case WorkTag.ForwardRef:
                candidateType = type.render;
                break;

            default:
                break;
        }

        if ( isRefreshHandler() ) {
            throw new Error( "Expected resolveFamily to be set during hot reload." );
        }

        let needsRender = false;
        let needsRemount = false;

        if ( candidateType !== null ) {
            const family = refresherHandler( candidateType );

            if ( family !== undefined ) {
                if ( staleFamilies.has( family ) ) {
                    needsRemount = true;
                } else if ( updatedFamilies.has( family ) ) {
                    if ( tag === WorkTag.ClassComponent ) {
                        needsRemount = true;
                    } else {
                        needsRender = true;
                    }
                }
            }
        }

        if ( hasFailedErrorBoundary() ) {
            if ( hasSpecificFailedErrorBoundarySafe( fiber ) ||
                alternate !== null &&
                hasSpecificFailedErrorBoundarySafe( alternate )
            ) {
                needsRemount = true;
            }
        }

        if ( needsRemount ) {
            fiber._debugNeedsRemount = true;
        }

        if ( needsRemount || needsRender ) {
            const root = enqueueConcurrentRenderForLane( fiber, SyncLane );

            if ( root !== null ) {
                scheduleUpdateOnFiber( root, fiber, SyncLane );
            }
        }

        if ( child !== null && ! needsRemount ) {
            scheduleFibersWithFamiliesRecursively( child, updatedFamilies, staleFamilies );
        }

        if ( sibling !== null ) {
            scheduleFibersWithFamiliesRecursively( sibling, updatedFamilies, staleFamilies );
        }
    }
}

export const findHostInstancesForRefresh: FindHostInstancesForRefresh = ( root: FiberRoot, families: Array<Family> ): Set<Instance> => {
    if ( __DEV__ ) {
        const hostInstances = new Set<Instance>();
        const types = new Set( families.map( family => family.current ) );
        findHostInstancesForMatchingFibersRecursively( root.current, types, hostInstances );
        return hostInstances;
    } else {
        throw new Error( "Did not expect findHostInstancesForRefresh to be called in production." );
    }
};

function findHostInstancesForMatchingFibersRecursively( fiber: Fiber, types: Set<any>, hostInstances: Set<Instance> ) {
    if ( __DEV__ ) {
        const {
            child,
            sibling,
            tag,
            type
        } = fiber;
        let candidateType = null;

        switch ( tag ) {
            case WorkTag.FunctionComponent:
            case WorkTag.SimpleMemoComponent:
            case WorkTag.ClassComponent:
                candidateType = type;
                break;

            case WorkTag.ForwardRef:
                candidateType = type.render;
                break;

            default:
                break;
        }

        let didMatch = false;

        if ( candidateType !== null ) {
            if ( types.has( candidateType ) ) {
                didMatch = true;
            }
        }

        if ( didMatch ) {
            // We have a match. This only drills down to the closest host components.
            // There's no need to search deeper because for the purpose of giving
            // visual feedback, "flashing" outermost parent rectangles is sufficient.
            findHostInstancesForFiberShallowly( fiber, hostInstances );
        } else {
            // If there's no match, maybe there will be one further down in the child tree.
            if ( child !== null ) {
                findHostInstancesForMatchingFibersRecursively( child, types, hostInstances );
            }
        }

        if ( sibling !== null ) {
            findHostInstancesForMatchingFibersRecursively( sibling, types, hostInstances );
        }
    }
}

function findHostInstancesForFiberShallowly( fiber: Fiber, hostInstances: Set<Instance> ): void {
    if ( __DEV__ ) {
        const foundHostInstances = findChildHostInstancesForFiberShallowly( fiber, hostInstances );

        if ( foundHostInstances ) {
            return;
        }

        // If we didn't find any host children, fallback to the closest host parent.
        let node = fiber;

        while ( true ) {
            switch ( node.tag ) {
                case WorkTag.HostSingleton:
                case WorkTag.HostComponent:
                    hostInstances.add( node.stateNode );
                    return;

                case WorkTag.HostPortal:
                    hostInstances.add( node.stateNode.containerInfo );
                    return;

                case WorkTag.HostRoot:
                    hostInstances.add( node.stateNode.containerInfo );
                    return;
            }

            if ( node.return === null ) {
                throw new Error( "Expected to reach root first." );
            }

            node = node.return;
        }
    }
}

function findChildHostInstancesForFiberShallowly( fiber: Fiber, hostInstances: Set<Instance> ): boolean {
    if ( __DEV__ ) {
        let node: Fiber = fiber;
        let foundHostInstances = false;

        while ( true ) {
            if (
                node.tag === WorkTag.HostComponent ||
                ( enableFloat ? node.tag === WorkTag.HostHoistable : false ) ||
                ( enableHostSingletons && supportsSingletons ? node.tag === WorkTag.HostSingleton : false )
            ) {
                // We got a match.
                foundHostInstances = true;
                hostInstances.add( node.stateNode ); // There may still be more, so keep searching.
            } else if ( node.child !== null ) {
                node.child.return = node;
                node = node.child;
                continue;
            }

            if ( node === fiber ) {
                return foundHostInstances;
            }

            while ( node.sibling === null ) {
                if ( node.return === null || node.return === fiber ) {
                    return foundHostInstances;
                }

                node = node.return;
            }

            node.sibling.return = node.return;
            node = node.sibling;
        }
    }

    return false;
}

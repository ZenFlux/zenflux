import { enableScopeAPI } from "@zenflux/react-shared/src/react-feature-flags";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { isFiberSuspenseAndTimedOut } from "@zenflux/react-reconciler/src/react-fiber-tree-reflection";

import type { ReactContext, ReactScopeInstance, ReactScopeQuery } from "@zenflux/react-shared/src/react-types";

import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

function getSuspenseFallbackChild( fiber: Fiber ): Fiber | null {
    return ( ( ( ( fiber.child as any ) as Fiber ).sibling as any ) as Fiber ).child;
}

const emptyObject = {};

const {
    getInstanceFromNode,
    getInstanceFromScope,
    getPublicInstance
} = globalThis.__RECONCILER__CONFIG__;

function collectScopedNodes( node: Fiber, fn: ReactScopeQuery, scopedNodes: Array<any> ): void {
    if ( enableScopeAPI ) {
        if ( node.tag === WorkTag.HostComponent ) {
            const {
                type,
                memoizedProps,
                stateNode
            } = node;
            const instance = getPublicInstance( stateNode );

            if ( instance !== null && fn( type, memoizedProps || emptyObject, instance ) === true ) {
                scopedNodes.push( instance );
            }
        }

        let child = node.child;

        if ( isFiberSuspenseAndTimedOut( node ) ) {
            child = getSuspenseFallbackChild( node );
        }

        if ( child !== null ) {
            collectScopedNodesFromChildren( child, fn, scopedNodes );
        }
    }
}

function collectFirstScopedNode( node: Fiber, fn: ReactScopeQuery ): null | Record<string, any> {
    if ( enableScopeAPI ) {
        if ( node.tag === WorkTag.HostComponent ) {
            const {
                type,
                memoizedProps,
                stateNode
            } = node;
            const instance = getPublicInstance( stateNode );

            if ( instance !== null && fn( type, memoizedProps, instance ) === true ) {
                return instance;
            }
        }

        let child = node.child;

        if ( isFiberSuspenseAndTimedOut( node ) ) {
            child = getSuspenseFallbackChild( node );
        }

        if ( child !== null ) {
            return collectFirstScopedNodeFromChildren( child, fn );
        }
    }

    return null;
}

function collectScopedNodesFromChildren( startingChild: Fiber, fn: ReactScopeQuery, scopedNodes: Array<any> ): void {
    let child: null | Fiber = startingChild;

    while ( child !== null ) {
        collectScopedNodes( child, fn, scopedNodes );
        child = child.sibling;
    }
}

function collectFirstScopedNodeFromChildren( startingChild: Fiber, fn: ReactScopeQuery ): Record<string, any> | null {
    let child: null | Fiber = startingChild;

    while ( child !== null ) {
        const scopedNode = collectFirstScopedNode( child, fn );

        if ( scopedNode !== null ) {
            return scopedNode;
        }

        child = child.sibling;
    }

    return null;
}

function collectNearestContextValues<T>( node: Fiber, context: ReactContext<T>, childContextValues: Array<T> ): void {
    if ( node.tag === WorkTag.ContextProvider && node.type._context === context ) {
        const contextValue = node.memoizedProps.value;
        childContextValues.push( contextValue );
    } else {
        let child = node.child;

        if ( isFiberSuspenseAndTimedOut( node ) ) {
            child = getSuspenseFallbackChild( node );
        }

        if ( child !== null ) {
            collectNearestChildContextValues( child, context, childContextValues );
        }
    }
}

function collectNearestChildContextValues<T>( startingChild: Fiber | null, context: ReactContext<T>, childContextValues: Array<T> ): void {
    let child = startingChild;

    while ( child !== null ) {
        collectNearestContextValues( child, context, childContextValues );
        child = child.sibling;
    }
}

function DO_NOT_USE_queryAllNodes( this: any, fn: ReactScopeQuery ): null | Array<Record<string, any>> {
    const currentFiber = getInstanceFromScope( this );

    if ( currentFiber === null ) {
        return null;
    }

    const child = currentFiber.child;
    const scopedNodes: Array<any> = [];

    if ( child !== null ) {
        collectScopedNodesFromChildren( child, fn, scopedNodes );
    }

    return scopedNodes.length === 0 ? null : scopedNodes;
}

function DO_NOT_USE_queryFirstNode( this: any, fn: ReactScopeQuery ): null | Record<string, any> {
    const currentFiber = getInstanceFromScope( this );

    if ( currentFiber === null ) {
        return null;
    }

    const child = currentFiber.child;

    if ( child !== null ) {
        return collectFirstScopedNodeFromChildren( child, fn );
    }

    return null;
}

function containsNode( this: any, node: HTMLElement ): boolean {
    let fiber = getInstanceFromNode( node );

    while ( fiber !== null ) {
        if ( fiber.tag === WorkTag.ScopeComponent && fiber.stateNode === this ) {
            return true;
        }

        fiber = fiber.return;
    }

    return false;
}

function getChildContextValues<T>( this: any, context: ReactContext<T> ): Array<T> {
    const currentFiber = getInstanceFromScope( this );

    if ( currentFiber === null ) {
        return [];
    }

    const child = currentFiber.child;
    const childContextValues: Array<T> = [];

    if ( child !== null ) {
        collectNearestChildContextValues( child, context, childContextValues );
    }

    return childContextValues;
}

export function createScopeInstance(): ReactScopeInstance {
    return {
        DO_NOT_USE_queryAllNodes,
        DO_NOT_USE_queryFirstNode,
        containsNode,
        getChildContextValues
    };
}

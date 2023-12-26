import getComponentNameFromType from "@zenflux/react-shared/src/get-component-name-from-type";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import type { Instance } from "@zenflux/react-reconciler/src/react-fiber-config";

import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

const {
    findFiberRoot,
    getBoundingRect,
    getInstanceFromNode,
    getTextContent,
    isHiddenSubtree,
    matchAccessibilityRole,
    setFocusIfFocusable,
    setupIntersectionObserver,
    supportsTestSelectors
} = globalThis.__RECONCILER__CONFIG__;

let COMPONENT_TYPE: Symbol | number = 0b000;
let HAS_PSEUDO_CLASS_TYPE: Symbol | number = 0b001;
let ROLE_TYPE: Symbol | number = 0b010;
let TEST_NAME_TYPE: Symbol | number = 0b011;
let TEXT_TYPE: Symbol | number = 0b100;

if ( typeof Symbol === "function" && Symbol.for ) {
    const symbolFor = Symbol.for;
    COMPONENT_TYPE = symbolFor( "selector.component" );
    HAS_PSEUDO_CLASS_TYPE = symbolFor( "selector.has_pseudo_class" );
    ROLE_TYPE = symbolFor( "selector.role" );
    TEST_NAME_TYPE = symbolFor( "selector.test_id" );
    TEXT_TYPE = symbolFor( "selector.text" );
}

// TODO: Find better solution for this
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type React$AbstractComponent<Props = {}, State = any> = {
    state: State;
    // You can include other properties or methods here.
};

type Type = Symbol | number;
export type ComponentSelector = {
    $$typeof: Type;
    value: React$AbstractComponent<never, unknown>;
};
export type HasPseudoClassSelector = {
    $$typeof: Type;
    value: Array<Selector>;
};
export type RoleSelector = {
    $$typeof: Type;
    value: string;
};
export type TextSelector = {
    $$typeof: Type;
    value: string;
};
export type TestNameSelector = {
    $$typeof: Type;
    value: string;
};
export type Selector = ComponentSelector | HasPseudoClassSelector | RoleSelector | TextSelector | TestNameSelector;

export function createComponentSelector( component: React$AbstractComponent<never, unknown> ): ComponentSelector {
    return {
        $$typeof: COMPONENT_TYPE,
        value: component
    };
}

export function createHasPseudoClassSelector( selectors: Array<Selector> ): HasPseudoClassSelector {
    return {
        $$typeof: HAS_PSEUDO_CLASS_TYPE,
        value: selectors
    };
}

export function createRoleSelector( role: string ): RoleSelector {
    return {
        $$typeof: ROLE_TYPE,
        value: role
    };
}

export function createTextSelector( text: string ): TextSelector {
    return {
        $$typeof: TEXT_TYPE,
        value: text
    };
}

export function createTestNameSelector( id: string ): TestNameSelector {
    return {
        $$typeof: TEST_NAME_TYPE,
        value: id
    };
}

function findFiberRootForHostRoot<THostInstance extends Instance>( hostRoot: THostInstance ): Fiber {
    const maybeFiber = getInstanceFromNode( ( hostRoot as any ) );

    if ( maybeFiber != null ) {
        if ( typeof maybeFiber.memoizedProps[ "data-testname" ] !== "string" ) {
            throw new Error( "Invalid host root specified. Should be either a React container or a node with a testname attribute." );
        }

        return ( ( maybeFiber as any ) as Fiber );
    } else {
        const fiberRoot = findFiberRoot( hostRoot );

        if ( fiberRoot === null ) {
            throw new Error( "Could not find React container within specified host subtree." );
        }

        // The Flow type for FiberRoot is a little funky.
        // createFiberRoot() cheats this by treating the root as :any and adding stateNode lazily.
        return ( ( fiberRoot as any ).stateNode.current as Fiber );
    }
}

function matchSelector( fiber: Fiber, selector: Selector ): boolean {
    const tag = fiber.tag;

    switch ( selector.$$typeof ) {
        case COMPONENT_TYPE:
            if ( fiber.type === selector.value ) {
                return true;
            }

            break;

        case HAS_PSEUDO_CLASS_TYPE:
            return hasMatchingPaths( fiber, ( ( selector as any ) as HasPseudoClassSelector ).value );

        case ROLE_TYPE:
            if ( tag === WorkTag.HostComponent || tag === WorkTag.HostHoistable || tag === WorkTag.HostSingleton ) {
                const node = fiber.stateNode;

                if ( matchAccessibilityRole( node, ( ( selector as any ) as RoleSelector ).value ) ) {
                    return true;
                }
            }

            break;

        case TEXT_TYPE:
            if ( tag === WorkTag.HostComponent || tag === WorkTag.HostText || tag === WorkTag.HostHoistable || tag === WorkTag.HostSingleton ) {
                const textContent = getTextContent( fiber );

                if ( textContent !== null && textContent.indexOf( ( ( selector as any ) as TextSelector ).value ) >= 0 ) {
                    return true;
                }
            }

            break;

        case TEST_NAME_TYPE:
            if ( tag === WorkTag.HostComponent || tag === WorkTag.HostHoistable || tag === WorkTag.HostSingleton ) {
                const dataTestID = fiber.memoizedProps[ "data-testname" ];

                if ( typeof dataTestID === "string" && dataTestID.toLowerCase() === ( ( selector as any ) as TestNameSelector ).value.toLowerCase() ) {
                    return true;
                }
            }

            break;

        default:
            throw new Error( "Invalid selector type specified." );
    }

    return false;
}

function selectorToString( selector: Selector ): string {
    switch ( selector.$$typeof ) {
        case COMPONENT_TYPE:
            const displayName = getComponentNameFromType( selector.value ) || "Unknown";
            return `<${ displayName }>`;

        case HAS_PSEUDO_CLASS_TYPE:
            return `:has(${ selectorToString( selector ) || "" })`;

        case ROLE_TYPE:
            return `[role="${ ( ( selector as any ) as RoleSelector ).value }"]`;

        case TEXT_TYPE:
            return `"${ ( ( selector as any ) as TextSelector ).value }"`;

        case TEST_NAME_TYPE:
            return `[data-testname="${ ( ( selector as any ) as TestNameSelector ).value }"]`;

        default:
            throw new Error( "Invalid selector type specified." );
    }
}

function findPaths( root: Fiber, selectors: Array<Selector> ): Array<Fiber> {
    const matchingFibers: Array<Fiber> = [];
    const stack = [ root, 0 ];
    let index = 0;

    while ( index < stack.length ) {
        const fiber = ( ( stack[ index++ ] as any ) as Fiber );
        const tag = fiber.tag;
        let selectorIndex = ( ( stack[ index++ ] as any ) as number );
        let selector = selectors[ selectorIndex ];

        if ( ( tag === WorkTag.HostComponent || tag === WorkTag.HostHoistable || tag === WorkTag.HostSingleton ) && isHiddenSubtree( fiber ) ) {
            continue;
        } else {
            while ( selector != null && matchSelector( fiber, selector ) ) {
                selectorIndex++;
                selector = selectors[ selectorIndex ];
            }
        }

        if ( selectorIndex === selectors.length ) {
            matchingFibers.push( fiber );
        } else {
            let child = fiber.child;

            while ( child !== null ) {
                stack.push( child, selectorIndex );
                child = child.sibling;
            }
        }
    }

    return matchingFibers;
}

// Same as findPaths but with eager bailout on first match
function hasMatchingPaths( root: Fiber, selectors: Array<Selector> ): boolean {
    const stack = [ root, 0 ];
    let index = 0;

    while ( index < stack.length ) {
        const fiber = ( ( stack[ index++ ] as any ) as Fiber );
        const tag = fiber.tag;
        let selectorIndex = ( ( stack[ index++ ] as any ) as number );
        let selector = selectors[ selectorIndex ];

        if ( ( tag === WorkTag.HostComponent || tag === WorkTag.HostHoistable || tag === WorkTag.HostSingleton ) && isHiddenSubtree( fiber ) ) {
            continue;
        } else {
            while ( selector != null && matchSelector( fiber, selector ) ) {
                selectorIndex++;
                selector = selectors[ selectorIndex ];
            }
        }

        if ( selectorIndex === selectors.length ) {
            return true;
        } else {
            let child = fiber.child;

            while ( child !== null ) {
                stack.push( child, selectorIndex );
                child = child.sibling;
            }
        }
    }

    return false;
}

export function findAllNodes<TInstance extends Instance>( hostRoot: TInstance, selectors: Array<Selector> ): Array<TInstance> {
    if ( ! supportsTestSelectors ) {
        throw new Error( "Test selector API is not supported by this renderer." );
    }

    const root = findFiberRootForHostRoot( hostRoot );
    const matchingFibers = findPaths( root, selectors );
    const instanceRoots: Array<TInstance> = [];
    const stack = Array.from( matchingFibers );
    let index = 0;

    while ( index < stack.length ) {
        const node = ( ( stack[ index++ ] as any ) as Fiber );
        const tag = node.tag;

        if ( tag === WorkTag.HostComponent || tag === WorkTag.HostHoistable || tag === WorkTag.HostSingleton ) {
            if ( isHiddenSubtree( node ) ) {
                continue;
            }

            instanceRoots.push( node.stateNode );
        } else {
            let child = node.child;

            while ( child !== null ) {
                stack.push( child );
                child = child.sibling;
            }
        }
    }

    return instanceRoots;
}

export function getFindAllNodesFailureDescription( hostRoot: Instance, selectors: Array<Selector> ): string | null {
    if ( ! supportsTestSelectors ) {
        throw new Error( "Test selector API is not supported by this renderer." );
    }

    const root = findFiberRootForHostRoot( hostRoot );
    let maxSelectorIndex: number = 0;
    const matchedNames: any[] = [];
    // The logic of this loop should be kept in sync with findPaths()
    const stack = [ root, 0 ];
    let index = 0;

    while ( index < stack.length ) {
        const fiber = ( ( stack[ index++ ] as any ) as Fiber );
        const tag = fiber.tag;
        let selectorIndex = ( ( stack[ index++ ] as any ) as number );
        const selector = selectors[ selectorIndex ];

        if ( ( tag === WorkTag.HostComponent || tag === WorkTag.HostHoistable || tag === WorkTag.HostSingleton ) && isHiddenSubtree( fiber ) ) {
            continue;
        } else if ( matchSelector( fiber, selector ) ) {
            matchedNames.push( selectorToString( selector ) );
            selectorIndex++;

            if ( selectorIndex > maxSelectorIndex ) {
                maxSelectorIndex = selectorIndex;
            }
        }

        if ( selectorIndex < selectors.length ) {
            let child = fiber.child;

            while ( child !== null ) {
                stack.push( child, selectorIndex );
                child = child.sibling;
            }
        }
    }

    if ( maxSelectorIndex < selectors.length ) {
        const unmatchedNames: string[] = [];

        for ( let i = maxSelectorIndex ; i < selectors.length ; i++ ) {
            unmatchedNames.push( selectorToString( selectors[ i ] ) );
        }

        return "findAllNodes was able to match part of the selector:\n" + `  ${ matchedNames.join( " > " ) }\n\n` + "No matching component was found for:\n" + `  ${ unmatchedNames.join( " > " ) }`;
    }

    return null;
}

export type BoundingRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export function findBoundingRects<THostInstance extends Instance>( hostRoot: THostInstance, selectors: Array<Selector> ): Array<BoundingRect> {
    if ( ! supportsTestSelectors ) {
        throw new Error( "Test selector API is not supported by this renderer." );
    }

    const instanceRoots = findAllNodes( hostRoot, selectors );
    const boundingRects: Array<BoundingRect> = [];

    for ( let i = 0 ; i < instanceRoots.length ; i++ ) {
        boundingRects.push( getBoundingRect( instanceRoots[ i ] ) );
    }

    for ( let i = boundingRects.length - 1 ; i > 0 ; i-- ) {
        const targetRect = boundingRects[ i ];
        const targetLeft = targetRect.x;
        const targetRight = targetLeft + targetRect.width;
        const targetTop = targetRect.y;
        const targetBottom = targetTop + targetRect.height;

        for ( let j = i - 1 ; j >= 0 ; j-- ) {
            if ( i !== j ) {
                const otherRect = boundingRects[ j ];
                const otherLeft = otherRect.x;
                const otherRight = otherLeft + otherRect.width;
                const otherTop = otherRect.y;
                const otherBottom = otherTop + otherRect.height;

                // Merging all rects to the minimums set would be complicated,
                // but we can handle the most common cases:
                // 1. completely overlapping rects
                // 2. adjacent rects that are the same width or height (e.g. items in a list)
                //
                // Even given the above constraints,
                // we still won't end up with the fewest possible rects without doing multiple passes,
                // but it's good enough for this purpose.
                if ( targetLeft >= otherLeft && targetTop >= otherTop && targetRight <= otherRight && targetBottom <= otherBottom ) {
                    // Complete overlapping rects; remove the inner one.
                    boundingRects.splice( i, 1 );
                    break;
                } else if ( targetLeft === otherLeft && targetRect.width === otherRect.width && ! ( otherBottom < targetTop ) && ! ( otherTop > targetBottom ) ) {
                    // Adjacent vertical rects; merge them.
                    if ( otherTop > targetTop ) {
                        otherRect.height += otherTop - targetTop;
                        otherRect.y = targetTop;
                    }

                    if ( otherBottom < targetBottom ) {
                        otherRect.height = targetBottom - otherTop;
                    }

                    boundingRects.splice( i, 1 );
                    break;
                } else if ( targetTop === otherTop && targetRect.height === otherRect.height && ! ( otherRight < targetLeft ) && ! ( otherLeft > targetRight ) ) {
                    // Adjacent horizontal rects; merge them.
                    if ( otherLeft > targetLeft ) {
                        otherRect.width += otherLeft - targetLeft;
                        otherRect.x = targetLeft;
                    }

                    if ( otherRight < targetRight ) {
                        otherRect.width = targetRight - otherLeft;
                    }

                    boundingRects.splice( i, 1 );
                    break;
                }
            }
        }
    }

    return boundingRects;
}

export function focusWithin( hostRoot: Instance, selectors: Array<Selector> ): boolean {
    if ( ! supportsTestSelectors ) {
        throw new Error( "Test selector API is not supported by this renderer." );
    }

    const root = findFiberRootForHostRoot( hostRoot );
    const matchingFibers = findPaths( root, selectors );
    const stack = Array.from( matchingFibers );
    let index = 0;

    while ( index < stack.length ) {
        const fiber = ( ( stack[ index++ ] as any ) as Fiber );
        const tag = fiber.tag;

        if ( isHiddenSubtree( fiber ) ) {
            continue;
        }

        if ( tag === WorkTag.HostComponent || tag === WorkTag.HostHoistable || tag === WorkTag.HostSingleton ) {
            const node = fiber.stateNode;

            if ( setFocusIfFocusable( node ) ) {
                return true;
            }
        }

        let child = fiber.child;

        while ( child !== null ) {
            stack.push( child );
            child = child.sibling;
        }
    }

    return false;
}

const commitHooks: Array<( ... args: Array<any> ) => any> = [];

export function onCommitRoot(): void {
    if ( supportsTestSelectors ) {
        commitHooks.forEach( commitHook => commitHook() );
    }
}

export type IntersectionObserverOptions = Record<string, any>;
export type ObserveVisibleRectsCallback = ( intersections: Array<{
    ratio: number;
    rect: BoundingRect;
}> ) => void;

export function observeVisibleRects( hostRoot: Instance, selectors: Array<Selector>, callback: ( intersections: Array<{
    ratio: number;
    rect: BoundingRect;
}> ) => void, options?: IntersectionObserverOptions ): {
    disconnect: () => void;
} {
    if ( ! supportsTestSelectors ) {
        throw new Error( "Test selector API is not supported by this renderer." );
    }

    const instanceRoots = findAllNodes( hostRoot, selectors );
    const {
        disconnect,
        observe,
        unobserve
    } = setupIntersectionObserver( instanceRoots, callback, options );

    // When React mutates the host environment, we may need to change what we're listening to.
    const commitHook = () => {
        const nextInstanceRoots = findAllNodes( hostRoot, selectors );
        instanceRoots.forEach( target => {
            if ( nextInstanceRoots.indexOf( target ) < 0 ) {
                unobserve( target );
            }
        } );
        nextInstanceRoots.forEach( target => {
            if ( instanceRoots.indexOf( target ) < 0 ) {
                observe( target );
            }
        } );
    };

    commitHooks.push( commitHook );
    return {
        disconnect: () => {
            // Stop listening for React mutations:
            const index = commitHooks.indexOf( commitHook );

            if ( index >= 0 ) {
                commitHooks.splice( index, 1 );
            }

            // Disconnect the host observer:
            disconnect();
        }
    };
}

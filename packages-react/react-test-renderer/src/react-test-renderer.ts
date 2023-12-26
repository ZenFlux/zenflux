/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import * as Scheduler from "@zenflux/react-scheduler/mock";

import {
    batchedUpdates,
    createContainer,
    flushSync,
    getPublicRootInstance,
    injectIntoDevTools,
    updateContainer,
} from "@zenflux/react-reconciler/src/react-fiber-reconciler";
import { findCurrentFiberUsingSlowPath } from "@zenflux/react-reconciler/src/react-fiber-tree-reflection";

import getComponentNameFromType from "@zenflux/react-shared/src/get-component-name-from-type";

import ReactVersion from "@zenflux/react-shared/src/react-version";

import { checkPropStringCoercion } from "@zenflux/react-shared/src/check-string-coercion";
import { ConcurrentRoot, LegacyRoot } from "@zenflux/react-shared/src/react-internal-constants/root-tags";
import { allowConcurrentByDefault } from "@zenflux/react-shared/src/react-feature-flags";

import { WorkTag } from "@zenflux/react-shared/src/react-internal-constants/work-tags";

import { getPublicInstance } from "@zenflux/react-test-renderer/src/react-reconciler-test-config";

import type { ReactNodeList } from "@zenflux/react-shared/src/react-types";

import type { Container, Instance, TextInstance, } from "@zenflux/react-test-renderer/src/react-reconciler-test-config";
import type { Fiber, FiberRoot } from "@zenflux/react-shared/src/react-internal-types";

type TestRendererOptions = {
    createNodeMock: ( element: ReactNodeList ) => any,
    unstable_isConcurrent: boolean,
    unstable_strictMode: boolean,
    unstable_concurrentUpdatesByDefault: boolean,
};

type ReactTestRendererJSON = {
    type: string,
    props: { [ propName: string ]: any },
    children: null | Array<ReactTestRendererNode>,
    $$typeof?: symbol, // Optional because we add it with defineProperty().
};
type ReactTestRendererNode = ReactTestRendererJSON | string;

type FindOptions = {
    // performs a "greedy" search: if a matching node is found, will continue
    // to search within the matching node's children. (default: true)
    deep?: boolean,
};

// @ts-ignore
export const act = React.unstable_act;

export type Predicate = ( node: ReactTestInstance ) => boolean;

const defaultTestOptions = {
    createNodeMock: function () {
        return null;
    },
};

function toJSON( inst: Instance | TextInstance ): ReactTestRendererNode | null {
    if ( inst.isHidden ) {
        // Omit timed out children from output entirely. This seems like the least
        // surprising behavior. We could perhaps add a separate API that includes
        // them, if it turns out people need it.
        return null;
    }
    switch ( inst.tag ) {
        case "TEXT":
            return inst.text;
        case "INSTANCE": {
            // We don't include the `children` prop in JSON.
            // Instead, we will include the actual rendered children.
            const { children, ... props } = inst.props;

            let renderedChildren = null;
            if ( inst.children && inst.children.length ) {
                for ( let i = 0 ; i < inst.children.length ; i++ ) {
                    const renderedChild = toJSON( inst.children[ i ] );
                    if ( renderedChild !== null ) {
                        if ( renderedChildren === null ) {
                            renderedChildren = [ renderedChild ];
                        } else {
                            renderedChildren.push( renderedChild );
                        }
                    }
                }
            }
            const json: ReactTestRendererJSON = {
                type: inst.type,
                props: props,
                children: renderedChildren,
            };
            Object.defineProperty( json, "$$typeof", {
                value: Symbol.for( "react.test.json" ),
            } );
            return json;
        }
        default:
            throw new Error( `Unexpected node type in toJSON: ${ ( inst as any ).tag }` );
    }
}

function childrenToTree( node: null | Fiber ) {
    if ( ! node ) {
        return null;
    }
    const children = nodeAndSiblingsArray( node );
    if ( children.length === 0 ) {
        return null;
    } else if ( children.length === 1 ) {
        return toTree( children[ 0 ] );
    }
    return flatten( children.map( toTree ) );
}

function nodeAndSiblingsArray( nodeWithSibling: Fiber ) {
    const array = [];
    let node = nodeWithSibling;
    while ( node != null ) {
        array.push( node );
        node = node.sibling;
    }
    return array;
}

function flatten( arr: any[] ) {
    const result = [];
    const stack = [ { i: 0, array: arr } ];
    while ( stack.length ) {
        const n = stack.pop();
        while ( n.i < n.array.length ) {
            const el = n.array[ n.i ];
            n.i += 1;
            if ( Array.isArray( el ) ) {
                stack.push( n );
                stack.push( { i: 0, array: el } );
                break;
            }
            result.push( el );
        }
    }
    return result;
}

function toTree( node: null | Fiber ) {
    if ( node == null ) {
        return null;
    }
    switch ( node.tag ) {
        case WorkTag.HostRoot:
            return childrenToTree( node.child );
        case WorkTag.HostPortal:
            return childrenToTree( node.child );
        case WorkTag.ClassComponent:
            return {
                nodeType: "component",
                type: node.type,
                props: { ... node.memoizedProps },
                instance: node.stateNode,
                rendered: childrenToTree( node.child ),
            };
        case WorkTag.FunctionComponent:
        case WorkTag.SimpleMemoComponent:
            return {
                nodeType: "component",
                type: node.type,
                props: { ... node.memoizedProps },
                instance: null,
                rendered: childrenToTree( node.child ),
            };
        case WorkTag.HostHoistable:
        case WorkTag.HostSingleton:
        case WorkTag.HostComponent: {
            return {
                nodeType: "host",
                type: node.type,
                props: { ... node.memoizedProps },
                instance: null, // TODO: use createNodeMock here somehow?
                rendered: flatten( nodeAndSiblingsArray( node.child ).map( toTree ) ),
            };
        }
        case WorkTag.HostText:
            return node.stateNode.text;
        case WorkTag.Fragment:
        case WorkTag.ContextProvider:
        case WorkTag.ContextConsumer:
        case WorkTag.Mode:
        case WorkTag.Profiler:
        case WorkTag.ForwardRef:
        case WorkTag.MemoComponent:
        case WorkTag.IncompleteClassComponent:
        case WorkTag.ScopeComponent:
            return childrenToTree( node.child );
        default:
            throw new Error(
                `toTree() does not yet know how to handle nodes with tag=${ node.tag }`,
            );
    }
}

const validWrapperTypes = new Set( [
    WorkTag.FunctionComponent,
    WorkTag.ClassComponent,
    WorkTag.HostComponent,
    WorkTag.ForwardRef,
    WorkTag.MemoComponent,
    WorkTag.SimpleMemoComponent,
    // Normally skipped, but used when there's more than one root child.
    WorkTag.HostRoot,
] );

function getChildren( parent: Fiber ) {
    const children = [];
    const startingNode = parent;
    let node: Fiber = startingNode;
    if ( node.child === null ) {
        return children;
    }
    node.child.return = node;
    node = node.child;
    outer: while ( true ) {
        let descend = false;
        if ( validWrapperTypes.has( node.tag ) ) {
            children.push( wrapFiber( node ) );
        } else if ( node.tag === WorkTag.HostText ) {
            if ( __DEV__ ) {
                checkPropStringCoercion( node.memoizedProps, "memoizedProps" );
            }
            children.push( "" + node.memoizedProps );
        } else {
            descend = true;
        }
        if ( descend && node.child !== null ) {
            node.child.return = node;
            node = node.child;
            continue;
        }
        while ( node.sibling === null ) {
            if ( node.return === startingNode ) {
                break outer;
            }
            node = ( node.return as any );
        }
        node.sibling.return = node.return;
        node = node.sibling;
    }
    return children;
}

class ReactTestInstance {
    public _fiber: Fiber;

    public _currentFiber(): Fiber {
        // Throws if this component has been unmounted.
        const fiber = findCurrentFiberUsingSlowPath( this._fiber );

        if ( fiber === null ) {
            throw new Error(
                "Can't read from currently-mounting component. This error is likely " +
                "caused by a bug in React. Please file an issue.",
            );
        }

        return fiber;
    }

    public constructor( fiber: Fiber ) {
        if ( ! validWrapperTypes.has( fiber.tag ) ) {
            throw new Error(
                `Unexpected object passed to ReactTestInstance constructor (tag: ${ fiber.tag }). ` +
                "This is probably a bug in React.",
            );
        }

        this._fiber = fiber;
    }

    public get instance() {
        const tag = this._fiber.tag;
        if (
            tag === WorkTag.HostComponent ||
            tag === WorkTag.HostHoistable ||
            tag === WorkTag.HostSingleton
        ) {
            return getPublicInstance( this._fiber.stateNode );
        } else {
            return this._fiber.stateNode;
        }
    }

    public get type(): any {
        return this._fiber.type;
    }

    public get props(): Object {
        return this._currentFiber().memoizedProps;
    }

    public get parent(): ReactTestInstance {
        let parent = this._fiber.return;
        while ( parent !== null ) {
            if ( validWrapperTypes.has( parent.tag ) ) {
                if ( parent.tag === WorkTag.HostRoot ) {
                    // Special case: we only "materialize" instances for roots
                    // if they have more than a single child. So we'll check that now.
                    if ( getChildren( parent ).length < 2 ) {
                        return null;
                    }
                }
                return wrapFiber( parent );
            }
            parent = parent.return;
        }
        return null;
    }

    public get children(): Array<ReactTestInstance | string> {
        return getChildren( this._currentFiber() );
    }

    // Custom search functions
    public find( predicate: Predicate ): ReactTestInstance {
        return expectOne(
            this.findAll( predicate, { deep: false } ),
            `matching custom predicate: ${ predicate.toString() }`,
        );
    }

    public findByType( type: any ): ReactTestInstance {
        return expectOne(
            this.findAllByType( type, { deep: false } ),
            `with node type: "${ getComponentNameFromType( type ) || "Unknown" }"`,
        );
    }

    public findByProps( props: Object ): ReactTestInstance {
        return expectOne(
            this.findAllByProps( props, { deep: false } ),
            `with props: ${ JSON.stringify( props ) }`,
        );
    }

    public findAll(
        predicate: Predicate,
        options: FindOptions = null,
    ): Array<ReactTestInstance> {
        return findAll( this, predicate, options );
    }

    public findAllByType(
        type: any,
        options: FindOptions = null,
    ): Array<ReactTestInstance> {
        return findAll( this, node => node.type === type, options );
    }

    public findAllByProps(
        props: Object,
        options: FindOptions = null,
    ): Array<ReactTestInstance> {
        return findAll(
            this,
            node => node.props && propsMatch( node.props, props ),
            options,
        );
    }
}

function findAll(
    root: ReactTestInstance,
    predicate: Predicate,
    options: FindOptions,
): Array<ReactTestInstance> {
    const deep = options ? options.deep : true;
    const results = [];

    if ( predicate( root ) ) {
        results.push( root );
        if ( ! deep ) {
            return results;
        }
    }

    root.children.forEach( child => {
        if ( typeof child === "string" ) {
            return;
        }
        results.push( ... findAll( child, predicate, options ) );
    } );

    return results;
}

function expectOne(
    all: Array<ReactTestInstance>,
    message: string,
): ReactTestInstance {
    if ( all.length === 1 ) {
        return all[ 0 ];
    }

    const prefix =
        all.length === 0
            ? "No instances found "
            : `Expected 1 but found ${ all.length } instances `;

    throw new Error( prefix + message );
}

function propsMatch( props: Object, filter: Object ): boolean {
    for ( const key in filter ) {
        if ( props[ key ] !== filter[ key ] ) {
            return false;
        }
    }
    return true;
}

function onRecoverableError( error: Error ) {
    // TODO: Expose onRecoverableError option to userspace
    console.error( error );
}

function create(
    element: ReactNodeList,
    options: TestRendererOptions,
): {
    _Scheduler: any,
    root: void,
    toJSON(): Array<ReactTestRendererNode> | ReactTestRendererNode | null,
    toTree(): any,
    update( newElement: ReactNodeList ): any,
    unmount(): void,
    getInstance(): any,
    unstable_flushSync: any,
} {
    let createNodeMock: ( element: ReactNodeList ) => any = defaultTestOptions.createNodeMock;
    let isConcurrent = false;
    let isStrictMode = false;
    let concurrentUpdatesByDefault = null;
    if ( typeof options === "object" && options !== null ) {
        if ( typeof options.createNodeMock === "function" ) {
            createNodeMock = options.createNodeMock;
        }
        if ( options.unstable_isConcurrent === true ) {
            isConcurrent = true;
        }
        if ( options.unstable_strictMode === true ) {
            isStrictMode = true;
        }
        if ( allowConcurrentByDefault ) {
            if ( options.unstable_concurrentUpdatesByDefault !== undefined ) {
                concurrentUpdatesByDefault =
                    options.unstable_concurrentUpdatesByDefault;
            }
        }
    }
    let container: Container = {
        children: [],
        createNodeMock,
        tag: "CONTAINER",
    };
    let root: FiberRoot | null = createContainer(
        container,
        isConcurrent ? ConcurrentRoot : LegacyRoot,
        null,
        isStrictMode,
        concurrentUpdatesByDefault,
        "",
        onRecoverableError,
        null,
    );

    if ( root === null ) {
        throw new Error( "something went wrong" );
    }

    updateContainer( element, root, null, null );

    const entry = {
        _Scheduler: Scheduler,

        root: undefined, // makes flow happy
        // we define a 'getter' for 'root' below using 'Object.defineProperty'
        toJSON(): Array<ReactTestRendererNode> | ReactTestRendererNode | null {
            if ( root == null || root.current == null || container == null ) {
                return null;
            }
            if ( container.children.length === 0 ) {
                return null;
            }
            if ( container.children.length === 1 ) {
                return toJSON( container.children[ 0 ] );
            }
            if (
                container.children.length === 2 &&
                container.children[ 0 ].isHidden === true &&
                container.children[ 1 ].isHidden === false
            ) {
                // Omit timed out children from output entirely, including the fact that we
                // temporarily wrap fallback and timed out children in an array.
                return toJSON( container.children[ 1 ] );
            }
            let renderedChildren = null;
            if ( container.children && container.children.length ) {
                for ( let i = 0 ; i < container.children.length ; i++ ) {
                    const renderedChild = toJSON( container.children[ i ] );
                    if ( renderedChild !== null ) {
                        if ( renderedChildren === null ) {
                            renderedChildren = [ renderedChild ];
                        } else {
                            renderedChildren.push( renderedChild );
                        }
                    }
                }
            }
            return renderedChildren;
        },
        toTree() {
            if ( root == null || root.current == null ) {
                return null;
            }
            return toTree( root.current );
        },
        update( newElement: ReactNodeList ): number | void {
            if ( root == null || root.current == null ) {
                return;
            }
            updateContainer( newElement, root, null, null );
        },
        unmount() {
            if ( root == null || root.current == null ) {
                return;
            }
            updateContainer( null, root, null, null );
            // $FlowFixMe[incompatible-type] found when upgrading Flow
            container = null;
            root = null;
        },
        getInstance() {
            if ( root == null || root.current == null ) {
                return null;
            }
            return getPublicRootInstance( root );
        },

        unstable_flushSync: flushSync,
    };

    Object.defineProperty(
        entry,
        "root",
        ( {
            configurable: true,
            enumerable: true,
            get: function () {
                {
                    if ( root === null ) {
                        throw new Error( "Can't access .root on unmounted test renderer" );
                    }
                    const children = getChildren( root.current );
                    if ( children.length === 0 ) {
                        throw new Error( "Can't access .root on unmounted test renderer" );
                    } else if ( children.length === 1 ) {
                        // Normally, we skip the root and just give you the child.
                        return children[ 0 ];
                    } else {
                        // However, we give you the root if there's more than one root child.
                        // We could make this the behavior for all cases but it would be a breaking change.
                        // $FlowFixMe[incompatible-use] found when upgrading Flow
                        return wrapFiber( root.current );
                    }
                }
            }
        } )
    );

    return entry;
}

const fiberToWrapper = new WeakMap<Fiber, ReactTestInstance>();

function wrapFiber( fiber: Fiber ): ReactTestInstance {
    let wrapper = fiberToWrapper.get( fiber );
    if ( wrapper === undefined && fiber.alternate !== null ) {
        wrapper = fiberToWrapper.get( fiber.alternate );
    }
    if ( wrapper === undefined ) {
        wrapper = new ReactTestInstance( fiber );
        fiberToWrapper.set( fiber, wrapper );
    }
    return wrapper;
}

// Enable ReactTestRenderer to be used to test DevTools integration.
injectIntoDevTools( {
    findFiberByHostInstance: ( () => {
        throw new Error( "TestRenderer does not support findFiberByHostInstance()" );
    } ),
    bundleType: __DEV__ ? 1 : 0,
    version: ReactVersion,
    rendererPackageName: "react-test-renderer",
} );

export {
    Scheduler as _Scheduler,
    create,
    batchedUpdates as unstable_batchedUpdates,
};

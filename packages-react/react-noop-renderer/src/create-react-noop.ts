/**
 * This is a renderer of React that doesn't have a render target output.
 * It is useful to demonstrate the internals of the reconciler in isolation
 * and for testing semantics of reconciliation separate from the host
 * environment.
 */

import * as Scheduler from "@zenflux/react-scheduler/mock";

import { checkPropStringCoercion } from "@zenflux/react-shared/src/check-string-coercion";

import { REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE } from "@zenflux/react-shared/src/react-symbols";

import { DefaultEventPriority, IdleEventPriority } from "@zenflux/react-reconciler/src/react-event-priorities";

import { ConcurrentRoot, LegacyRoot } from "@zenflux/react-shared/src/react-internal-constants/root-tags";

import type React from "react";

import type { RootTag } from "@zenflux/react-shared/src/react-internal-constants/root-tags";

import type { reactReconciler } from "@zenflux/react-reconciler";
import type { Fiber, PublicInstance, ReactReconcilerConfig } from "@zenflux/react-reconciler/src/react-fiber-config";

import type { FiberUpdateQueue, TransitionTracingCallbacks } from "@zenflux/react-shared/src/react-internal-types";

import type { ReactNodeList } from "@zenflux/react-shared/src/react-types";
import type { TransitionStatus } from "@zenflux/react-shared/src/react-internal-types/transition";

type Container = {
    rootID: string;
    children: Array<Instance | TextInstance>;
    pendingChildren: Array<Instance | TextInstance>;
};
type Props = {
    prop: any;
    hidden: boolean;
    children?: unknown;
    bottom?: null | number;
    left?: null | number;
    right?: null | number;
    top?: null | number;
    src?: string;
};
export type Instance = {
    type: string;
    id: number;
    parent: number;
    children: Array<Instance | TextInstance>;
    text: string | null;
    prop: any;
    hidden: boolean;
    context: HostContext;
};
type TextInstance = {
    text: string;
    id: number;
    parent: number;
    hidden: boolean;
    context: HostContext;
};
type HostContext = Record<string, any>;
type CreateRootOptions = {
    unstable_transitionCallbacks?: TransitionTracingCallbacks;
};
type SuspenseyCommitSubscription = {
    pendingCount: number;
    commit: null | ( () => void );
};
const NO_CONTEXT = {};
const UPPERCASE_CONTEXT = {};

// TODO: Use `zenflux-react-shared`
const __DEV__ = process.env.NODE_ENV === "development";

if ( __DEV__ ) {
    Object.freeze( NO_CONTEXT );
}

async function createReactNoop( reconciler: typeof reactReconciler, useMutation: boolean ) {
    let instanceCounter = 0;
    let hostUpdateCounter = 0;
    let hostCloneCounter = 0;

    function appendChildToContainerOrInstance( parentInstance: Container | Instance, child: Instance | TextInstance ): void {
        const prevParent = child.parent;

        if ( prevParent !== -1 && prevParent !== ( parentInstance as Instance ).id ) {
            throw new Error( "Reparenting is not allowed" );
        }

        child.parent = ( parentInstance as Instance ).id;
        const index = parentInstance.children.indexOf( child );

        if ( index !== -1 ) {
            parentInstance.children.splice( index, 1 );
        }

        parentInstance.children.push( child );
    }

    function appendChildToContainer( parentInstance: Container, child: Instance | TextInstance ): void {
        if ( typeof parentInstance.rootID !== "string" ) {
            // Some calls to this aren't typesafe.
            // This helps surface mistakes in tests.
            throw new Error( "appendChildToContainer() first argument is not a container." );
        }

        appendChildToContainerOrInstance( parentInstance, child );
    }

    function appendChild( parentInstance: Instance, child: Instance | TextInstance ): void {
        if ( typeof ( parentInstance as any ).rootID === "string" ) {
            // Some calls to this aren't typesafe.
            // This helps surface mistakes in tests.
            throw new Error( "appendChild() first argument is not an instance." );
        }

        appendChildToContainerOrInstance( parentInstance, child );
    }

    function insertInContainerOrInstanceBefore( parentInstance: Container | Instance, child: Instance | TextInstance, beforeChild: Instance | TextInstance ): void {
        const index = parentInstance.children.indexOf( child );

        if ( index !== -1 ) {
            parentInstance.children.splice( index, 1 );
        }

        const beforeIndex = parentInstance.children.indexOf( beforeChild );

        if ( beforeIndex === -1 ) {
            throw new Error( "This child does not exist." );
        }

        parentInstance.children.splice( beforeIndex, 0, child );
    }

    function insertInContainerBefore( parentInstance: Container, child: Instance | TextInstance, beforeChild: Instance | TextInstance ) {
        if ( typeof parentInstance.rootID !== "string" ) {
            // Some calls to this aren't typesafe.
            // This helps surface mistakes in tests.
            throw new Error( "insertInContainerBefore() first argument is not a container." );
        }

        insertInContainerOrInstanceBefore( parentInstance, child, beforeChild );
    }

    function insertBefore( parentInstance: Instance, child: Instance | TextInstance, beforeChild: Instance | TextInstance ) {
        if ( typeof ( parentInstance as any ).rootID === "string" ) {
            // Some calls to this aren't typesafe.
            // This helps surface mistakes in tests.
            throw new Error( "insertBefore() first argument is not an instance." );
        }

        insertInContainerOrInstanceBefore( parentInstance, child, beforeChild );
    }

    function clearContainer( container: Container ): void {
        container.children.splice( 0 );
    }

    function removeChildFromContainerOrInstance( parentInstance: Container | Instance, child: Instance | TextInstance ): void {
        const index = parentInstance.children.indexOf( child );

        if ( index === -1 ) {
            throw new Error( "This child does not exist." );
        }

        parentInstance.children.splice( index, 1 );
    }

    function removeChildFromContainer( parentInstance: Container, child: Instance | TextInstance ): void {
        if ( typeof parentInstance.rootID !== "string" ) {
            // Some calls to this aren't typesafe.
            // This helps surface mistakes in tests.
            throw new Error( "removeChildFromContainer() first argument is not a container." );
        }

        removeChildFromContainerOrInstance( parentInstance, child );
    }

    function removeChild( parentInstance: Instance, child: Instance | TextInstance ): void {
        if ( typeof ( parentInstance as any ).rootID === "string" ) {
            // Some calls to this aren't typesafe.
            // This helps surface mistakes in tests.
            throw new Error( "removeChild() first argument is not an instance." );
        }

        removeChildFromContainerOrInstance( parentInstance, child );
    }

    function cloneInstance( instance: Instance, type: string, oldProps: Props, newProps: Props, keepChildren: boolean, children: ReadonlyArray<Instance> | null | undefined ): Instance {
        if ( __DEV__ ) {
            checkPropStringCoercion( newProps.children, "children" );
        }

        const cloneBase = {
            id: instance.id,
            type: type,
            parent: instance.parent,
            children: keepChildren ? instance.children : children ?? [],
            text: shouldSetTextContent( type, newProps ) ? computeText( ( newProps.children as any ) + "", instance.context ) : null,
            prop: newProps.prop,
            hidden: !! newProps.hidden,
            context: instance.context
        };

        const clone: typeof cloneBase & { src?: string } = cloneBase;

        if ( type === "suspensey-thing" && typeof newProps.src === "string" ) {
            clone.src = newProps.src;
        }

        Object.defineProperty( clone, "id", {
            value: clone.id,
            enumerable: false
        } );
        Object.defineProperty( clone, "parent", {
            value: clone.parent,
            enumerable: false
        } );
        Object.defineProperty( clone, "text", {
            value: clone.text,
            enumerable: false
        } );
        Object.defineProperty( clone, "context", {
            value: clone.context,
            enumerable: false
        } );
        hostCloneCounter++;

        return clone as Instance;
    }

    function shouldSetTextContent( type: string, props: Props ): boolean {
        if ( type === "errorInBeginPhase" ) {
            throw new Error( "Error in host config." );
        }

        return typeof props.children === "string" || typeof props.children === "number";
    }

    function computeText( rawText, hostContext ) {
        return hostContext === UPPERCASE_CONTEXT ? rawText.toUpperCase() : rawText;
    }

    type SuspenseyThingRecord = {
        status: "pending" | "fulfilled";
        subscriptions: Array<SuspenseyCommitSubscription> | null;
    };
    let suspenseyThingCache: Map<string, SuspenseyThingRecord> | null = null;
    // Represents a subscription for all the suspensey things that block a
    // particular commit. Once they've all loaded, the commit phase can proceed.
    let suspenseyCommitSubscription: SuspenseyCommitSubscription | null = null;

    function startSuspendingCommit(): void {
        // This is where we might suspend on things that aren't associated with a
        // particular node, like document.fonts.ready.
        suspenseyCommitSubscription = null;
    }

    function suspendInstance( type: string, props: Props ): void {
        const src = props.src;

        if ( type === "suspensey-thing" && typeof src === "string" ) {
            // Attach a listener to the suspensey thing and create a subscription
            // object that uses reference counting to track when all the suspensey
            // things have loaded.
            const record = suspenseyThingCache.get( src );

            if ( record === undefined ) {
                throw new Error( "Could not find record for key." );
            }

            if ( record.status === "fulfilled" ) {// Already loaded.
            } else if ( record.status === "pending" ) {
                if ( suspenseyCommitSubscription === null ) {
                    suspenseyCommitSubscription = {
                        pendingCount: 1,
                        commit: null
                    };
                } else {
                    suspenseyCommitSubscription.pendingCount++;
                }

                // Stash the subscription on the record. In `resolveSuspenseyThing`,
                // we'll use this fire the commit once all the things have loaded.
                if ( record.subscriptions === null ) {
                    record.subscriptions = [];
                }

                record.subscriptions.push( suspenseyCommitSubscription );
            }
        } else {
            throw new Error( "Did not expect this host component to be visited when suspending " + "the commit. Did you check the SuspendCommit flag?" );
        }
    }

    function waitForCommitToBeReady(): ( ( commit: () => unknown ) => () => void ) | null {
        const subscription = suspenseyCommitSubscription;

        if ( subscription !== null ) {
            suspenseyCommitSubscription = null;
            return ( commit: () => void ) => {
                subscription.commit = commit;

                const cancelCommit = () => {
                    subscription.commit = null;
                };

                return cancelCommit;
            };
        }

        return null;
    }

    const sharedHostConfig = {
        supportsSingletons: false,

        getRootHostContext() {
            return NO_CONTEXT;
        },

        getChildHostContext( parentHostContext: HostContext, type: string ) {
            if ( type === "offscreen" ) {
                return parentHostContext;
            }

            if ( type === "uppercase" ) {
                return UPPERCASE_CONTEXT;
            }

            return NO_CONTEXT;
        },

        getPublicInstance( instance ) {
            return instance;
        },

        createInstance( type: string, props: Props, rootContainerInstance: Container, hostContext: HostContext, internalInstanceHandle: Record<string, any> ): Instance {
            if ( type === "errorInCompletePhase" ) {
                throw new Error( "Error in host config." );
            }

            if ( __DEV__ ) {
                // The `if` statement here prevents auto-disabling of the safe coercion
                // ESLint rule, so we must manually disable it below.
                if ( shouldSetTextContent( type, props ) ) {
                    checkPropStringCoercion( props.children, "children" );
                }
            }

            const baseInst = {
                id: instanceCounter++,
                type: type,
                children: [],
                parent: -1,
                text: shouldSetTextContent( type, props ) ?
                    computeText( ( props.children as any ) + "", hostContext ) : null,
                prop: props.prop,
                hidden: !! props.hidden,
                context: hostContext
            };

            const inst: typeof baseInst & { src?: string } = baseInst;

            if ( type === "suspensey-thing" && typeof props.src === "string" ) {
                inst.src = props.src;
            }

            // Hide from unit tests
            Object.defineProperty( inst, "id", {
                value: inst.id,
                enumerable: false
            } );
            Object.defineProperty( inst, "parent", {
                value: inst.parent,
                enumerable: false
            } );
            Object.defineProperty( inst, "text", {
                value: inst.text,
                enumerable: false
            } );
            Object.defineProperty( inst, "context", {
                value: inst.context,
                enumerable: false
            } );
            Object.defineProperty( inst, "fiber", {
                value: internalInstanceHandle,
                enumerable: false
            } );
            return inst;
        },

        appendInitialChild( parentInstance: Instance, child: Instance | TextInstance ): void {
            const prevParent = child.parent;

            if ( prevParent !== -1 && prevParent !== parentInstance.id ) {
                throw new Error( "Reparenting is not allowed" );
            }

            child.parent = parentInstance.id;
            parentInstance.children.push( child );
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        finalizeInitialChildren( domElement: Instance, type: string, props: Props ): boolean {
            return false;
        },

        shouldSetTextContent,

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        createTextInstance( text: string, rootContainerInstance: Container, hostContext: Record<string, any>, internalInstanceHandle: Record<string, any> ): TextInstance {
            if ( hostContext === UPPERCASE_CONTEXT ) {
                text = text.toUpperCase();
            }

            const inst = {
                text: text,
                id: instanceCounter++,
                parent: -1,
                hidden: false,
                context: hostContext
            };
            // Hide from unit tests
            Object.defineProperty( inst, "id", {
                value: inst.id,
                enumerable: false
            } );
            Object.defineProperty( inst, "parent", {
                value: inst.parent,
                enumerable: false
            } );
            Object.defineProperty( inst, "context", {
                value: inst.context,
                enumerable: false
            } );
            return inst;
        },

        scheduleTimeout: setTimeout,
        cancelTimeout: clearTimeout,
        noTimeout: -1,
        supportsMicrotasks: true,
        scheduleMicrotask: typeof queueMicrotask === "function" ? queueMicrotask : typeof Promise !== "undefined" ? callback => Promise.resolve( null ).then( callback ).catch( error => {
            setTimeout( () => {
                throw error;
            } );
        } ) : setTimeout,

        prepareForCommit(): null | Record<string, any> {
            return null;
        },

        resetAfterCommit(): void {
        },

        getCurrentEventPriority() {
            return currentEventPriority;
        },

        shouldAttemptEagerTransition(): boolean {
            return false;
        },

        now: Scheduler.unstable_now,
        isPrimaryRenderer: true,
        warnsIfNotActing: true,
        supportsHydration: false,

        getInstanceFromNode() {
            throw new Error( "Not yet implemented." );
        },

        beforeActiveInstanceBlur() {// NO-OP
        },

        afterActiveInstanceBlur() {// NO-OP
        },

        preparePortalMount() {// NO-OP
        },

        prepareScopeUpdate() {
        },

        getInstanceFromScope() {
            throw new Error( "Not yet implemented." );
        },

        detachDeletedInstance() {
        },

        logRecoverableError() {// no-op
        },

        requestPostPaintCallback( callback ) {
            const endTime = Scheduler.unstable_now();
            callback( endTime );
        },

        maySuspendCommit( type: string, props: Props ): boolean {
            // Asks whether it's possible for this combination of type and props
            // to ever need to suspend. This is different from asking whether it's
            // currently ready because even if it's ready now, it might get purged
            // from the cache later.
            return type === "suspensey-thing" && typeof props.src === "string";
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        mayResourceSuspendCommit( resource: unknown ): boolean {
            throw new Error( "Resources are not implemented for React Noop yet. This method should not be called" );
        },

        preloadInstance( type: string, props: Props & { onLoadStart: Function, src: string } ): boolean {
            if ( type !== "suspensey-thing" || typeof props.src !== "string" ) {
                throw new Error( "Attempted to preload unexpected instance: " + type );
            }

            // In addition to preloading an instance, this method asks whether the
            // instance is ready to be committed. If it's not, React may yield to the
            // main thread and ask again. It's possible a load event will fire in
            // between, in which case we can avoid showing a fallback.
            if ( suspenseyThingCache === null ) {
                suspenseyThingCache = new Map();
            }

            const record = suspenseyThingCache.get( props.src );

            if ( record === undefined ) {
                const newRecord: SuspenseyThingRecord = {
                    status: "pending",
                    subscriptions: null
                };
                suspenseyThingCache.set( props.src, newRecord );
                const onLoadStart = props.onLoadStart;

                if ( typeof onLoadStart === "function" ) {
                    onLoadStart();
                }

                return false;
            } else {
                // If this is false, React will trigger a fallback, if needed.
                return record.status === "fulfilled";
            }
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        preloadResource( resource: unknown ): boolean {
            throw new Error( "Resources are not implemented for React Noop yet. This method should not be called" );
        },

        startSuspendingCommit,
        suspendInstance,

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        suspendResource( resource: unknown ): void {
            throw new Error( "Resources are not implemented for React Noop yet. This method should not be called" );
        },

        waitForCommitToBeReady,
        NotPendingTransition: ( null as TransitionStatus )
    };
    // @ts-ignore
    const hostConfig: ReactReconcilerConfig = useMutation ? {
        ... sharedHostConfig,
        supportsMutation: true,
        supportsPersistence: false,

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        commitMount( instance: Instance, type: string, newProps: Props ): void {// Noop
        },

        commitUpdate( instance: Instance & { src: string }, updatePayload: Record<string, any>, type: string, oldProps: Props, newProps: Props ): void {
            if ( oldProps === null ) {
                throw new Error( "Should have old props" );
            }

            hostUpdateCounter++;
            instance.prop = newProps.prop;
            instance.hidden = !! newProps.hidden;

            if ( type === "suspensey-thing" && typeof newProps.src === "string" ) {
                instance.src = newProps.src;
            }

            if ( shouldSetTextContent( type, newProps ) ) {
                if ( __DEV__ ) {
                    checkPropStringCoercion( newProps.children, "children" );
                }

                instance.text = computeText( ( newProps.children as any ) + "", instance.context );
            }
        },

        commitTextUpdate( textInstance: TextInstance, oldText: string, newText: string ): void {
            hostUpdateCounter++;
            textInstance.text = computeText( newText, textInstance.context );
        },

        appendChild,
        appendChildToContainer,
        insertBefore,
        insertInContainerBefore,
        removeChild,
        removeChildFromContainer,
        clearContainer,

        hideInstance( instance: Instance ): void {
            instance.hidden = true;
        },

        hideTextInstance( textInstance: TextInstance ): void {
            textInstance.hidden = true;
        },

        unhideInstance( instance: Instance, props: Props ): void {
            if ( ! props.hidden ) {
                instance.hidden = false;
            }
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        unhideTextInstance( textInstance: TextInstance, text: string ): void {
            textInstance.hidden = false;
        },

        resetTextContent( instance: Instance ): void {
            instance.text = null;
        }

    } : {
        ... sharedHostConfig,
        supportsMutation: false,
        supportsPersistence: true,
        cloneInstance,
        clearContainer,

        createContainerChildSet(): Array<Instance | TextInstance> {
            return [];
        },

        appendChildToContainerChildSet( childSet: Array<Instance | TextInstance>, child: Instance | TextInstance ): void {
            childSet.push( child );
        },

        finalizeContainerChildren( container: Container, newChildren: Array<Instance | TextInstance> ): void {
            container.pendingChildren = newChildren;

            if ( newChildren.length === 1 && newChildren[ 0 ].text === "Error when completing root" ) {
                // Trigger an error for testing purposes
                throw Error( "Error when completing root" );
            }
        },

        replaceContainerChildren( container: Container, newChildren: Array<Instance | TextInstance> ): void {
            container.children = newChildren;
        },

        cloneHiddenInstance( instance: Instance, type: string, props: Props ): Instance {
            const clone = cloneInstance( instance, type, props, props, true, null );
            clone.hidden = true;
            return clone;
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        cloneHiddenTextInstance( instance: TextInstance, text: string ): TextInstance {
            const clone = {
                text: instance.text,
                id: instance.id,
                parent: instance.parent,
                hidden: true,
                context: instance.context
            };
            // Hide from unit tests
            Object.defineProperty( clone, "id", {
                value: clone.id,
                enumerable: false
            } );
            Object.defineProperty( clone, "parent", {
                value: clone.parent,
                enumerable: false
            } );
            Object.defineProperty( clone, "context", {
                value: clone.context,
                enumerable: false
            } );
            return clone;
        }

    };
    const NoopRenderer = await reconciler( hostConfig );
    const rootContainers = new Map();
    const roots = new Map();
    const DEFAULT_ROOT_ID = "<default>";
    let currentEventPriority = DefaultEventPriority;

    function childToJSX( child, text ) {
        if ( text !== null ) {
            return text;
        }

        if ( child === null ) {
            return null;
        }

        if ( typeof child === "string" ) {
            return child;
        }

        if ( Array.isArray( child ) ) {
            if ( child.length === 0 ) {
                return null;
            }

            if ( child.length === 1 ) {
                return childToJSX( child[ 0 ], null );
            }

            const children = child.map( c => childToJSX( c, null ) );

            if ( children.every( c => typeof c === "string" || typeof c === "number" ) ) {
                return children.join( "" );
            }

            return children;
        }

        if (  Array.isArray( child.children ) ) {
            // This is an instance.
            const instance: Instance & { src: string } = ( child as any );
            const children = childToJSX( instance.children, instance.text );
            const props = ( {
                prop: instance.prop
            } as any );

            if ( instance.hidden ) {
                props.hidden = true;
            }

            if ( instance.src ) {
                props.src = instance.src;
            }

            if ( children !== null ) {
                props.children = children;
            }

            return {
                $$typeof: REACT_ELEMENT_TYPE,
                type: instance.type,
                key: null,
                ref: null,
                props: props,
                _owner: null,
                _store: __DEV__ ? {} : undefined
            };
        }

        // This is a text instance
        const textInstance: TextInstance = ( child as any );

        if ( textInstance.hidden ) {
            return "";
        }

        return textInstance.text;
    }

    function getChildren( root ) {
        if ( root ) {
            return root.children;
        } else {
            return null;
        }
    }

    function getPendingChildren( root ) {
        if ( root ) {
            return root.children;
        } else {
            return null;
        }
    }

    function getChildrenAsJSX( root ) {
        const children = childToJSX( getChildren( root ), null );

        if ( children === null ) {
            return null;
        }

        if ( Array.isArray( children ) ) {
            return {
                $$typeof: REACT_ELEMENT_TYPE,
                type: REACT_FRAGMENT_TYPE,
                key: null,
                ref: null,
                props: {
                    children
                },
                _owner: null,
                _store: __DEV__ ? {} : undefined
            };
        }

        return children;
    }

    function getPendingChildrenAsJSX( root ) {
        const children = childToJSX( getChildren( root ), null );

        if ( children === null ) {
            return null;
        }

        if ( Array.isArray( children ) ) {
            return {
                $$typeof: REACT_ELEMENT_TYPE,
                type: REACT_FRAGMENT_TYPE,
                key: null,
                ref: null,
                props: {
                    children
                },
                _owner: null,
                _store: __DEV__ ? {} : undefined
            };
        }

        return children;
    }

    function flushSync<R>( fn: () => R ): R {
        if ( __DEV__ ) {
            if ( NoopRenderer.isAlreadyRendering() ) {
                console.error( "flushSync was called from inside a lifecycle method. React cannot " + "flush when React is already rendering. Consider moving this call to " + "a scheduler task or micro task." );
            }
        }

        return NoopRenderer.flushSync( fn );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function onRecoverableError( error ) {// TODO: Turn this on once tests are fixed
        // console.error(error);
    }

    let idCounter = 0;
    const ReactNoop = {
        _Scheduler: Scheduler,

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        getChildren( rootID: string = DEFAULT_ROOT_ID ) {
            throw new Error( "No longer supported due to bad performance when used with `expect()`. " + "Use `ReactNoop.getChildrenAsJSX()` instead or, if you really need to, `dangerouslyGetChildren` after you carefully considered the warning in its JSDOC." );
        },

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        getPendingChildren( rootID: string = DEFAULT_ROOT_ID ) {
            throw new Error( "No longer supported due to bad performance when used with `expect()`. " + "Use `ReactNoop.getPendingChildrenAsJSX()` instead or, if you really need to, `dangerouslyGetPendingChildren` after you carefully considered the warning in its JSDOC." );
        },

        /**
         * Prefer using `getChildrenAsJSX`.
         * Using the returned children in `.toEqual` has very poor performance on mismatch due to deep equality checking of fiber structures.
         * Make sure you deeply remove enumerable properties before passing it to `.toEqual`, or, better, use `getChildrenAsJSX` or `toMatchRenderedOutput`.
         */
        dangerouslyGetChildren( rootID: string = DEFAULT_ROOT_ID ) {
            const container = rootContainers.get( rootID );
            return getChildren( container );
        },

        /**
         * Prefer using `getPendingChildrenAsJSX`.
         * Using the returned children in `.toEqual` has very poor performance on mismatch due to deep equality checking of fiber structures.
         * Make sure you deeply remove enumerable properties before passing it to `.toEqual`, or, better, use `getChildrenAsJSX` or `toMatchRenderedOutput`.
         */
        dangerouslyGetPendingChildren( rootID: string = DEFAULT_ROOT_ID ) {
            const container = rootContainers.get( rootID );
            return getPendingChildren( container );
        },

        getOrCreateRootContainer( rootID: string = DEFAULT_ROOT_ID, tag: RootTag ) {
            let root = roots.get( rootID );

            if ( ! root ) {
                const container = {
                    rootID: rootID,
                    pendingChildren: [],
                    children: []
                };
                rootContainers.set( rootID, container );
                // @ts-ignore
                root = NoopRenderer.createContainer( container, tag, null, null, false, "", onRecoverableError, null );
                roots.set( rootID, root );
            }

            return root.current.stateNode.containerInfo;
        },

        // TODO: Replace ReactNoop.render with createRoot + root.render
        createRoot( options?: CreateRootOptions ) {
            const container = {
                rootID: "" + idCounter++,
                pendingChildren: [],
                children: []
            };
            // @ts-ignore
            const fiberRoot = NoopRenderer.createContainer( container, ConcurrentRoot, null, null, false, "", onRecoverableError, options && options.unstable_transitionCallbacks ? options.unstable_transitionCallbacks : null );
            return {
                _Scheduler: Scheduler,

                render( children: ReactNodeList ) {
                    NoopRenderer.updateContainer( children, fiberRoot, null, null );
                },

                getChildren() {
                    return getChildren( container );
                },

                getChildrenAsJSX() {
                    return getChildrenAsJSX( container );
                }

            };
        },

        createLegacyRoot() {
            const container = {
                rootID: "" + idCounter++,
                pendingChildren: [],
                children: []
            };
            // @ts-ignore
            const fiberRoot = NoopRenderer.createContainer( container, LegacyRoot, null, null, false, "", onRecoverableError, null );
            return {
                _Scheduler: Scheduler,

                render( children: ReactNodeList ) {
                    NoopRenderer.updateContainer( children, fiberRoot, null, null );
                },

                getChildren() {
                    return getChildren( container );
                },

                getChildrenAsJSX() {
                    return getChildrenAsJSX( container );
                }

            };
        },

        getChildrenAsJSX( rootID: string = DEFAULT_ROOT_ID ) {
            const container = rootContainers.get( rootID );
            return getChildrenAsJSX( container );
        },

        getPendingChildrenAsJSX( rootID: string = DEFAULT_ROOT_ID ) {
            const container = rootContainers.get( rootID );
            return getPendingChildrenAsJSX( container );
        },

        getSuspenseyThingStatus( src ): string | null {
            if ( suspenseyThingCache === null ) {
                return null;
            } else {
                const record = suspenseyThingCache.get( src );
                return record === undefined ? null : record.status;
            }
        },

        resolveSuspenseyThing( key: string ): void {
            if ( suspenseyThingCache === null ) {
                suspenseyThingCache = new Map();
            }

            const record = suspenseyThingCache.get( key );

            if ( record === undefined ) {
                const newRecord: SuspenseyThingRecord = {
                    status: "fulfilled",
                    subscriptions: null
                };
                suspenseyThingCache.set( key, newRecord );
            } else {
                if ( record.status === "pending" ) {
                    record.status = "fulfilled";
                    const subscriptions = record.subscriptions;

                    if ( subscriptions !== null ) {
                        record.subscriptions = null;

                        for ( let i = 0 ; i < subscriptions.length ; i++ ) {
                            const subscription = subscriptions[ i ];
                            subscription.pendingCount--;

                            if ( subscription.pendingCount === 0 ) {
                                const commit = subscription.commit;
                                subscription.commit = null;
                                commit();
                            }
                        }
                    }
                }
            }
        },

        resetSuspenseyThingCache() {
            suspenseyThingCache = null;
        },

        createPortal( children: ReactNodeList, container: Container, key: string | null | undefined = null ) {
            return NoopRenderer.createPortal( children, container, null, key );
        },

        // Shortcut for testing a single root
        render( element: React.ReactElement<React.ComponentProps<any>, any>, callback: ( ( ... args: Array<any> ) => any ) | null | undefined ) {
            ReactNoop.renderToRootWithID( element, DEFAULT_ROOT_ID, callback );
        },

        renderLegacySyncRoot( element: React.ReactElement<React.ComponentProps<any>, any>, callback: ( ( ... args: Array<any> ) => any ) | null | undefined ) {
            const rootID = DEFAULT_ROOT_ID;
            const container = ReactNoop.getOrCreateRootContainer( rootID, LegacyRoot );
            const root = roots.get( container.rootID );
            // @ts-ignore
            NoopRenderer.updateContainer( element, root, null, callback );
        },

        renderToRootWithID( element: React.ReactElement<React.ComponentProps<any>, any>, rootID: string, callback: ( ( ... args: Array<any> ) => any ) | null | undefined ) {
            const container = ReactNoop.getOrCreateRootContainer( rootID, ConcurrentRoot );
            const root = roots.get( container.rootID );
            // @ts-ignore
            NoopRenderer.updateContainer( element, root, null, callback );
        },

        unmountRootWithID( rootID: string ) {
            const root = roots.get( rootID );

            if ( root ) {
                NoopRenderer.updateContainer( null, root, null, () => {
                    roots.delete( rootID );
                    rootContainers.delete( rootID );
                } );
            }
        },

        findInstance( componentOrElement: Element | ( React.Component<any, any> | null | undefined ) ): null | PublicInstance {
            if ( componentOrElement == null ) {
                return null;
            }

            // Unsound duck typing.
            const component = ( componentOrElement as any );

            if ( typeof component.id === "number" ) {
                return component;
            }

            if ( __DEV__ ) {
                return NoopRenderer.findHostInstanceWithWarning( component, "findInstance" );
            }

            return NoopRenderer.findHostInstance( component );
        },

        flushNextYield(): Array<unknown> {
            Scheduler.unstable_flushNumberOfYields( 1 );
            return Scheduler.unstable_clearLog();
        },

        startTrackingHostCounters(): void {
            hostUpdateCounter = 0;
            hostCloneCounter = 0;
        },

        stopTrackingHostCounters(): {
            hostUpdateCounter: number;
        } | {
            hostCloneCounter: number;
        } {
            const result = useMutation ? {
                hostUpdateCounter
            } : {
                hostCloneCounter
            };
            hostUpdateCounter = 0;
            hostCloneCounter = 0;
            return result;
        },

        expire: Scheduler.unstable_advanceTime,

        flushExpired(): void {
            return Scheduler.unstable_flushExpired();
        },

        unstable_runWithPriority: NoopRenderer.runWithPriority.bind( NoopRenderer ),
        batchedUpdates: NoopRenderer.batchedUpdates.bind( NoopRenderer ),
        deferredUpdates: NoopRenderer.deferredUpdates.bind( NoopRenderer ),
        discreteUpdates: NoopRenderer.discreteUpdates.bind( NoopRenderer ),

        idleUpdates<T>( fn: () => T ): T {
            const prevEventPriority = currentEventPriority;
            currentEventPriority = IdleEventPriority;

            try {
                fn();
            } finally {
                currentEventPriority = prevEventPriority;
            }

            return undefined as any;
        },

        flushSync,
        flushPassiveEffects: NoopRenderer.flushPassiveEffects.bind( NoopRenderer ),

        // Logs the current state of the tree.
        dumpTree( rootID: string = DEFAULT_ROOT_ID ) {
            const root = roots.get( rootID );
            const rootContainer = rootContainers.get( rootID );

            if ( ! root || ! rootContainer ) {
                console.log( "Nothing rendered yet." );
                return;
            }

            const bufferedLog = [];

            function log( ... args ) {
                bufferedLog.push( ... args, "\n" );
            }

            function logHostInstances( children: Array<Instance | TextInstance>, depth ) {
                for ( let i = 0 ; i < children.length ; i++ ) {
                    const child = children[ i ];
                    const indent = "  ".repeat( depth );

                    if ( typeof child.text === "string" ) {
                        log( indent + "- " + child.text );
                    } else {
                        log( indent + "- " + (child as Instance).type + "#" + child.id );
                        logHostInstances( (child as Instance).children, depth + 1 );
                    }
                }
            }

            function logContainer( container: Container, depth ) {
                log( "  ".repeat( depth ) + "- [root#" + container.rootID + "]" );
                logHostInstances( container.children, depth + 1 );
            }

            function logUpdateQueue( updateQueue: FiberUpdateQueue<any>, depth ) {
                log( "  ".repeat( depth + 1 ) + "QUEUED UPDATES" );
                const first = updateQueue.firstBaseUpdate;
                const update = first;

                if ( update !== null ) {
                    do {
                        log( "  ".repeat( depth + 1 ) + "~", "[" + update.expirationTime + "]" );
                    } while ( update !== null );
                }

                const lastPending = updateQueue.shared.pending;

                if ( lastPending !== null ) {
                    const firstPending = lastPending.next;
                    const pendingUpdate = firstPending;

                    if ( pendingUpdate !== null ) {
                        do {
                            log( "  ".repeat( depth + 1 ) + "~", "[" + pendingUpdate.expirationTime + "]" );
                        } while ( pendingUpdate !== null && pendingUpdate !== firstPending );
                    }
                }
            }

            function logFiber( fiber: Fiber & { childExpirationTime: number }, depth ) {
                log( "  ".repeat( depth ) + "- " + ( // need to explicitly coerce Symbol to a string
                    fiber.type ? fiber.type.name || fiber.type.toString() : "[root]" ), "[" + fiber.childExpirationTime + ( fiber.pendingProps ? "*" : "" ) + "]" );

                if ( fiber.updateQueue ) {
                    // @ts-ignore
                    logUpdateQueue( fiber.updateQueue, depth );
                }

                // const childInProgress = fiber.progressedChild;
                // if (childInProgress && childInProgress !== fiber.child) {
                //   log(
                //     '  '.repeat(depth + 1) + 'IN PROGRESS: ' + fiber.pendingWorkPriority,
                //   );
                //   logFiber(childInProgress, depth + 1);
                //   if (fiber.child) {
                //     log('  '.repeat(depth + 1) + 'CURRENT');
                //   }
                // } else if (fiber.child && fiber.updateQueue) {
                //   log('  '.repeat(depth + 1) + 'CHILDREN');
                // }
                if ( fiber.child ) {
                    logFiber( fiber.child as typeof fiber, depth + 1 );
                }

                if ( fiber.sibling ) {
                    logFiber( fiber.sibling as typeof fiber, depth );
                }
            }

            log( "HOST INSTANCES:" );
            logContainer( rootContainer, 0 );
            log( "FIBERS:" );
            logFiber( root.current, 0 );

            console.log( ... bufferedLog );
        },

        getRoot( rootID: string = DEFAULT_ROOT_ID ) {
            return roots.get( rootID );
        }

    };
    return ReactNoop;
}

export default createReactNoop;

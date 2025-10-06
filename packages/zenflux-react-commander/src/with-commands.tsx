import { EventEmitter } from "events";

import React from "react";

import { BehaviorSubject } from "rxjs";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import {
    GET_INTERNAL_SYMBOL,
    INTERNAL_PROPS,
    REGISTER_INTERNAL_SYMBOL,
    INTERNAL_ON_UNMOUNT,
    UNREGISTER_INTERNAL_SYMBOL,
    SET_TO_CONTEXT_SYMBOL,
    INTERNAL_ON_MOUNT,
    INTERNAL_ON_UPDATE,
    INTERNAL_ON_LOAD,
    INTERNAL_STATE_UPDATED_EVENT
} from "./_internal/constants";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import core from "./_internal/core";

import { ComponentIdContext } from "@zenflux/react-commander/commands-context";

import commandsManager from "@zenflux/react-commander/commands-manager";

import { ComponentIdProvider } from "@zenflux/react-commander/commands-provider";

import type {
    DCommandFunctionComponent,
    DCommandNewInstanceWithArgs,
    DCommandComponentContextProps
} from "@zenflux/react-commander/definitions";

export function withCommands<TProps = any, TState = undefined>(
    componentName: string,
    Component: DCommandFunctionComponent<TProps, TState>,
    state: TState,
    commands: DCommandNewInstanceWithArgs<TState>[]
): DCommandFunctionComponent<TProps, TState>;

export function withCommands(
    componentName: string,
    Component: DCommandFunctionComponent,
    commands: DCommandNewInstanceWithArgs[]
): DCommandFunctionComponent;

export function withCommands(
    componentName: string,
    Component: DCommandFunctionComponent,
    ... args: any[]
): DCommandFunctionComponent {
    let commands: DCommandNewInstanceWithArgs[],
        state: React.ComponentState;

    if ( args.length === 1 ) {
        commands = args[ 0 ];
    } else if ( args.length === 2 ) {
        state = args[ 0 ];
        commands = args[ 1 ];
    } else {
        throw new Error( "Invalid arguments" );
    }

    function stringifyToLevel( obj: any, level: number ): string {
        let cache = new Map();
        let str = JSON.stringify( obj, ( key, value ) => {
            if ( typeof value === "object" && value !== null ) {
                if ( cache.size > level ) return; // Limit depth
                if ( cache.has( value ) ) return; // Duplicate reference
                cache.set( value, true );
            }
            return value;
        } );
        cache.clear(); // Enable garbage collection
        return str;
    }

    const comparedObjects = new WeakMap<object, object>();

    function compareObjects( obj1: any, obj2: any, level: number ): boolean {
        const isObj1Object = typeof obj1 === "object" && obj1 !== null;
        const isObj2Object = typeof obj2 === "object" && obj2 !== null;

        if ( isObj1Object && isObj2Object ) {
            if ( comparedObjects.has( obj1 ) && comparedObjects.get( obj1 ) === obj2 ) {
                return true;
            }
        }

        const strObj1 = stringifyToLevel( obj1, level );
        const strObj2 = stringifyToLevel( obj2, level );

        const isEqual = strObj1 === strObj2;

        if ( isEqual && isObj1Object && isObj2Object ) {
            comparedObjects.set( obj1, obj2 );
            comparedObjects.set( obj2, obj1 );
        }

        return isEqual;
    }

    class Store {
        private silentState: any;
        private currentState: BehaviorSubject<any>;
        private prevState: any;
        private subscription: any;

        public constructor( initialState: any ) {
            this.currentState = new BehaviorSubject( initialState );

            this.prevState = initialState;
        }

        public getState() {
            return this.silentState || this.currentState.getValue();
        }

        public getPrevState() {
            return this.prevState;
        }

        public setState( newState: any, silent = false ) {
            this.prevState = this.currentState.getValue();

            if ( silent ) {
                this.silentState = newState;

                return;
            }

            this.silentState = null;

            this.currentState.next( newState );
        }

        public hasChanged( level = 2 ) {
            if ( this.prevState === this.currentState ) {
                return false;
            }

            return ! compareObjects( this.prevState, this.currentState.getValue(), level );
        }

        public subscribe( callback: ( state: any ) => void ) {
            if ( this.subscription ) {
                this.subscription.unsubscribe();
            }

            this.subscription = this.currentState.subscribe( callback );

            callback( this.getState() );

            return this.subscription;
        }
    }

    if ( state ) {
        const originalFunction = Component,
            originalName = Component.displayName || Component.name || "Component";

        // This approach give us ability to inject second argument to the functional component.
        Component = function ( props: any ) {
            return originalFunction( props, state );
        };

        Object.defineProperty( Component, originalName, { value: originalName, writable: false } );

        Component.displayName = `withInjectedState(${ originalName })`;
    }

    const WrappedComponent = class WrappedComponent extends React.PureComponent<any, React.ComponentState> {
        public static displayName = `withCommands(${ componentName })`;

        public static contextType = ComponentIdContext;

        public context: DCommandComponentContextProps;

        private store: Store;

        private $$commander = {
            isMounted: false,
            lifecycleHandlers: {} as any,
        };

        private isMounted() {
            return this.$$commander.isMounted;
        }

        public constructor( props: any, context: any ) {
            super( props );

            this.context = context;

            this.state = {};
            this.store = new Store( state );

            this.registerInternalContext();
        }

        private registerInternalContext() {
            const id = this.context.getNameUnique();

            if ( this.props[ INTERNAL_PROPS ]?.handlers ) {
                this.$$commander.lifecycleHandlers = this.props[ INTERNAL_PROPS ].handlers;
            }

            if ( commandsManager.isContextRegistered( id ) ) {
                return;
            }

            const self = this;

            core[ REGISTER_INTERNAL_SYMBOL ]( {
                componentName,
                componentNameUnique: id,

                commands: commandsManager.get( componentName ),
                emitter: new EventEmitter(),

                key: self.props.$$key,

                isMounted: () => self.isMounted(),

                getComponentContext: () => self.context,

                getState: () => this.store ? this.store.getState() : this.state,
                setState: ( state, callback ) => {
                    this.store.setState(
                        {
                            ... this.store.getState(),
                            ... state
                        },
                        ! this.isMounted(),
                    );

                    if ( this.isMounted() ) {
                        const ctx = core[ GET_INTERNAL_SYMBOL ]( this.context.getNameUnique() );
                        ctx.emitter.emit( INTERNAL_STATE_UPDATED_EVENT );
                    }

                    if ( callback ) {
                        callback( this.store.getState() );
                    }
                },

                lifecycleHandlers: this.$$commander.lifecycleHandlers,
            } );
        }

        public componentWillUnmount() {
            this.$$commander.isMounted = false;

            if ( this.$$commander.lifecycleHandlers[ INTERNAL_ON_UNMOUNT ] ) {
                this.$$commander.lifecycleHandlers[ INTERNAL_ON_UNMOUNT ]( core[ GET_INTERNAL_SYMBOL ]( this.context.getNameUnique() ) );
            }

            const componentNameUnique = this.context.getNameUnique();

            core[ UNREGISTER_INTERNAL_SYMBOL ]( componentNameUnique );
        }

        /**
         * Using `componentDidMount` in a strict mode causes component to unmount therefor the context need to be
         * re-registered.
         */
        public componentDidMount() {
            const id = this.context.getNameUnique();

            this.$$commander.isMounted = true;

            this.registerInternalContext();

            core[ SET_TO_CONTEXT_SYMBOL ]( id, { props: this.props } );

            if ( this.$$commander.lifecycleHandlers[ INTERNAL_ON_MOUNT ] ) {
                this.$$commander.lifecycleHandlers[ INTERNAL_ON_MOUNT ]( core[ GET_INTERNAL_SYMBOL ]( this.context.getNameUnique() ) );
            }
        }

        public componentDidUpdate( prevProps: any, prevState: any, snapshot?: any ) {
            if ( this.store.hasChanged?.() ) {
                const ctx = core[ GET_INTERNAL_SYMBOL ]( this.context.getNameUnique() );
                ctx.emitter.emit( INTERNAL_STATE_UPDATED_EVENT );
            }

            if ( this.$$commander.lifecycleHandlers[ INTERNAL_ON_UPDATE ] ) {
                const context = core[ GET_INTERNAL_SYMBOL ]( this.context.getNameUnique() );

                this.$$commander.lifecycleHandlers[ INTERNAL_ON_UPDATE ]( context, {
                    currentProps: this.props,
                    currentState: this.store.getState(),
                    prevProps,
                    prevState: this.store.getPrevState(),
                    snapshot,
                } );
            }
        }

        public render() {
            if ( this.$$commander.lifecycleHandlers[ INTERNAL_ON_LOAD ] ) {
                this.$$commander.lifecycleHandlers[ INTERNAL_ON_LOAD ]( core[ GET_INTERNAL_SYMBOL ]( this.context.getNameUnique() ) );
            }

            return <Component { ... this.props } />;
        }
    };

    /**
     * Function `handleAncestorContexts()` - Manage and manipulate the hierarchical context structure
     * This function is designed to handle the relationship between a provided context and its parent context within a given
     * component hierarchy. By checking if the parent context is already set, it assigns the parent context to the current
     * context and ensures the correct child-parent relationships are established. Moreover, it also manages the children of the
     * current context by validating their existence in the internal mapping system, removing any child contexts that do not have
     * a corresponding internal context. This ensures a consistent and error-free context hierarchy within the application's
     * command component structure.
     **/
    function handleAncestorContexts( context: DCommandComponentContextProps, parentContext: DCommandComponentContextProps ) {

        if ( parentContext.isSet ) {
            context.parent = parentContext;
        }

        if ( context.parent ) {
            if ( ! context.parent.children ) {
                context.parent.children = {};
            }
            context.parent.children[ context.getNameUnique() ] = context;
        }

        if ( context.children ) {
            for ( const key in context.children ) {
                const child = context.children[ key ];

                const internalContext = core[ GET_INTERNAL_SYMBOL ]( child.getNameUnique(), true );

                if ( ! internalContext ) {
                    delete context.children[ key ];
                }
            }
        }
    }

    /**
     * React `useId` behave differently in production and development mode, because of `<React.StrictMode>`
     * https://github.com/facebook/react/issues/27103#issuecomment-1763359077
     */
    const UniqueWrappedComponent = React.forwardRef( ( props: any, _ref ) => {
        const parentContext = React.useContext( ComponentIdContext );

        const componentNameUnique = `${ componentName }-${ React.useId() }`;
        const componentRef = React.useRef( null );

        const context: DCommandComponentContextProps = {
            isSet: true,

            getNameUnique: () => componentNameUnique,
            getComponentName: () => componentName,
            getComponentRef: () => componentRef,
        };

        React.useLayoutEffect( () => {
            handleAncestorContexts( context, parentContext );
        }, [ context ] );

        React.useImperativeHandle( _ref, () => componentRef.current, [ componentRef.current ] );

        return (
            <ComponentIdProvider context={ context }>
                <WrappedComponent { ... props } ref={ componentRef } $$key={ performance.now() }/>
            </ComponentIdProvider>
        );
    } ) as DCommandFunctionComponent;

    UniqueWrappedComponent.getName = () => componentName;

    commandsManager.register( {
        componentName,
        commands,
    } );

    return UniqueWrappedComponent;
}


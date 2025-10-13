import React from "react";

import { of, fromEventPattern } from "rxjs";
import { map, distinctUntilChanged, shareReplay } from "rxjs/operators";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import { GET_INTERNAL_SYMBOL, GET_INTERNAL_MATCH_SYMBOL, INTERNAL_STATE_UPDATED_EVENT } from "./_internal/constants";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import core from "./_internal/core";

import { ComponentIdContext } from "@zenflux/react-commander/commands-context";
import commandsManager from "@zenflux/react-commander/commands-manager";

import type { Observable } from "rxjs";

import type { DCommandArgs, DCommandComponentContextProps, DCommandHookHandle, DCommandIdArgs, DCommandSingleComponentContext } from "@zenflux/react-commander/definitions";

/**
 * Ensures the effective component context matches the expected `componentName`.
 * Throws if called from a different component context to prevent cross-component misuse.
 * Used internally by hooks that must be bound to a specific component instance.
 */
function getSafeContext( componentName: string, context?: DCommandComponentContextProps ) {
    function maybeWrongContext( componentName: string, componentNameUnique: string ) {
        if ( componentName === componentNameUnique ) {
            return;
        }
        throw new Error(
            `You are not in: '${ componentName }', you are in '${ componentNameUnique }' which is not your context\n` +
            "If you are trying to reach sub-component context, it has to rendered, before you can use it\n",
        );
    }

    const componentContext = context || React.useContext( ComponentIdContext );

    const componentNameContext = componentContext.getComponentName();

    maybeWrongContext( componentName, componentNameContext );

    return componentContext;
}

function shallowEqual<T extends Record<string, unknown>>( a: T, b: T ): boolean {
    if ( a === b ) return true;
    if ( ! a || ! b ) return false;

    const aKeys = Object.keys( a );
    const bKeys = Object.keys( b );
    if ( aKeys.length !== bKeys.length ) return false;

    for ( const key of aKeys ) {
        if ( ( a as Record<string, unknown> )[ key ] !== ( b as Record<string, unknown> )[ key ] ) {
            return false;
        }
    }
    return true;
}

function useComponentStateSlice<TState, TSelected>(
    component: { getState: <T>() => T },
    selector: ( state: TState ) => TSelected,
    compare?: ( a: TSelected, b: TSelected ) => boolean,
    triggers?: Observable<unknown> | null,
): Observable<TSelected> {
    const cmp = compare ?? ( shallowEqual as unknown as ( a: TSelected, b: TSelected ) => boolean );
    const source = React.useMemo( () => triggers ?? of( null ), [ triggers ] );

    return React.useMemo( () => source.pipe(
        map( () => component.getState<TState>() ),
        map( selector ),
        distinctUntilChanged( cmp ),
        shareReplay( { bufferSize: 1, refCount: true } ),
    ), [ component, selector, cmp, source ] );
}

export function useCommandId(commandName: string, opts?: { match?: string; index?: number; waitForRef?: React.RefObject<any> } ): DCommandIdArgs | null {
    const match = opts?.match ?? commandsManager.getComponentName( commandName );
    const index = opts?.index ?? 0;
    const waitForRef = opts?.waitForRef;

    const [ id, setId ] = React.useState<DCommandIdArgs | null>( null );

    React.useEffect( () => {
        // If we need to wait for a ref, don't resolve until it's ready
        if ( waitForRef && ! waitForRef.current ) {
            setId( null );
            return;
        }

        try {
            if ( ! match ) {
                setId( null );
                return;
            }
            const contexts = useCommandMatch( match );
            const ctx = contexts[ index ];
            if ( ctx ) {
                // If we have a ref, make sure it matches the component's ref
                if ( waitForRef ) {
                    const componentRef = ctx.getComponentContext().getComponentRef();
                    if ( componentRef?.current !== waitForRef.current ) {
                        setId( null );
                        return;
                    }
                }

                setId( {
                    commandName,
                    componentName: ctx.componentName,
                    componentNameUnique: ctx.componentNameUnique,
                } );
            }
        } catch {
            setId( null );
        }
    }, [ match, index, commandName, waitForRef?.current ] );

    return id;
}

export function useComponentWithRef(componentName: string, ref: React.RefObject<any> ): ReturnType<typeof useComponent> | null {
    const [ id, setId ] = React.useState<ReturnType<typeof useComponent> | null>( null );

    React.useEffect( () => {
        try {
            const contexts = useCommandMatch( componentName );

            const currentContext = contexts.find( ( ctx ) => ctx.getComponentContext().getComponentRef().current === ref.current );

            if ( currentContext ) {
                setId( useComponent( componentName, currentContext.getComponentContext() ) );
            }
        } catch {
            setId( null );
        }

    }, [ componentName, ref.current ] );

    return id;
}

export function useCommandWithRef(commandName: string, componentRef: React.RefObject<any> ) {
    const [ command, setCommand ] = React.useState<ReturnType<typeof useCommand> & { unhookHandle: ( handle: DCommandHookHandle ) => void } | null>( null );

    const componentName = commandsManager.getComponentName( commandName );

    const component = useComponentWithRef( componentName, componentRef );

    React.useEffect( () => {
        if ( ! component ) {
            setCommand( null );
            return;
        }

        setCommand( {
            run: ( args: DCommandArgs, callback?: ( result: any ) => void ) => component.run( commandName, args, callback ),
            hook: ( callback: ( result: any, args?: DCommandArgs ) => void ) => component.hook( commandName, callback ),
            unhook: () => component.unhook( commandName ),
            unhookHandle: ( handle: DCommandHookHandle ) => component.unhookHandle( handle ),
            getInternalContext: () => component.getInternalContext(),
        } );
    }, [ component ] );

    return command;
}

/**
 * Discover and track descendants whose component name matches `componentName`.
 * Useful to batch-attach hooks across many child instances or to run commands on multiple children.
 *
 * Parameters
 * - componentName: string
 * - onChildrenUpdate?: (adapters: Array<ReturnType<typeof useComponent>>) => (() => void) | void
 *
 * Returns
 * - Array of adapters from `useComponent`
 *
 * Notes
 * - Reactively recomputes when the descendant structure changes.
 * - Differs from `useChildCommandHook` (attach a hook across all children) and
 *   `useChildCommandRunner` (select a single child by key and run a command).
 *
 * Example
 * ```tsx
 * function SubscribeAllItems() {
 *   const children = useCommanderChildrenComponents("Item", (items) => {
 *     items.forEach(i => i.hook("Selected", () => {/* handle selection *\/}));
 *     return () => items.forEach(i => i.unhook("Selected"));
 *   });
 *
 *   return <div>Total items: {children.length}</div>;
 * }
 * ```
 */
function useCommanderChildrenComponents(
    componentName: string,
    onChildrenUpdate?: ( commands: ReturnType<typeof useComponent>[] ) => ( () => void ) | void,
) {
    const componentContext = React.useContext( ComponentIdContext );

    const [ childrenComponents, setChildrenComponents ] = React.useState<ReturnType<typeof useComponent>[]>( [] );

    function getDescendantsKeys( context: DCommandComponentContextProps ) {
        let keys: string[] = [];

        // Check if the context has children
        if ( context.children ) {
            // Iterate over each child in the context
            for ( const key in context.children ) {
                // Add the current child's key to the keys array
                keys.push( key );

                // Recursively get the keys of the descendants of the current child
                // and concatenate them to the keys array
                keys = keys.concat( getDescendantsKeys( context.children[ key ] ) );
            }
        }

        // Join all the keys with a separator to form a unique ID
        return keys.join( "-" );
    }

    React.useEffect( () => {
        const children = componentContext.children;

        if ( ! children ) {
            throw new Error( `Current component: '${ componentContext.getComponentName() }' cannot find: '${ componentName }' children` );
        }

        const newChildrenComponents: ReturnType<typeof useComponent>[] = [];

        const loopChildren = ( children: { [ x: string ]: DCommandComponentContextProps; } ) => {
            for ( const childName in children ) {
                const child = children[ childName ];

                if ( child.getComponentName() === componentName ) {
                    const childComponent = useComponent( componentName, child );

                    newChildrenComponents.push( childComponent );
                }

                if ( child.children ) {
                    loopChildren( child.children );
                }
            }
        };

        loopChildren( children );

        setChildrenComponents( newChildrenComponents );

        const callback = onChildrenUpdate?.( newChildrenComponents );

        return () => {
            callback?.();
        };
    }, [ getDescendantsKeys( componentContext ) ] );

    return childrenComponents;
}

/**
 * Returns command utilities bound to the current component instance for the given `commandName`.
 *
 * Purpose
 * - Adapter for a single command in the current component context. Retrieves the unique component instance
 *   and exposes run/hook utilities bound to that instance.
 *
 * Parameters
 * - commandName: string
 *
 * Returns
 * - { run, hook, unhook, getInternalContext }
 *
 * Notes
 * - Component context must be set via `ComponentIdProvider`/`withCommands`.
 * - Scoped to the current component instance.
 * - Differs from `useScopedCommand` (resolves by search and adds owner-scoped hooks) and
 *   `useCommandRunner` (runner-only; no hook utilities).
 *
 * Example
 * ```tsx
 * import { useCommand } from "@zenflux/react-commander/use-commands";
 *
 * function SaveButton() {
 *   const save = useCommand("Save");
 *
 *   return (
 *     <button onClick={() => save.run({ force: false })}>Save</button>
 *   );
 * }
 * ```
 */
export function useCommand( commandName: string ) {
    const componentContext = React.useContext( ComponentIdContext );

    // Get component context
    const componentNameUnique = componentContext.getNameUnique();

    // Get command context
    const commandSignalContext = core[ GET_INTERNAL_SYMBOL ]( componentNameUnique );

    // Set id, used to identify command
    const id = {
        commandName,
        componentNameUnique,
        componentName: commandSignalContext.componentName,
    };

    return {
        run: ( args: DCommandArgs, callback?: ( result: any ) => void ) => commandsManager.run( id, args, callback ),
        hook: ( callback: ( result: any, args?: DCommandArgs ) => void ) => commandsManager.hook( id, callback ),
        unhook: () => commandsManager.unhook( id ),

        // TODO: Remove.
        getInternalContext: () => commandSignalContext,
    };
}

/**
 * Creates a component-level command adapter for a specific component instance.
 *
 * Purpose
 * - Target a specific component instance (current, parent, or child) identified by a `DCommandComponentContextProps`.
 *
 * Parameters
 * - componentName: string
 * - context?: DCommandComponentContextProps
 * - options?: { silent?: boolean } – when false (default) validates that `context` matches `componentName`.
 *
 * Returns
 * - { run, hook, unhook, getId, getKey, isAlive, getInternalContext, getContext, getState }
 *
 * Notes
 * - Unlike `useCommand`, you can target a different component instance by passing a context.
 * - `getState<TState>()` reads the component’s injected state (when provided by `withCommands`).
 * - Differs from `useScopedCommand` (resolves by search and adds owner-scoped hooks).
 *
 * Example
 * ```tsx
 * import type { DCommandComponentContextProps } from "@zenflux/react-commander/definitions";
 *
 * function SelectItem({ childContext }: { childContext: DCommandComponentContextProps }) {
 *   const item = useComponent("Item", childContext);
 *
 *   return (
 *     <button onClick={() => item.run("Select", { id: "a1" })}>
 *       Select item a1
 *     </button>
 *   );
 * }
 * ```
 */
export function useComponent( componentName: string, context?: DCommandComponentContextProps, options = { silent: false } ) {
    if ( ! options.silent ) {
        context = getSafeContext( componentName, context );
    }

    const id = context!.getNameUnique();

    return {
        run: ( commandName: string, args: DCommandArgs, callback?: ( result: any ) => void ) =>
            commandsManager.run( { commandName, componentName, componentNameUnique: id }, args, callback ),
        hook: ( commandName: string, callback: ( result?: any, args?: DCommandArgs ) => void ) =>
            commandsManager.hook( { commandName, componentName, componentNameUnique: id }, callback ),
        unhook: ( commandName: string ) =>
            commandsManager.unhook( { commandName, componentName, componentNameUnique: id } ),
        unhookHandle: ( handle: DCommandHookHandle ) =>
            commandsManager.unhookHandle( handle ),

        // TODO: Remove.
        getId: () => id,
        getKey: () => core[ GET_INTERNAL_SYMBOL ]( id ).key,
        isAlive: () => !! core[ GET_INTERNAL_SYMBOL ]( id, true ),
        getInternalContext: () => core[ GET_INTERNAL_SYMBOL ]( id ),
        getContext: () => context!,
        getState: <TState extends React.ComponentState>() => core[ GET_INTERNAL_SYMBOL ]( id ).getState() as TState,
    };
}

/**
 * Read and write the injected state of a named component instance from within that component's context.
 *
 * Parameters
 * - componentName: string
 *
 * Returns
 * - [getState, setState, isMounted]
 *
 * Notes
 * - Works only for components wrapped with `withCommands` that provided an initial `state`.
 * - Accesses the same state used by commands.
 *
 * Example
 * ```tsx
 * function IncCounter() {
 *   const [getState, setState] = useCommandState<{ count: number }>("Counter");
 *
 *   return (
 *     <button onClick={() => setState({ count: getState().count + 1 })}>
 *       Increment
 *     </button>
 *   );
 * }
 * ```
 */
export function useCommandState<const TState extends React.ComponentState>( componentName: string ) {
    const componentContext = getSafeContext( componentName );

    const id = componentContext.getNameUnique();

    const internalContext = core[ GET_INTERNAL_SYMBOL ]( id );

    return [
        internalContext.getState<TState>,
        internalContext.setState<TState>,

        internalContext.isMounted,
    ] as const;
}

/**
 * Subscribe to specific parts of command state with automatic re-rendering.
 *
 * This hook provides granular state subscription, allowing components to re-render
 * only when specific state properties change, improving performance and consistency.
 *
 * Parameters
 * - componentName: string
 * - selector: Function that selects specific state properties
 * - options?: { equalityFn?: (a, b) => boolean }
 *
 * Returns
 * - [selectedState, setState, isMounted]
 *
 * Notes
 * - Works only for components wrapped with `withCommands` that provided an initial `state`.
 * - Uses shallow comparison by default, but custom equality function can be provided.
 * - Automatically re-renders when selected state changes.
 * - Provides type-safe access to state properties.
 *
 * Example
 * ```tsx
 * function BudgetBaseline() {
 *   const [baseline, setState] = useCommandStateSelector<ChannelState>(
 *     "App/ChannelItem",
 *     (state) => ({ baseline: state.baseline, allocation: state.allocation })
 *   );
 *
 *   return (
 *     <input
 *       value={baseline.baseline}
 *       disabled={baseline.allocation === "manual"}
 *       onChange={(e) => setState({ baseline: e.target.value })}
 *     />
 *   );
 * }
 * ```
 */
export function useCommandStateSelector<TState, TSelected>(
    componentName: string,
    selector: ( state: TState ) => TSelected,
    options?: { equalityFn?: ( a: TSelected, b: TSelected ) => boolean }
) {
    const componentContext = getSafeContext( componentName );
    const id = componentContext.getNameUnique();
    const internalContext = core[ GET_INTERNAL_SYMBOL ]( id );

    const equalityFn = options?.equalityFn ?? ( shallowEqual as unknown as ( a: TSelected, b: TSelected ) => boolean );

    const triggers = React.useMemo( () => fromEventPattern<unknown>(
        ( handler ) => internalContext.emitter.on( INTERNAL_STATE_UPDATED_EVENT, handler as () => void ),
        ( handler ) => internalContext.emitter.off( INTERNAL_STATE_UPDATED_EVENT, handler as () => void ),
    ), [ internalContext ] );

    const slice$ = useComponentStateSlice<TState, TSelected>(
        { getState: internalContext.getState as unknown as <T>() => T },
        selector,
        equalityFn,
        triggers,
    );

    const valueRef = React.useRef<TSelected>( selector( internalContext.getState<TState>() ) );

    const subscribe = React.useCallback( ( onChange: () => void ) => {
        const sub = slice$.subscribe( ( next ) => {
            valueRef.current = next;
            onChange();
        } );
        return () => sub.unsubscribe();
    }, [ slice$ ] );

    const getSnapshot = React.useCallback( () => valueRef.current, [] );

    const selectedState = React.useSyncExternalStore( subscribe, getSnapshot, getSnapshot );

    return [
        selectedState as TSelected,
        internalContext.setState<TState>,
        internalContext.isMounted,
    ] as const;
}

/**
 * Unsafe, this command should be used carefully, since it can be used to run commands from any component.
 * It should be used only in cases where you are sure that there are no conflicts, and there are no other ways to do it.
 */
export function useCommandMatch( componentName: string ) {
    return core[ GET_INTERNAL_MATCH_SYMBOL ]( componentName + "*" );
}

/**
 * Lightweight runner factory. Returns a stable callback that runs a resolved command when available.
 * No hooking utilities included.
 *
 * Parameters
 * - commandName: string
 * - opts?: { match?: string; index?: number }
 *
 * Returns
 * - (args, callback?) => void | undefined
 *
 * Notes
 * - Differs from `useScopedCommand`: return value is just a run function; no hook/unhook.
 * - Use where you only need to invoke, not subscribe.
 *
 * Example
 * ```tsx
 * function DeleteButton() {
 *   const runDelete = useCommandRunner("Delete", { match: "Item" });
 *   return (
 *     <button onClick={() => runDelete?.({ id: "a1" })}>Delete a1</button>
 *   );
 * }
 * ```
 */
export function useCommandRunner( commandName: string, opts?: { match?: string; index?: number } ): ReturnType<typeof commandsManager["run"]> {
    const id = useCommandId( commandName, opts );

    return React.useCallback( ( args: DCommandArgs, callback?: ( result: unknown ) => void ) => {
        if ( ! id ) return;
        return commandsManager.run( id, args, callback );
    }, [ id ] );
}

/**
 * Declaratively attach a scoped hook for a resolved command during the component lifecycle
 * (mount → subscribe, unmount → unsubscribe).
 *
 * Parameters
 * - commandName: string
 * - handler: (result?, args?) => void
 * - opts?: { match?: string; index?: number; ignoreDuplicate?: boolean }
 *
 * Returns
 * - void
 *
 * Notes
 * - Differs from `useScopedCommand().hook` by being purely declarative and automatically disposed.
 * - Owner scoping is derived from the current component if present, or a generated GLOBAL id.
 *
 * Example
 * ```tsx
 * function SavedNotifier() {
*   useCommandHook("Saved", () => {/* notify *\/}, { match: "Form" });
 *   return null;
 * }
 * ```
 */
export function useCommandHook(
    commandName: string,
    handler: ( result?: unknown, args?: DCommandArgs ) => void,
    ref?: React.RefObject<any>,
) {
    const ownerIdRef = React.useRef<string | null>( null );

    if ( ! ownerIdRef.current ) {
        ownerIdRef.current = `${ commandName }:${ Math.random().toString( 36 ).slice( 2 ) }`;
    }

    const command = ref ? useCommandWithRef( commandName, ref ) : null;
    const id = ref ? null : useCommandId( commandName );

    React.useEffect( () => {
        if ( ref ) {
            if ( ! command ) return;

            const ctx = command.getInternalContext?.();
            if ( ! ctx ) return;

            const resolvedId = {
                commandName,
                componentName: ctx.componentName,
                componentNameUnique: ctx.componentNameUnique,
            } as DCommandIdArgs;

            const handle = commandsManager.hookScoped( resolvedId, ownerIdRef.current as string, handler );

            return () => {
                handle?.dispose();
            };
        } else {
            if ( id ) {
                const handle = commandsManager.hookScoped( id, ownerIdRef.current as string, handler );
                return () => {
                    handle?.dispose();
                };
            }

            const componentName = commandsManager.getComponentName( commandName );
            if ( ! componentName ) return;

            try {
                const handle = commandsManager.hookByNameScoped( { commandName, componentName, ownerId: ownerIdRef.current as string }, handler );
                return () => {
                    handle?.dispose();
                };
            } catch {
                return;
            }
        }
    }, [ ref?.current, command, id, handler ] );
}

/**
 * Declaratively attach a scoped hook bound to the current component instance.
 *
 * Purpose
 * - Waits for the current component to render and resolves its instance via ref.
 * - Uses owner-scoped lifecycle: subscribes on mount and disposes on unmount.
 *
 * Parameters
 * - commandName: string
 * - handler: (result?, args?) => void
 *
 * Returns
 * - void
 *
 * Notes
 * - Equivalent to calling `useLocalCommandHook(commandName, handler, refOfCurrentComponent)`.
 * - Use when the listener must bind strictly to the current component instance.
 *
 * Example
 * ```tsx
 * function Notifier() {
 *   useCurrentCommandHook("Form/Saved", () => {
 *     // notify user
 *   });
 *   return null;
 * }
 * ```
 */
export function useLocalCommandHook(
    commandName: string,
    handler: ( result?: unknown, args?: DCommandArgs ) => void
) {
    const ref = React.useContext(ComponentIdContext).getComponentRef();

    useCommandHook(commandName,  handler, ref);
}

/**
 * Attach hooks to a command across all descendant instances of a specific child component,
 * with optional filtering per-child.
 *
 * Parameters
 * - childComponentName: string
 * - commandName: string
 * - handler: (result?, args?) => void
 * - opts?: { filter?: (ctx) => boolean; ignoreDuplicate?: boolean }
 *
 * Returns
 * - void
 *
 * Notes
 * - Differs from `useCommandHook`: targets many children at once rather than resolving a single id.
 *
 * Example
 * ```tsx
 * function ItemsSelectionListener() {
*   useChildCommandHook("Item", "Selected", () => {/* handle *\/}, {
 *     filter: (cmd) => cmd.getKey() !== "disabled"
 *   });
 *   return null;
 * }
 * ```
 */
export function useChildCommandHook(
    childComponentName: string,
    commandName: string,
    handler: ( result?: unknown, args?: DCommandArgs ) => void,
    opts?: { filter?: (ctx: ReturnType<typeof useComponent>) => boolean; ignoreDuplicate?: boolean }
) {
    const children = useCommanderChildrenComponents(childComponentName);

    React.useEffect(() => {
        const disposers: Array<() => void> = [];

        children.forEach((cmd) => {
            if (opts?.filter && !opts.filter(cmd)) return;
            cmd.hook(commandName, handler);
            disposers.push(() => cmd.unhook(commandName));
        });

        return () => {
            disposers.forEach(d => d());
        };
    }, [children.map(c => c.getId()).join("|"), commandName, handler]);
}

/**
 * Multi-child command dispatcher. Finds a specific child by a key derived via `selector`,
 * then runs an arbitrary command on that child.
 *
 * Parameters
 * - childComponentName: string
 * - selector: (ctx: DCommandSingleComponentContext) => string
 *
 * Returns
 * - (key: string, commandName: string, args: DCommandArgs) => boolean
 *
 * Notes
 * - Returns false when no matching child is found.
 * - Differs from `useCommanderChildrenComponents`: focuses on selecting and running a single child at a time.
 *
 * Example
 * ```tsx
 * function EditRow42() {
 *   const runOnItem = useChildCommandRunner("Item", (ctx) => ctx.key as string);
 *   return (
 *     <button onClick={() => runOnItem("row-42", "Edit", { mode: "inline" })}>
 *       Edit Row 42
 *     </button>
 *   );
 * }
 * ```
 */
export function useChildCommandRunner(
    childComponentName: string,
    selector: (ctx: DCommandSingleComponentContext) => string // returns key to match (e.g., itemKey)
) {
    const children = useCommanderChildrenComponents(childComponentName);

    const getByKey = React.useCallback((key: string) => {
        for (const cmd of children) {
            const ctx = cmd.getInternalContext();
            const k = selector(ctx);
            if (k === key) return cmd;
        }
        return null;
    }, [children, selector]);

    const run = React.useCallback((key: string, commandName: string, args: DCommandArgs) => {
        const cmd = getByKey(key);
        if (!cmd) return false;
        cmd.run(commandName, args);
        return true;
    }, [getByKey]);

    return run;
}


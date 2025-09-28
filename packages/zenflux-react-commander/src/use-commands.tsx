import React from "react";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import { GET_INTERNAL_SYMBOL, GET_INTERNAL_MATCH_SYMBOL } from "./_internal/constants";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import core from "./_internal/core";

import { ComponentIdContext } from "@zenflux/react-commander/commands-context";
import commandsManager from "@zenflux/react-commander/commands-manager";

import type { DCommandArgs, DCommandComponentContextProps, DCommandIdArgs, DCommandSingleComponentContext } from "@zenflux/react-commander/definitions";

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

/**
 * Resolve a concrete command id across mounted contexts, optionally filtering by component name pattern and index.
 *
 * Purpose
 * - Non-hooking; just resolves identity for later runs/hooks.
 *
 * Parameters
 * - commandName: string
 * - opts?: { match?: string; index?: number }
 *
 * Returns
 * - DCommandIdArgs | null
 *
 * Notes
 * - Returns null when not found; consumers must handle null.
 *
 * Example
 * ```tsx
 * const id = useCommandId("Delete", { match: "Item", index: 0 });
 * ```
 */
function useCommandId( commandName: string, opts?: { match?: string; index?: number } ): DCommandIdArgs | null {
    const match = opts?.match ?? commandName;
    const index = opts?.index ?? 0;

    const [ id, setId ] = React.useState<DCommandIdArgs | null>( null );

    React.useEffect( () => {
        try {
            const contexts = useAnyComponentCommands( match );
            const ctx = contexts[ index ];
            if ( ctx ) {
                setId( {
                    commandName,
                    componentName: ctx.componentName,
                    componentNameUnique: ctx.componentNameUnique,
                } );
            }
        } catch {
            setId( null );
        }
    }, [ match, index, commandName ] );

    return id;
}

/**
 * Discover and track descendants whose component name matches `componentName`.
 * Useful to batch-attach hooks across many child instances or to run commands on multiple children.
 *
 * Parameters
 * - componentName: string
 * - onChildrenUpdate?: (adapters: Array<ReturnType<typeof useCommanderComponent>>) => (() => void) | void
 *
 * Returns
 * - Array of adapters from `useCommanderComponent`
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
    onChildrenUpdate?: ( commands: ReturnType<typeof useCommanderComponent>[] ) => ( () => void ) | void,
) {
    const componentContext = React.useContext( ComponentIdContext );

    const [ childrenComponents, setChildrenComponents ] = React.useState<ReturnType<typeof useCommanderComponent>[]>( [] );

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

        const newChildrenComponents: ReturnType<typeof useCommanderComponent>[] = [];

        const loopChildren = ( children: { [ x: string ]: DCommandComponentContextProps; } ) => {
            for ( const childName in children ) {
                const child = children[ childName ];

                if ( child.getComponentName() === componentName ) {
                    const childComponent = useCommanderComponent( componentName, child );

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
 * import { useCommanderCommand } from "@zenflux/react-commander/use-commands";
 *
 * function SaveButton() {
 *   const save = useCommanderCommand("Save");
 *
 *   return (
 *     <button onClick={() => save.run({ force: false })}>Save</button>
 *   );
 * }
 * ```
 */
export function useCommanderCommand( commandName: string ) {
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
 * - Unlike `useCommanderCommand`, you can target a different component instance by passing a context.
 * - `getState<TState>()` reads the component’s injected state (when provided by `withCommands`).
 * - Differs from `useScopedCommand` (resolves by search and adds owner-scoped hooks).
 *
 * Example
 * ```tsx
 * import type { DCommandComponentContextProps } from "@zenflux/react-commander/definitions";
 *
 * function SelectItem({ childContext }: { childContext: DCommandComponentContextProps }) {
 *   const item = useCommanderComponent("Item", childContext);
 *
 *   return (
 *     <button onClick={() => item.run("Select", { id: "a1" })}>
 *       Select item a1
 *     </button>
 *   );
 * }
 * ```
 */
export function useCommanderComponent( componentName: string, context?: DCommandComponentContextProps, options = { silent: false } ) {
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
 * Read and write the injected state of a named component instance from within that component’s context.
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
 *   const [getState, setState] = useCommanderState<{ count: number }>("Counter");
 *
 *   return (
 *     <button onClick={() => setState({ count: getState().count + 1 })}>
 *       Increment
 *     </button>
 *   );
 * }
 * ```
 */
export function useCommanderState<TState>( componentName: string ) {
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
 * Unsafe, this command should be used carefully, since it can be used to run commands from any component.
 * It should be used only in cases where you are sure that there are no conflicts, and there are no other ways to do it.
 */
export function useAnyComponentCommands( componentName: string ) {
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
export function useCommandRunner( commandName: string, opts?: { match?: string; index?: number } ) {
    const id = useCommandId( commandName, opts );

    return React.useCallback( ( args: DCommandArgs, callback?: ( result: unknown ) => void ) => {
        if ( ! id ) return;
        return commandsManager.run( id, args, callback as any );
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
    opts?: { match?: string; index?: number; ignoreDuplicate?: boolean }
) {
    const componentContext = React.useContext( ComponentIdContext );
    const fallbackId = React.useId();
    const ownerId = componentContext?.isSet ? componentContext.getNameUnique() : ( "GLOBAL-" + fallbackId );

    const id = useCommandId( commandName, opts );

    React.useEffect( () => {
        if ( ! id ) return;

        const handle = commandsManager.hookScoped( id, ownerId, handler, {
            __ignoreDuplicatedHookError: !! opts?.ignoreDuplicate,
        } );

        return () => {
            commandsManager.unhookHandle( handle );
        };
    }, [ id?.componentNameUnique, ownerId, handler ] );
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
    opts?: { filter?: (ctx: ReturnType<typeof useCommanderComponent>) => boolean; ignoreDuplicate?: boolean }
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


import type React from "react";

import type EventEmitter from "eventemitter3";

import type { CommandBase } from "@zenflux/react-commander/command-base";

/**
 * Type `DCommandFunctionComponent` - This type defines the structure of a functional component that integrates with the command system.
 * The component will have access to command-related properties and methods, enhancing its interactivity and state management capabilities.
 *
 * Why it's called `DCommandFunctionComponent`:
 *
 * - `FunctionComponent` denotes that this is a functional (rather than class-based) React component.
 * - The `DCommand` prefix indicates that this component is integrated with command functionalities within the project.
 *
 * Main points:
 *
 * - Ensures that functional components can seamlessly interact with the command system.
 * - Used in the `withCommands` higher-order function to enhance components with command-related features.
 * - Supports generic props (`TProps`) and state (`TState`) to accommodate various use cases.
 * - Promotes reusability and flexibility for components that need command capabilities.
 *
 * Sugar, e.g `ComponentType.getName` not `ComponentInstance`
 **/
export interface DCommandFunctionComponent<TProps = any, TState = undefined> extends React.FC<TProps> {
    (props: TProps, state?: TState): React.ReactNode;

    // Those methods always implemented "under the hood"
    getName?(): string;
}

/**
 * Interface `DCommandSingleComponentContext` - This interface is named `SingleComponentContext`
 * because it represents the context specifically for a single command component within the application.
 * This context is isolated to handle the state, properties, and event management pertinent to one
 * distinct component instance. Specifically, it includes:
 *
 * - `commands`: A dictionary mapping command names to their respective `CommandBase` instances,
 *   facilitating command execution within this particular component.
 *
 * - `componentNameUnique`: A unique identifier for the component instance, ensuring distinct context
 *   management even among multiple instances of the same component.
 *
 * - `componentName`: The general name of the component, which might not be unique across different instances.
 *
 * - `key`: Utilized for identifying list items in React, helping maintain consistent identity across renders.
 *
 * - `props`: This encompasses all props passed to the component, including children, ensuring the component
 *   receives all necessary data.
 *
 * - `isMounted()`: A method to check whether the component is currently mounted, aiding in lifecycle management.
 *
 * - `getState`: A generic method returning the current state of the component, promoting state encapsulation.
 *
 * - `setState`: Facilitates updating the component state with optional callbacks post state mutation.
 *
 * - `getComponentContext`: Returns additional context properties specific to the component, enhancing encapsulation.
 *
 * - `emitter`: An instance of `EventEmitter` used for managing and emitting events within the component scope.
 *
 * - `lifecycleHandlers`: Contains handlers for different lifecycle events of the component, supporting comprehensive
 *   lifecycle management and providing hooks for extending component behavior.
 *
 * This focus on a single component ensures that all interactions, state changes, and events are accurately and
 * efficiently managed within the bounds of that component's context, reducing the risk of errors and simplifying
 * the debugging and maintenance process.
 **/
export interface DCommandSingleComponentContext {
    commands: {
        [ commandName: string ]: CommandBase
    };
    componentNameUnique: string;
    componentName: string;

    key: React.Key;
    props: React.PropsWithChildren<any>;

    isMounted(): boolean;

    getState: <TState>() => TState
    setState<TState, K extends keyof TState = keyof TState>(
        state: ( TState | null ) | ( Pick<TState, K> | TState | null ),
        callback?: ( state: TState ) => void,
    ): void;

    getComponentContext: () => DCommandComponentContextProps;

    emitter: EventEmitter;

    lifecycleHandlers: any,
}

/**
 * Interface `DCommandComponentContextProps` - This interface outlines the context properties
 * for a command component within the application. It focuses on hierarchical relationships and
 * structural state, allowing components to maintain and manage tree-like dependencies.
 *
 * `DCommandComponentContextProps` is about managing a component's place and
 * relationships within a component hierarchy, ensuring structural context and inheritance, while
 * `DCommandSingleComponentContext` isolates the state and event management specific to one
 * standalone component. Their naming reflects these purposes: "SingleComponentContext" focuses
 * on an individual component's context, and "ComponentContextProps" denotes the properties needed
 * to manage a component within a broader structure.
 **/
export interface DCommandComponentContextProps {
    isSet: boolean;

    children?: { [ nameUnique: string ]: DCommandComponentContextProps };
    parent?: DCommandComponentContextProps;

    getNameUnique: () => string;
    getComponentName(): string;
    getComponentRef(): React.RefObject<any>;
}

/**
 * Interface `DCommandRegisterArgs` - This interface defines the arguments required for registering a command.
 **/
export interface DCommandRegisterArgs {
    commands: DCommandNewInstanceWithArgs[];
    componentName: string;
}

/**
 * Interface `DCommandIdArgs` - This interface defines the structure for identifying a specific command.
 * These identifiers enable the precise targeting and execution of commands within the system.
 **/
export interface DCommandIdArgs {
    // TODO: I dont really need all of them.
    componentNameUnique: string;
    componentName: string;
    commandName: string;
}

/**
 * Interface `DCommandArgs` - This interface defines the structure for the arguments provided to commands
 **/
export type DCommandArgs = {
    [ key: string | number | symbol ]: any
};

/**
 * Interface `DCommandOptions` - This interface defines additional options that can be passed to a command when it is executed.
 **/
export interface DCommandOptions<TState> {
    state?: React.ComponentState;
    setState?: <K extends keyof TState>(
        state: ( ( prevState: Readonly<TState> ) => Pick<TState, K> | TState | null ) | ( Pick<TState, K> | TState | null ),
        callback?: ( state: TState ) => void,
    ) => void;
}

export type DCommandNewInstanceWithArgs<TState = undefined> = ( new ( args: DCommandRegisterArgs ) => CommandBase<TState> );

/**
 * Handle returned by scoped hook registration, allowing precise unsubscription
 * of the listener that was added by a specific owner.
 */
export interface DCommandHookHandle {
    componentNameUnique: string;
    commandName: string;
    ownerId: string;
    dispose: () => void;
}


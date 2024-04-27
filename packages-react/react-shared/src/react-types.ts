/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE https://github.com/facebook/react/blob/main/LICENSE
 *
 * Partial Sync with: https://github.com/facebook/react/blob/ce2bc58a9f6f3b0bfc8c738a0d8e2a5f3a332ff5/packages/shared/ReactTypes.js
 */

import type { ReactElement } from "@zenflux/react-shared/src/react-element-type";

export type ReactNode =
    ReactElement
    | ReactPortal
    | ReactText
    | ReactFragment
    | ReactProvider<any>
    | ReactConsumer<any>;

export type ReactEmpty = null | void | boolean;

export type ReactFragment = ReactEmpty | Iterable<ReactNode>;

export type ReactNodeList = ReactEmpty | ReactNode;

export type ReactText = string | number;

export type ReactProvider<T> = {
    $$typeof: Symbol | number;
    type: ReactProviderType<T>;
    key: null | string;
    ref: null;
    props: {
        value: T;
        children?: ReactNodeList;
    };
};

export type ReactProviderType<T> = {
    $$typeof: Symbol | number;
    _context: ReactContext<T>;
};

export type ReactConsumer<T> = {
    $$typeof: Symbol | number;
    type: ReactContext<T>;
    key: null | string;
    ref: null;
    props: {
        children: ( value: T ) => ReactNodeList;
    };
};

export type ReactContext<T> = {
    $$typeof: Symbol | number;
    Consumer: ReactContext<T>;
    Provider: ReactProviderType<T>;
    _currentValue: T;
    _currentValue2: T;
    _threadCount: number;
    // DEV only
    _currentRenderer?: Record<string, any> | null;
    _currentRenderer2?: Record<string, any> | null;
    // This value may be added by application code
    // to improve DEV tooling display names
    displayName?: string;
    // only used by ServerContext
    _defaultValue: T;
    _globalName: string;
};

// TODO: Not sync with original
// export type ServerContextJSONValue =
//     string
//     | boolean
//     | number
//     | null
//     | ReadonlyArray<ServerContextJSONValue>
//     | Readonly<Record<string, ServerContextJSONValue>>;

export type ReactServerContext<T extends any> = ReactContext<T>;

export type ReactPortal = {
    $$typeof: Symbol | number;
    key: null | string;
    containerInfo: any;
    children: ReactNodeList;
    // TODO: figure out the API for cross-renderer implementation.
    implementation: any;
};

export type RefObject = {
    current: any;
};
export type ReactScope = {
    $$typeof: Symbol | number;
};
export type ReactScopeQuery = ( type: string, props: Record<string, unknown>, instance: unknown ) => boolean;
export type ReactScopeInstance = {
    DO_NOT_USE_queryAllNodes( arg0: ReactScopeQuery ): null | Array<Record<string, any>>;
    DO_NOT_USE_queryFirstNode( arg0: ReactScopeQuery ): null | Record<string, any>;
    containsNode( arg0: Record<string, any> ): boolean;
    getChildContextValues: <T>( context: ReactContext<T> ) => Array<T>;
};

// The subset of a Thenable required by things thrown by Suspense.
// This doesn't require a value to be passed to either handler.
export interface Wakeable {
    then( onFulfill: () => unknown, onReject: () => unknown ): void | Wakeable;
}

// The subset of a Promise that React APIs rely on. This resolves a value.
// This doesn't require a return value neither from the handler nor the
// then function.
interface ThenableImpl<T> {
    then( onFulfill: ( value: T ) => unknown, onReject: ( error: unknown ) => unknown ): void | Wakeable;
}

interface UntrackedThenable<T> extends ThenableImpl<T> {
    status?: string;
}

export interface PendingThenable<T> extends ThenableImpl<T> {
    status: "pending";
}

export interface FulfilledThenable<T> extends ThenableImpl<T> {
    status: "fulfilled";
    value: T;
}

export interface RejectedThenable<T> extends ThenableImpl<T> {
    status: "rejected";
    reason: unknown;
}

export type Thenable<T> = UntrackedThenable<T> | PendingThenable<T> | FulfilledThenable<T> | RejectedThenable<T>;

export type OffscreenMode = "hidden" | "unstable-defer-without-hiding" | "visible" | "manual";

export type StartTransitionOptions = {
    name?: string;
};

export type Usable<T> = Thenable<T> | ReactContext<T>;

export type ReactCustomFormAction = {
    name?: string;
    action?: string;
    encType?: string;
    method?: string;
    target?: string;
    data?: null | FormData;
};

// This is an opaque type returned by decodeFormState on the server, but it's
// defined in this shared file because the same type is used by React on
// the client.
export type ReactFormState<S, ReferenceId> = [ S
    /* actual state value */
    , string
    /* key path */
    , ReferenceId
    /* Server Reference ID */
    , number
    /* number of bound arguments */
];

import type React from "react";

import type {
    GET_INTERNAL_MATCH_SYMBOL,
    GET_INTERNAL_SYMBOL,
    REGISTER_INTERNAL_SYMBOL,
    SET_TO_CONTEXT_SYMBOL,
    UNREGISTER_INTERNAL_SYMBOL
} from "./constants";

import type { DCommandSingleComponentContext } from "@zenflux/react-commander/definitions";

import type EventEmitter from "eventemitter3";

export type DCoreContext = {
    [componentNameUnique: string]: DCommandSingleComponentContext;
};

export type DCoreRegisterArgs = {
    componentNameUnique: string;
    componentName: string;
    commands: DCommandSingleComponentContext[ "commands" ];
    emitter: EventEmitter;
    isMounted(): boolean;
    key: React.Key;
    getComponentContext: DCommandSingleComponentContext[ "getComponentContext" ];
    getState: DCommandSingleComponentContext[ "getState" ];
    setState: DCommandSingleComponentContext[ "setState" ];
    lifecycleHandlers: any;
};

export interface DCoreInterface {
    version: string;

    __devGetContextValues: () => DCommandSingleComponentContext[];
    __devGetContextKeys: () => string[];
    __devGetContextLength: () => number;
    __devDebug: ( ... args: any[] ) => void;

    [ REGISTER_INTERNAL_SYMBOL ]( args: DCoreRegisterArgs ): void;

    [ UNREGISTER_INTERNAL_SYMBOL ]( componentNameUnique: string ): void;

    [ GET_INTERNAL_SYMBOL ]( componentNameUnique: string, silent?: boolean ): DCommandSingleComponentContext;

    [ GET_INTERNAL_MATCH_SYMBOL ]( componentName: string ): DCommandSingleComponentContext[];

    [ SET_TO_CONTEXT_SYMBOL ]( componentNameUnique: string, data: { [ key: string ]: any } ): void;
}

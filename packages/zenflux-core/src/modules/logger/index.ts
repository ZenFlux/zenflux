import {
    getLoggerLogLevel,
    getLoggerLogLevelString,
    isLoggerDebugEnabled
} from "./config";

import { classes } from "../../exports";

import type { interfaces } from "../../interfaces";
import type { ObjectBase } from "../../bases/object-base";

type TLoggerOwner = ObjectBase | typeof ObjectBase | string;

type TLoggerImplementation = {
    new ( owner: TLoggerOwner, options?: any ): interfaces.ILogger;
    getName?: () => string;
    getLogLevelString?: () => string;
    getLogLevel?: () => number;
    isDebugEnabled?: () => boolean;
};

const FALLBACK_LOGGER_NAME = "ZenFlux/Core/Modules/LoggerProxy";

function resolveLoggerImplementation(): TLoggerImplementation {
    if ( globalThis?.zCore?.classes?.Logger && globalThis.zCore.classes.Logger !== Logger ) {
        return globalThis.zCore.classes.Logger as unknown as TLoggerImplementation;
    }

    return classes.Logger as unknown as TLoggerImplementation;
}

export class Logger {
    public constructor( owner: TLoggerOwner, options?: any ) {
        const Implementation = resolveLoggerImplementation();

        if ( Implementation === Logger ) {
            throw new Error( "Circular logger proxy detected. No logger implementation registered." );
        }

        return new Implementation( owner, options );
    }

    public static getName(): string {
        const Implementation = resolveLoggerImplementation();

        if ( typeof Implementation?.getName === "function" ) {
            return Implementation.getName();
        }

        return FALLBACK_LOGGER_NAME;
    }

    public static getLogLevelString(): string {
        const Implementation = resolveLoggerImplementation();

        if ( typeof Implementation?.getLogLevelString === "function" ) {
            return Implementation.getLogLevelString();
        }

        return getLoggerLogLevelString();
    }

    public static getLogLevel(): number {
        const Implementation = resolveLoggerImplementation();

        if ( typeof Implementation?.getLogLevel === "function" ) {
            return Implementation.getLogLevel();
        }

        return getLoggerLogLevel();
    }

    public static isDebugEnabled(): boolean {
        const Implementation = resolveLoggerImplementation();

        if ( typeof Implementation?.isDebugEnabled === "function" ) {
            return Implementation.isDebugEnabled();
        }

        return isLoggerDebugEnabled();
    }
}

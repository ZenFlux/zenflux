import * as util from "util";

import { isDebugEnabled } from "@zenflux/utils/src/environment";

import pc from "picocolors";

import { Logger } from "./logger";

import { ObjectBase } from "../bases/object-base";

// Define options interface for Debugger
interface DebuggerOptions {
    skipEventBusHook?: boolean;
}

export class Debugger extends ObjectBase {
    private logger!: Logger;

    declare private finalizationRegistry;

    public static getName() {
        return "ZenFlux/Core/Modules/Debugger";
    }

    public constructor(
        owner: ObjectBase | typeof ObjectBase | string,
        prefix?: string,
        private shouldDebug = Logger.isDebugEnabled(),
        options?: DebuggerOptions // Add options parameter
    ) {
        super();

        if ( shouldDebug ) {
            // Pass logger options down if skipEventBusHook is set
            const loggerOptions = options?.skipEventBusHook ? { skipEventBusHook: true } : undefined;
            this.logger = new Logger( owner, loggerOptions );

            if ( prefix ) {
                this.logger.addMessagePrefix( prefix );
            }
        } else {
            // Bypass all the methods
            this.log = () => {};
            this.dumpDown = () => {};
            this.enableCleanupDebug = () => {};
        }
    }

    public enableCleanupDebug( handle: ObjectBase, id: string = "" ) {
        if ( !this.finalizationRegistry ) {
            this.finalizationRegistry = new FinalizationRegistry( ( id: string ) => {
                this.log( this.constructor, `FinalizationRegistry: ${ id }` );
            } );
        }

        if ( !id ) {
            id = handle.getName() + ":" + handle.getUniqueId();
        }

        this.log( this.enableCleanupDebug, `Initialized: '${ id }'` );

        this.finalizationRegistry.register( handle, id );
    }

    public log( source: Function, message: string, ...args: any[] ) {
        if ( args && args.length > 0 ) {
            return this.logger.debug( source, message, ...args );
        }

        this.logger.debug( source, message );
    }

    public dumpDown( source: Function, object: any, objectName: string = "" ) {
        this.log(
            source,
            `${ objectName ? objectName + ":" : "" } ` + "🔽" + "\n" + pc.green( util.inspect( object, false, null, true ) )
        );
    }

    public isEnabled() {
        return this.shouldDebug;
    }
}

export function createDebugger( owner: ObjectBase | typeof ObjectBase | string, ownerType: string, prefix?: string ) {
    const ownerName = typeof owner === "string" ? owner : owner.getName();

    return new Debugger( owner, prefix, isDebugEnabled( ownerType, ownerName ) );
}

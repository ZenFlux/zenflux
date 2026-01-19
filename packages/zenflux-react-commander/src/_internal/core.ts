
import {
    GET_INTERNAL_MATCH_SYMBOL,
    GET_INTERNAL_SYMBOL,
    REGISTER_INTERNAL_SYMBOL,
    SET_TO_CONTEXT_SYMBOL,
    UNREGISTER_INTERNAL_SYMBOL
} from "./constants";

import { version } from "../../package.json";

import type { DCoreContext, DCoreInterface, DCoreRegisterArgs } from "./definitions";

import type { DCommandSingleComponentContext } from "@zenflux/react-commander/definitions";

const CORE_CONTEXT_KEY = Symbol.for( "@zenflux/react-commander/core-context" );
const CORE_SORTED_KEYS_KEY = Symbol.for( "@zenflux/react-commander/core-sorted-keys" );

type GlobalStore = {
    [ CORE_CONTEXT_KEY ]: DCoreContext;
    [ CORE_SORTED_KEYS_KEY ]: string[];
};

const globalObj = globalThis as unknown as GlobalStore;

if ( ! globalObj[ CORE_CONTEXT_KEY ] ) {
    globalObj[ CORE_CONTEXT_KEY ] = {};
}

if ( ! globalObj[ CORE_SORTED_KEYS_KEY ] ) {
    globalObj[ CORE_SORTED_KEYS_KEY ] = [];
}

const context = globalObj[ CORE_CONTEXT_KEY ];

function getSortedContextKeys() {
    return globalObj[ CORE_SORTED_KEYS_KEY ];
}

function setSortedContextKeys( keys: string[] ) {
    globalObj[ CORE_SORTED_KEYS_KEY ] = keys;
}

/**
 * Core class is responsible for managing the command context for each component.
 * It provides methods to register, unregister, get and link components.
 */
class Core implements DCoreInterface {
    public version = version;

    /**
     * Registers the context for a React component.
     */
    [ REGISTER_INTERNAL_SYMBOL ]( args: DCoreRegisterArgs ): void { // eslint-disable-line @typescript-eslint/explicit-member-accessibility
        const {
            componentNameUnique,
            componentName,
            commands,
            emitter,
            getComponentContext,
            getState,
            setState,
            isMounted,
            key,
            lifecycleHandlers
        } = args;

        this.__devDebug( `Registering component '${ componentNameUnique }'` );

        // Check if the component is registered
        if ( context[ componentNameUnique ] ) {
            throw new Error( `Component '${ componentNameUnique }' already registered` );
        }

        // Register the context
        context[ componentNameUnique ] = {
            commands,
            componentName,
            componentNameUnique,
            emitter,
            getComponentContext,
            getState,
            setState,
            isMounted,
            key,
            props: undefined,
            lifecycleHandlers,
        };

        // Update sorted keys
        this.updateSortedContextKeys();
    }

    /**
     * Unregisters the context.
     */
    [ UNREGISTER_INTERNAL_SYMBOL ]( // eslint-disable-line @typescript-eslint/explicit-member-accessibility
        componentNameUnique: string
    ): void {
        this.__devDebug( `Unregistering component '${ componentNameUnique }' from the context ` );

        // Check if the component is registered
        if ( ! context[ componentNameUnique ] ) {
            throw new Error( `Component '${ componentNameUnique }' not registered` );
        }

        // Clean up emitter
        context[ componentNameUnique ].emitter.removeAllListeners();

        // Clean up context
        delete context[ componentNameUnique ];

        // Update sorted keys
        this.updateSortedContextKeys();
    }

    /**
     * Gets the context for a React component.
     */
    [ GET_INTERNAL_SYMBOL ]( // eslint-disable-line @typescript-eslint/explicit-member-accessibility
        componentNameUnique: string,
        silent?: boolean,
    ): DCommandSingleComponentContext {
        // Check if the component is registered
        if ( ! silent && ! context[ componentNameUnique ] ) {
            throw new Error( `Component '${ componentNameUnique }' not registered` );
        }

        return context[ componentNameUnique ];
    }

    [ GET_INTERNAL_MATCH_SYMBOL ]( // eslint-disable-line @typescript-eslint/explicit-member-accessibility
        componentName: string,
    ): DCommandSingleComponentContext[] {
        if ( componentName.includes( "*" ) ) {
            const result: DCommandSingleComponentContext[] = [];

            const anyMatchComponent = componentName.substring( 0, componentName.length - 1 );

            getSortedContextKeys().forEach( ( componentNameUnique ) => {
                if ( componentNameUnique.includes( anyMatchComponent ) ) {
                    result.push( context[ componentNameUnique ] );
                }
            } );

            return result;
        } else {
            const sortedKeys = getSortedContextKeys();
            const index = this.binarySearch( sortedKeys, componentName );
            if ( index !== -1 ) {
                return [ context[ sortedKeys[ index ] ] ];
            }
        }

        throw new Error( `Component '${ componentName }' not found` );
    }

    [ SET_TO_CONTEXT_SYMBOL ]( // eslint-disable-line @typescript-eslint/explicit-member-accessibility
        componentNameUnique: string,
        data: { [ key: string ]: any },
    ): void {
        if ( ! context[ componentNameUnique ] ) {
            throw new Error( `Component '${ componentNameUnique }' not registered` );
        }

        Object.entries( data ).forEach( ( [ key, value ] ) => {
            // @ts-ignore
            context[ componentNameUnique ][ key ] = value;
        } );
    }

    /**
     * Updates the sorted keys for binary search.
     */
    private updateSortedContextKeys() {
        setSortedContextKeys( Object.keys( context ).sort() );
    }

    /**
     * Binary Search function to find a context entry by its symbol
     * @param array - The sorted array of context entry keys.
     * @param symbol - The symbol to find.
     * @returns Index of the found context entry, or -1 if not found.
     */
    private binarySearch( array: string[], symbol: string ): number {
        let left = 0;
        let right = array.length - 1;

        while ( left <= right ) {
            const mid = Math.floor( ( left + right ) / 2 );
            if ( array[ mid ] === symbol ) {
                return mid;
            } else if ( array[ mid ] < symbol ) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return -1; // Symbol not found
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public __devDebug( ... args: any[] ): void {
    }

    declare public __devGetContextLength: () => number;
    declare public __devGetContextKeys: () => string[];
    declare public __devGetContextValues: () => DCommandSingleComponentContext[];
}

const CORE_INSTANCE_KEY = Symbol.for( "@zenflux/react-commander/core-instance" );

function getOrCreateCore(): DCoreInterface {
    const globalStore = globalThis as unknown as Record<symbol, DCoreInterface>;

    if ( ! globalStore[ CORE_INSTANCE_KEY ] ) {
        globalStore[ CORE_INSTANCE_KEY ] = new Core();
    }

    return globalStore[ CORE_INSTANCE_KEY ];
}

const core = getOrCreateCore();

if ( /* from vite */ import.meta.env.DEV ) {
    if ( ( window as any ).__DEBUG__ ) {
        core.__devDebug = ( ... args: any[] ) => {
            console.log( ... args );
        };
    }

    core.__devGetContextLength = () => {
        return Object.keys( context ).length;
    };

    core.__devGetContextKeys = () => {
        return Object.keys( context );
    };

    core.__devGetContextValues = () => {
        return Object.values( context ).map( ( context ) => context );
    };

    ( window as any ).$$core = core;
}

export default core;

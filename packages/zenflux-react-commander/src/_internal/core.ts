// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import {
    GET_INTERNAL_MATCH_SYMBOL,
    GET_INTERNAL_SYMBOL,
    REGISTER_INTERNAL_SYMBOL,
    SET_TO_CONTEXT_SYMBOL,
    UNREGISTER_INTERNAL_SYMBOL
} from "./constants";

// eslint-disable-next-line no-restricted-imports, @zenflux/no-relative-imports
import type { DCoreContext, DCoreInterface, DCoreRegisterArgs } from "./definitions";

import type { DCommandSingleComponentContext } from "@zenflux/react-commander/definitions";

const context: DCoreContext = {};

/**
 * Core class is responsible for managing the command context for each component.
 * It provides methods to register, unregister, get and link components.
 */
class Core implements DCoreInterface {
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

            Object.entries( context ).forEach( ( [ componentNameUnique, context ] ) => {
                if ( componentNameUnique.includes( anyMatchComponent ) ) {
                    result.push( context );
                }
            } );

            return result;
        }

        throw new Error( `Component '${ componentName }' is not valid regex` );
    }

    [ SET_TO_CONTEXT_SYMBOL ]( // eslint-disable-line @typescript-eslint/explicit-member-accessibility
        componentNameUnique: string,
        data: { [ key: string ]: any },
    ): void {
        // Check if the component is registered
        if ( ! context[ componentNameUnique ] ) {
            throw new Error( `Component '${ componentNameUnique }' not registered` );
        }

        Object.entries( data ).forEach( ( [ key, value ] ) => {
            // @ts-ignore
            context[ componentNameUnique ][ key ] = value;
        } );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public __devDebug( ... args: any[] ): void {}

    declare public __devGetContextLength: () => number;
    declare public __devGetContextKeys: () => string[];
    declare public __devGetContextValues: () => DCommandSingleComponentContext[];
}

const core: DCoreInterface   = new Core();

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

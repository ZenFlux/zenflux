import { enableCreateEventHandleAPI } from "@zenflux/react-shared/src/react-feature-flags";

import type { DOMEventName } from "@zenflux/react-dom-bindings/src/events/DOMEventNames";

export const allNativeEvents: Set<DOMEventName> = new Set();

if ( enableCreateEventHandleAPI ) {
    allNativeEvents.add( "beforeblur" );
    allNativeEvents.add( "afterblur" );
}

/**
 * Mapping from registration name to event name
 */
export const registrationNameDependencies: Record<string, Array<DOMEventName>> = {};

/**
 * Mapping from lowercase registration names to the properly cased version,
 * used to warn in the case of missing event handlers. Available
 * only in __DEV__.
 * @type {Object}
 */
export const possibleRegistrationNames: Record<string, string> = __DEV__ ? {} : ( null as any );

// Trust the developer to only use possibleRegistrationNames in __DEV__
export function registerTwoPhaseEvent( registrationName: string, dependencies: Array<DOMEventName> ): void {
    registerDirectEvent( registrationName, dependencies );
    registerDirectEvent( registrationName + "Capture", dependencies );
}

export function registerDirectEvent( registrationName: string, dependencies: Array<DOMEventName> ) {
    if ( __DEV__ ) {
        if ( registrationNameDependencies[ registrationName ] ) {
            console.error( "EventRegistry: More than one plugin attempted to publish the same " + "registration name, `%s`.", registrationName );
        }
    }

    registrationNameDependencies[ registrationName ] = dependencies;

    if ( __DEV__ ) {
        const lowerCasedName = registrationName.toLowerCase();
        possibleRegistrationNames[ lowerCasedName ] = registrationName;

        if ( registrationName === "onDoubleClick" ) {
            possibleRegistrationNames.ondblclick = registrationName;
        }
    }

    for ( let i = 0 ; i < dependencies.length ; i++ ) {
        allNativeEvents.add( dependencies[ i ] );
    }
}

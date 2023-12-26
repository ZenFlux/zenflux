import { canUseDOM } from "@zenflux/react-shared/src/execution-environment";

export let passiveBrowserEventsSupported: boolean = false;

// Check if browser support events with passive listeners
// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Safely_detecting_option_support
if ( canUseDOM ) {
    try {
        const options: {
            passive?: void;
        } = {};
        Object.defineProperty( options, "passive", {
            get: function () {
                passiveBrowserEventsSupported = true;
            }
        } );
        // @ts-ignore
        window.addEventListener( "test", options, options );
        // @ts-ignore
        window.removeEventListener( "test", options, options );
    } catch ( e ) {
        passiveBrowserEventsSupported = false;
    }
}

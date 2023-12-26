import { canUseDOM } from "@zenflux/react-shared/src/execution-environment";

/**
 * Checks if an event is supported in the current execution environment.
 *
 * NOTE: This will not work correctly for non-generic events such as `change`,
 * `reset`, `load`, `error`, and `select`.
 *
 * Borrows from Modernizr.
 *
 * @param {string} eventNameSuffix Event name, e.g. "click".
 * @return {boolean} True if the event is supported.
 * @internal
 * @license Modernizr 3.0.0pre (Custom Build) | MIT
 */
function isEventSupported( eventNameSuffix: string ): boolean {
    if ( ! canUseDOM ) {
        return false;
    }

    const eventName = "on" + eventNameSuffix;
    let isSupported = ( eventName in document );

    if ( ! isSupported ) {
        const element = document.createElement( "div" );
        element.setAttribute( eventName, "return;" );
        isSupported = typeof ( element as any )[ eventName ] === "function";
    }

    return isSupported;
}

export default isEventSupported;

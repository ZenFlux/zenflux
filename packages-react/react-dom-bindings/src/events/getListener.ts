import { getFiberCurrentPropsFromNode } from "@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree";

import type { Fiber } from "@zenflux/react-shared/src/react-internal-types";

import type { Props } from "@zenflux/react-dom-bindings/src/client/ReactFiberConfigDOM";

function isInteractive( tag: string ): boolean {
    return tag === "button" || tag === "input" || tag === "select" || tag === "textarea";
}

function shouldPreventMouseEvent( name: string, type: string, props: Props ): boolean {
    switch ( name ) {
        case "onClick":
        case "onClickCapture":
        case "onDoubleClick":
        case "onDoubleClickCapture":
        case "onMouseDown":
        case "onMouseDownCapture":
        case "onMouseMove":
        case "onMouseMoveCapture":
        case "onMouseUp":
        case "onMouseUpCapture":
        case "onMouseEnter":
            return !! ( props.disabled && isInteractive( type ) );

        default:
            return false;
    }
}

/**
 * @param {object} inst The instance, which is the source of events.
 * @param {string} registrationName Name of listener (e.g. `onClick`).
 * @return {?function} The stored callback.
 */

export default function getListener( inst: Fiber, registrationName: string ) {
    const stateNode = inst.stateNode;

    if ( stateNode === null ) {
        // Work in progress (ex: onload events in incremental mode).
        return null;
    }

    const props = getFiberCurrentPropsFromNode( stateNode );

    if ( props === null ) {
        // Work in progress.
        return null;
    }

    const listener = props[ registrationName as keyof Props ];

    if ( shouldPreventMouseEvent( registrationName, inst.type, props ) ) {
        return null;
    }

    if ( listener && typeof listener !== "function" ) {
        throw new Error( `Expected \`${ registrationName }\` listener to be a function, instead got a value of \`${ typeof listener }\` type.` );
    }

    return listener;
}

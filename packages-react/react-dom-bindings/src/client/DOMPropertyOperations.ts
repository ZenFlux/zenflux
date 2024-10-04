import {
    enableCustomElementPropertySupport,
    enableTrustedTypesIntegration
} from "@zenflux/react-shared/src/react-feature-flags";
import { checkAttributeStringCoercion } from "@zenflux/react-shared/src/check-string-coercion";

import isAttributeNameSafe from "@zenflux/react-dom-bindings/src/shared/isAttributeNameSafe";

import { getFiberCurrentPropsFromNode } from "@zenflux/react-dom-bindings/src/client/ReactDOMComponentTree";

import type { Props } from "@zenflux/react-dom-bindings/src/client/ReactFiberConfigDOM";

/**
 * Get the value for a attribute on a node. Only used in DEV for SSR validation.
 * The third argument is used as a hint of what the expected value is. Some
 * attributes have multiple equivalent values.
 */
export function getValueForAttribute( node: Element, name: string, expected: unknown ): unknown {
    if ( __DEV__ ) {
        if ( ! isAttributeNameSafe( name ) ) {
            return;
        }

        if ( ! node.hasAttribute( name ) ) {
            // shouldRemoveAttribute
            switch ( typeof expected ) {
                case "function":
                case "symbol":
                    return expected;

                case "boolean": {
                    const prefix = name.toLowerCase().slice( 0, 5 );

                    if ( prefix !== "data-" && prefix !== "aria-" ) {
                        return expected;
                    }
                }
            }

            return expected === undefined ? undefined : null;
        }

        const value = node.getAttribute( name );

        if ( __DEV__ ) {
            checkAttributeStringCoercion( expected, name );
        }

        if ( value === "" + ( expected as any ) ) {
            return expected;
        }

        return value;
    }
}

export function getValueForAttributeOnCustomComponent( node: Element, name: string, expected: unknown ): unknown {
    if ( __DEV__ ) {
        if ( ! isAttributeNameSafe( name ) ) {
            return;
        }

        if ( ! node.hasAttribute( name ) ) {
            // shouldRemoveAttribute
            switch ( typeof expected ) {
                case "symbol":
                case "object":
                    // Symbols and objects are ignored when they're emitted so
                    // it would be expected that they end up not having an attribute.
                    return expected;

                case "function":
                    if ( enableCustomElementPropertySupport ) {
                        return expected;
                    }

                    break;

                case "boolean":
                    if ( enableCustomElementPropertySupport ) {
                        if ( expected === false ) {
                            return expected;
                        }
                    }

            }

            return expected === undefined ? undefined : null;
        }

        const value = node.getAttribute( name );

        if ( enableCustomElementPropertySupport ) {
            if ( value === "" && expected === true ) {
                return true;
            }
        }

        if ( __DEV__ ) {
            checkAttributeStringCoercion( expected, name );
        }

        if ( value === "" + ( expected as any ) ) {
            return expected;
        }

        return value;
    }
}

export function setValueForAttribute( node: Element, name: string, value: unknown ) {
    if ( isAttributeNameSafe( name ) ) {
        // If the prop isn't in the special list, treat it as a simple attribute.
        // shouldRemoveAttribute
        if ( value === null ) {
            node.removeAttribute( name );
            return;
        }

        switch ( typeof value ) {
            case "undefined":
            case "function":
            case "symbol":

                node.removeAttribute( name );
                return;

            case "boolean": {
                const prefix = name.toLowerCase().slice( 0, 5 );

                if ( prefix !== "data-" && prefix !== "aria-" ) {
                    node.removeAttribute( name );
                    return;
                }
            }
        }

        if ( __DEV__ ) {
            checkAttributeStringCoercion( value, name );
        }

        node.setAttribute( name, enableTrustedTypesIntegration ? ( value as any ) : "" + ( value as any ) );
    }
}

export function setValueForKnownAttribute( node: Element, name: string, value: unknown ) {
    if ( value === null ) {
        node.removeAttribute( name );
        return;
    }

    switch ( typeof value ) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean": {
            node.removeAttribute( name );
            return;
        }
    }

    if ( __DEV__ ) {
        checkAttributeStringCoercion( value, name );
    }

    node.setAttribute( name, enableTrustedTypesIntegration ? ( value as any ) : "" + ( value as any ) );
}

export function setValueForNamespacedAttribute( node: Element, namespace: string, name: string, value: unknown ) {
    if ( value === null ) {
        node.removeAttribute( name );
        return;
    }

    switch ( typeof value ) {
        case "undefined":
        case "function":
        case "symbol":
        case "boolean": {
            node.removeAttribute( name );
            return;
        }
    }

    if ( __DEV__ ) {
        checkAttributeStringCoercion( value, name );
    }

    node.setAttributeNS( namespace, name, enableTrustedTypesIntegration ? ( value as any ) : "" + ( value as any ) );
}

export function setValueForPropertyOnCustomComponent( node: Element, name: keyof Props, value: unknown ) {
    if ( name[ 0 ] === "o" && name[ 1 ] === "n" ) {
        const useCapture = name.endsWith( "Capture" );
        const eventName = name.slice( 2, useCapture ? name.length - 7 : undefined ) as keyof ElementEventMap;
        const prevProps = getFiberCurrentPropsFromNode( node );
        const prevValue = prevProps != null ? prevProps[ name ] : null;

        if ( typeof prevValue === "function" ) {
            node.removeEventListener( eventName, prevValue as any, useCapture );
        }

        if ( typeof value === "function" ) {
            if ( typeof prevValue !== "function" && prevValue !== null ) {
                // If we previously assigned a non-function type into this node, then
                // remove it when switching to event listener mode.
                if ( name in ( node as any ) ) {
                    ( node as any )[ name ] = null;
                } else if ( node.hasAttribute( name ) ) {
                    node.removeAttribute( name );
                }
            }

            // $FlowFixMe[incompatible-cast] value can't be casted to EventListener.
            node.addEventListener( eventName, ( value as EventListener ), useCapture );
            return;
        }
    }

    if ( name in ( node as any ) ) {
        ( node as any )[ name ] = value;
        return;
    }

    if ( value === true ) {
        node.setAttribute( name, "" );
        return;
    }

    // From here, it's the same as any attribute
    setValueForAttribute( node, name, value );
}

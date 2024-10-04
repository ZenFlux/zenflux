import { getCurrentFiberOwnerNameInDevOrNull } from "@zenflux/react-reconciler/src/react-current-fiber";

import { disableTextareaChildren } from "@zenflux/react-shared/src/react-feature-flags";

import { restoreControlledInputState } from "@zenflux/react-dom-bindings/src/client/ReactDOMInput";

import { getToStringValue, toString } from "@zenflux/react-dom-bindings/src/client/ToStringValue";

import { restoreControlledSelectState } from "@zenflux/react-dom-bindings/src/client/ReactDOMSelect";

import type { Props } from "@zenflux/react-dom-bindings/src/client/ReactFiberConfigDOM";

let didWarnValDefaultVal = false;

/**
 * Implements a <textarea> host component that allows setting `value`, and
 * `defaultValue`. This differs from the traditional DOM API because value is
 * usually set as PCDATA children.
 *
 * If `value` is not supplied (or null/undefined), user actions that affect the
 * value will trigger updates to the element.
 *
 * If `value` is supplied (and not null/undefined), the rendered element will
 * not trigger updates to the element. Instead, the `value` prop must change in
 * order for the rendered element to be updated.
 *
 * The rendered element will be initialized with an empty value, the prop
 * `defaultValue` if specified, or the children content (deprecated).
 */
export function validateTextareaProps( element: Element, props: Record<string, any> ) {
    if ( __DEV__ ) {
        if ( props.value !== undefined && props.defaultValue !== undefined && ! didWarnValDefaultVal ) {
            console.error( "%s contains a textarea with both value and defaultValue props. " + "Textarea elements must be either controlled or uncontrolled " + "(specify either the value prop, or the defaultValue prop, but not " + "both). Decide between using a controlled or uncontrolled textarea " + "and remove one of these props. More info: " + "https://reactjs.org/link/controlled-components", getCurrentFiberOwnerNameInDevOrNull() || "A component" );
            didWarnValDefaultVal = true;
        }

        if ( props.children != null && props.value == null ) {
            console.error( "Use the `defaultValue` or `value` props instead of setting " + "children on <textarea>." );
        }
    }
}

export function updateTextarea( element: Element, value: string | null | undefined | unknown, defaultValue: string | null | undefined | unknown ) {
    const node: HTMLTextAreaElement = ( element as any );

    if ( value != null ) {
        // Cast `value` to a string to ensure the value is set correctly. While
        // browsers typically do this as necessary, jsdom doesn't.
        const newValue = toString( getToStringValue( value ) );

        // To avoid side effects (such as losing text selection), only set value if changed
        if ( newValue !== node.value ) {
            node.value = newValue;
        }

        // TOOO: This should respect disableInputAttributeSyncing flag.
        if ( defaultValue == null ) {
            if ( node.defaultValue !== newValue ) {
                node.defaultValue = newValue;
            }

            return;
        }
    }

    if ( defaultValue != null ) {
        node.defaultValue = toString( getToStringValue( defaultValue ) );
    } else {
        node.defaultValue = "";
    }
}

export function initTextarea( element: Element, value: Props["value"], defaultValue: Props["defaultValue"], children: Props["children"] ) {
    const node: HTMLTextAreaElement = ( element as any );
    let initialValue = value;

    // Only bother fetching default value if we're going to use it
    if ( initialValue == null ) {
        if ( children != null ) {
            if ( ! disableTextareaChildren ) {
                if ( defaultValue != null ) {
                    throw new Error( "If you supply `defaultValue` on a <textarea>, do not pass children." );
                }

                if ( Array.isArray( children ) ) {
                    if ( children.length > 1 ) {
                        throw new Error( "<textarea> can only have at most one child." );
                    }

                    children = children[ 0 ];
                }

                defaultValue = children;
            }
        }

        if ( defaultValue == null ) {
            defaultValue = "";
        }

        initialValue = defaultValue;
    }

    const stringValue = getToStringValue( initialValue );
    node.defaultValue = ( stringValue as any ); // This will be toString:ed.

    // This is in postMount because we need access to the DOM node, which is not
    // available until after the component has mounted.
    const textContent = node.textContent;

    // Only set node.value if textContent is equal to the expected
    // initial value. In IE10/IE11 there is a bug where the placeholder attribute
    // will populate textContent as well.
    // https://developer.microsoft.com/microsoft-edge/platform/issues/101525/
    if ( textContent === stringValue ) {
        if ( textContent !== "" && textContent !== null ) {
            node.value = textContent;
        }
    }
}

export function restoreControlledTextareaState( element: Element, props: Record<string, any> ) {
    // DOM component is still mounted; update
    updateTextarea( element, props.value, props.defaultValue );
}

export function restoreControlledState( domElement: Element, tag: string, props: Record<string, any> ): void {
    switch ( tag ) {
        case "input":
            restoreControlledInputState( domElement, props );
            return;

        case "textarea":
            restoreControlledTextareaState( domElement, props );
            return;

        case "select":
            restoreControlledSelectState( domElement, props );
            return;
    }
}


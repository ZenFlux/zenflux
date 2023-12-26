/* globals MSApp */
import { enableTrustedTypesIntegration } from "@zenflux/react-shared/src/react-feature-flags";

import { SVG_NAMESPACE } from "@zenflux/react-dom-bindings/src/client/DOMNamespaces";
// SVG temp container for IE lacking innerHTML
let reusableSVGContainer: HTMLElement;

function setInnerHTMLImpl( node: Element | Node, html: {
    valueOf(): {
        toString(): string;
    };
} ): void {
    if ( ( node as Element ).namespaceURI === SVG_NAMESPACE ) {
        if ( __DEV__ ) {
            if ( enableTrustedTypesIntegration ) {
                // TODO: reconsider the text of this warning and when it should show
                // before enabling the feature flag.
                if ( typeof trustedTypes !== "undefined" ) {
                    console.error( "Using 'dangerouslySetInnerHTML' in an svg element with " + "Trusted Types enabled in an Internet Explorer will cause " + "the trusted value to be converted to string. Assigning string " + "to 'innerHTML' will throw an error if Trusted Types are enforced. " + "You can try to wrap your svg element inside a div and use 'dangerouslySetInnerHTML' " + "on the enclosing div instead." );
                }
            }
        }

        if ( ! ( "innerHTML" in node ) ) {
            // IE does not have innerHTML for SVG nodes, so instead we inject the
            // new markup in a temp node and then move the child nodes across into
            // the target node
            reusableSVGContainer = reusableSVGContainer || document.createElement( "div" );
            reusableSVGContainer.innerHTML = "<svg>" + html.valueOf().toString() + "</svg>";
            const svgNode = reusableSVGContainer.firstChild;

            while ( node.firstChild ) {
                node.removeChild( node.firstChild );
            }

            // $FlowFixMe[incompatible-use]
            // $FlowFixMe[incompatible-type]
            while ( svgNode?.firstChild ) {
                node.appendChild( svgNode.firstChild );
            }

            return;
        }
    }

    ( node as Element ).innerHTML = ( html as any );
}

let setInnerHTML: ( node: Element, html: {
    valueOf(): {
        toString(): string;
    };
} ) => void = setInnerHTMLImpl;

if ( typeof MSApp !== "undefined" && MSApp.execUnsafeLocalFunction ) {
    /**
     * Create a function which has 'unsafe' privileges (required by windows8 apps)
     */
    setInnerHTML = function ( node: Element, html: {
        valueOf(): {
            toString(): string;
        };
    } ): void {
        // $FlowFixMe[cannot-resolve-name]
        return MSApp.execUnsafeLocalFunction( function () {
            return setInnerHTMLImpl( node, html );
        } );
    };
}

export default setInnerHTML;

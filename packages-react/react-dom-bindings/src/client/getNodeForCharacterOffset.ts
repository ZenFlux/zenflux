import { TEXT_NODE } from "@zenflux/react-dom-bindings/src/client/HTMLNodeType";

/**
 * Given any node return the first leaf node without children.
 *
 * @param {DOMElement|DOMTextNode} node
 * @return {DOMElement|DOMTextNode}
 */
function getLeafNode( node: ( Node | Element ) | null | undefined ) {
    while ( node && node.firstChild ) {
        node = node.firstChild;
    }

    return node;
}

/**
 * Get the next sibling within a container. This will walk up the
 * DOM if a node's siblings have been exhausted.
 *
 * @param {DOMElement|DOMTextNode} node
 * @return {?DOMElement|DOMTextNode}
 */
function getSiblingNode( node: ( Node | Element ) | null | undefined ) {
    while ( node ) {
        if ( node.nextSibling ) {
            return node.nextSibling;
        }

        node = node.parentNode;
    }
}

/**
 * Get object describing the nodes which contain characters at offset.
 *
 * @param {DOMElement|DOMTextNode} root
 * @param {number} offset
 * @return {?object}
 */
function getNodeForCharacterOffset( root: Element|DocumentFragment, offset: number ): Record<string, any> | null | undefined {
    let node = getLeafNode( root );
    let nodeStart = 0;
    let nodeEnd = 0;

    while ( node ) {
        if ( node.nodeType === TEXT_NODE ) {
            nodeEnd = nodeStart + ( node.textContent?.length || 0 );

            if ( nodeStart <= offset && nodeEnd >= offset ) {
                return {
                    node: node,
                    offset: offset - nodeStart
                };
            }

            nodeStart = nodeEnd;
        }

        node = getLeafNode( getSiblingNode( node ) );
    }
}

export default getNodeForCharacterOffset;

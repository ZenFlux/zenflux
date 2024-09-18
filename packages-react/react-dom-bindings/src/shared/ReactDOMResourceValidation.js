"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValueDescriptorExpectingEnumForWarning = exports.getValueDescriptorExpectingObjectForWarning = exports.validateLinkPropsForStyleResource = void 0;
function validateLinkPropsForStyleResource(props) {
    if (__DEV__) {
        // This should only be called when we know we are opting into Resource semantics (i.e. precedence is not null)
        var href = props.href, onLoad = props.onLoad, onError = props.onError, disabled = props.disabled;
        var includedProps = [];
        if (onLoad)
            includedProps.push("`onLoad`");
        if (onError)
            includedProps.push("`onError`");
        if (disabled != null)
            includedProps.push("`disabled`");
        var includedPropsPhrase = propNamesListJoin(includedProps, "and");
        includedPropsPhrase += includedProps.length === 1 ? " prop" : " props";
        var withArticlePhrase = includedProps.length === 1 ? "an " + includedPropsPhrase : "the " + includedPropsPhrase;
        if (includedProps.length) {
            console.error("React encountered a <link rel=\"stylesheet\" href=\"%s\" ... /> with a `precedence` prop that" + " also included %s. The presence of loading and error handlers indicates an intent to manage" + " the stylesheet loading state from your from your Component code and React will not hoist or" + " deduplicate this stylesheet. If your intent was to have React hoist and deduplciate this stylesheet" + " using the `precedence` prop remove the %s, otherwise remove the `precedence` prop.", href, withArticlePhrase, includedPropsPhrase);
            return true;
        }
    }
    return false;
}
exports.validateLinkPropsForStyleResource = validateLinkPropsForStyleResource;
function propNamesListJoin(list, combinator) {
    switch (list.length) {
        case 0:
            return "";
        case 1:
            return list[0];
        case 2:
            return list[0] + " " + combinator + " " + list[1];
        default:
            return list.slice(0, -1).join(", ") + ", " + combinator + " " + list[list.length - 1];
    }
}
function getValueDescriptorExpectingObjectForWarning(thing) {
    return thing === null ? "`null`" : thing === undefined ? "`undefined`" : thing === "" ? "an empty string" : "something with type \"".concat(typeof thing, "\"");
}
exports.getValueDescriptorExpectingObjectForWarning = getValueDescriptorExpectingObjectForWarning;
function getValueDescriptorExpectingEnumForWarning(thing) {
    return thing === null ? "`null`" : thing === undefined ? "`undefined`" : thing === "" ? "an empty string" : typeof thing === "string" ? JSON.stringify(thing) : "something with type \"".concat(typeof thing, "\"");
}
exports.getValueDescriptorExpectingEnumForWarning = getValueDescriptorExpectingEnumForWarning;

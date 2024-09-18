"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.warnForInsertedHydratedText = exports.warnForInsertedHydratedElement = exports.warnForDeletedHydratableText = exports.warnForDeletedHydratableElement = exports.diffHydratedText = exports.diffHydratedProperties = exports.updateProperties = exports.setInitialProperties = exports.trapClickOnNonInteractiveElement = exports.checkForUnmatchedText = void 0;
var execution_environment_1 = require("@zenflux/react-shared/src/execution-environment");
var check_string_coercion_1 = require("@zenflux/react-shared/src/check-string-coercion");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var EventRegistry_1 = require("@zenflux/react-dom-bindings/src/events/EventRegistry");
var ReactControlledValuePropTypes_1 = require("@zenflux/react-dom-bindings/src/shared/ReactControlledValuePropTypes");
var isCustomElement_1 = require("@zenflux/react-dom-bindings/src/shared/isCustomElement");
var getAttributeAlias_1 = require("@zenflux/react-dom-bindings/src/shared/getAttributeAlias");
var possibleStandardNames_1 = require("@zenflux/react-dom-bindings/src/shared/possibleStandardNames");
var ReactDOMInvalidARIAHook_1 = require("@zenflux/react-dom-bindings/src/shared/ReactDOMInvalidARIAHook");
var DOMPropertyOperations_1 = require("@zenflux/react-dom-bindings/src/client/DOMPropertyOperations");
var ReactDOMInput_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMInput");
var ReactDOMOption_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMOption");
var ReactDOMSelect_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMSelect");
var ReactDOMTextarea_1 = require("@zenflux/react-dom-bindings/src/client/ReactDOMTextarea");
var validateDOMNesting_1 = require("@zenflux/react-dom-bindings/src/client/validateDOMNesting");
var inputValueTracking_1 = require("@zenflux/react-dom-bindings/src/client/inputValueTracking");
var setInnerHTML_1 = require("@zenflux/react-dom-bindings/src/client/setInnerHTML");
var setTextContent_1 = require("@zenflux/react-dom-bindings/src/client/setTextContent");
var CSSPropertyOperations_1 = require("@zenflux/react-dom-bindings/src/client/CSSPropertyOperations");
var DOMNamespaces_1 = require("@zenflux/react-dom-bindings/src/client/DOMNamespaces");
var ReactDOMNullInputValuePropHook_1 = require("@zenflux/react-dom-bindings/src/shared/ReactDOMNullInputValuePropHook");
var ReactDOMUnknownPropertyHook_1 = require("@zenflux/react-dom-bindings/src/shared/ReactDOMUnknownPropertyHook");
var sanitizeURL_1 = require("@zenflux/react-dom-bindings/src/shared/sanitizeURL");
var DOMPluginEventSystem_1 = require("@zenflux/react-dom-bindings/src/events/DOMPluginEventSystem");
var react_fiber_config_host_context_namespace_1 = require("@zenflux/react-dom-bindings/src/client/react-fiber-config-host-context-namespace");
var didWarnControlledToUncontrolled = false;
var didWarnUncontrolledToControlled = false;
var didWarnInvalidHydration = false;
var didWarnFormActionType = false;
var didWarnFormActionName = false;
var didWarnFormActionTarget = false;
var didWarnFormActionMethod = false;
var canDiffStyleForHydrationWarning;
if (__DEV__) {
    // IE 11 parses & normalizes the style attribute as opposed to other
    // browsers. It adds spaces and sorts the properties in some
    // non-alphabetical order. Handling that would require sorting CSS
    // properties in the client & server versions or applying
    // `expectedStyle` to a temporary DOM node to read its `style` attribute
    // normalized. Since it only affects IE, we're skipping style warnings
    // in that browser completely in favor of doing all that work.
    // See https://github.com/facebook/react/issues/11807
    // @ts-ignore
    canDiffStyleForHydrationWarning = react_feature_flags_1.disableIEWorkarounds || execution_environment_1.canUseDOM && !document.documentMode;
}
function validatePropertiesInDevelopment(type, props) {
    if (__DEV__) {
        (0, ReactDOMInvalidARIAHook_1.validateProperties)(type, props);
        (0, ReactDOMNullInputValuePropHook_1.validateProperties)(type, props);
        (0, ReactDOMUnknownPropertyHook_1.validateProperties)(type, props, {
            registrationNameDependencies: EventRegistry_1.registrationNameDependencies,
            possibleRegistrationNames: EventRegistry_1.possibleRegistrationNames
        });
        if (props.contentEditable && !props.suppressContentEditableWarning && props.children != null) {
            console.error("A component is `contentEditable` and contains `children` managed by " + "React. It is now your responsibility to guarantee that none of " + "those nodes are unexpectedly modified or duplicated. This is " + "probably not intentional.");
        }
    }
}
function validateFormActionInDevelopment(tag, key, value, props) {
    if (__DEV__) {
        if (value == null) {
            return;
        }
        if (tag === "form") {
            if (key === "formAction") {
                console.error("You can only pass the formAction prop to <input> or <button>. Use the action prop on <form>.");
            }
            else if (typeof value === "function") {
                if ((props.encType != null || props.method != null) && !didWarnFormActionMethod) {
                    didWarnFormActionMethod = true;
                    console.error("Cannot specify a encType or method for a form that specifies a " + "function as the action. React provides those automatically. " + "They will get overridden.");
                }
                if (props.target != null && !didWarnFormActionTarget) {
                    didWarnFormActionTarget = true;
                    console.error("Cannot specify a target for a form that specifies a function as the action. " + "The function will always be executed in the same window.");
                }
            }
        }
        else if (tag === "input" || tag === "button") {
            if (key === "action") {
                console.error("You can only pass the action prop to <form>. Use the formAction prop on <input> or <button>.");
            }
            else if (tag === "input" && props.type !== "submit" && props.type !== "image" && !didWarnFormActionType) {
                didWarnFormActionType = true;
                console.error("An input can only specify a formAction along with type=\"submit\" or type=\"image\".");
            }
            else if (tag === "button" && props.type != null && props.type !== "submit" && !didWarnFormActionType) {
                didWarnFormActionType = true;
                console.error("A button can only specify a formAction along with type=\"submit\" or no type.");
            }
            else if (typeof value === "function") {
                // Function form actions cannot control the form properties
                if (props.name != null && !didWarnFormActionName) {
                    didWarnFormActionName = true;
                    console.error("Cannot specify a \"name\" prop for a button that specifies a function as a formAction. " + "React needs it to encode which action should be invoked. It will get overridden.");
                }
                if ((props.formEncType != null || props.formMethod != null) && !didWarnFormActionMethod) {
                    didWarnFormActionMethod = true;
                    console.error("Cannot specify a formEncType or formMethod for a button that specifies a " + "function as a formAction. React provides those automatically. They will get overridden.");
                }
                if (props.formTarget != null && !didWarnFormActionTarget) {
                    didWarnFormActionTarget = true;
                    console.error("Cannot specify a formTarget for a button that specifies a function as a formAction. " + "The function will always be executed in the same window.");
                }
            }
        }
        else {
            if (key === "action") {
                console.error("You can only pass the action prop to <form>.");
            }
            else {
                console.error("You can only pass the formAction prop to <input> or <button>.");
            }
        }
    }
}
function warnForPropDifference(propName, serverValue, clientValue) {
    if (__DEV__) {
        if (didWarnInvalidHydration) {
            return;
        }
        if (serverValue === clientValue) {
            return;
        }
        var normalizedClientValue = normalizeMarkupForTextOrAttribute(clientValue);
        var normalizedServerValue = normalizeMarkupForTextOrAttribute(serverValue);
        if (normalizedServerValue === normalizedClientValue) {
            return;
        }
        didWarnInvalidHydration = true;
        console.error("Prop `%s` did not match. Server: %s Client: %s", propName, JSON.stringify(normalizedServerValue), JSON.stringify(normalizedClientValue));
    }
}
function warnForExtraAttributes(attributeNames) {
    if (__DEV__) {
        if (didWarnInvalidHydration) {
            return;
        }
        didWarnInvalidHydration = true;
        var names_1 = [];
        attributeNames.forEach(function (name) {
            names_1.push(name);
        });
        console.error("Extra attributes from the server: %s", names_1);
    }
}
function warnForInvalidEventListener(registrationName, listener) {
    if (__DEV__) {
        if (listener === false) {
            console.error("Expected `%s` listener to be a function, instead got `false`.\n\n" + "If you used to conditionally omit it with %s={condition && value}, " + "pass %s={condition ? value : undefined} instead.", registrationName, registrationName, registrationName);
        }
        else {
            console.error("Expected `%s` listener to be a function, instead got a value of `%s` type.", registrationName, typeof listener);
        }
    }
}
// Parse the HTML and read it back to normalize the HTML string so that it
// can be used for comparison.
function normalizeHTML(parent, html) {
    if (__DEV__) {
        // We could have created a separate document here to avoid
        // re-initializing custom elements if they exist. But this breaks
        // how <noscript> is being handled. So we use the same document.
        // See the discussion in https://github.com/facebook/react/pull/11157.
        var testElement = parent.namespaceURI === DOMNamespaces_1.MATH_NAMESPACE || parent.namespaceURI === DOMNamespaces_1.SVG_NAMESPACE ? parent.ownerDocument.createElementNS(parent.namespaceURI, parent.tagName) : parent.ownerDocument.createElement(parent.tagName);
        testElement.innerHTML = html;
        return testElement.innerHTML;
    }
}
// HTML parsing normalizes CR and CRLF to LF.
// It also can turn \u0000 into \uFFFD inside attributes.
// https://www.w3.org/TR/html5/single-page.html#preprocessing-the-input-stream
// If we have a mismatch, it might be caused by that.
// We will still patch up in this case but not fire the warning.
var NORMALIZE_NEWLINES_REGEX = /\r\n?/g;
var NORMALIZE_NULL_AND_REPLACEMENT_REGEX = /\u0000|\uFFFD/g;
function normalizeMarkupForTextOrAttribute(markup) {
    if (__DEV__) {
        (0, check_string_coercion_1.checkHtmlStringCoercion)(markup);
    }
    var markupString = typeof markup === "string" ? markup : "" + markup;
    return markupString.replace(NORMALIZE_NEWLINES_REGEX, "\n").replace(NORMALIZE_NULL_AND_REPLACEMENT_REGEX, "");
}
function checkForUnmatchedText(serverText, clientText, isConcurrentMode, shouldWarnDev) {
    var normalizedClientText = normalizeMarkupForTextOrAttribute(clientText);
    var normalizedServerText = normalizeMarkupForTextOrAttribute(serverText);
    if (normalizedServerText === normalizedClientText) {
        return;
    }
    if (shouldWarnDev) {
        if (__DEV__) {
            if (!didWarnInvalidHydration) {
                didWarnInvalidHydration = true;
                console.error("Text content did not match. Server: \"%s\" Client: \"%s\"", normalizedServerText, normalizedClientText);
            }
        }
    }
    if (isConcurrentMode && react_feature_flags_1.enableClientRenderFallbackOnTextMismatch) {
        // In concurrent roots, we throw when there's a text mismatch and revert to
        // client rendering, up to the nearest Suspense boundary.
        throw new Error("Text content does not match server-rendered HTML.");
    }
}
exports.checkForUnmatchedText = checkForUnmatchedText;
function noop() {
}
function trapClickOnNonInteractiveElement(node) {
    // Mobile Safari does not fire properly bubble click events on
    // non-interactive elements, which means delegated click listeners do not
    // fire. The workaround for this bug involves attaching an empty click
    // listener on the target node.
    // https://www.quirksmode.org/blog/archives/2010/09/click_event_del.html
    // Just set it using the onclick property so that we don't have to manage any
    // bookkeeping for it. Not sure if we need to clear it when the listener is
    // removed.
    // TODO: Only do this for the relevant Safaris maybe?
    node.onclick = noop;
}
exports.trapClickOnNonInteractiveElement = trapClickOnNonInteractiveElement;
var xlinkNamespace = "http://www.w3.org/1999/xlink";
var xmlNamespace = "http://www.w3.org/XML/1998/namespace";
function setProp(domElement, tag, key, value, props, prevValue) {
    switch (key) {
        case "children": {
            if (typeof value === "string") {
                if (__DEV__) {
                    (0, validateDOMNesting_1.validateTextNesting)(value, tag);
                }
                // Avoid setting initial textContent when the text is empty. In IE11 setting
                // textContent on a <textarea> will cause the placeholder to not
                // show within the <textarea> until it has been focused and blurred again.
                // https://github.com/facebook/react/issues/6731#issuecomment-254874553
                var canSetTextContent = (!react_feature_flags_1.enableHostSingletons || tag !== "body") && (tag !== "textarea" || value !== "");
                if (canSetTextContent) {
                    (0, setTextContent_1.default)(domElement, value);
                }
            }
            else if (typeof value === "number") {
                if (__DEV__) {
                    (0, validateDOMNesting_1.validateTextNesting)("" + value, tag);
                }
                var canSetTextContent = !react_feature_flags_1.enableHostSingletons || tag !== "body";
                if (canSetTextContent) {
                    (0, setTextContent_1.default)(domElement, "" + value);
                }
            }
            break;
        }
        // These are very common props and therefore are in the beginning of the switch.
        // TODO: aria-label is a very common prop but allows booleans so is not like the others
        // but should ideally go in this list too.
        case "className":
            (0, DOMPropertyOperations_1.setValueForKnownAttribute)(domElement, "class", value);
            break;
        case "tabIndex":
            // This has to be case sensitive in SVG.
            (0, DOMPropertyOperations_1.setValueForKnownAttribute)(domElement, "tabindex", value);
            break;
        case "dir":
        case "role":
        case "viewBox":
        case "width":
        case "height": {
            (0, DOMPropertyOperations_1.setValueForKnownAttribute)(domElement, key, value);
            break;
        }
        case "style": {
            (0, CSSPropertyOperations_1.setValueForStyles)(domElement, value, prevValue);
            break;
        }
        // These attributes accept URLs. These must not allow javascript: URLS.
        case "src":
        case "href": {
            if (react_feature_flags_1.enableFilterEmptyStringAttributesDOM) {
                if (value === "") {
                    if (__DEV__) {
                        if (key === "src") {
                            console.error("An empty string (\"\") was passed to the %s attribute. " + "This may cause the browser to download the whole page again over the network. " + "To fix this, either do not render the element at all " + "or pass null to %s instead of an empty string.", key, key);
                        }
                        else {
                            console.error("An empty string (\"\") was passed to the %s attribute. " + "To fix this, either do not render the element at all " + "or pass null to %s instead of an empty string.", key, key);
                        }
                    }
                    domElement.removeAttribute(key);
                    break;
                }
            }
            if (value == null || typeof value === "function" || typeof value === "symbol" || typeof value === "boolean") {
                domElement.removeAttribute(key);
                break;
            }
            // `setAttribute` with objects becomes only `[object]` in IE8/9,
            // ('' + value) makes it output the correct toString()-value.
            if (__DEV__) {
                (0, check_string_coercion_1.checkAttributeStringCoercion)(value, key);
            }
            var sanitizedValue = (0, sanitizeURL_1.default)(react_feature_flags_1.enableTrustedTypesIntegration ? value : "" + value);
            domElement.setAttribute(key, sanitizedValue);
            break;
        }
        case "action":
        case "formAction": {
            // TODO: Consider moving these special cases to the form, input and button tags.
            if (__DEV__) {
                validateFormActionInDevelopment(tag, key, value, props);
            }
            if (react_feature_flags_1.enableFormActions) {
                if (typeof value === "function") {
                    // Set a javascript URL that doesn't do anything. We don't expect this to be invoked
                    // because we'll preventDefault, but it can happen if a form is manually submitted or
                    // if someone calls stopPropagation before React gets the event.
                    // If CSP is used to block javascript: URLs that's fine too. It just won't show this
                    // error message but the URL will be logged.
                    domElement.setAttribute(key, // eslint-disable-next-line no-script-url
                    "javascript:throw new Error('" + "A React form was unexpectedly submitted. If you called form.submit() manually, " + "consider using form.requestSubmit() instead. If you\\'re trying to use " + "event.stopPropagation() in a submit event handler, consider also calling " + "event.preventDefault()." + "')");
                    break;
                }
                else if (typeof prevValue === "function") {
                    // When we're switching off a Server Action that was originally hydrated.
                    // The server control these fields during SSR that are now trailing.
                    // The regular diffing doesn't apply since we compare against the previous props.
                    // Instead, we need to force them to be set to whatever they should be now.
                    // This would be a lot cleaner if we did this whole fork in the per-tag approach.
                    if (key === "formAction") {
                        if (tag !== "input") {
                            // Setting the name here isn't completely safe for inputs if this is switching
                            // to become a radio button. In that case we let the tag based override take
                            // control.
                            setProp(domElement, tag, "name", props.name, props, null);
                        }
                        setProp(domElement, tag, "formEncType", props.formEncType, props, null);
                        setProp(domElement, tag, "formMethod", props.formMethod, props, null);
                        setProp(domElement, tag, "formTarget", props.formTarget, props, null);
                    }
                    else {
                        setProp(domElement, tag, "encType", props.encType, props, null);
                        setProp(domElement, tag, "method", props.method, props, null);
                        setProp(domElement, tag, "target", props.target, props, null);
                    }
                }
            }
            if (value == null || !react_feature_flags_1.enableFormActions && typeof value === "function" || typeof value === "symbol" || typeof value === "boolean") {
                domElement.removeAttribute(key);
                break;
            }
            // `setAttribute` with objects becomes only `[object]` in IE8/9,
            // ('' + value) makes it output the correct toString()-value.
            if (__DEV__) {
                (0, check_string_coercion_1.checkAttributeStringCoercion)(value, key);
            }
            var sanitizedValue = (0, sanitizeURL_1.default)(react_feature_flags_1.enableTrustedTypesIntegration ? value : "" + value);
            domElement.setAttribute(key, sanitizedValue);
            break;
        }
        case "onClick": {
            // TODO: This cast may not be sound for SVG, MathML or custom elements.
            if (value != null) {
                if (__DEV__ && typeof value !== "function") {
                    warnForInvalidEventListener(key, value);
                }
                trapClickOnNonInteractiveElement(domElement);
            }
            break;
        }
        case "onScroll": {
            if (value != null) {
                if (__DEV__ && typeof value !== "function") {
                    warnForInvalidEventListener(key, value);
                }
                (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("scroll", domElement);
            }
            break;
        }
        case "onScrollEnd": {
            if (value != null) {
                if (__DEV__ && typeof value !== "function") {
                    warnForInvalidEventListener(key, value);
                }
                (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("scrollend", domElement);
            }
            break;
        }
        case "dangerouslySetInnerHTML": {
            if (value != null) {
                if (typeof value !== "object" || !("__html" in value)) {
                    throw new Error("`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. " + "Please visit https://reactjs.org/link/dangerously-set-inner-html " + "for more information.");
                }
                var nextHtml = value.__html;
                if (nextHtml != null) {
                    if (props.children != null) {
                        throw new Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
                    }
                    if (react_feature_flags_1.disableIEWorkarounds) {
                        domElement.innerHTML = nextHtml;
                    }
                    else {
                        (0, setInnerHTML_1.default)(domElement, nextHtml);
                    }
                }
            }
            break;
        }
        // Note: `option.selected` is not updated if `select.multiple` is
        // disabled with `removeAttribute`. We have special logic for handling this.
        case "multiple": {
            domElement.multiple = value && typeof value !== "function" && typeof value !== "symbol";
            break;
        }
        case "muted": {
            domElement.muted = value && typeof value !== "function" && typeof value !== "symbol";
            break;
        }
        case "suppressContentEditableWarning":
        case "suppressHydrationWarning":
        case "defaultValue": // Reserved
        case "defaultChecked":
        case "innerHTML": {
            // Noop
            break;
        }
        case "autoFocus": {
            // We polyfill it separately on the client during commit.
            // We could have excluded it in the property list instead of
            // adding a special case here, but then it wouldn't be emitted
            // on server rendering (but we *do* want to emit it in SSR).
            break;
        }
        case "xlinkHref": {
            if (value == null || typeof value === "function" || typeof value === "boolean" || typeof value === "symbol") {
                domElement.removeAttribute("xlink:href");
                break;
            }
            // `setAttribute` with objects becomes only `[object]` in IE8/9,
            // ('' + value) makes it output the correct toString()-value.
            if (__DEV__) {
                (0, check_string_coercion_1.checkAttributeStringCoercion)(value, key);
            }
            var sanitizedValue = (0, sanitizeURL_1.default)(react_feature_flags_1.enableTrustedTypesIntegration ? value : "" + value);
            domElement.setAttributeNS(xlinkNamespace, "xlink:href", sanitizedValue);
            break;
        }
        case "contentEditable":
        case "spellCheck":
        case "draggable":
        case "value":
        case "autoReverse":
        case "externalResourcesRequired":
        case "focusable":
        case "preserveAlpha": {
            // Booleanish String
            // These are "enumerated" attributes that accept "true" and "false".
            // In React, we let users pass `true` and `false` even though technically
            // these aren't boolean attributes (they are coerced to strings).
            // The SVG attributes are case-sensitive. Since the HTML attributes are
            // insensitive they also work even though we canonically use lower case.
            if (value != null && typeof value !== "function" && typeof value !== "symbol") {
                if (__DEV__) {
                    (0, check_string_coercion_1.checkAttributeStringCoercion)(value, key);
                }
                domElement.setAttribute(key, react_feature_flags_1.enableTrustedTypesIntegration ? value : "" + value);
            }
            else {
                domElement.removeAttribute(key);
            }
            break;
        }
        // Boolean
        case "allowFullScreen":
        case "async":
        case "autoPlay":
        case "controls":
        case "default":
        case "defer":
        case "disabled":
        case "disablePictureInPicture":
        case "disableRemotePlayback":
        case "formNoValidate":
        case "hidden":
        case "loop":
        case "noModule":
        case "noValidate":
        case "open":
        case "playsInline":
        case "readOnly":
        case "required":
        case "reversed":
        case "scoped":
        case "seamless":
        case "itemScope": {
            if (value && typeof value !== "function" && typeof value !== "symbol") {
                domElement.setAttribute(key, "");
            }
            else {
                domElement.removeAttribute(key);
            }
            break;
        }
        // Overloaded Boolean
        case "capture":
        case "download": {
            // An attribute that can be used as a flag as well as with a value.
            // When true, it should be present (set either to an empty string or its name).
            // When false, it should be omitted.
            // For any other value, should be present with that value.
            if (value === true) {
                domElement.setAttribute(key, "");
            }
            else if (value !== false && value != null && typeof value !== "function" && typeof value !== "symbol") {
                if (__DEV__) {
                    (0, check_string_coercion_1.checkAttributeStringCoercion)(value, key);
                }
                domElement.setAttribute(key, value);
            }
            else {
                domElement.removeAttribute(key);
            }
            break;
        }
        case "cols":
        case "rows":
        case "size":
        case "span": {
            // These are HTML attributes that must be positive numbers.
            if (value != null && typeof value !== "function" && typeof value !== "symbol" && !isNaN(value) && value >= 1) {
                if (__DEV__) {
                    (0, check_string_coercion_1.checkAttributeStringCoercion)(value, key);
                }
                domElement.setAttribute(key, value);
            }
            else {
                domElement.removeAttribute(key);
            }
            break;
        }
        case "rowSpan":
        case "start": {
            // These are HTML attributes that must be numbers.
            if (value != null && typeof value !== "function" && typeof value !== "symbol" && !isNaN(value)) {
                if (__DEV__) {
                    (0, check_string_coercion_1.checkAttributeStringCoercion)(value, key);
                }
                domElement.setAttribute(key, value);
            }
            else {
                domElement.removeAttribute(key);
            }
            break;
        }
        case "xlinkActuate":
            (0, DOMPropertyOperations_1.setValueForNamespacedAttribute)(domElement, xlinkNamespace, "xlink:actuate", value);
            break;
        case "xlinkArcrole":
            (0, DOMPropertyOperations_1.setValueForNamespacedAttribute)(domElement, xlinkNamespace, "xlink:arcrole", value);
            break;
        case "xlinkRole":
            (0, DOMPropertyOperations_1.setValueForNamespacedAttribute)(domElement, xlinkNamespace, "xlink:role", value);
            break;
        case "xlinkShow":
            (0, DOMPropertyOperations_1.setValueForNamespacedAttribute)(domElement, xlinkNamespace, "xlink:show", value);
            break;
        case "xlinkTitle":
            (0, DOMPropertyOperations_1.setValueForNamespacedAttribute)(domElement, xlinkNamespace, "xlink:title", value);
            break;
        case "xlinkType":
            (0, DOMPropertyOperations_1.setValueForNamespacedAttribute)(domElement, xlinkNamespace, "xlink:type", value);
            break;
        case "xmlBase":
            (0, DOMPropertyOperations_1.setValueForNamespacedAttribute)(domElement, xmlNamespace, "xml:base", value);
            break;
        case "xmlLang":
            (0, DOMPropertyOperations_1.setValueForNamespacedAttribute)(domElement, xmlNamespace, "xml:lang", value);
            break;
        case "xmlSpace":
            (0, DOMPropertyOperations_1.setValueForNamespacedAttribute)(domElement, xmlNamespace, "xml:space", value);
            break;
        // Properties that should not be allowed on custom elements.
        case "is": {
            if (__DEV__) {
                if (prevValue != null) {
                    console.error("Cannot update the \"is\" prop after it has been initialized.");
                }
            }
            // TODO: We shouldn't actually set this attribute, because we've already
            // passed it to createElement. We don't also need the attribute.
            // However, our tests currently query for it so it's plausible someone
            // else does too so it's break.
            (0, DOMPropertyOperations_1.setValueForAttribute)(domElement, "is", value);
            break;
        }
        case "innerText":
        case "textContent":
            if (react_feature_flags_1.enableCustomElementPropertySupport) {
                break;
            }
        // Fall through
        default: {
            if (key.length > 2 && (key[0] === "o" || key[0] === "O") && (key[1] === "n" || key[1] === "N")) {
                if (__DEV__ && EventRegistry_1.registrationNameDependencies.hasOwnProperty(key) && value != null && typeof value !== "function") {
                    warnForInvalidEventListener(key, value);
                }
            }
            else {
                var attributeName = (0, getAttributeAlias_1.default)(key);
                (0, DOMPropertyOperations_1.setValueForAttribute)(domElement, attributeName, value);
            }
        }
    }
}
function setPropOnCustomElement(domElement, tag, key, value, props, prevValue) {
    switch (key) {
        case "style": {
            (0, CSSPropertyOperations_1.setValueForStyles)(domElement, value, prevValue);
            break;
        }
        case "dangerouslySetInnerHTML": {
            if (value != null) {
                if (typeof value !== "object" || !("__html" in value)) {
                    throw new Error("`props.dangerouslySetInnerHTML` must be in the form `{__html: ...}`. " + "Please visit https://reactjs.org/link/dangerously-set-inner-html " + "for more information.");
                }
                var nextHtml = value.__html;
                if (nextHtml != null) {
                    if (props.children != null) {
                        throw new Error("Can only set one of `children` or `props.dangerouslySetInnerHTML`.");
                    }
                    if (react_feature_flags_1.disableIEWorkarounds) {
                        domElement.innerHTML = nextHtml;
                    }
                    else {
                        (0, setInnerHTML_1.default)(domElement, nextHtml);
                    }
                }
            }
            break;
        }
        case "children": {
            if (typeof value === "string") {
                (0, setTextContent_1.default)(domElement, value);
            }
            else if (typeof value === "number") {
                (0, setTextContent_1.default)(domElement, "" + value);
            }
            break;
        }
        case "onScroll": {
            if (value != null) {
                if (__DEV__ && typeof value !== "function") {
                    warnForInvalidEventListener(key, value);
                }
                (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("scroll", domElement);
            }
            break;
        }
        case "onScrollEnd": {
            if (value != null) {
                if (__DEV__ && typeof value !== "function") {
                    warnForInvalidEventListener(key, value);
                }
                (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("scrollend", domElement);
            }
            break;
        }
        case "onClick": {
            // TODO: This cast may not be sound for SVG, MathML or custom elements.
            if (value != null) {
                if (__DEV__ && typeof value !== "function") {
                    warnForInvalidEventListener(key, value);
                }
                trapClickOnNonInteractiveElement(domElement);
            }
            break;
        }
        case "suppressContentEditableWarning":
        case "suppressHydrationWarning":
        case "innerHTML": {
            // Noop
            break;
        }
        case "innerText": // Properties
        case "textContent":
            if (react_feature_flags_1.enableCustomElementPropertySupport) {
                break;
            }
        // Fall through
        default: {
            if (EventRegistry_1.registrationNameDependencies.hasOwnProperty(key)) {
                if (__DEV__ && value != null && typeof value !== "function") {
                    warnForInvalidEventListener(key, value);
                }
            }
            else {
                if (react_feature_flags_1.enableCustomElementPropertySupport) {
                    (0, DOMPropertyOperations_1.setValueForPropertyOnCustomComponent)(domElement, key, value);
                }
                else {
                    if (typeof value === "boolean") {
                        // Special case before the new flag is on
                        value = "" + value;
                    }
                    (0, DOMPropertyOperations_1.setValueForAttribute)(domElement, key.toString(), value);
                }
            }
        }
    }
}
function setInitialProperties(domElement, tag, anyProps) {
    if (__DEV__) {
        validatePropertiesInDevelopment(tag, anyProps);
    }
    // TODO: Make sure that we check isMounted before firing any of these events.
    switch (tag) {
        case "div":
        case "span":
        case "svg":
        case "path":
        case "a":
        case "g":
        case "p":
        case "li": {
            // Fast track the most common tag types
            break;
        }
        case "input": {
            var props_1 = anyProps;
            if (__DEV__) {
                (0, ReactControlledValuePropTypes_1.checkControlledValueProps)("input", props_1);
            }
            // We listen to this event in case to ensure emulated bubble
            // listeners still fire for the invalid event.
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("invalid", domElement);
            var name_1 = null;
            var type = null;
            var value = null;
            var defaultValue = null;
            var checked = null;
            var defaultChecked = null;
            for (var key in props_1) {
                if (!props_1.hasOwnProperty(key)) {
                    continue;
                }
                var propKey = key;
                if (props_1[propKey] == null) {
                    continue;
                }
                switch (propKey) {
                    case "name": {
                        name_1 = props_1[propKey];
                        break;
                    }
                    case "type": {
                        type = props_1[propKey];
                        break;
                    }
                    case "checked": {
                        checked = props_1[propKey];
                        break;
                    }
                    case "defaultChecked": {
                        defaultChecked = props_1[propKey];
                        break;
                    }
                    case "value": {
                        value = props_1[propKey];
                        break;
                    }
                    case "defaultValue": {
                        defaultValue = props_1[propKey];
                        break;
                    }
                    case "children":
                    case "dangerouslySetInnerHTML": {
                        if (props_1[propKey] != null) {
                            throw new Error("".concat(tag, " is a void element tag and must neither have `children` nor ") + "use `dangerouslySetInnerHTML`.");
                        }
                        break;
                    }
                    default: {
                        setProp(domElement, tag, propKey, props_1[propKey], props_1, null);
                    }
                }
            }
            // TODO: Make sure we check if this is still unmounted or do any clean
            // up necessary since we never stop tracking anymore.
            (0, ReactDOMInput_1.validateInputProps)(domElement, props_1);
            (0, ReactDOMInput_1.initInput)(domElement, value, defaultValue, checked, defaultChecked, type, name_1, false);
            (0, inputValueTracking_1.track)(domElement);
            return;
        }
        case "select": {
            var props_2 = anyProps;
            if (__DEV__) {
                (0, ReactControlledValuePropTypes_1.checkControlledValueProps)("select", props_2);
            }
            // We listen to this event in case to ensure emulated bubble
            // listeners still fire for the invalid event.
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("invalid", domElement);
            var value = null;
            var defaultValue = null;
            var multiple = null;
            for (var key in props_2) {
                if (!props_2.hasOwnProperty(key)) {
                    continue;
                }
                var propKey = key;
                if (props_2[propKey] == null) {
                    continue;
                }
                switch (propKey) {
                    case "value": {
                        value = props_2[propKey];
                        // This is handled by initSelect below.
                        break;
                    }
                    case "defaultValue": {
                        defaultValue = props_2[propKey];
                        // This is handled by initSelect below.
                        break;
                    }
                    case "multiple": {
                        multiple = props_2[propKey]; // TODO: We don't actually have to fall through here because we set it
                        // in initSelect anyway. We can remove the special case in setProp.
                    }
                    // Fallthrough
                    default: {
                        setProp(domElement, tag, propKey, props_2[propKey], props_2, null);
                    }
                }
            }
            (0, ReactDOMSelect_1.validateSelectProps)(domElement, props_2);
            (0, ReactDOMSelect_1.initSelect)(domElement, value, defaultValue, multiple);
            return;
        }
        case "textarea": {
            var props_3 = anyProps;
            if (__DEV__) {
                (0, ReactControlledValuePropTypes_1.checkControlledValueProps)("textarea", props_3);
            }
            // We listen to this event in case to ensure emulated bubble
            // listeners still fire for the invalid event.
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("invalid", domElement);
            var value = null;
            var defaultValue = null;
            var children = null;
            for (var key in props_3) {
                if (!props_3.hasOwnProperty(key)) {
                    continue;
                }
                var propKey = key;
                if (props_3[propKey] == null) {
                    continue;
                }
                switch (propKey) {
                    case "value": {
                        value = props_3[propKey];
                        // This is handled by initTextarea below.
                        break;
                    }
                    case "defaultValue": {
                        defaultValue = props_3[propKey];
                        break;
                    }
                    case "children": {
                        children = props_3[propKey];
                        // Handled by initTextarea above.
                        break;
                    }
                    case "dangerouslySetInnerHTML": {
                        if (props_3[propKey] !== null) {
                            // TODO: Do we really need a special error message for this. It's also pretty blunt.
                            throw new Error("`dangerouslySetInnerHTML` does not make sense on <textarea>.");
                        }
                        break;
                    }
                    default: {
                        setProp(domElement, tag, propKey, props_3[propKey], props_3, null);
                    }
                }
            }
            // TODO: Make sure we check if this is still unmounted or do any clean
            // up necessary since we never stop tracking anymore.
            (0, ReactDOMTextarea_1.validateTextareaProps)(domElement, props_3);
            (0, ReactDOMTextarea_1.initTextarea)(domElement, value, defaultValue, children);
            (0, inputValueTracking_1.track)(domElement);
            return;
        }
        case "option": {
            var props_4 = anyProps;
            (0, ReactDOMOption_1.validateOptionProps)(domElement, props_4);
            for (var key in props_4) {
                if (!props_4.hasOwnProperty(key)) {
                    continue;
                }
                var propKey = key;
                var propValue = [propKey];
                if (propValue == null) {
                    continue;
                }
                switch (propKey) {
                    case "selected": {
                        // TODO: Remove support for selected on option.
                        domElement.selected = propValue && typeof propValue !== "function" && typeof propValue !== "symbol";
                        break;
                    }
                    default: {
                        setProp(domElement, tag, propKey, propValue, props_4, null);
                    }
                }
            }
            return;
        }
        case "dialog": {
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("cancel", domElement);
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("close", domElement);
            break;
        }
        case "iframe":
        case "object": {
            // We listen to this event in case to ensure emulated bubble
            // listeners still fire for the load event.
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("load", domElement);
            break;
        }
        case "video":
        case "audio": {
            // We listen to these events in case to ensure emulated bubble
            // listeners still fire for all the media events.
            for (var i = 0; i < DOMPluginEventSystem_1.mediaEventTypes.length; i++) {
                (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)(DOMPluginEventSystem_1.mediaEventTypes[i], domElement);
            }
            break;
        }
        case "image": {
            // We listen to these events in case to ensure emulated bubble
            // listeners still fire for error and load events.
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("error", domElement);
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("load", domElement);
            break;
        }
        case "details": {
            // We listen to this event in case to ensure emulated bubble
            // listeners still fire for the toggle event.
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("toggle", domElement);
            break;
        }
        case "embed":
        case "source":
        case "img":
        case "link": {
            // These are void elements that also need delegated events.
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("error", domElement);
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("load", domElement); // We fallthrough to the return of the void elements
        }
        case "area":
        case "base":
        case "br":
        case "col":
        case "hr":
        case "keygen":
        case "meta":
        case "param":
        case "track":
        case "wbr":
        case "menuitem": {
            var props_5 = anyProps;
            // Void elements
            for (var key in props_5) {
                if (!props_5.hasOwnProperty(key)) {
                    continue;
                }
                var propKey = key;
                var propValue = props_5[propKey];
                if (propValue == null) {
                    continue;
                }
                switch (propKey) {
                    case "children":
                    case "dangerouslySetInnerHTML": {
                        // TODO: Can we make this a DEV warning to avoid this deny list?
                        throw new Error("".concat(tag, " is a void element tag and must neither have `children` nor ") + "use `dangerouslySetInnerHTML`.");
                    }
                    // defaultChecked and defaultValue are ignored by setProp
                    default: {
                        setProp(domElement, tag, propKey, propValue, props_5, null);
                    }
                }
            }
            return;
        }
        default: {
            var props_6 = anyProps;
            if ((0, isCustomElement_1.default)(tag, props_6)) {
                for (var key in props_6) {
                    if (!props_6.hasOwnProperty(key)) {
                        continue;
                    }
                    var propKey = key;
                    var propValue = props_6[propKey];
                    if (propValue == null) {
                        continue;
                    }
                    setPropOnCustomElement(domElement, tag, propKey, propValue, props_6, null);
                }
                return;
            }
        }
    }
    var props = anyProps;
    for (var key in props) {
        if (!props.hasOwnProperty(key)) {
            continue;
        }
        var propKey = key;
        var propValue = props[propKey];
        if (propValue == null) {
            continue;
        }
        setProp(domElement, tag, key, propValue, props, null);
    }
}
exports.setInitialProperties = setInitialProperties;
function updateProperties(domElement, tag, lastProps, nextProps) {
    if (__DEV__) {
        validatePropertiesInDevelopment(tag, nextProps);
    }
    switch (tag) {
        case "div":
        case "span":
        case "svg":
        case "path":
        case "a":
        case "g":
        case "p":
        case "li": {
            // Fast track the most common tag types
            break;
        }
        case "input": {
            var name_2 = null;
            var type = null;
            var value = null;
            var defaultValue = null;
            var lastDefaultValue = null;
            var checked = null;
            var defaultChecked = null;
            for (var key in lastProps) {
                var propKey = key;
                if (lastProps.hasOwnProperty(propKey) && lastProps[propKey] !== null) {
                    switch (propKey) {
                        case "checked": {
                            break;
                        }
                        case "value": {
                            // This is handled by updateWrapper below.
                            break;
                        }
                        case "defaultValue": {
                            lastDefaultValue = lastProps[propKey];
                        }
                        // defaultChecked and defaultValue are ignored by setProp
                        // Fallthrough
                        default: {
                            if (!nextProps.hasOwnProperty(propKey))
                                setProp(domElement, tag, propKey, null, nextProps, lastProps[propKey]);
                        }
                    }
                }
            }
            for (var key in nextProps) {
                var propKey = key;
                if (nextProps.hasOwnProperty(propKey) && (nextProps[propKey] != null || lastProps[propKey] != null)) {
                    switch (propKey) {
                        case "type": {
                            type = nextProps[propKey];
                            break;
                        }
                        case "name": {
                            name_2 = nextProps[propKey];
                            break;
                        }
                        case "checked": {
                            checked = nextProps[propKey];
                            break;
                        }
                        case "defaultChecked": {
                            defaultChecked = nextProps[propKey];
                            break;
                        }
                        case "value": {
                            value = nextProps[propKey];
                            break;
                        }
                        case "defaultValue": {
                            defaultValue = nextProps[propKey];
                            break;
                        }
                        case "children":
                        case "dangerouslySetInnerHTML": {
                            if (nextProps[propKey] != null) {
                                throw new Error("".concat(tag, " is a void element tag and must neither have `children` nor ") + "use `dangerouslySetInnerHTML`.");
                            }
                            break;
                        }
                        default: {
                            var nextProp = nextProps[propKey];
                            var lastProp = lastProps[propKey];
                            if (nextProp !== lastProp) {
                                setProp(domElement, tag, propKey, nextProp, nextProps, lastProp);
                            }
                        }
                    }
                }
            }
            if (__DEV__) {
                var wasControlled = lastProps.type === "checkbox" || lastProps.type === "radio" ? lastProps.checked != null : lastProps.value != null;
                var isControlled = nextProps.type === "checkbox" || nextProps.type === "radio" ? nextProps.checked != null : nextProps.value != null;
                if (!wasControlled && isControlled && !didWarnUncontrolledToControlled) {
                    console.error("A component is changing an uncontrolled input to be controlled. " + "This is likely caused by the value changing from undefined to " + "a defined value, which should not happen. " + "Decide between using a controlled or uncontrolled input " + "element for the lifetime of the component. More info: https://reactjs.org/link/controlled-components");
                    didWarnUncontrolledToControlled = true;
                }
                if (wasControlled && !isControlled && !didWarnControlledToUncontrolled) {
                    console.error("A component is changing a controlled input to be uncontrolled. " + "This is likely caused by the value changing from a defined to " + "undefined, which should not happen. " + "Decide between using a controlled or uncontrolled input " + "element for the lifetime of the component. More info: https://reactjs.org/link/controlled-components");
                    didWarnControlledToUncontrolled = true;
                }
            }
            // Update the wrapper around inputs *after* updating props. This has to
            // happen after updating the rest of props. Otherwise HTML5 input validations
            // raise warnings and prevent the new value from being assigned.
            (0, ReactDOMInput_1.updateInput)(domElement, value, defaultValue, lastDefaultValue, checked, defaultChecked, type, name_2);
            return;
        }
        case "select": {
            var value = null;
            var defaultValue = null;
            var multiple = null;
            var wasMultiple = null;
            for (var key in lastProps) {
                var propKey = key;
                var lastProp = lastProps[propKey];
                if (lastProps.hasOwnProperty(propKey) && lastProp != null) {
                    switch (propKey) {
                        case "value": {
                            // This is handled by updateWrapper below.
                            break;
                        }
                        // defaultValue are ignored by setProp
                        case "multiple": {
                            wasMultiple = lastProps[propKey]; // TODO: Move special case in here from setProp.
                        }
                        // Fallthrough
                        default: {
                            if (!nextProps.hasOwnProperty(propKey))
                                setProp(domElement, tag, propKey, null, nextProps, lastProp);
                        }
                    }
                }
            }
            for (var key in nextProps) {
                var propKey = key;
                if (nextProps.hasOwnProperty(propKey) && (nextProps[propKey] != null || nextProps[propKey] != null)) {
                    switch (propKey) {
                        case "value": {
                            value = nextProps[propKey];
                            // This is handled by updateSelect below.
                            break;
                        }
                        case "defaultValue": {
                            defaultValue = nextProps[propKey];
                            break;
                        }
                        case "multiple": {
                            multiple = nextProps[propKey]; // TODO: Just move the special case in here from setProp.
                        }
                        // Fallthrough
                        default: {
                            if (nextProps[propKey] !== lastProps[propKey]) {
                                setProp(domElement, tag, propKey, nextProps[propKey], nextProps, lastProps[propKey]);
                            }
                        }
                    }
                }
            }
            // <select> value update needs to occur after <option> children
            // reconciliation
            (0, ReactDOMSelect_1.updateSelect)(domElement, value, defaultValue, multiple, wasMultiple);
            return;
        }
        case "textarea": {
            var value = null;
            var defaultValue = null;
            for (var key in lastProps) {
                var propKey = key;
                var lastProp = lastProps[propKey];
                if (lastProps.hasOwnProperty(propKey) && lastProp != null && !nextProps.hasOwnProperty(propKey)) {
                    switch (propKey) {
                        case "value": {
                            // This is handled by updateTextarea below.
                            break;
                        }
                        case "children": {
                            // TODO: This doesn't actually do anything if it updates.
                            break;
                        }
                        // defaultValue is ignored by setProp
                        default: {
                            setProp(domElement, tag, propKey, null, nextProps, lastProp);
                        }
                    }
                }
            }
            for (var key in nextProps) {
                var propKey = key;
                var nextProp = nextProps[propKey];
                var lastProp = lastProps[propKey];
                if (nextProps.hasOwnProperty(propKey) && (nextProp != null || lastProp != null)) {
                    switch (propKey) {
                        case "value": {
                            value = nextProp;
                            // This is handled by updateTextarea below.
                            break;
                        }
                        case "defaultValue": {
                            defaultValue = nextProp;
                            break;
                        }
                        case "children": {
                            // TODO: This doesn't actually do anything if it updates.
                            break;
                        }
                        case "dangerouslySetInnerHTML": {
                            if (nextProp != null) {
                                // TODO: Do we really need a special error message for this. It's also pretty blunt.
                                throw new Error("`dangerouslySetInnerHTML` does not make sense on <textarea>.");
                            }
                            break;
                        }
                        default: {
                            if (nextProp !== lastProp)
                                setProp(domElement, tag, propKey, nextProp, nextProps, lastProp);
                        }
                    }
                }
            }
            (0, ReactDOMTextarea_1.updateTextarea)(domElement, value, defaultValue);
            return;
        }
        case "option": {
            for (var key in lastProps) {
                var propKey = key;
                var lastProp = lastProps[propKey];
                if (lastProps.hasOwnProperty(propKey) && lastProp != null && !nextProps.hasOwnProperty(propKey)) {
                    switch (propKey) {
                        case "selected": {
                            // TODO: Remove support for selected on option.
                            domElement.selected = false;
                            break;
                        }
                        default: {
                            setProp(domElement, tag, propKey, null, nextProps, lastProp);
                        }
                    }
                }
            }
            for (var key in nextProps) {
                var propKey = key;
                var nextProp = nextProps[propKey];
                var lastProp = lastProps[propKey];
                if (nextProps.hasOwnProperty(propKey) && nextProp !== lastProp && (nextProp != null || lastProp != null)) {
                    switch (propKey) {
                        case "selected": {
                            // TODO: Remove support for selected on option.
                            domElement.selected = nextProp && typeof nextProp !== "function" && typeof nextProp !== "symbol";
                            break;
                        }
                        default: {
                            setProp(domElement, tag, propKey, nextProp, nextProps, lastProp);
                        }
                    }
                }
            }
            return;
        }
        case "img":
        case "link":
        case "area":
        case "base":
        case "br":
        case "col":
        case "embed":
        case "hr":
        case "keygen":
        case "meta":
        case "param":
        case "source":
        case "track":
        case "wbr":
        case "menuitem": {
            // Void elements
            for (var key in lastProps) {
                var propKey = key;
                var lastProp = lastProps[propKey];
                if (lastProps.hasOwnProperty(propKey) && lastProp != null && !nextProps.hasOwnProperty(propKey)) {
                    setProp(domElement, tag, propKey, null, nextProps, lastProp);
                }
            }
            for (var key in nextProps) {
                var propKey = key;
                var nextProp = nextProps[propKey];
                var lastProp = lastProps[propKey];
                if (nextProps.hasOwnProperty(propKey) && nextProp !== lastProp && (nextProp != null || lastProp != null)) {
                    switch (propKey) {
                        case "children":
                        case "dangerouslySetInnerHTML": {
                            if (nextProp != null) {
                                // TODO: Can we make this a DEV warning to avoid this deny list?
                                throw new Error("".concat(tag, " is a void element tag and must neither have `children` nor ") + "use `dangerouslySetInnerHTML`.");
                            }
                            break;
                        }
                        // defaultChecked and defaultValue are ignored by setProp
                        default: {
                            setProp(domElement, tag, propKey, nextProp, nextProps, lastProp);
                        }
                    }
                }
            }
            return;
        }
        default: {
            if ((0, isCustomElement_1.default)(tag, nextProps)) {
                for (var key in lastProps) {
                    var propKey = key;
                    var lastProp = lastProps[propKey];
                    if (lastProps.hasOwnProperty(propKey) && lastProp != null && !nextProps.hasOwnProperty(propKey)) {
                        setPropOnCustomElement(domElement, tag, propKey, null, nextProps, lastProp);
                    }
                }
                for (var key in nextProps) {
                    var propKey = key;
                    var nextProp = nextProps[propKey];
                    var lastProp = lastProps[propKey];
                    if (nextProps.hasOwnProperty(propKey) && nextProp !== lastProp && (nextProp != null || lastProp != null)) {
                        setPropOnCustomElement(domElement, tag, propKey, nextProp, nextProps, lastProp);
                    }
                }
                return;
            }
        }
    }
    for (var key in lastProps) {
        var propKey = key;
        var lastProp = lastProps[propKey];
        if (lastProps.hasOwnProperty(propKey) && lastProp != null && !nextProps.hasOwnProperty(propKey)) {
            setProp(domElement, tag, propKey, null, nextProps, lastProp);
        }
    }
    for (var key in nextProps) {
        var propKey = key;
        var nextProp = nextProps[propKey];
        var lastProp = lastProps[propKey];
        if (nextProps.hasOwnProperty(propKey) && nextProp !== lastProp && (nextProp != null || lastProp != null)) {
            setProp(domElement, tag, propKey, nextProp, nextProps, lastProp);
        }
    }
}
exports.updateProperties = updateProperties;
function getPossibleStandardName(propName) {
    if (__DEV__) {
        var lowerCasedName = propName.toLowerCase();
        if (!possibleStandardNames_1.default.hasOwnProperty(lowerCasedName)) {
            return null;
        }
        return possibleStandardNames_1.default[lowerCasedName] || null;
    }
    return null;
}
function diffHydratedStyles(domElement, value) {
    if (value != null && typeof value !== "object") {
        throw new Error("The `style` prop expects a mapping from style properties to values, " + "not a string. For example, style={{marginRight: spacing + 'em'}} when " + "using JSX.");
    }
    if (canDiffStyleForHydrationWarning) {
        var expectedStyle = (0, CSSPropertyOperations_1.createDangerousStringForStyles)(value);
        var serverValue = domElement.getAttribute("style");
        warnForPropDifference("style", serverValue, expectedStyle);
    }
}
function hydrateAttribute(domElement, propKey, attributeName, value, extraAttributes) {
    extraAttributes.delete(attributeName);
    var serverValue = domElement.getAttribute(attributeName);
    if (serverValue === null) {
        switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
                return;
        }
    }
    else {
        if (value == null) { // We had an attribute but shouldn't have had one, so read it
            // for the error message.
        }
        else {
            switch (typeof value) {
                case "function":
                case "symbol":
                case "boolean":
                    break;
                default: {
                    if (__DEV__) {
                        (0, check_string_coercion_1.checkAttributeStringCoercion)(value, propKey);
                    }
                    if (serverValue === "" + value) {
                        return;
                    }
                }
            }
        }
    }
    warnForPropDifference(propKey, serverValue, value);
}
function hydrateBooleanAttribute(domElement, propKey, attributeName, value, extraAttributes) {
    extraAttributes.delete(attributeName);
    var serverValue = domElement.getAttribute(attributeName);
    if (serverValue === null) {
        switch (typeof value) {
            case "function":
            case "symbol":
                return;
        }
        if (!value) {
            return;
        }
    }
    else {
        switch (typeof value) {
            case "function":
            case "symbol":
                break;
            default: {
                if (value) {
                    // If this was a boolean, it doesn't matter what the value is
                    // the fact that we have it is the same as the expected.
                    // As long as it's positive.
                    return;
                }
            }
        }
    }
    warnForPropDifference(propKey, serverValue, value);
}
function hydrateOverloadedBooleanAttribute(domElement, propKey, attributeName, value, extraAttributes) {
    extraAttributes.delete(attributeName);
    var serverValue = domElement.getAttribute(attributeName);
    if (serverValue === null) {
        switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
                return;
            default:
                if (value === false) {
                    return;
                }
        }
    }
    else {
        if (value == null) { // We had an attribute but shouldn't have had one, so read it
            // for the error message.
        }
        else {
            switch (typeof value) {
                case "function":
                case "symbol":
                    break;
                case "boolean":
                    if (value === true && serverValue === "") {
                        return;
                    }
                    break;
                default: {
                    if (__DEV__) {
                        (0, check_string_coercion_1.checkAttributeStringCoercion)(value, propKey);
                    }
                    if (serverValue === "" + value) {
                        return;
                    }
                }
            }
        }
    }
    warnForPropDifference(propKey, serverValue, value);
}
function hydrateBooleanishAttribute(domElement, propKey, attributeName, value, extraAttributes) {
    extraAttributes.delete(attributeName);
    var serverValue = domElement.getAttribute(attributeName);
    if (serverValue === null) {
        switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
                return;
        }
    }
    else {
        if (value == null) { // We had an attribute but shouldn't have had one, so read it
            // for the error message.
        }
        else {
            switch (typeof value) {
                case "function":
                case "symbol":
                    break;
                default: {
                    if (__DEV__) {
                        (0, check_string_coercion_1.checkAttributeStringCoercion)(value, attributeName);
                    }
                    if (serverValue === "" + value) {
                        return;
                    }
                }
            }
        }
    }
    warnForPropDifference(propKey, serverValue, value);
}
function hydrateNumericAttribute(domElement, propKey, attributeName, value, extraAttributes) {
    extraAttributes.delete(attributeName);
    var serverValue = domElement.getAttribute(attributeName);
    if (serverValue === null) {
        switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
                return;
            default:
                if (isNaN(value)) {
                    return;
                }
        }
    }
    else {
        if (value == null) { // We had an attribute but shouldn't have had one, so read it
            // for the error message.
        }
        else {
            switch (typeof value) {
                case "function":
                case "symbol":
                case "boolean":
                    break;
                default: {
                    if (isNaN(value)) {
                        // We had an attribute but shouldn't have had one, so read it
                        // for the error message.
                        break;
                    }
                    if (__DEV__) {
                        (0, check_string_coercion_1.checkAttributeStringCoercion)(value, propKey);
                    }
                    if (serverValue === "" + value) {
                        return;
                    }
                }
            }
        }
    }
    warnForPropDifference(propKey, serverValue, value);
}
function hydratePositiveNumericAttribute(domElement, propKey, attributeName, value, extraAttributes) {
    extraAttributes.delete(attributeName);
    var serverValue = domElement.getAttribute(attributeName);
    if (serverValue === null) {
        switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
                return;
            default:
                if (isNaN(value) || value < 1) {
                    return;
                }
        }
    }
    else {
        if (value == null) { // We had an attribute but shouldn't have had one, so read it
            // for the error message.
        }
        else {
            switch (typeof value) {
                case "function":
                case "symbol":
                case "boolean":
                    break;
                default: {
                    if (isNaN(value) || value < 1) {
                        // We had an attribute but shouldn't have had one, so read it
                        // for the error message.
                        break;
                    }
                    if (__DEV__) {
                        (0, check_string_coercion_1.checkAttributeStringCoercion)(value, propKey);
                    }
                    if (serverValue === "" + value) {
                        return;
                    }
                }
            }
        }
    }
    warnForPropDifference(propKey, serverValue, value);
}
function hydrateSanitizedAttribute(domElement, propKey, attributeName, value, extraAttributes) {
    extraAttributes.delete(attributeName);
    var serverValue = domElement.getAttribute(attributeName);
    if (serverValue === null) {
        switch (typeof value) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
                return;
        }
    }
    else {
        if (value == null) { // We had an attribute but shouldn't have had one, so read it
            // for the error message.
        }
        else {
            switch (typeof value) {
                case "function":
                case "symbol":
                case "boolean":
                    break;
                default: {
                    if (__DEV__) {
                        (0, check_string_coercion_1.checkAttributeStringCoercion)(value, propKey);
                    }
                    var sanitizedValue = (0, sanitizeURL_1.default)("" + value);
                    if (serverValue === sanitizedValue) {
                        return;
                    }
                }
            }
        }
    }
    warnForPropDifference(propKey, serverValue, value);
}
function diffHydratedCustomComponent(domElement, tag, props, hostContext, extraAttributes) {
    for (var propKey in props) {
        if (!props.hasOwnProperty(propKey)) {
            continue;
        }
        var value = props[propKey];
        if (value == null) {
            continue;
        }
        if (EventRegistry_1.registrationNameDependencies.hasOwnProperty(propKey)) {
            if (typeof value !== "function") {
                warnForInvalidEventListener(propKey, value);
            }
            continue;
        }
        if (props.suppressHydrationWarning === true) {
            // Don't bother comparing. We're ignoring all these warnings.
            continue;
        }
        // Validate that the properties correspond to their expected values.
        switch (propKey) {
            case "children": // Checked above already
            case "suppressContentEditableWarning":
            case "suppressHydrationWarning":
            case "defaultValue":
            case "defaultChecked":
            case "innerHTML":
                // Noop
                continue;
            case "dangerouslySetInnerHTML":
                var serverHTML = domElement.innerHTML;
                var nextHtml = value ? value.__html : undefined;
                if (nextHtml != null) {
                    var expectedHTML = normalizeHTML(domElement, nextHtml);
                    warnForPropDifference(propKey, serverHTML, expectedHTML);
                }
                continue;
            case "style":
                extraAttributes.delete(propKey);
                diffHydratedStyles(domElement, value);
                continue;
            case "offsetParent":
            case "offsetTop":
            case "offsetLeft":
            case "offsetWidth":
            case "offsetHeight":
            case "isContentEditable":
            case "outerText":
            case "outerHTML":
                if (react_feature_flags_1.enableCustomElementPropertySupport) {
                    extraAttributes.delete(propKey.toLowerCase());
                    if (__DEV__) {
                        console.error("Assignment to read-only property will result in a no-op: `%s`", propKey);
                    }
                    continue;
                }
            // Fall through
            case "className":
                if (react_feature_flags_1.enableCustomElementPropertySupport) {
                    // className is a special cased property on the server to render as an attribute.
                    extraAttributes.delete("class");
                    var serverValue = (0, DOMPropertyOperations_1.getValueForAttributeOnCustomComponent)(domElement, "class", value);
                    warnForPropDifference("className", serverValue, value);
                    continue;
                }
            // Fall through
            default: {
                // This is a DEV-only path
                var hostContextDev = hostContext;
                var hostContextProd = hostContextDev.context;
                if (hostContextProd === react_fiber_config_host_context_namespace_1.HostContextNamespaceNone && tag !== "svg" && tag !== "math") {
                    extraAttributes.delete(propKey.toLowerCase());
                }
                else {
                    extraAttributes.delete(propKey);
                }
                var serverValue = (0, DOMPropertyOperations_1.getValueForAttributeOnCustomComponent)(domElement, propKey, value);
                warnForPropDifference(propKey, serverValue, value);
            }
        }
    }
}
// This is the exact URL string we expect that Fizz renders if we provide a function action.
// We use this for hydration warnings. It needs to be in sync with Fizz. Maybe makes sense
// as a shared module for that reason.
var EXPECTED_FORM_ACTION_URL = // eslint-disable-next-line no-script-url
 "javascript:throw new Error('A React form was unexpectedly submitted.')";
function diffHydratedGenericElement(domElement, tag, props, hostContext, extraAttributes) {
    for (var propKey in props) {
        if (!props.hasOwnProperty(propKey)) {
            continue;
        }
        var value = props[propKey];
        if (value == null) {
            continue;
        }
        if (EventRegistry_1.registrationNameDependencies.hasOwnProperty(propKey)) {
            if (typeof value !== "function") {
                warnForInvalidEventListener(propKey, value);
            }
            continue;
        }
        if (props.suppressHydrationWarning === true) {
            // Don't bother comparing. We're ignoring all these warnings.
            continue;
        }
        // Validate that the properties correspond to their expected values.
        switch (propKey) {
            case "children": // Checked above already
            case "suppressContentEditableWarning":
            case "suppressHydrationWarning":
            case "value": // Controlled attributes are not validated
            case "checked": // TODO: Only ignore them on controlled tags.
            case "selected":
            case "defaultValue":
            case "defaultChecked":
            case "innerHTML":
                // Noop
                continue;
            case "dangerouslySetInnerHTML":
                var serverHTML = domElement.innerHTML;
                var nextHtml = value ? value.__html : undefined;
                if (nextHtml != null) {
                    var expectedHTML = normalizeHTML(domElement, nextHtml);
                    warnForPropDifference(propKey, serverHTML, expectedHTML);
                }
                continue;
            case "className":
                hydrateAttribute(domElement, propKey, "class", value, extraAttributes);
                continue;
            case "tabIndex":
                hydrateAttribute(domElement, propKey, "tabindex", value, extraAttributes);
                continue;
            case "style":
                extraAttributes.delete(propKey);
                diffHydratedStyles(domElement, value);
                continue;
            case "multiple": {
                extraAttributes.delete(propKey);
                var serverValue = domElement.multiple;
                warnForPropDifference(propKey, serverValue, value);
            }
            case "muted": {
                extraAttributes.delete(propKey);
                var serverValue = domElement.muted;
                warnForPropDifference(propKey, serverValue, value);
            }
            case "autoFocus": {
                extraAttributes.delete("autofocus");
                var serverValue = domElement.autofocus;
                warnForPropDifference(propKey, serverValue, value);
            }
            case "src":
            case "href":
                if (react_feature_flags_1.enableFilterEmptyStringAttributesDOM) {
                    if (value === "") {
                        if (__DEV__) {
                            if (propKey === "src") {
                                console.error("An empty string (\"\") was passed to the %s attribute. " + "This may cause the browser to download the whole page again over the network. " + "To fix this, either do not render the element at all " + "or pass null to %s instead of an empty string.", propKey, propKey);
                            }
                            else {
                                console.error("An empty string (\"\") was passed to the %s attribute. " + "To fix this, either do not render the element at all " + "or pass null to %s instead of an empty string.", propKey, propKey);
                            }
                        }
                        hydrateSanitizedAttribute(domElement, propKey, propKey, null, extraAttributes);
                        continue;
                    }
                }
                hydrateSanitizedAttribute(domElement, propKey, propKey, value, extraAttributes);
                continue;
            case "action":
            case "formAction":
                if (react_feature_flags_1.enableFormActions) {
                    var serverValue = domElement.getAttribute(propKey);
                    if (typeof value === "function") {
                        extraAttributes.delete(propKey.toLowerCase());
                        // The server can set these extra properties to implement actions.
                        // So we remove them from the extra attributes warnings.
                        if (propKey === "formAction") {
                            extraAttributes.delete("name");
                            extraAttributes.delete("formenctype");
                            extraAttributes.delete("formmethod");
                            extraAttributes.delete("formtarget");
                        }
                        else {
                            extraAttributes.delete("enctype");
                            extraAttributes.delete("method");
                            extraAttributes.delete("target");
                        }
                        // Ideally we should be able to warn if the server value was not a function
                        // however since the function can return any of these attributes any way it
                        // wants as a custom progressive enhancement, there's nothing to compare to.
                        // We can check if the function has the $FORM_ACTION property on the client
                        // and if it's not, warn, but that's an unnecessary constraint that they
                        // have to have the extra extension that doesn't do anything on the client.
                        continue;
                    }
                    else if (serverValue === EXPECTED_FORM_ACTION_URL) {
                        extraAttributes.delete(propKey.toLowerCase());
                        warnForPropDifference(propKey, "function", value);
                        continue;
                    }
                }
                hydrateSanitizedAttribute(domElement, propKey, propKey.toLowerCase(), value, extraAttributes);
                continue;
            case "xlinkHref":
                hydrateSanitizedAttribute(domElement, propKey, "xlink:href", value, extraAttributes);
                continue;
            case "contentEditable": {
                // Lower-case Booleanish String
                hydrateBooleanishAttribute(domElement, propKey, "contenteditable", value, extraAttributes);
            }
            case "spellCheck": {
                // Lower-case Booleanish String
                hydrateBooleanishAttribute(domElement, propKey, "spellcheck", value, extraAttributes);
            }
            case "draggable":
            case "autoReverse":
            case "externalResourcesRequired":
            case "focusable":
            case "preserveAlpha": {
                // Case-sensitive Booleanish String
                hydrateBooleanishAttribute(domElement, propKey, propKey, value, extraAttributes);
            }
            case "allowFullScreen":
            case "async":
            case "autoPlay":
            case "controls":
            case "default":
            case "defer":
            case "disabled":
            case "disablePictureInPicture":
            case "disableRemotePlayback":
            case "formNoValidate":
            case "hidden":
            case "loop":
            case "noModule":
            case "noValidate":
            case "open":
            case "playsInline":
            case "readOnly":
            case "required":
            case "reversed":
            case "scoped":
            case "seamless":
            case "itemScope": {
                // Some of these need to be lower case to remove them from the extraAttributes list.
                hydrateBooleanAttribute(domElement, propKey, propKey.toLowerCase(), value, extraAttributes);
            }
            case "capture":
            case "download": {
                hydrateOverloadedBooleanAttribute(domElement, propKey, propKey, value, extraAttributes);
            }
            case "cols":
            case "rows":
            case "size":
            case "span": {
                hydratePositiveNumericAttribute(domElement, propKey, propKey, value, extraAttributes);
            }
            case "rowSpan": {
                hydrateNumericAttribute(domElement, propKey, "rowspan", value, extraAttributes);
            }
            case "start": {
                hydrateNumericAttribute(domElement, propKey, propKey, value, extraAttributes);
            }
            case "xHeight":
                hydrateAttribute(domElement, propKey, "x-height", value, extraAttributes);
                continue;
            case "xlinkActuate":
                hydrateAttribute(domElement, propKey, "xlink:actuate", value, extraAttributes);
                continue;
            case "xlinkArcrole":
                hydrateAttribute(domElement, propKey, "xlink:arcrole", value, extraAttributes);
                continue;
            case "xlinkRole":
                hydrateAttribute(domElement, propKey, "xlink:role", value, extraAttributes);
                continue;
            case "xlinkShow":
                hydrateAttribute(domElement, propKey, "xlink:show", value, extraAttributes);
                continue;
            case "xlinkTitle":
                hydrateAttribute(domElement, propKey, "xlink:title", value, extraAttributes);
                continue;
            case "xlinkType":
                hydrateAttribute(domElement, propKey, "xlink:type", value, extraAttributes);
                continue;
            case "xmlBase":
                hydrateAttribute(domElement, propKey, "xml:base", value, extraAttributes);
                continue;
            case "xmlLang":
                hydrateAttribute(domElement, propKey, "xml:lang", value, extraAttributes);
                continue;
            case "xmlSpace":
                hydrateAttribute(domElement, propKey, "xml:space", value, extraAttributes);
                continue;
            default: {
                if ( // shouldIgnoreAttribute
                // We have already filtered out null/undefined and reserved words.
                propKey.length > 2 && (propKey[0] === "o" || propKey[0] === "O") && (propKey[1] === "n" || propKey[1] === "N")) {
                    continue;
                }
                var attributeName = (0, getAttributeAlias_1.default)(propKey);
                var isMismatchDueToBadCasing = false;
                // This is a DEV-only path
                var hostContextDev = hostContext;
                var hostContextProd = hostContextDev.context;
                if (hostContextProd === react_fiber_config_host_context_namespace_1.HostContextNamespaceNone && tag !== "svg" && tag !== "math") {
                    extraAttributes.delete(attributeName.toLowerCase());
                }
                else {
                    var standardName = getPossibleStandardName(propKey);
                    if (standardName !== null && standardName !== propKey) {
                        // If an SVG prop is supplied with bad casing, it will
                        // be successfully parsed from HTML, but will produce a mismatch
                        // (and would be incorrectly rendered on the client).
                        // However, we already warn about bad casing elsewhere.
                        // So we'll skip the misleading extra mismatch warning in this case.
                        isMismatchDueToBadCasing = true;
                        extraAttributes.delete(standardName);
                    }
                    extraAttributes.delete(attributeName);
                }
                var serverValue = (0, DOMPropertyOperations_1.getValueForAttribute)(domElement, attributeName, value);
                if (!isMismatchDueToBadCasing) {
                    warnForPropDifference(propKey, serverValue, value);
                }
            }
        }
    }
}
function diffHydratedProperties(domElement, tag, props, isConcurrentMode, shouldWarnDev, hostContext) {
    if (__DEV__) {
        validatePropertiesInDevelopment(tag, props);
    }
    // TODO: Make sure that we check isMounted before firing any of these events.
    switch (tag) {
        case "dialog":
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("cancel", domElement);
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("close", domElement);
            break;
        case "iframe":
        case "object":
        case "embed":
            // We listen to this event in case to ensure emulated bubble
            // listeners still fire for the load event.
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("load", domElement);
            break;
        case "video":
        case "audio":
            // We listen to these events in case to ensure emulated bubble
            // listeners still fire for all the media events.
            for (var i = 0; i < DOMPluginEventSystem_1.mediaEventTypes.length; i++) {
                (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)(DOMPluginEventSystem_1.mediaEventTypes[i], domElement);
            }
            break;
        case "source":
            // We listen to this event in case to ensure emulated bubble
            // listeners still fire for the error event.
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("error", domElement);
            break;
        case "img":
        case "image":
        case "link":
            // We listen to these events in case to ensure emulated bubble
            // listeners still fire for error and load events.
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("error", domElement);
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("load", domElement);
            break;
        case "details":
            // We listen to this event in case to ensure emulated bubble
            // listeners still fire for the toggle event.
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("toggle", domElement);
            break;
        case "input":
            if (__DEV__) {
                (0, ReactControlledValuePropTypes_1.checkControlledValueProps)("input", props);
            }
            // We listen to this event in case to ensure emulated bubble
            // listeners still fire for the invalid event.
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("invalid", domElement);
            // TODO: Make sure we check if this is still unmounted or do any clean
            // up necessary since we never stop tracking anymore.
            (0, ReactDOMInput_1.validateInputProps)(domElement, props);
            // For input and textarea we current always set the value property at
            // post mount to force it to diverge from attributes. However, for
            // option and select we don't quite do the same thing and select
            // is not resilient to the DOM state changing so we don't do that here.
            // TODO: Consider not doing this for input and textarea.
            (0, ReactDOMInput_1.initInput)(domElement, props.value, props.defaultValue, props.checked, props.defaultChecked, props.type, props.name, true);
            (0, inputValueTracking_1.track)(domElement);
            break;
        case "option":
            (0, ReactDOMOption_1.validateOptionProps)(domElement, props);
            break;
        case "select":
            if (__DEV__) {
                (0, ReactControlledValuePropTypes_1.checkControlledValueProps)("select", props);
            }
            // We listen to this event in case to ensure emulated bubble
            // listeners still fire for the invalid event.
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("invalid", domElement);
            (0, ReactDOMSelect_1.validateSelectProps)(domElement, props);
            break;
        case "textarea":
            if (__DEV__) {
                (0, ReactControlledValuePropTypes_1.checkControlledValueProps)("textarea", props);
            }
            // We listen to this event in case to ensure emulated bubble
            // listeners still fire for the invalid event.
            (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("invalid", domElement);
            // TODO: Make sure we check if this is still unmounted or do any clean
            // up necessary since we never stop tracking anymore.
            (0, ReactDOMTextarea_1.validateTextareaProps)(domElement, props);
            (0, ReactDOMTextarea_1.initTextarea)(domElement, props.value, props.defaultValue, props.children);
            (0, inputValueTracking_1.track)(domElement);
            break;
    }
    var children = props.children;
    // For text content children we compare against textContent. This
    // might match additional HTML that is hidden when we read it using
    // textContent. E.g. "foo" will match "f<span>oo</span>" but that still
    // satisfies our requirement. Our requirement is not to produce perfect
    // HTML and attributes. Ideally we should preserve structure but it's
    // ok not to if the visible content is still enough to indicate what
    // even listeners these nodes might be wired up to.
    // TODO: Warn if there is more than a single textNode as a child.
    // TODO: Should we use domElement.firstChild.nodeValue to compare?
    if (typeof children === "string" || typeof children === "number") {
        if (domElement.textContent !== "" + children) {
            if (props.suppressHydrationWarning !== true) {
                // @ts-ignore
                checkForUnmatchedText(domElement.textContent, children, isConcurrentMode, shouldWarnDev);
            }
            if (!isConcurrentMode || !react_feature_flags_1.enableClientRenderFallbackOnTextMismatch) {
                // We really should be patching this in the commit phase but since
                // this only affects legacy mode hydration which is deprecated anyway
                // we can get away with it.
                // Host singletons get their children appended and don't use the text
                // content mechanism.
                if (!react_feature_flags_1.enableHostSingletons || tag !== "body") {
                    domElement.textContent = children;
                }
            }
        }
    }
    if (props.onScroll != null) {
        (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("scroll", domElement);
    }
    if (props.onScrollEnd != null) {
        (0, DOMPluginEventSystem_1.listenToNonDelegatedEvent)("scrollend", domElement);
    }
    if (props.onClick != null) {
        // TODO: This cast may not be sound for SVG, MathML or custom elements.
        trapClickOnNonInteractiveElement(domElement);
    }
    if (__DEV__ && shouldWarnDev) {
        var extraAttributes = new Set();
        var attributes = domElement.attributes;
        for (var i = 0; i < attributes.length; i++) {
            var name_3 = attributes[i].name.toLowerCase();
            switch (name_3) {
                // Controlled attributes are not validated
                // TODO: Only ignore them on controlled tags.
                case "value":
                    break;
                case "checked":
                    break;
                case "selected":
                    break;
                default:
                    // Intentionally use the original name.
                    // See discussion in https://github.com/facebook/react/pull/10676.
                    extraAttributes.add(attributes[i].name);
            }
        }
        if ((0, isCustomElement_1.default)(tag, props)) {
            diffHydratedCustomComponent(domElement, tag, props, hostContext, extraAttributes);
        }
        else {
            diffHydratedGenericElement(domElement, tag, props, hostContext, extraAttributes);
        }
        if (extraAttributes.size > 0 && props.suppressHydrationWarning !== true) {
            warnForExtraAttributes(extraAttributes);
        }
    }
}
exports.diffHydratedProperties = diffHydratedProperties;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function diffHydratedText(textNode, text, isConcurrentMode) {
    var isDifferent = textNode.nodeValue !== text;
    return isDifferent;
}
exports.diffHydratedText = diffHydratedText;
function warnForDeletedHydratableElement(parentNode, child) {
    if (__DEV__) {
        if (didWarnInvalidHydration) {
            return;
        }
        didWarnInvalidHydration = true;
        console.error("Did not expect server HTML to contain a <%s> in <%s>.", child.nodeName.toLowerCase(), parentNode.nodeName.toLowerCase());
    }
}
exports.warnForDeletedHydratableElement = warnForDeletedHydratableElement;
function warnForDeletedHydratableText(parentNode, child) {
    if (__DEV__) {
        if (didWarnInvalidHydration) {
            return;
        }
        didWarnInvalidHydration = true;
        console.error("Did not expect server HTML to contain the text node \"%s\" in <%s>.", child.nodeValue, parentNode.nodeName.toLowerCase());
    }
}
exports.warnForDeletedHydratableText = warnForDeletedHydratableText;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function warnForInsertedHydratedElement(parentNode, tag, props) {
    if (__DEV__) {
        if (didWarnInvalidHydration) {
            return;
        }
        didWarnInvalidHydration = true;
        console.error("Expected server HTML to contain a matching <%s> in <%s>.", tag, parentNode.nodeName.toLowerCase());
    }
}
exports.warnForInsertedHydratedElement = warnForInsertedHydratedElement;
function warnForInsertedHydratedText(parentNode, text) {
    if (__DEV__) {
        if (text === "") {
            // We expect to insert empty text nodes since they're not represented in
            // the HTML.
            // TODO: Remove this special case if we can just avoid inserting empty
            // text nodes.
            return;
        }
        if (didWarnInvalidHydration) {
            return;
        }
        didWarnInvalidHydration = true;
        console.error("Expected server HTML to contain a matching text node for \"%s\" in <%s>.", text, parentNode.nodeName.toLowerCase());
    }
}
exports.warnForInsertedHydratedText = warnForInsertedHydratedText;

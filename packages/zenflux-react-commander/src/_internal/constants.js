"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INTERNAL_PROPS = exports.INTERNAL_ON_UPDATE = exports.INTERNAL_ON_UNMOUNT = exports.INTERNAL_ON_MOUNT = exports.INTERNAL_ON_LOAD = exports.SET_TO_CONTEXT_SYMBOL = exports.GET_INTERNAL_MATCH_SYMBOL = exports.GET_INTERNAL_SYMBOL = exports.UNREGISTER_INTERNAL_SYMBOL = exports.REGISTER_INTERNAL_SYMBOL = void 0;
// Same as https://github.com/facebook/react/blob/main/packages/react-dom-bindings/src/client/ReactDOMComponentTree.js#L39
var randomKey = "__" + Math.random().toString(36).slice(2);
exports.REGISTER_INTERNAL_SYMBOL = Symbol("REGISTER_INTERNAL" + randomKey);
exports.UNREGISTER_INTERNAL_SYMBOL = Symbol("UNREGISTER_INTERNAL" + randomKey);
exports.GET_INTERNAL_SYMBOL = Symbol("GET_INTERNAL" + randomKey);
exports.GET_INTERNAL_MATCH_SYMBOL = Symbol("GET_INTERNAL_MATCH" + randomKey);
exports.SET_TO_CONTEXT_SYMBOL = Symbol("SET_TO_CONTEXT" + randomKey);
exports.INTERNAL_ON_LOAD = "__internalOnLoad" + randomKey;
exports.INTERNAL_ON_MOUNT = "__internalOnMount" + randomKey;
exports.INTERNAL_ON_UNMOUNT = "__internalOnUnmount" + randomKey;
exports.INTERNAL_ON_UPDATE = "__internalOnUpdate" + randomKey;
exports.INTERNAL_PROPS = "__internalProps" + randomKey;

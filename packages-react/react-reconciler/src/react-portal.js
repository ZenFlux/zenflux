"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPortal = void 0;
var check_string_coercion_1 = require("@zenflux/react-shared/src/check-string-coercion");
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
function createPortal(children, containerInfo, // TODO: figure out the API for cross-renderer implementation.
implementation, key) {
    if (key === void 0) { key = null; }
    if (__DEV__) {
        (0, check_string_coercion_1.checkKeyStringCoercion)(key);
    }
    return {
        // This tag allow us to uniquely identify this as a React Portal
        $$typeof: react_symbols_1.REACT_PORTAL_TYPE,
        key: key == null ? null : "" + key,
        children: children,
        containerInfo: containerInfo,
        implementation: implementation
    };
}
exports.createPortal = createPortal;

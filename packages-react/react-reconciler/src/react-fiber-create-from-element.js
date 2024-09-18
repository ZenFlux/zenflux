"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFiberFromElement = void 0;
var react_fiber_from_create_type_n_props_1 = require("@zenflux/react-reconciler/src/react-fiber-from-create-type-n-props");
function createFiberFromElement(element, mode, lanes) {
    var source = null;
    var owner = null;
    if (__DEV__) {
        source = element._source;
        owner = element._owner;
    }
    var type = element.type;
    var key = element.key;
    var pendingProps = element.props;
    var fiber = (0, react_fiber_from_create_type_n_props_1.createFiberFromTypeAndProps)(type, key, pendingProps, source, owner, mode, lanes);
    if (__DEV__) {
        fiber._debugSource = element._source;
        fiber._debugOwner = element._owner;
    }
    return fiber;
}
exports.createFiberFromElement = createFiberFromElement;

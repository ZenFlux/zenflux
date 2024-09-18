"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveLazyComponentTag = exports.isSimpleFunctionComponent = exports.shouldConstruct = void 0;
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
function shouldConstruct(Component) {
    var prototype = Component.prototype;
    return !!(prototype && prototype.isReactComponent);
}
exports.shouldConstruct = shouldConstruct;
function isSimpleFunctionComponent(type) {
    return typeof type === "function" && !shouldConstruct(type) && type.defaultProps === undefined;
}
exports.isSimpleFunctionComponent = isSimpleFunctionComponent;
function resolveLazyComponentTag(Component) {
    if (typeof Component === "function") {
        return shouldConstruct(Component) ? work_tags_1.WorkTag.ClassComponent : work_tags_1.WorkTag.FunctionComponent;
    }
    else if (Component !== undefined && Component !== null) {
        // @ts-ignore
        var $$typeof = Component.$$typeof;
        if ($$typeof === react_symbols_1.REACT_FORWARD_REF_TYPE) {
            return work_tags_1.WorkTag.ForwardRef;
        }
        if ($$typeof === react_symbols_1.REACT_MEMO_TYPE) {
            return work_tags_1.WorkTag.MemoComponent;
        }
    }
    return work_tags_1.WorkTag.IndeterminateComponent;
}
exports.resolveLazyComponentTag = resolveLazyComponentTag;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDefaultProps = void 0;
function resolveDefaultProps(Component, baseProps) {
    if (Component && Component.defaultProps) {
        // Resolve default props. Taken from ReactElement
        var props = Object.assign({}, baseProps);
        var defaultProps = Component.defaultProps;
        for (var propName in defaultProps) {
            if (props[propName] === undefined) {
                props[propName] = defaultProps[propName];
            }
        }
        return props;
    }
    return baseProps;
}
exports.resolveDefaultProps = resolveDefaultProps;

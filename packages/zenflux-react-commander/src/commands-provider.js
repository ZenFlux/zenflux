"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentIdProvider = void 0;
var react_1 = require("react");
var commands_context_1 = require("@zenflux/react-commander/commands-context");
/**
 * Function `ComponentIdProvider()` - This function is used to provide a context that contains
 * properties relevant to the component's unique identification within a tree-like structure.
 * It wraps its children with the `ComponentIdContext.Provider`, passing the provided `context`
 * value down the component tree. This allows any descendant components to access and share the
 * structural state and hierarchical relationships defined in `DCommandComponentContextProps`.
 *
 * The purpose of `ComponentIdProvider` is to establish a consistent context environment for
 * the components that are working within a command-oriented architecture, ensuring that each
 * component can retrieve and manage relationships and dependencies via the shared context.
 *
 * Usage Example:
 * ```typescript jsx
 * return (
 *     <ComponentIdProvider context={ context }>
 *         <WrappedComponent { ...props } ref={ componentRef } $$key={ performance.now() }/>
 *     </ComponentIdProvider>
 * );
 * ```
 **/
function ComponentIdProvider(props) {
    var children = props.children, context = props.context;
    return (<commands_context_1.ComponentIdContext.Provider value={context}>
                {children}
            </commands_context_1.ComponentIdContext.Provider>);
}
exports.ComponentIdProvider = ComponentIdProvider;

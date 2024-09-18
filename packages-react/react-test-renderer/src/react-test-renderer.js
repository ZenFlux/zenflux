"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unstable_batchedUpdates = exports.create = exports._Scheduler = exports.act = void 0;
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Scheduler = require("@zenflux/react-scheduler/mock");
exports._Scheduler = Scheduler;
var react_fiber_reconciler_1 = require("@zenflux/react-reconciler/src/react-fiber-reconciler");
Object.defineProperty(exports, "unstable_batchedUpdates", { enumerable: true, get: function () { return react_fiber_reconciler_1.batchedUpdates; } });
var react_fiber_tree_reflection_1 = require("@zenflux/react-reconciler/src/react-fiber-tree-reflection");
var get_component_name_from_type_1 = require("@zenflux/react-shared/src/get-component-name-from-type");
var react_version_1 = require("@zenflux/react-shared/src/react-version");
var check_string_coercion_1 = require("@zenflux/react-shared/src/check-string-coercion");
var root_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/root-tags");
var react_feature_flags_1 = require("@zenflux/react-shared/src/react-feature-flags");
var work_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/work-tags");
var react_reconciler_test_config_1 = require("@zenflux/react-test-renderer/src/react-reconciler-test-config");
// @ts-ignore
exports.act = React.unstable_act;
var defaultTestOptions = {
    createNodeMock: function () {
        return null;
    },
};
function toJSON(inst) {
    if (inst.isHidden) {
        // Omit timed out children from output entirely. This seems like the least
        // surprising behavior. We could perhaps add a separate API that includes
        // them, if it turns out people need it.
        return null;
    }
    switch (inst.tag) {
        case "TEXT":
            return inst.text;
        case "INSTANCE": {
            // We don't include the `children` prop in JSON.
            // Instead, we will include the actual rendered children.
            var _a = inst.props, children = _a.children, props = __rest(_a, ["children"]);
            var renderedChildren = null;
            if (inst.children && inst.children.length) {
                for (var i = 0; i < inst.children.length; i++) {
                    var renderedChild = toJSON(inst.children[i]);
                    if (renderedChild !== null) {
                        if (renderedChildren === null) {
                            renderedChildren = [renderedChild];
                        }
                        else {
                            renderedChildren.push(renderedChild);
                        }
                    }
                }
            }
            var json = {
                type: inst.type,
                props: props,
                children: renderedChildren,
            };
            Object.defineProperty(json, "$$typeof", {
                value: Symbol.for("react.test.json"),
            });
            return json;
        }
        default:
            throw new Error("Unexpected node type in toJSON: ".concat(inst.tag));
    }
}
function childrenToTree(node) {
    if (!node) {
        return null;
    }
    var children = nodeAndSiblingsArray(node);
    if (children.length === 0) {
        return null;
    }
    else if (children.length === 1) {
        return toTree(children[0]);
    }
    return flatten(children.map(toTree));
}
function nodeAndSiblingsArray(nodeWithSibling) {
    var array = [];
    var node = nodeWithSibling;
    while (node != null) {
        array.push(node);
        node = node.sibling;
    }
    return array;
}
function flatten(arr) {
    var result = [];
    var stack = [{ i: 0, array: arr }];
    while (stack.length) {
        var n = stack.pop();
        while (n.i < n.array.length) {
            var el = n.array[n.i];
            n.i += 1;
            if (Array.isArray(el)) {
                stack.push(n);
                stack.push({ i: 0, array: el });
                break;
            }
            result.push(el);
        }
    }
    return result;
}
function toTree(node) {
    if (node == null) {
        return null;
    }
    switch (node.tag) {
        case work_tags_1.WorkTag.HostRoot:
            return childrenToTree(node.child);
        case work_tags_1.WorkTag.HostPortal:
            return childrenToTree(node.child);
        case work_tags_1.WorkTag.ClassComponent:
            return {
                nodeType: "component",
                type: node.type,
                props: __assign({}, node.memoizedProps),
                instance: node.stateNode,
                rendered: childrenToTree(node.child),
            };
        case work_tags_1.WorkTag.FunctionComponent:
        case work_tags_1.WorkTag.SimpleMemoComponent:
            return {
                nodeType: "component",
                type: node.type,
                props: __assign({}, node.memoizedProps),
                instance: null,
                rendered: childrenToTree(node.child),
            };
        case work_tags_1.WorkTag.HostHoistable:
        case work_tags_1.WorkTag.HostSingleton:
        case work_tags_1.WorkTag.HostComponent: {
            return {
                nodeType: "host",
                type: node.type,
                props: __assign({}, node.memoizedProps),
                instance: null,
                rendered: flatten(nodeAndSiblingsArray(node.child).map(toTree)),
            };
        }
        case work_tags_1.WorkTag.HostText:
            return node.stateNode.text;
        case work_tags_1.WorkTag.Fragment:
        case work_tags_1.WorkTag.ContextProvider:
        case work_tags_1.WorkTag.ContextConsumer:
        case work_tags_1.WorkTag.Mode:
        case work_tags_1.WorkTag.Profiler:
        case work_tags_1.WorkTag.ForwardRef:
        case work_tags_1.WorkTag.MemoComponent:
        case work_tags_1.WorkTag.IncompleteClassComponent:
        case work_tags_1.WorkTag.ScopeComponent:
            return childrenToTree(node.child);
        default:
            throw new Error("toTree() does not yet know how to handle nodes with tag=".concat(node.tag));
    }
}
var validWrapperTypes = new Set([
    work_tags_1.WorkTag.FunctionComponent,
    work_tags_1.WorkTag.ClassComponent,
    work_tags_1.WorkTag.HostComponent,
    work_tags_1.WorkTag.ForwardRef,
    work_tags_1.WorkTag.MemoComponent,
    work_tags_1.WorkTag.SimpleMemoComponent,
    // Normally skipped, but used when there's more than one root child.
    work_tags_1.WorkTag.HostRoot,
]);
function getChildren(parent) {
    var children = [];
    var startingNode = parent;
    var node = startingNode;
    if (node.child === null) {
        return children;
    }
    node.child.return = node;
    node = node.child;
    outer: while (true) {
        var descend = false;
        if (validWrapperTypes.has(node.tag)) {
            children.push(wrapFiber(node));
        }
        else if (node.tag === work_tags_1.WorkTag.HostText) {
            if (__DEV__) {
                (0, check_string_coercion_1.checkPropStringCoercion)(node.memoizedProps, "memoizedProps");
            }
            children.push("" + node.memoizedProps);
        }
        else {
            descend = true;
        }
        if (descend && node.child !== null) {
            node.child.return = node;
            node = node.child;
            continue;
        }
        while (node.sibling === null) {
            if (node.return === startingNode) {
                break outer;
            }
            node = node.return;
        }
        node.sibling.return = node.return;
        node = node.sibling;
    }
    return children;
}
var ReactTestInstance = /** @class */ (function () {
    function ReactTestInstance(fiber) {
        if (!validWrapperTypes.has(fiber.tag)) {
            throw new Error("Unexpected object passed to ReactTestInstance constructor (tag: ".concat(fiber.tag, "). ") +
                "This is probably a bug in React.");
        }
        this._fiber = fiber;
    }
    ReactTestInstance.prototype._currentFiber = function () {
        // Throws if this component has been unmounted.
        var fiber = (0, react_fiber_tree_reflection_1.findCurrentFiberUsingSlowPath)(this._fiber);
        if (fiber === null) {
            throw new Error("Can't read from currently-mounting component. This error is likely " +
                "caused by a bug in React. Please file an issue.");
        }
        return fiber;
    };
    Object.defineProperty(ReactTestInstance.prototype, "instance", {
        get: function () {
            var tag = this._fiber.tag;
            if (tag === work_tags_1.WorkTag.HostComponent ||
                tag === work_tags_1.WorkTag.HostHoistable ||
                tag === work_tags_1.WorkTag.HostSingleton) {
                return (0, react_reconciler_test_config_1.getPublicInstance)(this._fiber.stateNode);
            }
            else {
                return this._fiber.stateNode;
            }
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ReactTestInstance.prototype, "type", {
        get: function () {
            return this._fiber.type;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ReactTestInstance.prototype, "props", {
        get: function () {
            return this._currentFiber().memoizedProps;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ReactTestInstance.prototype, "parent", {
        get: function () {
            var parent = this._fiber.return;
            while (parent !== null) {
                if (validWrapperTypes.has(parent.tag)) {
                    if (parent.tag === work_tags_1.WorkTag.HostRoot) {
                        // Special case: we only "materialize" instances for roots
                        // if they have more than a single child. So we'll check that now.
                        if (getChildren(parent).length < 2) {
                            return null;
                        }
                    }
                    return wrapFiber(parent);
                }
                parent = parent.return;
            }
            return null;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(ReactTestInstance.prototype, "children", {
        get: function () {
            return getChildren(this._currentFiber());
        },
        enumerable: false,
        configurable: true
    });
    // Custom search functions
    ReactTestInstance.prototype.find = function (predicate) {
        return expectOne(this.findAll(predicate, { deep: false }), "matching custom predicate: ".concat(predicate.toString()));
    };
    ReactTestInstance.prototype.findByType = function (type) {
        return expectOne(this.findAllByType(type, { deep: false }), "with node type: \"".concat((0, get_component_name_from_type_1.default)(type) || "Unknown", "\""));
    };
    ReactTestInstance.prototype.findByProps = function (props) {
        return expectOne(this.findAllByProps(props, { deep: false }), "with props: ".concat(JSON.stringify(props)));
    };
    ReactTestInstance.prototype.findAll = function (predicate, options) {
        if (options === void 0) { options = null; }
        return findAll(this, predicate, options);
    };
    ReactTestInstance.prototype.findAllByType = function (type, options) {
        if (options === void 0) { options = null; }
        return findAll(this, function (node) { return node.type === type; }, options);
    };
    ReactTestInstance.prototype.findAllByProps = function (props, options) {
        if (options === void 0) { options = null; }
        return findAll(this, function (node) { return node.props && propsMatch(node.props, props); }, options);
    };
    return ReactTestInstance;
}());
function findAll(root, predicate, options) {
    var deep = options ? options.deep : true;
    var results = [];
    if (predicate(root)) {
        results.push(root);
        if (!deep) {
            return results;
        }
    }
    root.children.forEach(function (child) {
        if (typeof child === "string") {
            return;
        }
        results.push.apply(results, findAll(child, predicate, options));
    });
    return results;
}
function expectOne(all, message) {
    if (all.length === 1) {
        return all[0];
    }
    var prefix = all.length === 0
        ? "No instances found "
        : "Expected 1 but found ".concat(all.length, " instances ");
    throw new Error(prefix + message);
}
function propsMatch(props, filter) {
    for (var key in filter) {
        if (props[key] !== filter[key]) {
            return false;
        }
    }
    return true;
}
function onRecoverableError(error) {
    // TODO: Expose onRecoverableError option to userspace
    console.error(error);
}
function create(element, options) {
    var createNodeMock = defaultTestOptions.createNodeMock;
    var isConcurrent = false;
    var isStrictMode = false;
    var concurrentUpdatesByDefault = null;
    if (typeof options === "object" && options !== null) {
        if (typeof options.createNodeMock === "function") {
            createNodeMock = options.createNodeMock;
        }
        if (options.unstable_isConcurrent === true) {
            isConcurrent = true;
        }
        if (options.unstable_strictMode === true) {
            isStrictMode = true;
        }
        if (react_feature_flags_1.allowConcurrentByDefault) {
            if (options.unstable_concurrentUpdatesByDefault !== undefined) {
                concurrentUpdatesByDefault =
                    options.unstable_concurrentUpdatesByDefault;
            }
        }
    }
    var container = {
        children: [],
        createNodeMock: createNodeMock,
        tag: "CONTAINER",
    };
    var root = (0, react_fiber_reconciler_1.createContainer)(container, isConcurrent ? root_tags_1.ConcurrentRoot : root_tags_1.LegacyRoot, null, isStrictMode, concurrentUpdatesByDefault, "", onRecoverableError, null);
    if (root === null) {
        throw new Error("something went wrong");
    }
    (0, react_fiber_reconciler_1.updateContainer)(element, root, null, null);
    var entry = {
        _Scheduler: Scheduler,
        root: undefined,
        // we define a 'getter' for 'root' below using 'Object.defineProperty'
        toJSON: function () {
            if (root == null || root.current == null || container == null) {
                return null;
            }
            if (container.children.length === 0) {
                return null;
            }
            if (container.children.length === 1) {
                return toJSON(container.children[0]);
            }
            if (container.children.length === 2 &&
                container.children[0].isHidden === true &&
                container.children[1].isHidden === false) {
                // Omit timed out children from output entirely, including the fact that we
                // temporarily wrap fallback and timed out children in an array.
                return toJSON(container.children[1]);
            }
            var renderedChildren = null;
            if (container.children && container.children.length) {
                for (var i = 0; i < container.children.length; i++) {
                    var renderedChild = toJSON(container.children[i]);
                    if (renderedChild !== null) {
                        if (renderedChildren === null) {
                            renderedChildren = [renderedChild];
                        }
                        else {
                            renderedChildren.push(renderedChild);
                        }
                    }
                }
            }
            return renderedChildren;
        },
        toTree: function () {
            if (root == null || root.current == null) {
                return null;
            }
            return toTree(root.current);
        },
        update: function (newElement) {
            if (root == null || root.current == null) {
                return;
            }
            (0, react_fiber_reconciler_1.updateContainer)(newElement, root, null, null);
        },
        unmount: function () {
            if (root == null || root.current == null) {
                return;
            }
            (0, react_fiber_reconciler_1.updateContainer)(null, root, null, null);
            // $FlowFixMe[incompatible-type] found when upgrading Flow
            container = null;
            root = null;
        },
        getInstance: function () {
            if (root == null || root.current == null) {
                return null;
            }
            return (0, react_fiber_reconciler_1.getPublicRootInstance)(root);
        },
        unstable_flushSync: react_fiber_reconciler_1.flushSync,
    };
    Object.defineProperty(entry, "root", ({
        configurable: true,
        enumerable: true,
        get: function () {
            {
                if (root === null) {
                    throw new Error("Can't access .root on unmounted test renderer");
                }
                var children = getChildren(root.current);
                if (children.length === 0) {
                    throw new Error("Can't access .root on unmounted test renderer");
                }
                else if (children.length === 1) {
                    // Normally, we skip the root and just give you the child.
                    return children[0];
                }
                else {
                    // However, we give you the root if there's more than one root child.
                    // We could make this the behavior for all cases but it would be a breaking change.
                    // $FlowFixMe[incompatible-use] found when upgrading Flow
                    return wrapFiber(root.current);
                }
            }
        }
    }));
    return entry;
}
exports.create = create;
var fiberToWrapper = new WeakMap();
function wrapFiber(fiber) {
    var wrapper = fiberToWrapper.get(fiber);
    if (wrapper === undefined && fiber.alternate !== null) {
        wrapper = fiberToWrapper.get(fiber.alternate);
    }
    if (wrapper === undefined) {
        wrapper = new ReactTestInstance(fiber);
        fiberToWrapper.set(fiber, wrapper);
    }
    return wrapper;
}
// Enable ReactTestRenderer to be used to test DevTools integration.
(0, react_fiber_reconciler_1.injectIntoDevTools)({
    findFiberByHostInstance: (function () {
        throw new Error("TestRenderer does not support findFiberByHostInstance()");
    }),
    bundleType: __DEV__ ? 1 : 0,
    version: react_version_1.default,
    rendererPackageName: "react-test-renderer",
});

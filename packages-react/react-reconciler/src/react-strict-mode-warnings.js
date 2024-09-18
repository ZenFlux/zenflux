"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var type_of_mode_1 = require("@zenflux/react-shared/src/react-internal-constants/type-of-mode");
var react_get_component_name_from_fiber_1 = require("@zenflux/react-reconciler/src/react-get-component-name-from-fiber");
var react_current_fiber_1 = require("@zenflux/react-reconciler/src/react-current-fiber");
var ReactStrictModeWarnings = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    recordUnsafeLifecycleWarnings: function (fiber, instance) {
    },
    flushPendingUnsafeLifecycleWarnings: function () {
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    recordLegacyContextWarning: function (fiber, instance) {
    },
    flushLegacyContextWarning: function () {
    },
    discardPendingWarnings: function () {
    }
};
if (__DEV__) {
    var findStrictRoot_1 = function (fiber) {
        var maybeStrictRoot = null;
        var node = fiber;
        while (node !== null) {
            if (node.mode & type_of_mode_1.TypeOfMode.StrictLegacyMode) {
                maybeStrictRoot = node;
            }
            node = node.return;
        }
        return maybeStrictRoot;
    };
    var setToSortedString_1 = function (set) {
        var array = [];
        set.forEach(function (value) {
            array.push(value);
        });
        return array.sort().join(", ");
    };
    var pendingComponentWillMountWarnings_1 = [];
    var pendingUNSAFE_ComponentWillMountWarnings_1 = [];
    var pendingComponentWillReceivePropsWarnings_1 = [];
    var pendingUNSAFE_ComponentWillReceivePropsWarnings_1 = [];
    var pendingComponentWillUpdateWarnings_1 = [];
    var pendingUNSAFE_ComponentWillUpdateWarnings_1 = [];
    // Tracks components we have already warned about.
    var didWarnAboutUnsafeLifecycles_1 = new Set();
    ReactStrictModeWarnings.recordUnsafeLifecycleWarnings = function (fiber, instance) {
        // Dedupe strategy: Warn once per component.
        if (didWarnAboutUnsafeLifecycles_1.has(fiber.type)) {
            return;
        }
        if (typeof instance.componentWillMount === "function" && // Don't warn about react-lifecycles-compat polyfilled components.
            instance.componentWillMount.__suppressDeprecationWarning !== true) {
            pendingComponentWillMountWarnings_1.push(fiber);
        }
        if (fiber.mode & type_of_mode_1.TypeOfMode.StrictLegacyMode && typeof instance.UNSAFE_componentWillMount === "function") {
            pendingUNSAFE_ComponentWillMountWarnings_1.push(fiber);
        }
        if (typeof instance.componentWillReceiveProps === "function" && instance.componentWillReceiveProps.__suppressDeprecationWarning !== true) {
            pendingComponentWillReceivePropsWarnings_1.push(fiber);
        }
        if (fiber.mode & type_of_mode_1.TypeOfMode.StrictLegacyMode && typeof instance.UNSAFE_componentWillReceiveProps === "function") {
            pendingUNSAFE_ComponentWillReceivePropsWarnings_1.push(fiber);
        }
        if (typeof instance.componentWillUpdate === "function" && instance.componentWillUpdate.__suppressDeprecationWarning !== true) {
            pendingComponentWillUpdateWarnings_1.push(fiber);
        }
        if (fiber.mode & type_of_mode_1.TypeOfMode.StrictLegacyMode && typeof instance.UNSAFE_componentWillUpdate === "function") {
            pendingUNSAFE_ComponentWillUpdateWarnings_1.push(fiber);
        }
    };
    ReactStrictModeWarnings.flushPendingUnsafeLifecycleWarnings = function () {
        // We do an initial pass to gather component names
        var componentWillMountUniqueNames = new Set();
        if (pendingComponentWillMountWarnings_1.length > 0) {
            pendingComponentWillMountWarnings_1.forEach(function (fiber) {
                componentWillMountUniqueNames.add((0, react_get_component_name_from_fiber_1.default)(fiber) || "Component");
                didWarnAboutUnsafeLifecycles_1.add(fiber.type);
            });
            pendingComponentWillMountWarnings_1 = [];
        }
        var UNSAFE_componentWillMountUniqueNames = new Set();
        if (pendingUNSAFE_ComponentWillMountWarnings_1.length > 0) {
            pendingUNSAFE_ComponentWillMountWarnings_1.forEach(function (fiber) {
                UNSAFE_componentWillMountUniqueNames.add((0, react_get_component_name_from_fiber_1.default)(fiber) || "Component");
                didWarnAboutUnsafeLifecycles_1.add(fiber.type);
            });
            pendingUNSAFE_ComponentWillMountWarnings_1 = [];
        }
        var componentWillReceivePropsUniqueNames = new Set();
        if (pendingComponentWillReceivePropsWarnings_1.length > 0) {
            pendingComponentWillReceivePropsWarnings_1.forEach(function (fiber) {
                componentWillReceivePropsUniqueNames.add((0, react_get_component_name_from_fiber_1.default)(fiber) || "Component");
                didWarnAboutUnsafeLifecycles_1.add(fiber.type);
            });
            pendingComponentWillReceivePropsWarnings_1 = [];
        }
        var UNSAFE_componentWillReceivePropsUniqueNames = new Set();
        if (pendingUNSAFE_ComponentWillReceivePropsWarnings_1.length > 0) {
            pendingUNSAFE_ComponentWillReceivePropsWarnings_1.forEach(function (fiber) {
                UNSAFE_componentWillReceivePropsUniqueNames.add((0, react_get_component_name_from_fiber_1.default)(fiber) || "Component");
                didWarnAboutUnsafeLifecycles_1.add(fiber.type);
            });
            pendingUNSAFE_ComponentWillReceivePropsWarnings_1 = [];
        }
        var componentWillUpdateUniqueNames = new Set();
        if (pendingComponentWillUpdateWarnings_1.length > 0) {
            pendingComponentWillUpdateWarnings_1.forEach(function (fiber) {
                componentWillUpdateUniqueNames.add((0, react_get_component_name_from_fiber_1.default)(fiber) || "Component");
                didWarnAboutUnsafeLifecycles_1.add(fiber.type);
            });
            pendingComponentWillUpdateWarnings_1 = [];
        }
        var UNSAFE_componentWillUpdateUniqueNames = new Set();
        if (pendingUNSAFE_ComponentWillUpdateWarnings_1.length > 0) {
            pendingUNSAFE_ComponentWillUpdateWarnings_1.forEach(function (fiber) {
                UNSAFE_componentWillUpdateUniqueNames.add((0, react_get_component_name_from_fiber_1.default)(fiber) || "Component");
                didWarnAboutUnsafeLifecycles_1.add(fiber.type);
            });
            pendingUNSAFE_ComponentWillUpdateWarnings_1 = [];
        }
        // Finally, we flush all the warnings
        // UNSAFE_ ones before the deprecated ones, since they'll be 'louder'
        if (UNSAFE_componentWillMountUniqueNames.size > 0) {
            var sortedNames = setToSortedString_1(UNSAFE_componentWillMountUniqueNames);
            console.error("Using UNSAFE_componentWillMount in strict mode is not recommended and may indicate bugs in your code. " + "See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n" + "* Move code with side effects to componentDidMount, and set initial state in the constructor.\n" + "\nPlease update the following components: %s", sortedNames);
        }
        if (UNSAFE_componentWillReceivePropsUniqueNames.size > 0) {
            var sortedNames = setToSortedString_1(UNSAFE_componentWillReceivePropsUniqueNames);
            console.error("Using UNSAFE_componentWillReceiveProps in strict mode is not recommended " + "and may indicate bugs in your code. " + "See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n" + "* Move data fetching code or side effects to componentDidUpdate.\n" + "* If you're updating state whenever props change, " + "refactor your code to use memoization techniques or move it to " + "static getDerivedStateFromProps. Learn more at: https://reactjs.org/link/derived-state\n" + "\nPlease update the following components: %s", sortedNames);
        }
        if (UNSAFE_componentWillUpdateUniqueNames.size > 0) {
            var sortedNames = setToSortedString_1(UNSAFE_componentWillUpdateUniqueNames);
            console.error("Using UNSAFE_componentWillUpdate in strict mode is not recommended " + "and may indicate bugs in your code. " + "See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n" + "* Move data fetching code or side effects to componentDidUpdate.\n" + "\nPlease update the following components: %s", sortedNames);
        }
        if (componentWillMountUniqueNames.size > 0) {
            var sortedNames = setToSortedString_1(componentWillMountUniqueNames);
            console.warn("componentWillMount has been renamed, and is not recommended for use. " + "See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n" + "* Move code with side effects to componentDidMount, and set initial state in the constructor.\n" + "* Rename componentWillMount to UNSAFE_componentWillMount to suppress " + "this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. " + "To rename all deprecated lifecycles to their new names, you can run " + "`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n" + "\nPlease update the following components: %s", sortedNames);
        }
        if (componentWillReceivePropsUniqueNames.size > 0) {
            var sortedNames = setToSortedString_1(componentWillReceivePropsUniqueNames);
            console.warn("componentWillReceiveProps has been renamed, and is not recommended for use. " + "See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n" + "* Move data fetching code or side effects to componentDidUpdate.\n" + "* If you're updating state whenever props change, refactor your " + "code to use memoization techniques or move it to " + "static getDerivedStateFromProps. Learn more at: https://reactjs.org/link/derived-state\n" + "* Rename componentWillReceiveProps to UNSAFE_componentWillReceiveProps to suppress " + "this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. " + "To rename all deprecated lifecycles to their new names, you can run " + "`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n" + "\nPlease update the following components: %s", sortedNames);
        }
        if (componentWillUpdateUniqueNames.size > 0) {
            var sortedNames = setToSortedString_1(componentWillUpdateUniqueNames);
            console.warn("componentWillUpdate has been renamed, and is not recommended for use. " + "See https://reactjs.org/link/unsafe-component-lifecycles for details.\n\n" + "* Move data fetching code or side effects to componentDidUpdate.\n" + "* Rename componentWillUpdate to UNSAFE_componentWillUpdate to suppress " + "this warning in non-strict mode. In React 18.x, only the UNSAFE_ name will work. " + "To rename all deprecated lifecycles to their new names, you can run " + "`npx react-codemod rename-unsafe-lifecycles` in your project source folder.\n" + "\nPlease update the following components: %s", sortedNames);
        }
    };
    var pendingLegacyContextWarning_1 = new Map();
    // Tracks components we have already warned about.
    var didWarnAboutLegacyContext_1 = new Set();
    ReactStrictModeWarnings.recordLegacyContextWarning = function (fiber, instance) {
        var strictRoot = findStrictRoot_1(fiber);
        if (strictRoot === null) {
            console.error("Expected to find a StrictMode component in a strict mode tree. " + "This error is likely caused by a bug in React. Please file an issue.");
            return;
        }
        // Dedup strategy: Warn once per component.
        if (didWarnAboutLegacyContext_1.has(fiber.type)) {
            return;
        }
        var warningsForRoot = pendingLegacyContextWarning_1.get(strictRoot);
        if (fiber.type.contextTypes != null || fiber.type.childContextTypes != null || instance !== null && typeof instance.getChildContext === "function") {
            if (warningsForRoot === undefined) {
                warningsForRoot = [];
                pendingLegacyContextWarning_1.set(strictRoot, warningsForRoot);
            }
            warningsForRoot.push(fiber);
        }
    };
    ReactStrictModeWarnings.flushLegacyContextWarning = function () {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        pendingLegacyContextWarning_1.forEach(function (fiberArray, strictRoot) {
            if (fiberArray.length === 0) {
                return;
            }
            var firstFiber = fiberArray[0];
            var uniqueNames = new Set();
            fiberArray.forEach(function (fiber) {
                uniqueNames.add((0, react_get_component_name_from_fiber_1.default)(fiber) || "Component");
                didWarnAboutLegacyContext_1.add(fiber.type);
            });
            var sortedNames = setToSortedString_1(uniqueNames);
            try {
                (0, react_current_fiber_1.setCurrentFiber)(firstFiber);
                console.error("Legacy context API has been detected within a strict-mode tree." + "\n\nThe old API will be supported in all 16.x releases, but applications " + "using it should migrate to the new version." + "\n\nPlease update the following components: %s" + "\n\nLearn more about this warning here: https://reactjs.org/link/legacy-context", sortedNames);
            }
            finally {
                (0, react_current_fiber_1.resetCurrentFiber)();
            }
        });
    };
    ReactStrictModeWarnings.discardPendingWarnings = function () {
        pendingComponentWillMountWarnings_1 = [];
        pendingUNSAFE_ComponentWillMountWarnings_1 = [];
        pendingComponentWillReceivePropsWarnings_1 = [];
        pendingUNSAFE_ComponentWillReceivePropsWarnings_1 = [];
        pendingComponentWillUpdateWarnings_1 = [];
        pendingUNSAFE_ComponentWillUpdateWarnings_1 = [];
        pendingLegacyContextWarning_1 = new Map();
    };
}
exports.default = ReactStrictModeWarnings;

"use strict";
/**
 * This is a renderer of React that doesn't have a render target output.
 * It is useful to demonstrate the internals of the reconciler in isolation
 * and for testing semantics of reconciliation separate from the host
 * environment.
 */
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var Scheduler = require("@zenflux/react-scheduler/mock");
var check_string_coercion_1 = require("@zenflux/react-shared/src/check-string-coercion");
var react_symbols_1 = require("@zenflux/react-shared/src/react-symbols");
var react_event_priorities_1 = require("@zenflux/react-reconciler/src/react-event-priorities");
var root_tags_1 = require("@zenflux/react-shared/src/react-internal-constants/root-tags");
var NO_CONTEXT = {};
var UPPERCASE_CONTEXT = {};
// TODO: Use `zenflux-react-shared`
var __DEV__ = process.env.NODE_ENV === "development";
if (__DEV__) {
    Object.freeze(NO_CONTEXT);
}
function createReactNoop(reconciler, useMutation) {
    return __awaiter(this, void 0, void 0, function () {
        function appendChildToContainerOrInstance(parentInstance, child) {
            var prevParent = child.parent;
            if (prevParent !== -1 && prevParent !== parentInstance.id) {
                throw new Error("Reparenting is not allowed");
            }
            child.parent = parentInstance.id;
            var index = parentInstance.children.indexOf(child);
            if (index !== -1) {
                parentInstance.children.splice(index, 1);
            }
            parentInstance.children.push(child);
        }
        function appendChildToContainer(parentInstance, child) {
            if (typeof parentInstance.rootID !== "string") {
                // Some calls to this aren't typesafe.
                // This helps surface mistakes in tests.
                throw new Error("appendChildToContainer() first argument is not a container.");
            }
            appendChildToContainerOrInstance(parentInstance, child);
        }
        function appendChild(parentInstance, child) {
            if (typeof parentInstance.rootID === "string") {
                // Some calls to this aren't typesafe.
                // This helps surface mistakes in tests.
                throw new Error("appendChild() first argument is not an instance.");
            }
            appendChildToContainerOrInstance(parentInstance, child);
        }
        function insertInContainerOrInstanceBefore(parentInstance, child, beforeChild) {
            var index = parentInstance.children.indexOf(child);
            if (index !== -1) {
                parentInstance.children.splice(index, 1);
            }
            var beforeIndex = parentInstance.children.indexOf(beforeChild);
            if (beforeIndex === -1) {
                throw new Error("This child does not exist.");
            }
            parentInstance.children.splice(beforeIndex, 0, child);
        }
        function insertInContainerBefore(parentInstance, child, beforeChild) {
            if (typeof parentInstance.rootID !== "string") {
                // Some calls to this aren't typesafe.
                // This helps surface mistakes in tests.
                throw new Error("insertInContainerBefore() first argument is not a container.");
            }
            insertInContainerOrInstanceBefore(parentInstance, child, beforeChild);
        }
        function insertBefore(parentInstance, child, beforeChild) {
            if (typeof parentInstance.rootID === "string") {
                // Some calls to this aren't typesafe.
                // This helps surface mistakes in tests.
                throw new Error("insertBefore() first argument is not an instance.");
            }
            insertInContainerOrInstanceBefore(parentInstance, child, beforeChild);
        }
        function clearContainer(container) {
            container.children.splice(0);
        }
        function removeChildFromContainerOrInstance(parentInstance, child) {
            var index = parentInstance.children.indexOf(child);
            if (index === -1) {
                throw new Error("This child does not exist.");
            }
            parentInstance.children.splice(index, 1);
        }
        function removeChildFromContainer(parentInstance, child) {
            if (typeof parentInstance.rootID !== "string") {
                // Some calls to this aren't typesafe.
                // This helps surface mistakes in tests.
                throw new Error("removeChildFromContainer() first argument is not a container.");
            }
            removeChildFromContainerOrInstance(parentInstance, child);
        }
        function removeChild(parentInstance, child) {
            if (typeof parentInstance.rootID === "string") {
                // Some calls to this aren't typesafe.
                // This helps surface mistakes in tests.
                throw new Error("removeChild() first argument is not an instance.");
            }
            removeChildFromContainerOrInstance(parentInstance, child);
        }
        function cloneInstance(instance, type, oldProps, newProps, keepChildren, children) {
            if (__DEV__) {
                (0, check_string_coercion_1.checkPropStringCoercion)(newProps.children, "children");
            }
            var cloneBase = {
                id: instance.id,
                type: type,
                parent: instance.parent,
                children: keepChildren ? instance.children : children !== null && children !== void 0 ? children : [],
                text: shouldSetTextContent(type, newProps) ? computeText(newProps.children + "", instance.context) : null,
                prop: newProps.prop,
                hidden: !!newProps.hidden,
                context: instance.context
            };
            var clone = cloneBase;
            if (type === "suspensey-thing" && typeof newProps.src === "string") {
                clone.src = newProps.src;
            }
            Object.defineProperty(clone, "id", {
                value: clone.id,
                enumerable: false
            });
            Object.defineProperty(clone, "parent", {
                value: clone.parent,
                enumerable: false
            });
            Object.defineProperty(clone, "text", {
                value: clone.text,
                enumerable: false
            });
            Object.defineProperty(clone, "context", {
                value: clone.context,
                enumerable: false
            });
            hostCloneCounter++;
            return clone;
        }
        function shouldSetTextContent(type, props) {
            if (type === "errorInBeginPhase") {
                throw new Error("Error in host config.");
            }
            return typeof props.children === "string" || typeof props.children === "number";
        }
        function computeText(rawText, hostContext) {
            return hostContext === UPPERCASE_CONTEXT ? rawText.toUpperCase() : rawText;
        }
        function startSuspendingCommit() {
            // This is where we might suspend on things that aren't associated with a
            // particular node, like document.fonts.ready.
            suspenseyCommitSubscription = null;
        }
        function suspendInstance(type, props) {
            var src = props.src;
            if (type === "suspensey-thing" && typeof src === "string") {
                // Attach a listener to the suspensey thing and create a subscription
                // object that uses reference counting to track when all the suspensey
                // things have loaded.
                var record = suspenseyThingCache.get(src);
                if (record === undefined) {
                    throw new Error("Could not find record for key.");
                }
                if (record.status === "fulfilled") { // Already loaded.
                }
                else if (record.status === "pending") {
                    if (suspenseyCommitSubscription === null) {
                        suspenseyCommitSubscription = {
                            pendingCount: 1,
                            commit: null
                        };
                    }
                    else {
                        suspenseyCommitSubscription.pendingCount++;
                    }
                    // Stash the subscription on the record. In `resolveSuspenseyThing`,
                    // we'll use this fire the commit once all the things have loaded.
                    if (record.subscriptions === null) {
                        record.subscriptions = [];
                    }
                    record.subscriptions.push(suspenseyCommitSubscription);
                }
            }
            else {
                throw new Error("Did not expect this host component to be visited when suspending " + "the commit. Did you check the SuspendCommit flag?");
            }
        }
        function waitForCommitToBeReady() {
            var subscription = suspenseyCommitSubscription;
            if (subscription !== null) {
                suspenseyCommitSubscription = null;
                return function (commit) {
                    subscription.commit = commit;
                    var cancelCommit = function () {
                        subscription.commit = null;
                    };
                    return cancelCommit;
                };
            }
            return null;
        }
        function childToJSX(child, text) {
            if (text !== null) {
                return text;
            }
            if (child === null) {
                return null;
            }
            if (typeof child === "string") {
                return child;
            }
            if (Array.isArray(child)) {
                if (child.length === 0) {
                    return null;
                }
                if (child.length === 1) {
                    return childToJSX(child[0], null);
                }
                var children = child.map(function (c) { return childToJSX(c, null); });
                if (children.every(function (c) { return typeof c === "string" || typeof c === "number"; })) {
                    return children.join("");
                }
                return children;
            }
            if (Array.isArray(child.children)) {
                // This is an instance.
                var instance = child;
                var children = childToJSX(instance.children, instance.text);
                var props = {
                    prop: instance.prop
                };
                if (instance.hidden) {
                    props.hidden = true;
                }
                if (instance.src) {
                    props.src = instance.src;
                }
                if (children !== null) {
                    props.children = children;
                }
                return {
                    $$typeof: react_symbols_1.REACT_ELEMENT_TYPE,
                    type: instance.type,
                    key: null,
                    ref: null,
                    props: props,
                    _owner: null,
                    _store: __DEV__ ? {} : undefined
                };
            }
            // This is a text instance
            var textInstance = child;
            if (textInstance.hidden) {
                return "";
            }
            return textInstance.text;
        }
        function getChildren(root) {
            if (root) {
                return root.children;
            }
            else {
                return null;
            }
        }
        function getPendingChildren(root) {
            if (root) {
                return root.children;
            }
            else {
                return null;
            }
        }
        function getChildrenAsJSX(root) {
            var children = childToJSX(getChildren(root), null);
            if (children === null) {
                return null;
            }
            if (Array.isArray(children)) {
                return {
                    $$typeof: react_symbols_1.REACT_ELEMENT_TYPE,
                    type: react_symbols_1.REACT_FRAGMENT_TYPE,
                    key: null,
                    ref: null,
                    props: {
                        children: children
                    },
                    _owner: null,
                    _store: __DEV__ ? {} : undefined
                };
            }
            return children;
        }
        function getPendingChildrenAsJSX(root) {
            var children = childToJSX(getChildren(root), null);
            if (children === null) {
                return null;
            }
            if (Array.isArray(children)) {
                return {
                    $$typeof: react_symbols_1.REACT_ELEMENT_TYPE,
                    type: react_symbols_1.REACT_FRAGMENT_TYPE,
                    key: null,
                    ref: null,
                    props: {
                        children: children
                    },
                    _owner: null,
                    _store: __DEV__ ? {} : undefined
                };
            }
            return children;
        }
        function flushSync(fn) {
            if (__DEV__) {
                if (NoopRenderer.isAlreadyRendering()) {
                    console.error("flushSync was called from inside a lifecycle method. React cannot " + "flush when React is already rendering. Consider moving this call to " + "a scheduler task or micro task.");
                }
            }
            return NoopRenderer.flushSync(fn);
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        function onRecoverableError(error) {
            // console.error(error);
        }
        var instanceCounter, hostUpdateCounter, hostCloneCounter, suspenseyThingCache, suspenseyCommitSubscription, sharedHostConfig, hostConfig, NoopRenderer, rootContainers, roots, DEFAULT_ROOT_ID, currentEventPriority, idCounter, ReactNoop;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    instanceCounter = 0;
                    hostUpdateCounter = 0;
                    hostCloneCounter = 0;
                    suspenseyThingCache = null;
                    suspenseyCommitSubscription = null;
                    sharedHostConfig = {
                        supportsSingletons: false,
                        getRootHostContext: function () {
                            return NO_CONTEXT;
                        },
                        getChildHostContext: function (parentHostContext, type) {
                            if (type === "offscreen") {
                                return parentHostContext;
                            }
                            if (type === "uppercase") {
                                return UPPERCASE_CONTEXT;
                            }
                            return NO_CONTEXT;
                        },
                        getPublicInstance: function (instance) {
                            return instance;
                        },
                        createInstance: function (type, props, rootContainerInstance, hostContext, internalInstanceHandle) {
                            if (type === "errorInCompletePhase") {
                                throw new Error("Error in host config.");
                            }
                            if (__DEV__) {
                                // The `if` statement here prevents auto-disabling of the safe coercion
                                // ESLint rule, so we must manually disable it below.
                                if (shouldSetTextContent(type, props)) {
                                    (0, check_string_coercion_1.checkPropStringCoercion)(props.children, "children");
                                }
                            }
                            var baseInst = {
                                id: instanceCounter++,
                                type: type,
                                children: [],
                                parent: -1,
                                text: shouldSetTextContent(type, props) ?
                                    computeText(props.children + "", hostContext) : null,
                                prop: props.prop,
                                hidden: !!props.hidden,
                                context: hostContext
                            };
                            var inst = baseInst;
                            if (type === "suspensey-thing" && typeof props.src === "string") {
                                inst.src = props.src;
                            }
                            // Hide from unit tests
                            Object.defineProperty(inst, "id", {
                                value: inst.id,
                                enumerable: false
                            });
                            Object.defineProperty(inst, "parent", {
                                value: inst.parent,
                                enumerable: false
                            });
                            Object.defineProperty(inst, "text", {
                                value: inst.text,
                                enumerable: false
                            });
                            Object.defineProperty(inst, "context", {
                                value: inst.context,
                                enumerable: false
                            });
                            Object.defineProperty(inst, "fiber", {
                                value: internalInstanceHandle,
                                enumerable: false
                            });
                            return inst;
                        },
                        appendInitialChild: function (parentInstance, child) {
                            var prevParent = child.parent;
                            if (prevParent !== -1 && prevParent !== parentInstance.id) {
                                throw new Error("Reparenting is not allowed");
                            }
                            child.parent = parentInstance.id;
                            parentInstance.children.push(child);
                        },
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        finalizeInitialChildren: function (domElement, type, props) {
                            return false;
                        },
                        shouldSetTextContent: shouldSetTextContent,
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        createTextInstance: function (text, rootContainerInstance, hostContext, internalInstanceHandle) {
                            if (hostContext === UPPERCASE_CONTEXT) {
                                text = text.toUpperCase();
                            }
                            var inst = {
                                text: text,
                                id: instanceCounter++,
                                parent: -1,
                                hidden: false,
                                context: hostContext
                            };
                            // Hide from unit tests
                            Object.defineProperty(inst, "id", {
                                value: inst.id,
                                enumerable: false
                            });
                            Object.defineProperty(inst, "parent", {
                                value: inst.parent,
                                enumerable: false
                            });
                            Object.defineProperty(inst, "context", {
                                value: inst.context,
                                enumerable: false
                            });
                            return inst;
                        },
                        scheduleTimeout: setTimeout,
                        cancelTimeout: clearTimeout,
                        noTimeout: -1,
                        supportsMicrotasks: true,
                        scheduleMicrotask: typeof queueMicrotask === "function" ? queueMicrotask : typeof Promise !== "undefined" ? function (callback) { return Promise.resolve(null).then(callback).catch(function (error) {
                            setTimeout(function () {
                                throw error;
                            });
                        }); } : setTimeout,
                        prepareForCommit: function () {
                            return null;
                        },
                        resetAfterCommit: function () {
                        },
                        getCurrentEventPriority: function () {
                            return currentEventPriority;
                        },
                        shouldAttemptEagerTransition: function () {
                            return false;
                        },
                        now: Scheduler.unstable_now,
                        isPrimaryRenderer: true,
                        warnsIfNotActing: true,
                        supportsHydration: false,
                        getInstanceFromNode: function () {
                            throw new Error("Not yet implemented.");
                        },
                        beforeActiveInstanceBlur: function () {
                        },
                        afterActiveInstanceBlur: function () {
                        },
                        preparePortalMount: function () {
                        },
                        prepareScopeUpdate: function () {
                        },
                        getInstanceFromScope: function () {
                            throw new Error("Not yet implemented.");
                        },
                        detachDeletedInstance: function () {
                        },
                        logRecoverableError: function () {
                        },
                        requestPostPaintCallback: function (callback) {
                            var endTime = Scheduler.unstable_now();
                            callback(endTime);
                        },
                        maySuspendCommit: function (type, props) {
                            // Asks whether it's possible for this combination of type and props
                            // to ever need to suspend. This is different from asking whether it's
                            // currently ready because even if it's ready now, it might get purged
                            // from the cache later.
                            return type === "suspensey-thing" && typeof props.src === "string";
                        },
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        mayResourceSuspendCommit: function (resource) {
                            throw new Error("Resources are not implemented for React Noop yet. This method should not be called");
                        },
                        preloadInstance: function (type, props) {
                            if (type !== "suspensey-thing" || typeof props.src !== "string") {
                                throw new Error("Attempted to preload unexpected instance: " + type);
                            }
                            // In addition to preloading an instance, this method asks whether the
                            // instance is ready to be committed. If it's not, React may yield to the
                            // main thread and ask again. It's possible a load event will fire in
                            // between, in which case we can avoid showing a fallback.
                            if (suspenseyThingCache === null) {
                                suspenseyThingCache = new Map();
                            }
                            var record = suspenseyThingCache.get(props.src);
                            if (record === undefined) {
                                var newRecord = {
                                    status: "pending",
                                    subscriptions: null
                                };
                                suspenseyThingCache.set(props.src, newRecord);
                                var onLoadStart = props.onLoadStart;
                                if (typeof onLoadStart === "function") {
                                    onLoadStart();
                                }
                                return false;
                            }
                            else {
                                // If this is false, React will trigger a fallback, if needed.
                                return record.status === "fulfilled";
                            }
                        },
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        preloadResource: function (resource) {
                            throw new Error("Resources are not implemented for React Noop yet. This method should not be called");
                        },
                        startSuspendingCommit: startSuspendingCommit,
                        suspendInstance: suspendInstance,
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        suspendResource: function (resource) {
                            throw new Error("Resources are not implemented for React Noop yet. This method should not be called");
                        },
                        waitForCommitToBeReady: waitForCommitToBeReady,
                        NotPendingTransition: null
                    };
                    hostConfig = useMutation ? __assign(__assign({}, sharedHostConfig), { supportsMutation: true, supportsPersistence: false, 
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        commitMount: function (instance, type, newProps) {
                        }, commitUpdate: function (instance, updatePayload, type, oldProps, newProps) {
                            if (oldProps === null) {
                                throw new Error("Should have old props");
                            }
                            hostUpdateCounter++;
                            instance.prop = newProps.prop;
                            instance.hidden = !!newProps.hidden;
                            if (type === "suspensey-thing" && typeof newProps.src === "string") {
                                instance.src = newProps.src;
                            }
                            if (shouldSetTextContent(type, newProps)) {
                                if (__DEV__) {
                                    (0, check_string_coercion_1.checkPropStringCoercion)(newProps.children, "children");
                                }
                                instance.text = computeText(newProps.children + "", instance.context);
                            }
                        }, commitTextUpdate: function (textInstance, oldText, newText) {
                            hostUpdateCounter++;
                            textInstance.text = computeText(newText, textInstance.context);
                        }, appendChild: appendChild, appendChildToContainer: appendChildToContainer, insertBefore: insertBefore, insertInContainerBefore: insertInContainerBefore, removeChild: removeChild, removeChildFromContainer: removeChildFromContainer, clearContainer: clearContainer, hideInstance: function (instance) {
                            instance.hidden = true;
                        }, hideTextInstance: function (textInstance) {
                            textInstance.hidden = true;
                        }, unhideInstance: function (instance, props) {
                            if (!props.hidden) {
                                instance.hidden = false;
                            }
                        }, 
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        unhideTextInstance: function (textInstance, text) {
                            textInstance.hidden = false;
                        }, resetTextContent: function (instance) {
                            instance.text = null;
                        } }) : __assign(__assign({}, sharedHostConfig), { supportsMutation: false, supportsPersistence: true, cloneInstance: cloneInstance, clearContainer: clearContainer, createContainerChildSet: function () {
                            return [];
                        }, appendChildToContainerChildSet: function (childSet, child) {
                            childSet.push(child);
                        }, finalizeContainerChildren: function (container, newChildren) {
                            container.pendingChildren = newChildren;
                            if (newChildren.length === 1 && newChildren[0].text === "Error when completing root") {
                                // Trigger an error for testing purposes
                                throw Error("Error when completing root");
                            }
                        }, replaceContainerChildren: function (container, newChildren) {
                            container.children = newChildren;
                        }, cloneHiddenInstance: function (instance, type, props) {
                            var clone = cloneInstance(instance, type, props, props, true, null);
                            clone.hidden = true;
                            return clone;
                        }, 
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        cloneHiddenTextInstance: function (instance, text) {
                            var clone = {
                                text: instance.text,
                                id: instance.id,
                                parent: instance.parent,
                                hidden: true,
                                context: instance.context
                            };
                            // Hide from unit tests
                            Object.defineProperty(clone, "id", {
                                value: clone.id,
                                enumerable: false
                            });
                            Object.defineProperty(clone, "parent", {
                                value: clone.parent,
                                enumerable: false
                            });
                            Object.defineProperty(clone, "context", {
                                value: clone.context,
                                enumerable: false
                            });
                            return clone;
                        } });
                    return [4 /*yield*/, reconciler(hostConfig)];
                case 1:
                    NoopRenderer = _a.sent();
                    rootContainers = new Map();
                    roots = new Map();
                    DEFAULT_ROOT_ID = "<default>";
                    currentEventPriority = react_event_priorities_1.DefaultEventPriority;
                    idCounter = 0;
                    ReactNoop = {
                        _Scheduler: Scheduler,
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        getChildren: function (rootID) {
                            if (rootID === void 0) { rootID = DEFAULT_ROOT_ID; }
                            throw new Error("No longer supported due to bad performance when used with `expect()`. " + "Use `ReactNoop.getChildrenAsJSX()` instead or, if you really need to, `dangerouslyGetChildren` after you carefully considered the warning in its JSDOC.");
                        },
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        getPendingChildren: function (rootID) {
                            if (rootID === void 0) { rootID = DEFAULT_ROOT_ID; }
                            throw new Error("No longer supported due to bad performance when used with `expect()`. " + "Use `ReactNoop.getPendingChildrenAsJSX()` instead or, if you really need to, `dangerouslyGetPendingChildren` after you carefully considered the warning in its JSDOC.");
                        },
                        /**
                         * Prefer using `getChildrenAsJSX`.
                         * Using the returned children in `.toEqual` has very poor performance on mismatch due to deep equality checking of fiber structures.
                         * Make sure you deeply remove enumerable properties before passing it to `.toEqual`, or, better, use `getChildrenAsJSX` or `toMatchRenderedOutput`.
                         */
                        dangerouslyGetChildren: function (rootID) {
                            if (rootID === void 0) { rootID = DEFAULT_ROOT_ID; }
                            var container = rootContainers.get(rootID);
                            return getChildren(container);
                        },
                        /**
                         * Prefer using `getPendingChildrenAsJSX`.
                         * Using the returned children in `.toEqual` has very poor performance on mismatch due to deep equality checking of fiber structures.
                         * Make sure you deeply remove enumerable properties before passing it to `.toEqual`, or, better, use `getChildrenAsJSX` or `toMatchRenderedOutput`.
                         */
                        dangerouslyGetPendingChildren: function (rootID) {
                            if (rootID === void 0) { rootID = DEFAULT_ROOT_ID; }
                            var container = rootContainers.get(rootID);
                            return getPendingChildren(container);
                        },
                        getOrCreateRootContainer: function (rootID, tag) {
                            if (rootID === void 0) { rootID = DEFAULT_ROOT_ID; }
                            var root = roots.get(rootID);
                            if (!root) {
                                var container = {
                                    rootID: rootID,
                                    pendingChildren: [],
                                    children: []
                                };
                                rootContainers.set(rootID, container);
                                // @ts-ignore
                                root = NoopRenderer.createContainer(container, tag, null, null, false, "", onRecoverableError, null);
                                roots.set(rootID, root);
                            }
                            return root.current.stateNode.containerInfo;
                        },
                        // TODO: Replace ReactNoop.render with createRoot + root.render
                        createRoot: function (options) {
                            var container = {
                                rootID: "" + idCounter++,
                                pendingChildren: [],
                                children: []
                            };
                            // @ts-ignore
                            var fiberRoot = NoopRenderer.createContainer(container, root_tags_1.ConcurrentRoot, null, null, false, "", onRecoverableError, options && options.unstable_transitionCallbacks ? options.unstable_transitionCallbacks : null);
                            return {
                                _Scheduler: Scheduler,
                                render: function (children) {
                                    NoopRenderer.updateContainer(children, fiberRoot, null, null);
                                },
                                getChildren: function () {
                                    return getChildren(container);
                                },
                                getChildrenAsJSX: function () {
                                    return getChildrenAsJSX(container);
                                }
                            };
                        },
                        createLegacyRoot: function () {
                            var container = {
                                rootID: "" + idCounter++,
                                pendingChildren: [],
                                children: []
                            };
                            // @ts-ignore
                            var fiberRoot = NoopRenderer.createContainer(container, root_tags_1.LegacyRoot, null, null, false, "", onRecoverableError, null);
                            return {
                                _Scheduler: Scheduler,
                                render: function (children) {
                                    NoopRenderer.updateContainer(children, fiberRoot, null, null);
                                },
                                getChildren: function () {
                                    return getChildren(container);
                                },
                                getChildrenAsJSX: function () {
                                    return getChildrenAsJSX(container);
                                }
                            };
                        },
                        getChildrenAsJSX: function (rootID) {
                            if (rootID === void 0) { rootID = DEFAULT_ROOT_ID; }
                            var container = rootContainers.get(rootID);
                            return getChildrenAsJSX(container);
                        },
                        getPendingChildrenAsJSX: function (rootID) {
                            if (rootID === void 0) { rootID = DEFAULT_ROOT_ID; }
                            var container = rootContainers.get(rootID);
                            return getPendingChildrenAsJSX(container);
                        },
                        getSuspenseyThingStatus: function (src) {
                            if (suspenseyThingCache === null) {
                                return null;
                            }
                            else {
                                var record = suspenseyThingCache.get(src);
                                return record === undefined ? null : record.status;
                            }
                        },
                        resolveSuspenseyThing: function (key) {
                            if (suspenseyThingCache === null) {
                                suspenseyThingCache = new Map();
                            }
                            var record = suspenseyThingCache.get(key);
                            if (record === undefined) {
                                var newRecord = {
                                    status: "fulfilled",
                                    subscriptions: null
                                };
                                suspenseyThingCache.set(key, newRecord);
                            }
                            else {
                                if (record.status === "pending") {
                                    record.status = "fulfilled";
                                    var subscriptions = record.subscriptions;
                                    if (subscriptions !== null) {
                                        record.subscriptions = null;
                                        for (var i = 0; i < subscriptions.length; i++) {
                                            var subscription = subscriptions[i];
                                            subscription.pendingCount--;
                                            if (subscription.pendingCount === 0) {
                                                var commit = subscription.commit;
                                                subscription.commit = null;
                                                commit();
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        resetSuspenseyThingCache: function () {
                            suspenseyThingCache = null;
                        },
                        createPortal: function (children, container, key) {
                            if (key === void 0) { key = null; }
                            return NoopRenderer.createPortal(children, container, null, key);
                        },
                        // Shortcut for testing a single root
                        render: function (element, callback) {
                            ReactNoop.renderToRootWithID(element, DEFAULT_ROOT_ID, callback);
                        },
                        renderLegacySyncRoot: function (element, callback) {
                            var rootID = DEFAULT_ROOT_ID;
                            var container = ReactNoop.getOrCreateRootContainer(rootID, root_tags_1.LegacyRoot);
                            var root = roots.get(container.rootID);
                            // @ts-ignore
                            NoopRenderer.updateContainer(element, root, null, callback);
                        },
                        renderToRootWithID: function (element, rootID, callback) {
                            var container = ReactNoop.getOrCreateRootContainer(rootID, root_tags_1.ConcurrentRoot);
                            var root = roots.get(container.rootID);
                            // @ts-ignore
                            NoopRenderer.updateContainer(element, root, null, callback);
                        },
                        unmountRootWithID: function (rootID) {
                            var root = roots.get(rootID);
                            if (root) {
                                NoopRenderer.updateContainer(null, root, null, function () {
                                    roots.delete(rootID);
                                    rootContainers.delete(rootID);
                                });
                            }
                        },
                        findInstance: function (componentOrElement) {
                            if (componentOrElement == null) {
                                return null;
                            }
                            // Unsound duck typing.
                            var component = componentOrElement;
                            if (typeof component.id === "number") {
                                return component;
                            }
                            if (__DEV__) {
                                return NoopRenderer.findHostInstanceWithWarning(component, "findInstance");
                            }
                            return NoopRenderer.findHostInstance(component);
                        },
                        flushNextYield: function () {
                            Scheduler.unstable_flushNumberOfYields(1);
                            return Scheduler.unstable_clearLog();
                        },
                        startTrackingHostCounters: function () {
                            hostUpdateCounter = 0;
                            hostCloneCounter = 0;
                        },
                        stopTrackingHostCounters: function () {
                            var result = useMutation ? {
                                hostUpdateCounter: hostUpdateCounter
                            } : {
                                hostCloneCounter: hostCloneCounter
                            };
                            hostUpdateCounter = 0;
                            hostCloneCounter = 0;
                            return result;
                        },
                        expire: Scheduler.unstable_advanceTime,
                        flushExpired: function () {
                            return Scheduler.unstable_flushExpired();
                        },
                        unstable_runWithPriority: NoopRenderer.runWithPriority.bind(NoopRenderer),
                        batchedUpdates: NoopRenderer.batchedUpdates.bind(NoopRenderer),
                        deferredUpdates: NoopRenderer.deferredUpdates.bind(NoopRenderer),
                        discreteUpdates: NoopRenderer.discreteUpdates.bind(NoopRenderer),
                        idleUpdates: function (fn) {
                            var prevEventPriority = currentEventPriority;
                            currentEventPriority = react_event_priorities_1.IdleEventPriority;
                            try {
                                fn();
                            }
                            finally {
                                currentEventPriority = prevEventPriority;
                            }
                            return undefined;
                        },
                        flushSync: flushSync,
                        flushPassiveEffects: NoopRenderer.flushPassiveEffects.bind(NoopRenderer),
                        // Logs the current state of the tree.
                        dumpTree: function (rootID) {
                            if (rootID === void 0) { rootID = DEFAULT_ROOT_ID; }
                            var root = roots.get(rootID);
                            var rootContainer = rootContainers.get(rootID);
                            if (!root || !rootContainer) {
                                console.log("Nothing rendered yet.");
                                return;
                            }
                            var bufferedLog = [];
                            function log() {
                                var args = [];
                                for (var _i = 0; _i < arguments.length; _i++) {
                                    args[_i] = arguments[_i];
                                }
                                bufferedLog.push.apply(bufferedLog, __spreadArray(__spreadArray([], args, false), ["\n"], false));
                            }
                            function logHostInstances(children, depth) {
                                for (var i = 0; i < children.length; i++) {
                                    var child = children[i];
                                    var indent = "  ".repeat(depth);
                                    if (typeof child.text === "string") {
                                        log(indent + "- " + child.text);
                                    }
                                    else {
                                        log(indent + "- " + child.type + "#" + child.id);
                                        logHostInstances(child.children, depth + 1);
                                    }
                                }
                            }
                            function logContainer(container, depth) {
                                log("  ".repeat(depth) + "- [root#" + container.rootID + "]");
                                logHostInstances(container.children, depth + 1);
                            }
                            function logUpdateQueue(updateQueue, depth) {
                                log("  ".repeat(depth + 1) + "QUEUED UPDATES");
                                var first = updateQueue.firstBaseUpdate;
                                var update = first;
                                if (update !== null) {
                                    do {
                                        log("  ".repeat(depth + 1) + "~", "[" + update.expirationTime + "]");
                                    } while (update !== null);
                                }
                                var lastPending = updateQueue.shared.pending;
                                if (lastPending !== null) {
                                    var firstPending = lastPending.next;
                                    var pendingUpdate = firstPending;
                                    if (pendingUpdate !== null) {
                                        do {
                                            log("  ".repeat(depth + 1) + "~", "[" + pendingUpdate.expirationTime + "]");
                                        } while (pendingUpdate !== null && pendingUpdate !== firstPending);
                                    }
                                }
                            }
                            function logFiber(fiber, depth) {
                                log("  ".repeat(depth) + "- " + ( // need to explicitly coerce Symbol to a string
                                fiber.type ? fiber.type.name || fiber.type.toString() : "[root]"), "[" + fiber.childExpirationTime + (fiber.pendingProps ? "*" : "") + "]");
                                if (fiber.updateQueue) {
                                    // @ts-ignore
                                    logUpdateQueue(fiber.updateQueue, depth);
                                }
                                // const childInProgress = fiber.progressedChild;
                                // if (childInProgress && childInProgress !== fiber.child) {
                                //   log(
                                //     '  '.repeat(depth + 1) + 'IN PROGRESS: ' + fiber.pendingWorkPriority,
                                //   );
                                //   logFiber(childInProgress, depth + 1);
                                //   if (fiber.child) {
                                //     log('  '.repeat(depth + 1) + 'CURRENT');
                                //   }
                                // } else if (fiber.child && fiber.updateQueue) {
                                //   log('  '.repeat(depth + 1) + 'CHILDREN');
                                // }
                                if (fiber.child) {
                                    logFiber(fiber.child, depth + 1);
                                }
                                if (fiber.sibling) {
                                    logFiber(fiber.sibling, depth);
                                }
                            }
                            log("HOST INSTANCES:");
                            logContainer(rootContainer, 0);
                            log("FIBERS:");
                            logFiber(root.current, 0);
                            console.log.apply(console, bufferedLog);
                        },
                        getRoot: function (rootID) {
                            if (rootID === void 0) { rootID = DEFAULT_ROOT_ID; }
                            return roots.get(rootID);
                        }
                    };
                    return [2 /*return*/, ReactNoop];
            }
        });
    });
}
exports.default = createReactNoop;

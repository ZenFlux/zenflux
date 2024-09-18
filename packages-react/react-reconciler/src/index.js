"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.reactReconciler = exports.ZenFluxReactReconciler = void 0;
var ZenFluxReactReconciler = /** @class */ (function () {
    function ZenFluxReactReconciler(config) {
        var _this = this;
        this.config = config;
        if (config) {
            globalThis.__RECONCILER__CONFIG__ = config;
        }
        this.initPromise = Promise.resolve().then(function () { return require("./react-fiber-reconciler"); }).then(function (r) { return _this.reconciler = r; });
    }
    ZenFluxReactReconciler.prototype.waitForInitialize = function () {
        return this.initPromise;
    };
    ZenFluxReactReconciler.prototype.attemptContinuousHydration = function (fiber) {
        return this.reconciler.attemptContinuousHydration(fiber);
    };
    ;
    ZenFluxReactReconciler.prototype.attemptDiscreteHydration = function (fiber) {
        return this.reconciler.attemptDiscreteHydration(fiber); // Not implemented
    };
    ZenFluxReactReconciler.prototype.attemptHydrationAtCurrentPriority = function (fiber) {
        return this.reconciler.attemptHydrationAtCurrentPriority(fiber);
    };
    ZenFluxReactReconciler.prototype.attemptSynchronousHydration = function (fiber) {
        return this.reconciler.attemptSynchronousHydration(fiber);
    };
    ZenFluxReactReconciler.prototype.batchedUpdates = function (fn, a) {
        return this.reconciler.batchedUpdates(fn, a);
    };
    ZenFluxReactReconciler.prototype.createComponentSelector = function (component) {
        return this.reconciler.createComponentSelector(component);
    };
    ZenFluxReactReconciler.prototype.createContainer = function (containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks) {
        return this.reconciler.createContainer(containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks);
    };
    ZenFluxReactReconciler.prototype.createHasPseudoClassSelector = function (selectors) {
        return this.reconciler.createHasPseudoClassSelector(selectors);
    };
    ZenFluxReactReconciler.prototype.createHydrationContainer = function (initialChildren, callback, containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks) {
        return this.reconciler.createHydrationContainer(initialChildren, callback, containerInfo, tag, hydrationCallbacks, isStrictMode, concurrentUpdatesByDefaultOverride, identifierPrefix, onRecoverableError, transitionCallbacks, null);
    };
    ZenFluxReactReconciler.prototype.createPortal = function (children, containerInfo, implementation, key) {
        return this.reconciler.createPortal(children, containerInfo, implementation, key);
    };
    ZenFluxReactReconciler.prototype.createRoleSelector = function (role) {
        return this.reconciler.createRoleSelector(role);
    };
    ZenFluxReactReconciler.prototype.createTestNameSelector = function (id) {
        return this.reconciler.createTestNameSelector(id);
    };
    ZenFluxReactReconciler.prototype.createTextSelector = function (text) {
        return this.reconciler.createTextSelector(text);
    };
    ZenFluxReactReconciler.prototype.deferredUpdates = function (fn) {
        // @ts-ignore
        return this.reconciler.deferredUpdates(fn);
    };
    ZenFluxReactReconciler.prototype.discreteUpdates = function (fn, a, b, c, d) {
        return this.reconciler.discreteUpdates(fn, a, b, c, d);
    };
    ZenFluxReactReconciler.prototype.findAllNodes = function (hostRoot, selectors) {
        return this.reconciler.findAllNodes(hostRoot, selectors);
    };
    ZenFluxReactReconciler.prototype.findBoundingRects = function (hostRoot, selectors) {
        return this.reconciler.findBoundingRects(hostRoot, selectors);
    };
    ZenFluxReactReconciler.prototype.findHostInstance = function (component) {
        return this.reconciler.findHostInstance(component);
    };
    ZenFluxReactReconciler.prototype.findHostInstanceWithNoPortals = function (fiber) {
        return this.reconciler.findHostInstanceWithNoPortals(fiber);
    };
    ZenFluxReactReconciler.prototype.findHostInstanceWithWarning = function (component, methodName) {
        return this.reconciler.findHostInstanceWithWarning(component, methodName);
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ZenFluxReactReconciler.prototype.flushControlled = function (fn) {
        throw new Error("Method not implemented.");
    };
    ZenFluxReactReconciler.prototype.flushPassiveEffects = function () {
        return this.reconciler.flushPassiveEffects();
    };
    ZenFluxReactReconciler.prototype.flushSync = function (fn) {
        return this.reconciler.flushSync(fn);
    };
    ZenFluxReactReconciler.prototype.focusWithin = function (hostRoot, selectors) {
        return this.reconciler.focusWithin(hostRoot, selectors);
    };
    ZenFluxReactReconciler.prototype.getCurrentUpdatePriority = function () {
        return this.reconciler.getCurrentUpdatePriority();
    };
    ZenFluxReactReconciler.prototype.getFindAllNodesFailureDescription = function (hostRoot, selectors) {
        return this.reconciler.getFindAllNodesFailureDescription(hostRoot, selectors);
    };
    ZenFluxReactReconciler.prototype.getPublicRootInstance = function (container) {
        return this.reconciler.getPublicRootInstance(container);
    };
    ZenFluxReactReconciler.prototype.injectIntoDevTools = function (devToolsConfig) {
        // TODO Handle issue with devToolsConfig generics.
        return this.reconciler.injectIntoDevTools(devToolsConfig);
    };
    ZenFluxReactReconciler.prototype.isAlreadyRendering = function () {
        return this.reconciler.isAlreadyRendering();
    };
    ZenFluxReactReconciler.prototype.observeVisibleRects = function (hostRoot, selectors, callback, options) {
        return this.reconciler.observeVisibleRects(hostRoot, selectors, callback, options);
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ZenFluxReactReconciler.prototype.registerMutableSourceForHydration = function (root, mutableSource) {
        throw new Error("Method not implemented.");
    };
    ZenFluxReactReconciler.prototype.runWithPriority = function (priority, fn) {
        return this.reconciler.runWithPriority(priority, fn);
    };
    ZenFluxReactReconciler.prototype.shouldError = function (fiber) {
        // TODO: Try to see what about 'null';
        return this.reconciler.shouldError(fiber);
    };
    ZenFluxReactReconciler.prototype.shouldSuspend = function (fiber) {
        return this.reconciler.shouldSuspend(fiber);
    };
    ZenFluxReactReconciler.prototype.updateContainer = function (element, container, parentComponent, callback) {
        return this.reconciler.updateContainer(element, container, parentComponent, callback);
    };
    return ZenFluxReactReconciler;
}());
exports.ZenFluxReactReconciler = ZenFluxReactReconciler;
function reactReconciler(config) {
    return __awaiter(this, void 0, void 0, function () {
        var reconciler;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    reconciler = new ZenFluxReactReconciler(config);
                    return [4 /*yield*/, reconciler.waitForInitialize()];
                case 1:
                    _a.sent();
                    return [2 /*return*/, reconciler];
            }
        });
    });
}
exports.reactReconciler = reactReconciler;
exports.default = reactReconciler;

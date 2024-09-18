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
Object.defineProperty(exports, "__esModule", { value: true });
exports.accordionHandleExternalSelection = exports.accordionHandleSelection = void 0;
var react_1 = require("react");
/**
 * Function accordionHandleSelection() Handles the selection of an accordion item.
 */
var accordionHandleSelection = function (event, ref, args) {
    var _a;
    // TODO: Add block on transition if needed.
    if (!ref.current /*|| args.isTransitioning */) {
        return;
    }
    var target = ref.current;
    var onClick = args.onClick, collapsedState = args.collapsedState, setCollapsedState = args.setCollapsedState, selected = args.selected, setSelected = args.setSelected;
    var state = collapsedState === "detached" ? "attached" : "detached";
    var controller = new AbortController();
    if (!args.key) {
        throw new Error("Accordion item key is not defined");
    }
    onClick === null || onClick === void 0 ? void 0 : onClick(event, args.key, state, controller);
    if (controller.signal.aborted) {
        return;
    }
    /**
     * Trigger accordion item selection
     */
    setCollapsedState(state);
    // Update for external
    setSelected(__assign(__assign({}, selected), (_a = {}, _a[args.key] = state === "attached", _a)));
    target.setAttribute("data-collapsed", state);
};
exports.accordionHandleSelection = accordionHandleSelection;
/**
 * Function accordionHandleExternalSelection() Since state can be created outside the component, it is necessary to implement a some sort of
 * solution.
 */
var accordionHandleExternalSelection = function (args) {
    var isSelectionChanged = react_1.default.useMemo(function () {
        // Convert to array and compare
        return JSON.stringify(Object.keys(args.prevSelected)) !== JSON.stringify(Object.keys(args.selected));
    }, [args.selected]);
    react_1.default.useEffect(function () {
        if (args.onSelectionChanged) {
            setTimeout(function () {
                args.onSelectionChanged();
            });
        }
        if (isSelectionChanged) {
            // If all cleared, then clear all
            if (Object.keys(args.selected).length === 0) {
                Object.values(args.sharedProps).forEach(function (props) {
                    // If attached, then detach
                    props.setCollapsedState(props.collapsedState === "attached" ? "detached" : "attached");
                });
            }
            // Update all items according to their selection state
            Object.values(args.sharedProps).forEach(function (props) {
                var key = props.itemKey;
                // If attached, then detach
                props.setCollapsedState(args.selected[key] ? "attached" : "detached");
            });
        }
        args.setPrevSelected(args.selected);
    }, [args.selected]);
};
exports.accordionHandleExternalSelection = accordionHandleExternalSelection;

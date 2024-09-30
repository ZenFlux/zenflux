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
exports.ChannelItemTable = void 0;
var react_1 = require("react");
var moment_1 = require("moment");
var input_1 = require("@nextui-org/input");
var symbols_1 = require("@zenflux/react-ui/src/symbols");
var with_commands_1 = require("@zenflux/react-commander/with-commands");
var use_commands_1 = require("@zenflux/react-commander/use-commands");
var utils_1 = require("@zenflux/app-budget-allocation/src/utils");
var channel_constants_1 = require("@zenflux/app-budget-allocation/src/components/channel/channel-constants");
var channel_types_1 = require("@zenflux/app-budget-allocation/src/components/channel/channel-types");
var commands = require("@zenflux/app-budget-allocation/src/components/channel/commands");
require("@zenflux/app-budget-allocation/src/components/channel/_channel-item-table.scss");
var ChannelItemTable = function (props) {
    var _a;
    var _b = (0, use_commands_1.useCommanderState)("App/ChannelItem"), getState = _b[0], _setState = _b[1], isMounted = _b[2], state = getState();
    var _c = react_1.default.useState(new Array(state.breaks.length).fill(false)), isEditing = _c[0], setIsEditing = _c[1];
    var _d = react_1.default.useState("right"), arrowRightOrLeft = _d[0], setArrowRightOrLeft = _d[1];
    var _e = react_1.default.useState(state), cloneState = _e[0], setCloneState = _e[1];
    react_1.default.useEffect(function () {
        if (isMounted()) {
            setCloneState(__assign({}, state));
        }
    }, [isMounted()]);
    // @ts-ignore - Handles issue with state not being set on first render, when page loaded on overview.
    if (!((_a = state.breaks) === null || _a === void 0 ? void 0 : _a.length) && props.breaks.length)
        state.breaks = props.breaks;
    var tableRef = react_1.default.useRef(null);
    var commands = (0, use_commands_1.useCommanderComponent)("App/ChannelItem");
    var setBreakdown = function (index, value, force) {
        if (force === void 0) { force = false; }
        if (!force) {
            commands.run("App/ChannelItem/SetBreakdown", {
                index: index,
                value: value,
                setState: setCloneState,
                source: channel_types_1.UpdateSource.FROM_BUDGET_OVERVIEW
            });
            return;
        }
        commands.run("App/ChannelItem/SetBreakdown", { index: index, value: value, source: channel_types_1.UpdateSource.FROM_BUDGET_OVERVIEW });
        var newIsEditing = __spreadArray([], isEditing, true);
        newIsEditing[index] = false;
        setIsEditing(newIsEditing);
        setCloneState(__assign(__assign({}, cloneState), { breaks: cloneState.breaks.map(function (budgetBreak, i) { return (__assign(__assign({}, budgetBreak), { value: i === index ? value : budgetBreak.value })); }) }));
    };
    // All the code made for "SkinnyRight" is hacky, but that fine for this demo situation.
    function smoothScroll(element, target, duration) {
        var start = element.scrollLeft, change = target - start, startTime = performance.now(), val;
        function animateScroll(currentTime) {
            var elapsed = currentTime - startTime;
            val = Math.easeInOutQuad(elapsed, start, change, duration);
            element.scrollLeft = val;
            if (elapsed < duration) {
                window.requestAnimationFrame(animateScroll);
            }
        }
        ;
        Math.easeInOutQuad = function (t, b, c, d) {
            t /= d / 2;
            if (t < 1)
                return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        };
        window.requestAnimationFrame(animateScroll);
    }
    function scroll() {
        var table = tableRef.current;
        if (table) {
            if (arrowRightOrLeft === "right") {
                smoothScroll(table, table.scrollWidth - table.clientWidth, 500);
            }
            else {
                smoothScroll(table, 0, 500);
            }
        }
    }
    function onArrowClick() {
        setArrowRightOrLeft(arrowRightOrLeft === "right" ? "left" : "right");
        scroll();
    }
    return (<div className={"channel-item-table ".concat(arrowRightOrLeft)} ref={tableRef}>
            <symbols_1.ArrowSkinnyRight onClick={function () { return onArrowClick(); }}/>
            <div className="channel-item-table-breaks" ref={tableRef}>
                {state.breaks.map(function (budgetBreak, index) {
            return (<div key={index} className="channel-item-table-date">
                            <>{(0, moment_1.default)(budgetBreak.date).format("MMM D")}</>
                        </div>);
        })}
                {cloneState.breaks.map(function (budgetBreak, index) {
            var disabled = !isEditing[index];
            var inputProps = __assign(__assign({}, channel_constants_1.DEFAULT_CHANNEL_BREAK_INPUT_PROPS), { disabled: disabled, variant: "flat", onChange: function (event) {
                    !disabled && setBreakdown(index, event.target.value);
                }, endContent: (<span className="control-area">
                            <symbols_1.Pencil onClick={function () {
                        var newIsEditing = __spreadArray([], isEditing, true);
                        newIsEditing[index] = !isEditing[index];
                        setIsEditing(newIsEditing);
                    }}/>

                            <symbols_1.Save onClick={function () {
                        setBreakdown(index, cloneState.breaks[index].value, true);
                    }}/>

                            <symbols_1.Cancel onClick={function () {
                        setBreakdown(index, state.breaks[index].value, true);
                    }}/>

                        </span>), value: (0, utils_1.formatNumericStringToFraction)(budgetBreak.value) });
            return (<div key={index} className="channel-item-table-budget" data-disabled={disabled}>
                            <input_1.Input {...inputProps}/>
                        </div>);
        })}
            </div>
        </div>);
};
exports.ChannelItemTable = ChannelItemTable;
var $$ = (0, with_commands_1.withCommands)("App/ChannelItem", exports.ChannelItemTable, {
    frequency: "annually",
    baseline: "0",
    allocation: "equal",
    breaks: [],
}, [
    commands.SetBreakdown,
]);
exports.default = $$;

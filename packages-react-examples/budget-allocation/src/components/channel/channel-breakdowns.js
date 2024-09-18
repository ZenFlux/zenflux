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
exports.ChannelBreakdowns = void 0;
var react_1 = require("react");
var moment_1 = require("moment");
var input_1 = require("@nextui-org/input");
var use_commands_1 = require("@zenflux/react-commander/use-commands");
var channel_constants_tsx_1 = require("@zenflux/app-budget-allocation/src/components/channel/channel-constants.tsx");
var utils_1 = require("@zenflux/app-budget-allocation/src/utils");
var channel_types_1 = require("@zenflux/app-budget-allocation/src/components/channel/channel-types");
function generateBreaks(frequency, baseline) {
    var breaks = [];
    var baselineParsed = parseFloat(baseline.toString().replace(/,/g, ""));
    var fillValue;
    // noinspection FallThroughInSwitchStatementJS
    switch (frequency) {
        case "annually":
            // Per month.
            fillValue = baselineParsed / 12;
            break;
        case "monthly":
            // Same each month.
            fillValue = baselineParsed;
            break;
        case "quarterly":
            var perQuarter = baselineParsed / 4;
            for (var i = 0; i < 12; i++) {
                var date = (0, moment_1.default)().month(i).toDate();
                if (i % 3 === 0) {
                    breaks.push({
                        date: date,
                        value: perQuarter.toString(),
                    });
                    continue;
                }
                // No budget
                breaks.push({
                    date: date,
                    value: "0",
                });
            }
            break;
        default:
            throw new Error("Invalid frequency: ".concat(frequency));
    }
    if (!breaks.length) {
        for (var i = 0; i < 12; i++) {
            breaks.push({
                date: (0, moment_1.default)().month(i).toDate(),
                value: fillValue.toString(),
            });
        }
    }
    return breaks;
}
function getBreakElements(breaks, breaksElements, allocation, onInputChange) {
    if (!breaks.length) {
        throw new Error("Breaks state is empty");
    }
    var breakElements = [];
    var Break = function (props) {
        var label = props.label, index = props.index, formatted = (0, utils_1.formatNumericStringToFraction)(props.value);
        var disabled = allocation === "equal";
        var inputProps = __assign(__assign({}, channel_constants_tsx_1.DEFAULT_CHANNEL_BREAK_INPUT_PROPS), { label: label, disabled: disabled, value: formatted, onChange: function (e) { return !disabled && onInputChange(index, e.target.value); } });
        return (<div className="break" data-disabled={inputProps.disabled}>
                <input_1.Input {...inputProps}/>
            </div>);
    };
    function formatDate(date) {
        return (0, moment_1.default)(date).format("MMM D");
    }
    ;
    var index = 0;
    var isAllocationChanged = breaksElements === null || breaksElements === void 0 ? void 0 : breaksElements.some(function (element) { return element.props.allocation !== allocation; });
    for (var _i = 0, breaks_1 = breaks; _i < breaks_1.length; _i++) {
        var _a = breaks_1[_i], date = _a.date, value = _a.value;
        if (!isAllocationChanged && (breaksElements === null || breaksElements === void 0 ? void 0 : breaksElements[index])) {
            var existBreakElement = breaksElements === null || breaksElements === void 0 ? void 0 : breaksElements[index];
            // Update with pinceta
            if (existBreakElement.props.value.toString() !== value.toString()) {
                breakElements.push(react_1.default.cloneElement(existBreakElement, {
                    value: value.toString(),
                }));
                index++;
                continue;
            }
            breakElements.push(existBreakElement);
            index++;
            continue;
        }
        var props = {
            index: index,
            allocation: allocation,
            label: formatDate(date),
            value: value.toString(),
        };
        breakElements.push(<Break key={date.getTime()} {...props}/>);
        index++;
    }
    return breakElements;
}
var ChannelBreakdowns = function () {
    var commands = (0, use_commands_1.useCommanderComponent)("App/ChannelItem"), _a = (0, use_commands_1.useCommanderState)("App/ChannelItem"), getState = _a[0], setState = _a[1], isMounted = _a[2];
    var onceRef = react_1.default.useRef(false);
    var onBreakdownInputChange = function (index, value) {
        commands.run("App/ChannelItem/SetBreakdown", { index: index, value: value, source: channel_types_1.UpdateSource.FROM_BUDGET_BREAKS });
    };
    var state = getState();
    react_1.default.useEffect(function () {
        var _a;
        var stateChanged = false;
        var newState = __assign({}, getState());
        if (!((_a = newState.breaks) === null || _a === void 0 ? void 0 : _a.length)) {
            stateChanged = true;
            newState.breaks = generateBreaks(newState.frequency, newState.baseline);
        }
        if (stateChanged) {
            setState(newState);
        }
    }, [isMounted()]);
    react_1.default.useEffect(function () {
        var _a;
        if (!isMounted() && !onceRef.current) {
            return;
        }
        onceRef.current = true;
        var currentState = commands.getState();
        if ((_a = currentState.breaks) === null || _a === void 0 ? void 0 : _a.length) {
            var newBreaks = getBreakElements(currentState.breaks, currentState.breakElements || [], currentState.allocation, onBreakdownInputChange);
            if (newBreaks !== currentState.breakElements) {
                setState({
                    breakElements: newBreaks
                });
            }
        }
    }, [isMounted(), state.breaks]);
    var setBreakdownElements = function (breaks) {
        var currentState = commands.getState();
        var breakdownElements = getBreakElements(breaks, currentState.breakElements, currentState.allocation, onBreakdownInputChange);
        setState({
            breakElements: breakdownElements
        });
    };
    var setCurrentBreakdownsCallback = function (update) { return __awaiter(void 0, void 0, void 0, function () {
        var prevFrequency, prevBaseline, prevAllocation, updateFrom, currentState, breaks, isBudgetSettingsChanged;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prevFrequency = state.frequency, prevBaseline = state.baseline, prevAllocation = state.allocation;
                    return [4 /*yield*/, update];
                case 1:
                    updateFrom = _a.sent();
                    if (updateFrom) {
                        currentState = commands.getState();
                        breaks = currentState.breaks;
                        switch (updateFrom) {
                            case channel_types_1.UpdateSource.FROM_BUDGET_BREAKS:
                                setBreakdownElements(breaks);
                                break;
                            case channel_types_1.UpdateSource.FROM_BUDGET_SETTINGS:
                                isBudgetSettingsChanged = prevFrequency !== currentState.frequency ||
                                    prevAllocation !== currentState.allocation ||
                                    ("0" === currentState.baseline || prevBaseline !== currentState.baseline);
                                if (isBudgetSettingsChanged) {
                                    breaks = generateBreaks(currentState.frequency, currentState.baseline);
                                }
                                setBreakdownElements(breaks);
                                break;
                            // Mostly happens while hot-reloading.
                            default:
                                return [2 /*return*/];
                        }
                        setState({
                            breaks: breaks
                        });
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var setBreakdownSum = function () {
        // TODO: Should be using state, but im lazy.
        // Get all the values from the inputs.
        var values = Array.from(document.querySelectorAll(".break input"))
            .map(function (input) { return parseFloat(input.value.replace(/,/g, "")); });
        // Sum them up.
        var sum = (0, utils_1.formatNumericStringToFraction)(values
            .filter(function (value) { return !isNaN(value); })
            .reduce(function (a, b) { return a + b; }, 0)
            .toString());
        // Set the new baseline.
        setState({
            baseline: sum
        });
        // Update the breaks.
        setCurrentBreakdownsCallback(Promise.resolve(channel_types_1.UpdateSource.FROM_BUDGET_BREAKS));
    };
    react_1.default.useEffect(function () {
        commands.hook("App/ChannelItem/SetBaseline", setCurrentBreakdownsCallback);
        commands.hook("App/ChannelItem/SetFrequency", setCurrentBreakdownsCallback);
        commands.hook("App/ChannelItem/SetAllocation", setCurrentBreakdownsCallback);
        commands.hook("App/ChannelItem/SetBreakdown", setBreakdownSum);
        return function () {
            commands.unhook("App/ChannelItem/SetBaseline");
            commands.unhook("App/ChannelItem/SetFrequency");
            commands.unhook("App/ChannelItem/SetAllocation");
            commands.unhook("App/ChannelItem/SetBreakdown");
        };
    }, [commands]);
    return (<div className="content">
            {state.breakElements}
        </div>);
};
exports.ChannelBreakdowns = ChannelBreakdowns;

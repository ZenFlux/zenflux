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
exports.ChannelBudgetBaseline = void 0;
var react_1 = require("react");
var input_1 = require("@nextui-org/input");
var use_commands_1 = require("@zenflux/react-commander/use-commands");
var symbols_1 = require("@zenflux/react-ui/src/symbols");
var channel_types_1 = require("@zenflux/app-budget-allocation/src/components/channel/channel-types");
var channel_budget_frequency_1 = require("@zenflux/app-budget-allocation/src/components/channel/channel-budget-settings/channel-budget-frequency");
var DEFAULT_PROPS = {
    classNames: {
        base: "input",
        mainWrapper: "wrapper",
        inputWrapper: "trigger",
    },
    type: "string",
    variant: "bordered",
    radius: "none",
};
function ChannelBudgetBaseline(props) {
    var frequency = props.frequency, allocation = props.allocation, baseline = props.baseline;
    var command = (0, use_commands_1.useCommanderCommand)("App/ChannelItem/SetBaseline");
    var inputProps = __assign(__assign({}, DEFAULT_PROPS), { disabled: allocation === "manual", value: (baseline || 0).toString(), onChange: function (e) { return command.run({
            value: e.target.value,
            source: channel_types_1.UpdateSource.FROM_BUDGET_SETTINGS
        }); } });
    var frequencyLabel = inputProps.disabled ? "Manual" :
        (0, channel_budget_frequency_1.getChannelBudgetFrequencyLabel)(frequency);
    return (<div className="channel-budget-baseline" data-disabled={inputProps.disabled}>
            <symbols_1.Info>Baseline [{frequencyLabel}] Budget</symbols_1.Info>
            <input_1.Input aria-labelledby="baseline" {...inputProps}></input_1.Input>
        </div>);
}
exports.ChannelBudgetBaseline = ChannelBudgetBaseline;

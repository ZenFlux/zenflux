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
exports.ChannelBudgetFrequency = exports.getChannelBudgetFrequencyLabel = void 0;
var react_1 = require("react");
var select_1 = require("@nextui-org/select");
var use_commands_1 = require("@zenflux/react-commander/use-commands");
var symbols_1 = require("@zenflux/react-ui/src/symbols");
var channel_types_1 = require("@zenflux/app-budget-allocation/src/components/channel/channel-types");
var DEFAULT_FREQUENCIES = {
    annually: "Annually",
    monthly: "Monthly",
    quarterly: "Quarterly",
};
var DEFAULT_PROPS = {
    classNames: {
        base: "select",
        trigger: "trigger",
        mainWrapper: "wrapper",
        innerWrapper: "inner"
    },
    multiple: false,
    size: "sm",
    variant: "bordered",
    radius: "none",
    disallowEmptySelection: true,
    "aria-labelledby": "channel-budget-frequency-label",
};
function getChannelBudgetFrequencyLabel(frequency) {
    return DEFAULT_FREQUENCIES[frequency];
}
exports.getChannelBudgetFrequencyLabel = getChannelBudgetFrequencyLabel;
function ChannelBudgetFrequency(props) {
    var frequency = props.frequency;
    var command = (0, use_commands_1.useCommanderCommand)("App/ChannelItem/SetFrequency");
    var selectProps = __assign(__assign({}, DEFAULT_PROPS), { selectedKeys: [frequency], onChange: function (e) { return command.run({ value: e.target.value, source: channel_types_1.UpdateSource.FROM_BUDGET_SETTINGS }); } });
    return (<div className="channel-budget-frequency">
            <symbols_1.Info>Budget Frequency</symbols_1.Info>
            <select_1.Select {...selectProps}>
                {Object.keys(DEFAULT_FREQUENCIES).map(function (key) { return (<select_1.SelectItem key={key} value={key}>{getChannelBudgetFrequencyLabel(key)}</select_1.SelectItem>); })}
            </select_1.Select>
        </div>);
}
exports.ChannelBudgetFrequency = ChannelBudgetFrequency;
"use strict";
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
exports.ChannelBudgetAllocation = exports.ChannelBudgetAllocationButton = exports.getChannelBudgetAllocationLabel = void 0;
var react_1 = require("react");
var button_1 = require("@nextui-org/button");
var use_commands_1 = require("@zenflux/react-commander/use-commands");
var symbols_1 = require("@zenflux/react-ui/src/symbols");
var channel_types_1 = require("@zenflux/app-budget-allocation/src/components/channel/channel-types");
var DEFAULT_BUDGET_ALLOCATIONS = {
    "equal": "Equal",
    "manual": "Manual"
};
function getChannelBudgetAllocationLabel(budgetAllocation) {
    return DEFAULT_BUDGET_ALLOCATIONS[budgetAllocation];
}
exports.getChannelBudgetAllocationLabel = getChannelBudgetAllocationLabel;
var DEFAULT_PROPS = {
    className: "button",
    variant: "ghost",
    radius: "none"
};
function ChannelBudgetAllocationButton(props) {
    var current = props.current, allocation = props.allocation, buttonProps = __rest(props, ["current", "allocation"]);
    var command = (0, use_commands_1.useCommanderCommand)("App/ChannelItem/SetAllocation");
    return (<button_1.Button {...DEFAULT_PROPS} {...buttonProps} data-active={allocation === current} disabled={allocation === current} onClick={function () { return command.run({ value: current, source: channel_types_1.UpdateSource.FROM_BUDGET_SETTINGS }); }}>
            {getChannelBudgetAllocationLabel(current)}
        </button_1.Button>);
}
exports.ChannelBudgetAllocationButton = ChannelBudgetAllocationButton;
function ChannelBudgetAllocation(props) {
    return (<div className="channel-budget-allocation">
            <symbols_1.Info>Budget Allocation</symbols_1.Info>
            <button_1.ButtonGroup className="button-group">
                {Object.keys(DEFAULT_BUDGET_ALLOCATIONS).map(function (key) { return (<ChannelBudgetAllocationButton key={key} current={key} {...props}/>); })}
            </button_1.ButtonGroup>
        </div>);
}
exports.ChannelBudgetAllocation = ChannelBudgetAllocation;

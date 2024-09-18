"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelItemAccordion = void 0;
var react_1 = require("react");
var with_commands_1 = require("@zenflux/react-commander/with-commands");
var use_commands_1 = require("@zenflux/react-commander/use-commands");
require("@zenflux/app-budget-allocation/src/components/channel/_channel-item-accordion.scss");
var channel_budget_settings_1 = require("@zenflux/app-budget-allocation/src/components/channel/channel-budget-settings");
var channel_breakdowns_1 = require("@zenflux/app-budget-allocation/src/components/channel/channel-breakdowns");
var commands = require("@zenflux/app-budget-allocation/src/components/channel/commands");
var ChannelItemAccordion = function () {
    var getState = (0, use_commands_1.useCommanderState)("App/ChannelItem")[0];
    var _a = getState(), frequency = _a.frequency, baseline = _a.baseline, allocation = _a.allocation;
    return (<div className="channel-item-accordion">
            <div className="channel-budget-settings">
                <channel_budget_settings_1.ChannelBudgetFrequency frequency={frequency}/>
                <channel_budget_settings_1.ChannelBudgetBaseline frequency={frequency} baseline={baseline} allocation={allocation}/>
                <channel_budget_settings_1.ChannelBudgetAllocation allocation={allocation}/>
            </div>

            <div className="channel-budget-breakdowns">
                <div className="header">
                    <p className="fs-2">Budget Breakdown</p>
                    <p className="description">By default, your budget will be equally divided throughout the year. You
                        can manually change the budget allocation, either now or later.</p>

                    <channel_breakdowns_1.ChannelBreakdowns />
                </div>
            </div>
        </div>);
};
exports.ChannelItemAccordion = ChannelItemAccordion;
var $$ = (0, with_commands_1.withCommands)("App/ChannelItem", exports.ChannelItemAccordion, {
    frequency: "annually",
    baseline: "0",
    allocation: "equal",
}, [
    commands.SetAllocation,
    commands.SetBaseline,
    commands.SetBreakdown,
    commands.SetFrequency,
]);
exports.default = $$;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var src_1 = require("@zenflux/react-api/src");
var channels_list_1 = require("@zenflux/app-budget-allocation/src/components/channels/channels-list");
var channel_item_table_1 = require("@zenflux/app-budget-allocation/src/components/channel/channel-item-table");
var api_channels_module_1 = require("@zenflux/app-budget-allocation/src/api/api-channels-module");
function BudgetOverview() {
    return (<src_1.API.Component fallback={<div className="loading">Loading <span className="dots">◌</span></div>} module={api_channels_module_1.APIChannelsModule} type={channels_list_1.default} chainProps={{ view: "table" }}>
            <src_1.API.Component type={channel_item_table_1.default}/>
        </src_1.API.Component>);
}
exports.default = BudgetOverview;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelsListTable = void 0;
var react_1 = require("react");
var use_commands_1 = require("@zenflux/react-commander/use-commands");
var channel_item_table_tsx_1 = require("@zenflux/app-budget-allocation/src/components/channel/channel-item-table.tsx");
require("@zenflux/app-budget-allocation/src/components/channels/_channels-list-table.scss");
var ChannelsListTable = function () {
    var getChannelsListState = (0, use_commands_1.useCommanderState)("App/ChannelsList")[0];
    var channelsListState = getChannelsListState();
    var channelsRenderer = channelsListState.channels.filter(
    // @ts-ignore
    function (channel) { var _a; return ((_a = channel.props.breaks) === null || _a === void 0 ? void 0 : _a.length) > 0; });
    return (<div className="channel-list-table pt-[45px]">
            {0 === channelsRenderer.length && (<div className="channel-list-table-heading-text text-center">
                        There are {channelsListState.channels.length} channels, but none of them have any budget allocation.
                    </div>) ||
            channelsRenderer.map(function (channel, index) {
                return (<div key={index} className="channel-list-table-row">
                            <div className="channel-list-table-heading">
                                <div className="channel-list-table-heading-text">
                                    Channel #{index + 1}
                                </div>

                                <div className="channel-list-table-heading-title">
                                    <img src={channel.props.meta.icon} alt={channel.props.meta.name}/>
                                    <span>{channel.props.meta.name}</span>
                                </div>
                            </div>
                            <div className="channel-list-table-separator"/>

                            <channel_item_table_tsx_1.default {...channel.props} key={channel.props.meta.id}/>
                        </div>);
            })}
        </div>);
};
exports.ChannelsListTable = ChannelsListTable;
exports.default = exports.ChannelsListTable;

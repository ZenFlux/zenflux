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
exports.ChannelsListAccordion = exports.toAccordionItem = void 0;
var react_1 = require("react");
var use_commands_1 = require("@zenflux/react-commander/use-commands");
var channels_list_accordion_interactions_1 = require("@zenflux/app-budget-allocation/src/components/channels/channels-list-accordion-interactions");
var accordion_1 = require("@zenflux/app-budget-allocation/src/ui-command-able/accordion/accordion");
var accordion_item_1 = require("@zenflux/app-budget-allocation/src/ui-command-able/accordion/accordion-item");
var channel_item_accordion_1 = require("@zenflux/app-budget-allocation/src/components/channel/channel-item-accordion");
function toAccordionItem(channel, channelsCommands, index) {
    // Omit `collapsedState` and `setCollapsedState` those are extended by `renderExtendAccordionItem`
    var accordionProps = {
        itemKey: channel.props.meta.id,
        onRender: channel.props.onRender,
        children: <channel_item_accordion_1.default {...channel.props} key={channel.props.meta.id}/>,
        heading: {
            title: channel.props.meta.name,
            icon: channel.props.meta.icon,
        },
        menu: {
            edit: {
                label: "Edit",
                action: function () { return channelsCommands.run("App/ChannelsList/EditRequest", { channel: channel, }); },
            },
            remove: {
                label: "Remove",
                color: "danger",
                action: function () { return channelsCommands.run("App/ChannelsList/RemoveRequest", { channel: channel, }); },
            },
        },
    };
    var children = accordionProps.children, withoutChildren = __rest(accordionProps, ["children"]);
    return <accordion_item_1.default children={children} {...withoutChildren} key={"channel-" + channel.props.meta.id + "-accordion-item-" + index.toString()}/>;
}
exports.toAccordionItem = toAccordionItem;
var ChannelsListAccordion = function () {
    var _a = (0, use_commands_1.useCommanderState)("App/ChannelsList"), getChannelsListState = _a[0], setChannelsListState = _a[1];
    var channelsCommands = (0, use_commands_1.useCommanderComponent)("App/ChannelsList");
    var channelsListState = getChannelsListState();
    var setSelected = function (selected) {
        setChannelsListState({ selected: selected });
    };
    (0, channels_list_accordion_interactions_1.channelsListAccordionInteractions)();
    return (<accordion_1.default selected={channelsListState.selected} setSelected={setSelected}>
            {channelsListState.channels.map(function (i, index) { return toAccordionItem(i, channelsCommands, index); })}
        </accordion_1.default>);
};
exports.ChannelsListAccordion = ChannelsListAccordion;
exports.default = exports.ChannelsListAccordion;

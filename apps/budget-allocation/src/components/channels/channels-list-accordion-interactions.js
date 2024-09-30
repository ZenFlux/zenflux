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
exports.channelsListAccordionInteractions = void 0;
var events_1 = require("events");
var react_1 = require("react");
var commands_manager_1 = require("@zenflux/react-commander/commands-manager");
var use_commands_1 = require("@zenflux/react-commander/use-commands");
var channel_item_accordion_tsx_1 = require("@zenflux/app-budget-allocation/src/components//channel/channel-item-accordion.tsx");
var scheduler = new events_1.default();
// On channel list, request edit title name
function onEditRequest(channel, setSelected, channelsCommands, accordionItemCommands) {
    var _a;
    // Select the channel (trigger accordion item selection)
    setSelected((_a = {}, _a[channel.props.meta.id] = true, _a));
    var correspondingCommand = accordionItemCommands.find(function (command) {
        return command.getInternalContext().props.itemKey === channel.props.meta.id;
    });
    var tryToEnableEdit = function (correspondingCommand) {
        // Try tell accordion to enter edit mode
        correspondingCommand === null || correspondingCommand === void 0 ? void 0 : correspondingCommand.run("UI/AccordionItem/EditableTitle", { state: true });
        return correspondingCommand;
    };
    if (tryToEnableEdit(correspondingCommand))
        return;
    scheduler.once("enable-editable-title-".concat(channel.props.meta.id), tryToEnableEdit);
}
function onRemoveRequest(channel, getChannelsListState, setChannelsListState) {
    var newList = getChannelsListState().channels.filter(function (c) { return c.props.meta.id !== channel.props.meta.id; });
    // Remove the channel from the list
    setChannelsListState(__assign(__assign({}, getChannelsListState()), { channels: newList }));
}
function onAddRequest(getChannelsListState, setChannelsListState, channelsCommands) {
    var id = "channel-".concat(Math.random().toString(16).slice(2));
    // Create a new channel object
    var newChannelProps = {
        meta: {
            id: id,
            name: "New Channel #" + (getChannelsListState().channels.length + 1),
            icon: "https://api.dicebear.com/7.x/icons/svg?seed=".concat(performance.now()),
            createdAt: new Date().getTime(),
        },
        onRender: function () { return channelsCommands.run("App/ChannelsList/EditRequest", { channel: newChannelComponent }); },
    };
    // Create a new ChannelItem component with the new channel object as props
    var newChannelComponent = <channel_item_accordion_tsx_1.default {...newChannelProps} key={newChannelProps.meta.id}/>;
    var currentState = getChannelsListState();
    // Add the new ChannelItem component to the channelsState array
    setChannelsListState(__assign(__assign({}, currentState), { channels: __spreadArray(__spreadArray([], currentState.channels, true), [newChannelComponent], false) }));
}
function channelsListAccordionInteractions() {
    var _a = (0, use_commands_1.useCommanderState)("App/ChannelsList"), getChannelsListState = _a[0], setChannelsListState = _a[1], isMounted = _a[2];
    var setSelected = function (selected) { return setChannelsListState({ selected: selected }); };
    var channelsCommands = (0, use_commands_1.useCommanderComponent)("App/ChannelsList");
    (0, use_commands_1.useCommanderChildrenComponents)("UI/AccordionItem", function (accordionItemCommands) {
        if (!accordionItemCommands.length)
            return;
        // Hook on title changed, run command within the channel list, to inform about the change
        accordionItemCommands.forEach(function (command) {
            if (!command.isAlive())
                return;
            command.hook("UI/AccordionItem/OnTitleChanged", function (result, args) {
                channelsCommands.run("App/ChannelsList/SetName", {
                    id: args.itemKey,
                    name: args.title,
                });
            });
            // This will ensure that the accordion item will enter edit mode, if the channel list requested it
            var key = "enable-editable-title-".concat(command.getInternalContext().props.itemKey);
            if (scheduler.eventNames().includes(key)) {
                scheduler.emit(key, command);
                scheduler.removeAllListeners(key);
            }
        });
        channelsCommands.hook("App/ChannelsList/EditRequest", function (r, args) {
            return onEditRequest(args.channel, setSelected, channelsCommands, accordionItemCommands);
        });
        channelsCommands.hook("App/ChannelsList/RemoveRequest", function (r, args) {
            return onRemoveRequest(args.channel, getChannelsListState, setChannelsListState);
        });
        return function () {
            accordionItemCommands.forEach(function (command) {
                command.unhook("UI/AccordionItem/OnTitleChanged");
            });
            commands_manager_1.default.unhookWithinComponent(channelsCommands.getId());
        };
    });
    react_1.default.useEffect(function () {
        var addChannelCommands = (0, use_commands_1.useAnyComponentCommands)("App/AddChannel");
        var addChannelCommandId = {
            commandName: "App/AddChannel",
            componentName: "App/AddChannel",
            componentNameUnique: addChannelCommands[0].componentNameUnique,
        };
        commands_manager_1.default.hook(addChannelCommandId, function () {
            return onAddRequest(getChannelsListState, setChannelsListState, channelsCommands);
        });
        return function () {
            commands_manager_1.default.unhookWithinComponent(addChannelCommandId.componentNameUnique);
        };
    }, [isMounted()]);
}
exports.channelsListAccordionInteractions = channelsListAccordionInteractions;

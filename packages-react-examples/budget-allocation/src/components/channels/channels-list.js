"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.ChannelsList = void 0;
var react_1 = require("react");
var command_base_1 = require("@zenflux/react-commander/command-base");
var with_commands_1 = require("@zenflux/react-commander/with-commands");
var channel_constants_1 = require("@zenflux/app-budget-allocation/src/components/channel/channel-constants");
var utils_1 = require("@zenflux/app-budget-allocation/src/utils");
var AccordionChannelsList = react_1.default.lazy(function () { return Promise.resolve().then(function () { return require("@zenflux/app-budget-allocation/src/components/channels/channels-list-accordion"); }); });
var TableChannelsList = react_1.default.lazy(function () { return Promise.resolve().then(function () { return require("@zenflux/app-budget-allocation/src/components/channels/channels-list-table"); }); });
var ChannelsList = function (props, state) {
    var channels = Array.isArray(props.children) ? props.children : [props.children];
    state.channels = channels.map(function (channel) {
        return __assign(__assign({}, channel), { 
            // Exposing meta, for commands to use
            meta: (0, utils_1.pickEnforcedKeys)(channel.props.meta, channel_constants_1.META_DATA_KEYS) });
    });
    switch (props.view) {
        case "accordion":
            return <AccordionChannelsList />;
        case "table":
            return <TableChannelsList />;
        default:
            throw new Error("Unknown view: ".concat(props.view));
    }
};
exports.ChannelsList = ChannelsList;
var $$ = (0, with_commands_1.withCommands)("App/ChannelsList", exports.ChannelsList, {
    channels: [],
    selected: {},
}, [
    /** @class */ (function (_super) {
        __extends(EditRequest, _super);
        function EditRequest() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        EditRequest.getName = function () {
            return "App/ChannelsList/EditRequest";
        };
        return EditRequest;
    }(command_base_1.CommandBase)),
    /** @class */ (function (_super) {
        __extends(Remove, _super);
        function Remove() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        Remove.getName = function () {
            return "App/ChannelsList/RemoveRequest";
        };
        return Remove;
    }(command_base_1.CommandBase)),
    /** @class */ (function (_super) {
        __extends(SetName, _super);
        function SetName() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SetName.getName = function () {
            return "App/ChannelsList/SetName";
        };
        SetName.prototype.apply = function (args) {
            var channels = __spreadArray([], this.state.channels, true); // Create a copy of the channels array
            var channelIndex = channels.findIndex(function (c) { return c.props.meta.id === args.id; });
            if (channelIndex !== -1) {
                // Create a new channel object with the updated data & replace it in the channels array
                channels[channelIndex] = __assign(__assign({}, channels[channelIndex]), { props: {
                        meta: __assign(__assign({}, channels[channelIndex].props.meta), { name: args.name }),
                        onRender: function () { },
                    } });
                return this.setState({ channels: channels });
            }
        };
        return SetName;
    }(command_base_1.CommandBase))
]);
exports.default = $$;

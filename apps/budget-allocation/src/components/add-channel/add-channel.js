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
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var button_1 = require("@nextui-org/button");
var with_commands_1 = require("@zenflux/react-commander/with-commands");
var use_commands_1 = require("@zenflux/react-commander/use-commands");
var command_base_1 = require("@zenflux/react-commander/command-base");
var symbols_1 = require("@zenflux/react-ui/src/symbols");
var AddChannel = function () {
    var command = (0, use_commands_1.useCommanderCommand)("App/AddChannel");
    return (<div>
            <button_1.Button onClick={function () { return command.run({}); }} className="add-channel" variant="bordered" radius={"none"}>{symbols_1.Plus} Add Channel</button_1.Button>
        </div>);
};
var $$ = (0, with_commands_1.withCommands)("App/AddChannel", AddChannel, [
    /** @class */ (function (_super) {
        __extends(AddChannel, _super);
        function AddChannel() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        AddChannel.getName = function () {
            return "App/AddChannel";
        };
        return AddChannel;
    }(command_base_1.CommandBase))
]);
exports.default = $$;

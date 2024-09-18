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
exports.ConsoleMenuHotkey = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var console_menu_1 = require("@zenflux/cli/src/modules/console/console-menu");
var ConsoleMenuHotkey = /** @class */ (function (_super) {
    __extends(ConsoleMenuHotkey, _super);
    function ConsoleMenuHotkey(items) {
        var _this = _super.call(this, items) || this;
        _this.items = items;
        return _this;
    }
    ConsoleMenuHotkey.prototype.getSelection = function (key) {
        var indexOf = key.str ?
            this.items.findIndex(function (item) { return item.hotkey === key.str; }) : -1;
        if (indexOf === -1) {
            return _super.prototype.getSelection.call(this, key);
        }
        return { index: indexOf, item: this.items[indexOf] };
    };
    ConsoleMenuHotkey.prototype.getItemDisplay = function (item) {
        var label = "".concat(item.hotkey, ": ").concat(item.title);
        return this.selected.item === item ?
            "".concat(ConsoleMenuHotkey.DEFAULT_SELECT_CURSOR).concat(label) :
            "   ".concat(label);
    };
    return ConsoleMenuHotkey;
}(console_menu_1.ConsoleMenu));
exports.ConsoleMenuHotkey = ConsoleMenuHotkey;

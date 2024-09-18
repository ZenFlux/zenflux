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
exports.ConsoleMenuCheckbox = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var console_menu_1 = require("@zenflux/cli/src/modules/console/console-menu");
var ConsoleMenuCheckbox = /** @class */ (function (_super) {
    __extends(ConsoleMenuCheckbox, _super);
    function ConsoleMenuCheckbox(items, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, items) || this;
        _this.items = items;
        _this.options = options;
        _this.checked = [];
        // Set selected items as checked
        _this.checked = items.filter(function (item) { return item.checked; });
        if (undefined === options.helpMessage) {
            options.helpMessage = "Press <space> to toggle selection, <enter> to confirm.";
        }
        if (options.headMessage) {
            _this.items.unshift({ separator: true });
            _this.items.unshift({ title: options.headMessage, disabled: true });
        }
        _this.items.push({ separator: true });
        _this.items.push({ title: options.helpMessage, disabled: true });
        _this.addCustomKeyHandler(function (key) {
            if (key.name === "space") {
                _this.toggleChecked(_this.selected);
                return true;
            }
            return false;
        });
        return _this;
    }
    ConsoleMenuCheckbox.prototype.toggleChecked = function (selected) {
        var item = selected.item;
        if (this.checked.includes(item)) {
            this.checked.splice(this.checked.indexOf(item), 1);
        }
        else {
            this.checked.push(item);
        }
    };
    ConsoleMenuCheckbox.prototype.getItemDisplay = function (item) {
        var checked = this.checked.includes(item) ? "[✓]" : "[ ]";
        return this.selected.item === item ?
            "".concat(ConsoleMenuCheckbox.DEFAULT_SELECT_CURSOR).concat(checked, " ").concat(item.title) :
            "   ".concat(checked, " ").concat(item.title);
    };
    ConsoleMenuCheckbox.prototype.getSelection = function (key) {
        if (_super.prototype.getSelection.call(this, key)) {
            return this.checked;
        }
    };
    return ConsoleMenuCheckbox;
}(console_menu_1.ConsoleMenu));
exports.ConsoleMenuCheckbox = ConsoleMenuCheckbox;

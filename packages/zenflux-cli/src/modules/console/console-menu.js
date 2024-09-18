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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleMenu = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var process_1 = require("process");
var os_1 = require("os");
var readline_1 = require("readline");
var ConsoleMenu = /** @class */ (function () {
    function ConsoleMenu(items) {
        this.items = items;
        this.bindHandleKeyPress = this.handleKeyPress.bind(this);
        this.customKeyHandlers = [];
        this.selected = {
            index: -1,
            item: undefined,
        };
        this.selected = this.findInitialSelection();
        this.scrollOffset = 0;
    }
    ConsoleMenu.prototype.initialize = function () {
        readline_1.default.emitKeypressEvents(process_1.default.stdin);
        process_1.default.stdin.setRawMode(true);
        process_1.default.stdin.on("keypress", this.bindHandleKeyPress);
        // Hides cursor
        process_1.default.stdout.write("\u001B[?25l");
        process_1.default.stdin.resume();
        this.printMenu();
    };
    ConsoleMenu.prototype.handleKeyPress = function (str, key) {
        var efficientKey = __assign({ str: str }, key);
        if (this.customKeyHandlers.some(function (handler) { return handler(efficientKey); })) {
            return this.updateSelected(this.selected.index);
        }
        var selectedOption = this.getSelection(efficientKey);
        if (selectedOption || key.name === "escape" || (key.name === "c" && key.ctrl)) {
            return this.cleanup(selectedOption);
        }
        this.handleNavigation(efficientKey);
    };
    ConsoleMenu.prototype.handleNavigationKeyPress = function (_a) {
        var name = _a.name;
        var selectedIndex = this.selected.index;
        if (name === "up" && selectedIndex > 0) {
            return this.findPreviousValidIndex(selectedIndex);
        }
        else if (name === "down" && selectedIndex < this.items.length - 1) {
            return this.findNextValidIndex(selectedIndex);
        }
        return null;
    };
    ConsoleMenu.prototype.handleNavigation = function (key) {
        var newIndex = this.handleNavigationKeyPress(key);
        if (newIndex !== null) {
            this.updateSelected(newIndex);
        }
    };
    ConsoleMenu.prototype.updateSelected = function (selectedIndex) {
        this.resetCursor();
        this.selected = {
            index: selectedIndex,
            item: this.items[selectedIndex],
        };
        if (selectedIndex < this.scrollOffset) {
            this.scrollOffset = selectedIndex;
        }
        this.printMenu();
    };
    ConsoleMenu.prototype.printMenu = function () {
        for (var i = this.scrollOffset; i < this.calculateScrollEnd(); i++) {
            this.printMenuItem(this.items[i]);
        }
        this.moveCursor(this.calculateCursorPosition());
    };
    ConsoleMenu.prototype.printMenuItem = function (item) {
        if (item.disabled) {
            process_1.default.stdout.write("   ".concat(item.title));
        }
        else if (!item.separator) {
            process_1.default.stdout.write(this.getItemDisplay(item));
        }
        process_1.default.stdout.write(os_1.default.EOL);
    };
    ConsoleMenu.prototype.calculateScrollEnd = function () {
        return this.scrollOffset ? Math.min(this.items.length, this.scrollOffset) : this.items.length;
    };
    ConsoleMenu.prototype.calculateCursorPosition = function () {
        return -(this.calculateScrollEnd() - this.scrollOffset) + this.selected.index - this.scrollOffset;
    };
    ConsoleMenu.prototype.moveCursor = function (position) {
        readline_1.default.moveCursor(process_1.default.stdout, 0, position);
    };
    ConsoleMenu.prototype.resetCursor = function () {
        this.moveCursor(-this.selected.index + this.scrollOffset);
    };
    ConsoleMenu.prototype.findInitialSelection = function () {
        var _a, _b;
        var initialSelectedIndex = this.items.findIndex(function (item) { return item.selected; });
        if (initialSelectedIndex === -1) {
            initialSelectedIndex = (_a = this.findNextValidIndex(-1)) !== null && _a !== void 0 ? _a : 0;
        }
        return {
            index: initialSelectedIndex,
            item: (_b = this.items[initialSelectedIndex]) !== null && _b !== void 0 ? _b : undefined,
        };
    };
    ConsoleMenu.prototype.findNextValidIndex = function (startIndex) {
        return this.findValidIndex(startIndex, 1);
    };
    ConsoleMenu.prototype.findPreviousValidIndex = function (startIndex) {
        return this.findValidIndex(startIndex, -1);
    };
    ConsoleMenu.prototype.findValidIndex = function (startIndex, step) {
        for (var i = startIndex + step; i >= 0 && i < this.items.length; i += step) {
            if (!this.items[i].separator && !this.items[i].disabled) {
                return i;
            }
        }
        return null;
    };
    ConsoleMenu.prototype.addCustomKeyHandler = function (handler) {
        this.customKeyHandlers.push(handler);
    };
    ConsoleMenu.prototype.cleanup = function (selection) {
        process_1.default.stdin.removeListener("keypress", this.bindHandleKeyPress);
        process_1.default.stdin.setRawMode(false);
        this.resetCursor();
        readline_1.default.clearScreenDown(process_1.default.stdout);
        process_1.default.stdin.pause();
        this.resolve(selection);
    };
    ConsoleMenu.prototype.getItemDisplay = function (item) {
        return this.selected.item === item ?
            "".concat(ConsoleMenu.DEFAULT_SELECT_CURSOR).concat(item.title) :
            "   ".concat(item.title);
    };
    ConsoleMenu.prototype.getSelection = function (_a) {
        var name = _a.name;
        if (name === "return") {
            return __assign(__assign({}, this.items[this.selected.index]), { index: this.selected.index });
        }
        return undefined;
    };
    ConsoleMenu.prototype.start = function () {
        var _this = this;
        this.initialize();
        return new Promise(function (resolve) {
            _this.resolve = resolve;
        });
    };
    ConsoleMenu.DEFAULT_SELECT_CURSOR = "\x1b[1m⟶  \x1b[0m";
    return ConsoleMenu;
}());
exports.ConsoleMenu = ConsoleMenu;

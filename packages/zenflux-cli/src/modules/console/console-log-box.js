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
exports.zConsoleRender = exports.zConsoleCreateLogBox = exports.zConsoleCreateStickyBox = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var node_process_1 = require("node:process");
var blessed_1 = require("blessed");
var DEFAULT_TAB_WIDTH = 4;
var screen, container, allLogs = [], allStickyBoxes = [];
var autoScrollTimeout, resizeTimeout;
// Assuming 'allLogs' is an array of strings where each string is a log entry
var maxColWidths = [], realLogLines = [];
// TODO To copy text hold FN or press shift depending on the terminal emulator
// Fix issue with resize for terminal emulators like jetbrains uses
function zConsoleHandleResize() {
    container.width = screen.width;
    container.height = screen.height;
    var children = screen.children.slice(0);
    children.forEach(function (child) {
        screen.remove(child);
    });
    // Append all the elements back
    children.forEach(function (child) {
        screen.append(child);
    });
    screen.render();
}
function zConsoleOnResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(zConsoleHandleResize, 800);
}
function zConsoleNormalizeLogBox(log) {
    var logIndex = allLogs.indexOf(log);
    if (!maxColWidths[logIndex]) {
        maxColWidths[logIndex] = [];
    }
    if (!realLogLines[logIndex]) {
        realLogLines[logIndex] = [];
    }
    var content = log.getContent();
    if (!content) {
        return;
    }
    var lines = content.split("\n");
    if (!lines.length) {
        return;
    }
    // Calculate max column widths and real log lines in a separate pass
    lines.forEach(function (line, position) {
        if (!realLogLines[logIndex][position]) {
            realLogLines[logIndex][position] = line;
        }
        // Split the log into columns
        var cols = realLogLines[logIndex][position].split("{tab}");
        if (cols.length <= 1) {
            return;
        }
        // Update the maximum width for each column
        cols.forEach(function (col, i) {
            if (col.includes("{colspan}")) {
                return;
            }
            var colWidth = col.length;
            // If this is a new column, add it to 'maxColWidths'
            if (maxColWidths[logIndex].length <= i) {
                maxColWidths[logIndex].push(colWidth);
            }
            // Otherwise, update the maximum width if necessary
            else if (colWidth > maxColWidths[logIndex][i]) {
                maxColWidths[logIndex][i] = colWidth;
            }
        });
    });
    // Format the log entries
    var newContent = lines.map(function (line, position) {
        // Split the log into columns
        var cols = realLogLines[logIndex][position].split("{tab}");
        if (cols.length <= 1) {
            return line;
        }
        // Adjust the padding for each column
        var paddedCols = cols.map(function (col, i) {
            return col.padEnd(maxColWidths[logIndex][i] + DEFAULT_TAB_WIDTH);
        });
        // Replace {colspan} with empty string
        paddedCols = paddedCols.map(function (col) {
            return col.replace("{colspan}", "");
        });
        // Join the columns back together and print the result
        return paddedCols.join("");
    });
    log.content = newContent.join("\n");
}
function zConsoleEnsureScreen() {
    if (!screen) {
        screen = blessed_1.default.screen({
            smartCSR: true,
            fullUnicode: true,
            dockBorders: true,
            ignoreDockContrast: true,
            resizeTimeout: 800,
        });
        container = blessed_1.default.box({
            left: 0,
            top: 0,
            width: screen.width,
            height: screen.height,
        });
        screen.on("resize", zConsoleOnResize);
        // Quit on Escape, q, or Control-C.
        screen.key(["escape", "q", "C-c"], function () {
            return node_process_1.default.exit(0);
        });
        screen.on("prerender", function () { return allLogs.forEach(zConsoleNormalizeLogBox); });
    }
}
function zConsoleCreateStickyBox(label, position) {
    zConsoleEnsureScreen();
    var options = {};
    if (position === "top") {
        options.top = 0;
    }
    else if (position === "bottom") {
        options.bottom = 1;
    }
    var box = blessed_1.default.box(__assign(__assign({}, options), { label: label, width: "shrink", height: "shrink", right: 0, border: {
            type: "line",
        } }));
    allStickyBoxes.push(box);
    return box;
}
exports.zConsoleCreateStickyBox = zConsoleCreateStickyBox;
function zConsoleCreateLogBox(label) {
    zConsoleEnsureScreen();
    var box = blessed_1.default.box({
        // mouse: false,
        label: label,
        // top: `${boxTopPercent}%`,
        left: "0%",
        // height: `${boxHeightPercent}%`,
        width: "100%",
        border: {
            type: "line",
        },
    });
    var log = blessed_1.default.log({
        left: "0%",
        width: "100%-".concat(2),
        height: "100%-".concat(2),
        tags: true,
        style: {
            fg: "white",
        },
        scrollable: true,
        alwaysScroll: false,
        scrollOnInput: false,
        scrollbar: {
            ch: " ",
            style: {
                inverse: true,
            }
        },
        mouse: true,
    });
    log.on("element mouseover", function () {
        // Change box label color to red
        box.style.border.fg = "green";
        screen.render();
    });
    log.on("element mouseout", function () {
        // Change box label color to white
        box.style.border.fg = "white";
        screen.render();
    });
    box.append(log);
    allLogs.push(log);
    return log;
}
exports.zConsoleCreateLogBox = zConsoleCreateLogBox;
function zConsoleRender(logs, options) {
    if (logs === void 0) { logs = allLogs; }
    if (options === void 0) { options = {
        autoScrollPauseInterval: 1000,
    }; }
    zConsoleEnsureScreen();
    function zConsoleEnableAutoScroll(log) {
        clearTimeout(autoScrollTimeout);
        autoScrollTimeout = setTimeout(function () {
            // @ts-ignore - Internal property
            log._userScrolled = false;
        }, options.autoScrollPauseInterval);
    }
    function zConsoleHandleWheelEvent(log, add) {
        return function () {
            // @ts-ignore - Internal property
            log._userScrolled = true;
            var scroll = log.getScroll(), amount = add ? 1 : -1, newScroll = scroll + amount;
            if (newScroll >= 0 && newScroll <= log.getScrollHeight() - Number(log.height)) {
                log.setScroll(newScroll);
            }
            screen.render();
            zConsoleEnableAutoScroll(log);
        };
    }
    logs.forEach(function (log) {
        log.on("wheelup", zConsoleHandleWheelEvent(log, false));
        log.on("wheeldown", zConsoleHandleWheelEvent(log, true));
        // Change log height and top position to fit the screen
        var box = log.parent;
        box.height = "".concat(100 / logs.length, "%");
        box.top = "".concat((100 / logs.length) * logs.indexOf(log), "%");
        container.append(log.parent);
    });
    allStickyBoxes.forEach(function (box) {
        container.append(box);
    });
    screen.append(container);
    setTimeout(function () {
        // Render the screen.
        screen.render();
    }, 2000);
}
exports.zConsoleRender = zConsoleRender;

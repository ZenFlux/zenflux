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
exports.tsDeclarationConsole = exports.tsDiagnosticConsole = exports.rollupConsole = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var worker_1 = require("@zenflux/worker");
var console_thread_format_1 = require("@zenflux/cli/src/console/console-thread-format");
var console_1 = require("@zenflux/cli/src/modules/console");
var common_1 = require("@zenflux/cli/src/utils/common");
var timers_1 = require("@zenflux/cli/src/utils/timers");
var LogWidgetRollup = (0, console_1.zConsoleCreateLogBox)("Rollup Build"), logWidgetTypescript = (0, console_1.zConsoleCreateLogBox)("TypeScript Diagnostic & Declaration"), logWidgetDebug = console_thread_format_1.ConsoleThreadFormat.isFlagEnabled("debug") ? (0, console_1.zConsoleCreateLogBox)("Debug") : null, logThreadsCountBox = (0, console_1.zConsoleCreateStickyBox)("Threads Count", "top");
var logWidgetDebugBuffer = [];
var LOG_MAX_BUFFER_SIZE = 100, LOG_DEBUG_DEBOUNCE_DELAY = 500;
var SimpleOutputStrategy = /** @class */ (function () {
    function SimpleOutputStrategy(base) {
        this.$ = base;
    }
    SimpleOutputStrategy.prototype.output = function (method, args) {
        this.$.getLogWidget().log(args.join(" "));
    };
    return SimpleOutputStrategy;
}());
/**
 * `DebugOutputStrategy` is a strategy for outputting log messages.
 * It has a special handling for debug messages: they are buffered and logged in a batch.
 * This is done to prevent too many logs appearing at once.
 * The buffer is flushed either when it reaches a certain size (LOG_MAX_BUFFER_SIZE)
 * or after a certain delay (LOG_DEBUG_DEBOUNCE_DELAY), whichever comes first.
 * This strategy is used when the debug flag is enabled.
 */
var DebugOutputStrategy = /** @class */ (function () {
    function DebugOutputStrategy(base) {
        this.$ = base;
    }
    DebugOutputStrategy.prototype.output = function (method, args) {
        if (method.name === this.$.debug.name) {
            logWidgetDebugBuffer.push(args.join(" "));
            return this.addDebouncedLog();
        }
        this.$.getLogWidget().log(args.join(" "));
    };
    DebugOutputStrategy.prototype.addDebouncedLog = function () {
        var _this = this;
        // Use debounce to prevent too many logs.
        if (logWidgetDebugBuffer.length > LOG_MAX_BUFFER_SIZE) {
            this.createLogAndClearBuffer();
        }
        (0, timers_1.zDebounce)("console-".concat(this.$.getName(), "-debug-buffer"), function () {
            if (logWidgetDebugBuffer.length) {
                _this.createLogAndClearBuffer();
            }
        }, LOG_DEBUG_DEBOUNCE_DELAY);
    };
    DebugOutputStrategy.prototype.createLogAndClearBuffer = function () {
        logWidgetDebug.log(logWidgetDebugBuffer.join("\n"));
        logWidgetDebugBuffer.length = 0;
    };
    return DebugOutputStrategy;
}());
var ConsoleWatchBase = /** @class */ (function (_super) {
    __extends(ConsoleWatchBase, _super);
    function ConsoleWatchBase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ConsoleWatchBase.prototype.getThreadId = function () {
        return "M";
    };
    ConsoleWatchBase.prototype.getPrefix = function () {
        return "Thread {blue-fg}".concat(this.getThreadCode(), "-").concat(this.getThreadId().toString(), "{/}{tab}");
    };
    ConsoleWatchBase.prototype.initialize = function () {
        this.outputStrategy = console_thread_format_1.ConsoleThreadFormat.isFlagEnabled("debug") ?
            new DebugOutputStrategy(this) :
            new SimpleOutputStrategy(this);
        _super.prototype.initialize.call(this);
    };
    ConsoleWatchBase.prototype.getFormat = function (method, args) {
        var prefix = args[0], name = args[1], action = args[2], argsLeft = args.slice(3);
        return prefix +
            "{red-fg}".concat((0, common_1.zUppercaseAt)(name), "{/}{tab}") +
            "{yellow-fg}".concat((0, common_1.zUppercaseAt)(action), "{/}{tab}") +
            argsLeft.join(" ");
    };
    ConsoleWatchBase.prototype.getFormatExtended = function (method, args) {
        var prefix = args[0], action = args[1], argsLeft = args.slice(3);
        var context = args[2];
        if (method === this.verbose || method === this.debug) {
            context += "()";
        }
        else {
            context = (0, common_1.zUppercaseAt)(context);
        }
        return prefix +
            "{red-fg}".concat((0, common_1.zUppercaseAt)(action), "{/}{tab}") +
            "-> ".concat(method.name.charAt(0).toUpperCase() + method.name.slice(1), " ->{tab}") +
            "{yellow-fg}".concat(context, "{/}{tab}") +
            argsLeft.join(" ");
    };
    ConsoleWatchBase.prototype.output = function (method, args, prepareFormat) {
        if (prepareFormat === void 0) { prepareFormat = this.prepareFormat.bind(this); }
        args = prepareFormat(args, method);
        this.outputStrategy.output(method, args);
    };
    return ConsoleWatchBase;
}(console_thread_format_1.ConsoleThreadFormat));
var RollupConsole = /** @class */ (function (_super) {
    __extends(RollupConsole, _super);
    function RollupConsole() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RollupConsole.prototype.getName = function () {
        return "Rollup";
    };
    RollupConsole.prototype.getThreadCode = function () {
        return "RO";
    };
    RollupConsole.prototype.getLogWidget = function () {
        return LogWidgetRollup;
    };
    return RollupConsole;
}(ConsoleWatchBase));
var TypescriptConsoleBase = /** @class */ (function (_super) {
    __extends(TypescriptConsoleBase, _super);
    function TypescriptConsoleBase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TypescriptConsoleBase.prototype.getName = function () {
        return "Typescript";
    };
    TypescriptConsoleBase.prototype.getArgs = function (method, args) {
        args = _super.prototype.getArgs.call(this, method, args);
        // Push sub name to args
        args.unshift(this.getSubName());
        return args;
    };
    TypescriptConsoleBase.prototype.getLogWidget = function () {
        return logWidgetTypescript;
    };
    return TypescriptConsoleBase;
}(ConsoleWatchBase));
var TsDiagnosticConsole = /** @class */ (function (_super) {
    __extends(TsDiagnosticConsole, _super);
    function TsDiagnosticConsole() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TsDiagnosticConsole.prototype.getSubName = function () {
        return "Diagnostics";
    };
    TsDiagnosticConsole.prototype.getThreadCode = function () {
        return "DI";
    };
    return TsDiagnosticConsole;
}(TypescriptConsoleBase));
;
var TsDeclarationConsole = /** @class */ (function (_super) {
    __extends(TsDeclarationConsole, _super);
    function TsDeclarationConsole() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TsDeclarationConsole.prototype.getSubName = function () {
        return "Declaration";
    };
    TsDeclarationConsole.prototype.getThreadCode = function () {
        return "DE";
    };
    return TsDeclarationConsole;
}(TypescriptConsoleBase));
exports.rollupConsole = new RollupConsole();
exports.tsDiagnosticConsole = new TsDiagnosticConsole();
exports.tsDeclarationConsole = new TsDeclarationConsole();
(0, console_1.zConsoleRender)();
// Interval that prints the threads count.
setInterval(function () {
    logThreadsCountBox.setContent(" ".concat((0, worker_1.zWorkerGetCount)()));
    logThreadsCountBox.render();
}, 1000);

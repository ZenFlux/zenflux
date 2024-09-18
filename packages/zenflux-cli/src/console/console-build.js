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
var node_util_1 = require("node:util");
var console_thread_format_1 = require("@zenflux/cli/src/console/console-thread-format");
var ConsoleBuildBase = /** @class */ (function (_super) {
    __extends(ConsoleBuildBase, _super);
    function ConsoleBuildBase() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ConsoleBuildBase.prototype.getThreadId = function () {
        return "M";
    };
    ConsoleBuildBase.prototype.getPrefix = function () {
        return "Thread ".concat(this.getThreadCode(), "-").concat(this.getThreadId().toString().padEnd(5)).concat(this.getName()).padEnd(30);
    };
    ConsoleBuildBase.prototype.getFormatExtended = function (method, args) {
        var prefix = args[0], action = args[1], argsLeft = args.slice(3);
        var context = args[2];
        if (method === this.verbose || method === this.debug) {
            context += "()";
        }
        else {
            context = context.charAt(0).toUpperCase() + context.slice(1);
        }
        return "".concat(prefix.charAt(0).toUpperCase() + prefix.slice(1)).padEnd(30) +
            "".concat(node_util_1.default.inspect(action.charAt(0).toUpperCase() + action.slice(1))).padEnd(30) +
            "-> ".concat(method.name.charAt(0).toUpperCase() + method.name.slice(1), " ->").padEnd(25) +
            "".concat(context, " -> ") +
            argsLeft.join(" ");
    };
    ConsoleBuildBase.prototype.getFormat = function (method, args) {
        var prefix = args[0], action = args[1];
        var argsLeft = args.slice(2);
        if (argsLeft.length) {
            // Upper case first arg in `argsLeft`
            argsLeft[0] = argsLeft[0].charAt(0).toUpperCase() + argsLeft[0].slice(1);
            return "".concat(prefix.charAt(0).toUpperCase() + prefix.slice(1)).padEnd(30) +
                "".concat(node_util_1.default.inspect(action.charAt(0).toUpperCase() + action.slice(1))).padEnd(30) +
                argsLeft.join(" ");
        }
        return args.join("\t");
    };
    return ConsoleBuildBase;
}(console_thread_format_1.ConsoleThreadFormat));
var RollupConsole = /** @class */ (function (_super) {
    __extends(RollupConsole, _super);
    function RollupConsole() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RollupConsole.prototype.getThreadCode = function () {
        return "RO";
    };
    RollupConsole.prototype.getName = function () {
        return "Rollup";
    };
    return RollupConsole;
}(ConsoleBuildBase));
;
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
    return TypescriptConsoleBase;
}(ConsoleBuildBase));
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

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
exports.ConsoleThreadSend = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var node_process_1 = require("node:process");
var console_manager_1 = require("@zenflux/cli/src/managers/console-manager");
var stdout = node_process_1.default.stdout, stderr = node_process_1.default.stderr;
/**
 * `ConsoleThreadSend` is a specialized class for managing sending operations in a multithreaded console environment,
 * leveraging the functionalities provided by ConsoleManager.
 */
var ConsoleThreadSend = /** @class */ (function (_super) {
    __extends(ConsoleThreadSend, _super);
    function ConsoleThreadSend(host) {
        var _this = _super.call(this, { stdout: stdout, stderr: stderr }) || this;
        _this.host = host;
        return _this;
    }
    ConsoleThreadSend.prototype.output = function (method, args) {
        var _a, _b, _c, _d, _e;
        args = this.getArgs(method, args);
        switch (method) {
            case this.error:
                if (args[0] instanceof Error) {
                    throw args[0];
                }
                throw new Error(args.join(" "));
            case this.warn:
                (_a = this.host).sendWarn.apply(_a, args);
                break;
            case this.info:
                (_b = this.host).sendInfo.apply(_b, args);
                break;
            case this.verbose:
                (_c = this.host).sendVerbose.apply(_c, args);
                break;
            case this.debug:
                (_d = this.host).sendDebug.apply(_d, args);
                break;
            case this.log:
                (_e = this.host).sendLog.apply(_e, args);
                break;
            default:
                throw new Error("Unknown method: ".concat(method));
        }
    };
    return ConsoleThreadSend;
}(console_manager_1.ConsoleManager.module()));
exports.ConsoleThreadSend = ConsoleThreadSend;
;

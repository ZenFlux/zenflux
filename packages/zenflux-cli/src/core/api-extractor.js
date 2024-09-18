"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zApiExporter = void 0;
/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
var node_process_1 = require("node:process");
var node_util_1 = require("node:util");
var node_fs_1 = require("node:fs");
var node_path_1 = require("node:path");
var api_extractor_1 = require("@microsoft/api-extractor");
var console_manager_1 = require("@zenflux/cli/src/managers/console-manager");
function zApiExporter(projectPath, inputPath, outputPath, activeConsole) {
    if (activeConsole === void 0) { activeConsole = console_manager_1.ConsoleManager.$; }
    var logDiagnosticsFile = node_process_1.default.env.NODE_ENV === "development" ?
        node_path_1.default.resolve(projectPath, "log/api-extractor-diagnostics.".concat(node_path_1.default.basename(inputPath), ".log")) : undefined;
    // TODO, Make it configurable
    if (logDiagnosticsFile) {
        var logFolder = node_path_1.default.dirname(logDiagnosticsFile);
        // Ensure folder exists
        if (!node_fs_1.default.existsSync(logFolder)) {
            node_fs_1.default.mkdirSync(logFolder, { recursive: true });
        }
    }
    activeConsole.verbose(function () { return [zApiExporter.name, node_util_1.default.inspect({
            projectPath: projectPath,
            inputPath: inputPath,
            outputPath: outputPath,
        })]; });
    var extractorConfig = api_extractor_1.ExtractorConfig.prepare({
        configObject: {
            projectFolder: projectPath,
            mainEntryPointFilePath: inputPath,
            bundledPackages: [],
            compiler: {
                tsconfigFilePath: "<projectFolder>/tsconfig.api-extractor.json",
            },
            dtsRollup: {
                enabled: true,
                untrimmedFilePath: outputPath,
            }
        },
        configObjectFullPath: undefined,
        packageJsonFullPath: projectPath + "/package.json",
    });
    if (logDiagnosticsFile && node_fs_1.default.existsSync(logDiagnosticsFile)) {
        activeConsole.verbose(function () { return [zApiExporter.name, "Removing old diagnostics file: ".concat(logDiagnosticsFile)]; });
        node_fs_1.default.unlinkSync(logDiagnosticsFile);
    }
    var devDiagnostics = [];
    // Invoke API Extractor
    var result = api_extractor_1.Extractor.invoke(extractorConfig, {
        localBuild: true,
        showDiagnostics: node_process_1.default.env.NODE_ENV === "development",
        messageCallback: function (message) {
            var handled = true;
            if (logDiagnosticsFile) {
                devDiagnostics.push(message.text);
            }
            else {
                switch (message.logLevel) {
                    case "error":
                        activeConsole.error(message.text);
                        break;
                    case "warning":
                        activeConsole.warn("".concat(zApiExporter.name), "warning", message.text);
                        break;
                    case "verbose":
                        activeConsole.verbose(function () { return [zApiExporter.name, message.text]; });
                        break;
                    case "info":
                        activeConsole.info("".concat(zApiExporter.name), "info", message.text);
                        break;
                    default:
                        handled = false;
                }
                ;
            }
            // By default, API Extractor sends its messages to the console, this flag tells api-extractor to not log to console.
            message.handled = handled;
        }
    });
    if (logDiagnosticsFile) {
        node_fs_1.default.writeFileSync(logDiagnosticsFile, devDiagnostics.join("\n"));
        activeConsole.log("Api-Extractor", "diagnostics file is created: ", "'".concat(logDiagnosticsFile, "'"));
    }
    return result;
}
exports.zApiExporter = zApiExporter;

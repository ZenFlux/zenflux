/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import process from "node:process";
import util from "node:util";
import fs from "node:fs";
import path from "node:path";

import {
    Extractor,
    ExtractorConfig,
    ExtractorLogLevel
} from "@microsoft/api-extractor";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import type ts from "typescript";

import type { IExtractorConfigPrepareOptions } from "@microsoft/api-extractor";

import type { IZConfigInternal } from "@zenflux/cli/src/definitions/config";

export function zApiExporter(
    projectPath: string,
    config: IZConfigInternal,
    tsConfig: ts.ParsedCommandLine,
    activeConsole = ConsoleManager.$
) {
    const inputPath = config.inputDtsPath!,
        outputPath = config.outputDtsPath!;

    const logDiagnosticsFile = process.env.NODE_ENV === "development" ?
        path.resolve( projectPath, `log/api-extractor-diagnostics.${ path.basename( inputPath ) }.log` ) : undefined;

    // TODO, Make it configurable
    if ( logDiagnosticsFile ) {
        const logFolder = path.dirname( logDiagnosticsFile );

        // Ensure folder exists
        if ( ! fs.existsSync( logFolder ) ) {
            fs.mkdirSync( logFolder, { recursive: true } );
        }
    }
    activeConsole.verbose( () => [ zApiExporter.name, util.inspect( {
        projectPath,
        inputPath,
        outputPath,
    } ) ] );

    const packageJsonFullPath = projectPath + "/package.json",
        packageJsonContent = JSON.parse( fs.readFileSync( packageJsonFullPath, "utf8" ) ),
        selfPackageLocalize = packageJsonContent[ "name" ] + "/*",
        paths = { [ selfPackageLocalize ]: [ "./dist/*" ] };

    tsConfig.raw.compilerOptions ??= {};
    tsConfig.raw.include ??= [];
    tsConfig.raw.exclude ??= [];

    tsConfig.raw.include.push(
        "dist/src/**/*.d.ts"
    );

    tsConfig.raw.compilerOptions["paths"] = {
        ... tsConfig.raw.compilerOptions["paths"] ?? {},
        ... paths,
    };

    const baseConfig: IExtractorConfigPrepareOptions = {
        configObject: {
            projectFolder: projectPath,
            mainEntryPointFilePath: inputPath,
            compiler: {
                overrideTsconfig: tsConfig.raw,
            },
            dtsRollup: {
                enabled: true,
                untrimmedFilePath: outputPath,
            },
            ... config.apiExtractor ?? {}
        },
        configObjectFullPath: projectPath + "api-extractor.json",
        packageJsonFullPath: projectPath + "/package.json",
    };

    baseConfig.configObject.messages ??= {};
    baseConfig.configObject.messages.extractorMessageReporting ??= {};

    baseConfig.configObject.messages.extractorMessageReporting[ "ae-wrong-input-file-type" ] ??= {
        logLevel: ExtractorLogLevel.Error
    };

    const extractorConfig: ExtractorConfig = ExtractorConfig.prepare( baseConfig );

    if ( logDiagnosticsFile && fs.existsSync( logDiagnosticsFile ) ) {
        activeConsole.verbose( () => [ zApiExporter.name, `Removing old diagnostics file: ${ logDiagnosticsFile }` ] );
        fs.unlinkSync( logDiagnosticsFile );
    }

    const devDiagnostics: string[] = [];

    // Invoke API Extractor
    const result = Extractor.invoke( extractorConfig, {
        localBuild: true,
        showDiagnostics: process.env.NODE_ENV === "development",

        messageCallback( message ) {
            let handled = true;

            if ( logDiagnosticsFile ) {
                devDiagnostics.push( util.inspect( message, { colors: false } ) );
            } else {
                switch ( message.logLevel ) {
                    case "error":
                        activeConsole.error( `${ zApiExporter.name }`, util.inspect( message ) );
                        break;
                    case "warning":
                        activeConsole.warn( `${ zApiExporter.name }`, "warning", message.text );
                        break;
                    case "verbose":
                        activeConsole.verbose( () => [ zApiExporter.name, message.text ] );
                        break;

                    case "info":
                        activeConsole.info( `${ zApiExporter.name }`, "info", message.text );
                        break;

                    default:
                        handled = false;
                }
            }

            // By default, API Extractor sends its messages to the console, this flag tells api-extractor to not log to console.
            message.handled = handled;
        }
    } );

    if ( logDiagnosticsFile ) {
        fs.writeFileSync( logDiagnosticsFile, devDiagnostics.join( "\n" ) );

        activeConsole.log( "Api-Extractor", "diagnostics file is created: ", `'${ logDiagnosticsFile }'` );
    }

    return result;
}

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
    tsConfigVirtual: ts.ParsedCommandLine,
    tsConfigExtractor: ts.ParsedCommandLine,
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

    // Start - TODO - Refactor + Dedicated method + Dont guess additionalPaths that comes from references, use custom property.
    const packageJsonFullPath = projectPath + "/package.json",
        // TODO: Use module `Package` to read.
        packageJsonContent = JSON.parse( fs.readFileSync( packageJsonFullPath, "utf8" ) ),
        selfPackageLocalize = packageJsonContent[ "name" ] + "/*";

    tsConfigExtractor.raw.compilerOptions ??= {};

    // parseJsonConfigFileContent mutates raw, merging extends chain values (e.g. include: ["src"], exclude: ["dist"]).
    // Override include to ONLY match declaration files, and remove "dist" from exclude so they're not filtered out.
    tsConfigExtractor.raw.include = [ "dist/**/*.d.ts" ];
    tsConfigExtractor.raw.exclude = [ "node_modules" ];

    // Ensure baseUrl is set so that paths mappings work (paths are relative to baseUrl)
    tsConfigExtractor.raw.compilerOptions[ "baseUrl" ] = "./";

    const additionalPaths: ts.ParsedCommandLine[ "options" ][ "paths" ] = {};

    if ( tsConfigVirtual.options.rootDir ) {
        // With rootDir set, cross-project declarations are NOT emitted into this project's dist.
        // Each referenced package has its own declarations in its own dist directory.
        // Note: projectReferences may be undefined since `references` in tsconfig are NOT inherited through `extends`.
        // Instead, scan node_modules for @zenflux/* dependencies and resolve their dist paths via symlinks.
        const scope = packageJsonContent[ "name" ]?.split( "/" )[ 0 ];

        if ( scope ) {
            let nodeModulesDir: string | undefined;
            let searchDir = projectPath;

            // Find the nearest node_modules containing the scoped packages
            while ( searchDir !== path.dirname( searchDir ) ) {
                const candidate = path.join( searchDir, "node_modules", scope );

                if ( fs.existsSync( candidate ) ) {
                    nodeModulesDir = candidate;
                    break;
                }

                searchDir = path.dirname( searchDir );
            }

            if ( nodeModulesDir ) {
                const scopedPackages = fs.readdirSync( nodeModulesDir );

                for ( const pkgName of scopedPackages ) {
                    const symlink = path.join( nodeModulesDir, pkgName );

                    try {
                        const realPkgPath = fs.realpathSync( symlink );
                        const realDist = path.join( realPkgPath, "dist" );

                        if ( fs.existsSync( realDist ) ) {
                            const refDist = path.relative( projectPath, realDist );
                            additionalPaths[ `${ scope }/${ pkgName }/*` ] = [ `./${ refDist }/*` ];
                        }
                    } catch { /* skip unresolvable symlinks */ }
                }
            }
        }

        // Self-package declarations are at dist/* (rootDir "." means src/ maps to dist/src/)
        additionalPaths[ selfPackageLocalize ] = [ "./dist/*" ];

        // Override moduleResolution to "node" so that the API Extractor resolves imports through
        // paths mappings instead of package.json exports (which point to .ts source files).
        tsConfigExtractor.raw.compilerOptions[ "moduleResolution" ] = "Node";
    } else if ( tsConfigVirtual.projectReferences?.length ) {
        // Without rootDir, cross-project declarations are emitted into this project's dist.
        // For each reference that starts with "@" add path to `dist/${ref}/*`/.
        tsConfigVirtual.projectReferences.forEach( ref => {
            if ( ref.originalPath!.startsWith( "@" ) ) {

                additionalPaths[ `${ ref.originalPath }/*` ] = [ `./dist/${ path.basename( ref.path ) }/*` ];
            }
        } );
        additionalPaths[ selfPackageLocalize ] = [ `./dist/${ path.basename( projectPath ) }/*` ];
    } else {
        additionalPaths[ selfPackageLocalize ] = [ "./dist/*" ];
    }

    tsConfigExtractor.raw.compilerOptions[ "paths" ] = {
        ... tsConfigExtractor.raw.compilerOptions[ "paths" ] ?? {},
        ... additionalPaths,
    };
    // End - Refactor

    const baseConfig: IExtractorConfigPrepareOptions = {
        configObject: {
            projectFolder: projectPath,
            mainEntryPointFilePath: inputPath,
            compiler: {
                overrideTsconfig: tsConfigExtractor.raw,
            },
            dtsRollup: {
                enabled: true,
                untrimmedFilePath: outputPath,
            },
            ... config.apiExtractor ?? {}
        },
        configObjectFullPath: projectPath + "/api-extractor.json",
        packageJsonFullPath: projectPath + "/package.json",
    };

    baseConfig.configObject.messages ??= {};
    baseConfig.configObject.messages.extractorMessageReporting ??= {};

    baseConfig.configObject.messages.extractorMessageReporting[ "ae-wrong-input-file-type" ] ??= {
        logLevel: ExtractorLogLevel.Error
    };

    activeConsole.debug( () => [ zApiExporter.name, util.inspect( baseConfig ) ] );

    const extractorConfig: ExtractorConfig = ExtractorConfig.prepare( baseConfig );

    if ( logDiagnosticsFile && fs.existsSync( logDiagnosticsFile ) ) {
        activeConsole.verbose( () => [ zApiExporter.name, `Removing old diagnostics file: ${ logDiagnosticsFile }` ] );
        fs.unlinkSync( logDiagnosticsFile );
    }

    const devDiagnostics: string[] = [];

    let hadError = false;

    // Invoke API Extractor
    const result = Extractor.invoke( extractorConfig, {
        localBuild: true,
        showDiagnostics: process.env.NODE_ENV === "development",

        messageCallback( message ) {
            let handled = true;

            if ( logDiagnosticsFile ) {
                let logLine;

                if ( message.logLevel === "error" ) {
                    hadError = true;

                    const { text, ... raw } = message;

                    logLine = `${ text }, metadata: ${ util.inspect( raw, { colors: false } ) }`;
                } else {
                    logLine = message.text;
                }

                devDiagnostics.push( `${ message.logLevel }: ${ logLine }` );
            } else {
                switch ( message.logLevel ) {
                    case "error":
                        activeConsole.error( `${ zApiExporter.name }`, util.inspect( {
                            ... message,
                            _tsConfig: config.path
                        } ) );

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

        if ( hadError ) {
            activeConsole.error( "Api-Extractor", "diagnostics file contains errors, please check it" );
        }
    }

    return result;
}

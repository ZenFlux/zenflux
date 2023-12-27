/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import fs from "node:fs";
import process from "node:process";
import path from "node:path";
import util from "node:util";

import { workerData, Worker, parentPort } from "node:worker_threads";

import { fileURLToPath, pathToFileURL } from "node:url";

import ts from "typescript";

import { console } from "@zenflux/cli/src/modules/console";

import type { TZCreateDeclarationArgs, TZPreDiagnosticsArgs } from "@zenflux/cli/src/definitions/typescript";
import type { TZFormatType } from "@zenflux/cli/src/definitions/zenflux";

// TODO: Avoid this, create threadPool with max threads = cpu cores.
const diagnosticWorkers = new Map<number, Worker>(),
    declarationWorkers = new Map<number, Worker>();

const pathsCache: { [ key: string ]: string } = {},
    configCache: { [ key: string ]: ts.ParsedCommandLine } = {},
    configValidationCache: { [ key: string ]: boolean } = {},
    cacheCompilerHost: { [ key: string ]: ts.CompilerHost } = {},
    cacheProgram: { [ key: string ]: ts.Program } = {};

export function zCustomizeDiagnostic( diagnostic: ts.Diagnostic ) {
    let isIntroduceFile = false;
    const str = ts.flattenDiagnosticMessageText( diagnostic.messageText, "\n" );

    // Make the message more readable and useful
    const customized = str.replace( /'([^']*)'/g, function ( _, match ) {
        let pathSegments = match.split( "/" );
        if ( match.startsWith( "/" ) && pathSegments[ pathSegments.length - 1 ].includes( "." ) ) {
            // Some IDE's support path links
            isIntroduceFile = true;
            return util.inspect( "file://" + match );
        } else {
            return util.inspect( match );
        }
    } );

    // TypeScript doesn't show always the file name, for easier error handling we will add it.
    if ( ! isIntroduceFile && diagnostic.file?.fileName ) {
        let filename = diagnostic.file.fileName;

        if ( diagnostic.start ) {
            const { line, character } = diagnostic.file.getLineAndCharacterOfPosition( diagnostic.start );

            filename += `:${ line + 1 }:${ character + 1 }`;
        }

        return customized + " caused by: file://" + filename;
    }

    return customized;
}

/**
 * Function zTSConfigGetPath() - This function returns the path to the TypeScript configuration file based on the specified format.
 * It checks for different TypeScript configuration files depending on the environment and format.
 *
 * Fallback order:
 * -. tsconfig.{format}.dev.json
 * -. tsconfig.dev.json
 * -. tsconfig.{format}.json
 * -. tsconfig.json
 */
export function zTSConfigGetPath( format: TZFormatType | null, targetPath: string, showErrors = true ) {
    function generateCacheKey( format: TZFormatType | null, targetPath: string ): string {
        return `${ targetPath }_${ format }`;
    };

    function logVerbose( message: string ) {
        console.verbose( () => `${ zTSConfigGetPath.name }() -> ${ message }` );
    };

    function fileExists( filePath: string ) {
        logVerbose( `'${ filePath }' file exists check` );
        const exists = fs.existsSync( filePath );
        logVerbose( `'${ filePath }' ${ exists ? "found" : "not found" }` );
        return exists;
    };

    function getTSConfigPath( configFileName: string ) {
        return path.join( targetPath, configFileName );
    }

    function getTSConfigBundlePath( source = getTSConfigPath ) {
        if ( process.env.NODE_ENV === "development" ) {
            const devFormatFilePath = source( `tsconfig.${ format }.dev.json` );
            if ( fileExists( devFormatFilePath ) ) {
                return devFormatFilePath;
            }

            const devFilePath = source( "tsconfig.dev.json" );
            if ( fileExists( devFilePath ) ) {
                return devFilePath;
            }
        }

        const formatFilePath = source( `tsconfig.${ format }.json` );
        if ( fileExists( formatFilePath ) ) {
            return formatFilePath;
        }

        const defaultFilePath = source( "tsconfig.json" );
        if ( fileExists( defaultFilePath ) ) {
            return defaultFilePath;
        }
    }

    const cacheKey = generateCacheKey( format, targetPath );

    if ( pathsCache[ cacheKey ] ) {
        return pathsCache[ cacheKey ];
    }

    const tsConfigPath = getTSConfigBundlePath();

    if ( tsConfigPath ) {
        return pathsCache[ cacheKey ] = tsConfigPath;
    }

    if ( showErrors ) {
        console.error( "tsconfig.json not found" );
    }
}

/**
 * Function zTSConfigRead() - Read and parse TypeScript configuration from tsconfig.json file.
 *
 * @param {TZFormatType|null} format - Format will add a suffix(`tsconfig.es.json`) to the file name, null is default(`tsconfig.json`).
 * @param {string} projectPath - The project's root directory path.
 *
 * @throws {Error} - If tsconfig.json file is not found or if there are any syntax errors in the file.
 */
export function zTSConfigRead( format: TZFormatType | null, projectPath: string ) {
    const cacheKey = projectPath + "_" + format;

    if ( configCache[ cacheKey ] ) {
        return configCache[ cacheKey ];
    }

    const tsConfigPath = zTSConfigGetPath( format, projectPath, false );

    if ( ! tsConfigPath ) {
        throw new Error( "tsconfig.json not found" );
    }

    console.verbose( () => `${ zTSConfigRead.name }() -> Reading and parsing '${ tsConfigPath }' of project '${ projectPath }'` );

    const data = ts.readConfigFile( tsConfigPath, ts.sys.readFile );

    if ( data.error ) {
        const error = new Error();

        error.cause = tsConfigPath;
        error.name = "\x1b[31mTypeScript 'tsconfig' configuration error\x1b[0m";
        error.message = "\n" + zCustomizeDiagnostic( data.error );

        throw error;
    }

    const content = ts.parseJsonConfigFileContent(
        data.config,
        ts.sys,
        projectPath,
    );

    if ( content.errors.length ) {
        const error = new Error();

        error.cause = tsConfigPath;
        error.name = "\x1b[31mTypeScript 'tsconfig' parse error\x1b[0m";
        error.message = "\n" + content.errors.map( error => zCustomizeDiagnostic( error ) )
            .join( "\n\n" );

        console.error( error );

        if ( content.options.noEmitOnError ) {
            process.exit( 1 );
        }
    }

    configCache[ cacheKey ] = Object.assign( {}, content );

    content.options.rootDir = content.options.rootDir || projectPath;
    content.options.configFilePath = tsConfigPath;

    return content;
}

/**
 * Function zTSGetCompilerHost() - Retrieves the compiler host for a given TypeScript configuration.
 *
 * Retrieves the compiler host for a given TypeScript configuration.
 *
 * @param {ts.ParsedCommandLine} tsConfig - The TypeScript configuration.
 */
export function zTSGetCompilerHost( tsConfig: ts.ParsedCommandLine ) {
    const outPath = tsConfig.options.declarationDir || tsConfig.options.outDir;

    if ( ! outPath ) {
        throw new Error( `${ tsConfig.options.configFilePath }: 'declarationDir' or 'outDir' is required` );
    }

    // Get from cache
    if ( cacheCompilerHost[ outPath ] ) {
        return cacheCompilerHost[ outPath ];
    }

    const compilerHost = ts.createCompilerHost( tsConfig.options, true ),
        compilerHostGetSourceFile = compilerHost.getSourceFile;

    compilerHost.getSourceFile = ( fileName, languageVersion, onError, shouldCreateNewSourceFile ) => {
        // Exclude internal TypeScript files from validation
        if ( fileName.startsWith( outPath ) ) {
            console.verbose( () => `${ zTSGetCompilerHost.name }::${ compilerHost.getSourceFile.name }() -> Skipping '${ fileName }', internal TypeScript file` );
            return;
        }

        return compilerHostGetSourceFile( fileName, languageVersion, onError, shouldCreateNewSourceFile );
    };

    cacheCompilerHost[ tsConfig.options.configFilePath as string ] = compilerHost;

    return compilerHost;
}

/**
 * Function zTSPreDiagnostics() - Runs pre-diagnostics for specific TypeScript configuration.
 */
export function zTSPreDiagnostics( tsConfig: ts.ParsedCommandLine, args: TZPreDiagnosticsArgs = {} ) {
    if ( args.thread || 0 === args.thread ) {
        return zTSCreateDiagnosticWorker( tsConfig, args );
    }
    // ---
    const {
        useCache = true,
        haltOnError = false,
    } = args;

    /**
     * Validation should run only once per tsconfig.json file, validation and declaration generation
     * should be based on main `tsconfig.json` file, not on `tsconfig.es.json` or `tsconfig.es.dev.json`, etc.
     */
    if ( useCache && configValidationCache[ tsConfig.options.configFilePath as string ] ) {
        console.verbose( () => `${ zTSPreDiagnostics.name }() -> Skipping validation for '${ tsConfig.options.configFilePath }', already validated` );
        return;
    }

    const compilerHost = zTSGetCompilerHost( tsConfig );

    const program = ts.createProgram( tsConfig.fileNames, Object.assign( {}, tsConfig.options, {
        noEmit: true,

        // In case `tsconfig.dev.json` is used, we don't want to generate source maps or declarations for diagnostic
        inlineSourceMap: false,
        sourceMap: false,
        inlineSources: false,

        declaration: false,
        declarationMap: false,
        declarationDir: undefined,
    } as ts.CompilerOptions ), compilerHost, cacheProgram[ tsConfig.options.configFilePath as string ] );

    cacheProgram[ tsConfig.options.configFilePath as string ] = program;

    const diagnostics = ts.getPreEmitDiagnostics( program );

    configValidationCache[ tsConfig.options.configFilePath as string ] = true;

    if ( diagnostics.length ) {
        const error = new Error();

        error.name = `\x1b[31mTypeScript validation has ${ diagnostics.length } error(s)\x1b[0m config: ${ "file://" + tsConfig.options.configFilePath }`;
        error.message = "\n" + diagnostics.map( error => zCustomizeDiagnostic( error ) ).join( "\n\n" );

        console.error( error );

        if ( haltOnError || tsConfig.options.noEmitOnError ) {
            process.exit( 1 );
        }
    }

    return diagnostics.length <= 0;
}

export function zTSCreateDeclaration( tsConfig: ts.ParsedCommandLine, args: TZCreateDeclarationArgs = {} ) {
    if ( args.thread || 0 === args.thread ) {
        return zTSCreateDeclarationWorker( tsConfig, args );
    }

    const compilerHost = zTSGetCompilerHost( tsConfig );

    const program = ts.createProgram( tsConfig.fileNames, Object.assign( {}, tsConfig.options, {
        declaration: true,
        noEmit: false,
        emitDeclarationOnly: true,
        declarationDir: tsConfig.options.declarationDir || tsConfig.options.outDir,
    } as ts.CompilerOptions ), compilerHost, cacheProgram[ tsConfig.options.configFilePath as string ] );

    cacheProgram[ tsConfig.options.configFilePath as string ] = program;

    // Remove old declaration .d.ts files
    const declarationPath = tsConfig.options.declarationDir || tsConfig.options.outDir;

    if ( ! declarationPath ) {
        throw new Error( `${ tsConfig.options.configFilePath }: 'declarationDir' or 'outDir' is required` );
    }

    const result = program.emit();

    if ( result.diagnostics.length ) {
        const error = new Error();

        error.name = `\x1b[31mTypeScript declaration has ${ result.diagnostics.length } error(s)\x1b[0m config: ${ "file://" + tsConfig.options.configFilePath }`;
        error.message = "\n" + result.diagnostics.map( error => zCustomizeDiagnostic( error ) ).join( "\n\n" );

        console.error( error );
    } else {
        console.verbose( () => `${ zTSCreateDeclaration.name }() -> Declaration created for '${ tsConfig.options.configFilePath }'` );
    }

    return result.diagnostics.length <= 0;
}

function zTSDiagnosticInWorker() {
    if ( ! workerData.args.thread && 0 !== workerData.args.thread ) {
        throw new Error( "Thread options not found." );
    }

    if ( ! workerData.tsConfigPath ) {
        throw new Error( "tsConfigPath not found." );
    }

    if ( ! workerData.args ) {
        throw new Error( "args not found." );
    }

    const id = workerData.args.thread as number,
        tsConfig = zTSConfigRead( null, path.dirname( workerData.tsConfigPath ) );

    // Waiting for the parent to send a message.
    parentPort?.on( "message", async ( message ) => {
        switch ( message ) {
            case "run":
                console.verbose( () => `Thread\t${ id }\tRun\t${ util.inspect( tsConfig.options.configFilePath ) }` );

                const result = zTSPreDiagnostics( tsConfig, {
                    ... workerData.args,
                    thread: false,
                } );

                // Ensuring that console.log is flushed.
                setTimeout( () => {
                    parentPort?.postMessage( [
                        "done",
                        result,
                    ] );
                } );

                break;

            default:
                throw new Error( `Unknown message: ${ message }` );
        }
    } );
}

function zTSDeclarationInWorker() {
    if ( ! workerData.args.thread && 0 !== workerData.args.thread ) {
        throw new Error( "Thread options not found." );
    }

    if ( ! workerData.tsConfigPath ) {
        throw new Error( "tsConfigPath not found." );
    }

    if ( ! workerData.args ) {
        throw new Error( "args not found." );
    }

    const id = workerData.args.thread as number,
        tsConfig = zTSConfigRead( null, path.dirname( workerData.tsConfigPath ) );

    // Waiting for the parent to send a message.
    parentPort?.on( "message", async ( message ) => {
        switch ( message ) {
            case "run":
                console.verbose( () => `Thread\t${ id }\tRun\t${ util.inspect( tsConfig.options.configFilePath ) }` );

                const result = zTSCreateDeclaration( tsConfig, {
                    ... workerData.args,
                    thread: false,
                } );

                // Ensuring that console.log is flushed.
                setTimeout( () => {
                    parentPort?.postMessage( [
                        "done",
                        result,
                    ] );
                } );

                break;

            default:
                throw new Error( `Unknown message: ${ message }` );
        }
    } );
}

export async function zTSCreateDiagnosticWorker( tsConfig: ts.ParsedCommandLine, args: TZPreDiagnosticsArgs = {} ) {
    // Since worker do not need to load it, it can't be in top level.
    const { zGlobalPathsGet } = ( await import( "@zenflux/cli/src/core/global" ) );

    // Await for the worker to finish.
    return new Promise( async ( resolve ) => {
        if ( ! diagnosticWorkers.has( args.thread as number ) ) {
            console.verbose( () => `Diagnostic\t${ args.thread }\tStart\t${ util.inspect( tsConfig.options.configFilePath ) }` );

            const worker = new Worker( pathToFileURL( zGlobalPathsGet().cli ), {
                name: `zTSCreateDiagnosticWorker-${ args.thread }`,
                argv: process.argv,
                workerData: {
                    zCliWorkPath: fileURLToPath( import.meta.url ),

                    args,

                    tsConfigPath: tsConfig.options.configFilePath,

                    action: "tsDiagnostic",
                },
            } );

            diagnosticWorkers.set( args.thread as number, worker );
        }

        const worker = diagnosticWorkers.get( args.thread as number ) as Worker;

        worker.on( "exit", () => {
            console.verbose( () => `Diagnostic\t${ args.thread }\tClose\t${ util.inspect( tsConfig.options.configFilePath ) }` );

            diagnosticWorkers.delete( args.thread as number );

            resolve( false );
        } );

        worker.once( "message", ( [ action, result ] ) => {
            switch ( action ) {
                case "done":
                    resolve( result as boolean );
                    break;

                default:
                    throw new Error( `Unknown action: ${ action }` );
        } } );

        worker.postMessage( "run" );
    } );
}

export async function zTSCreateDeclarationWorker( tsConfig: ts.ParsedCommandLine, args: TZPreDiagnosticsArgs = {} ) {
    // Since worker do not need to load it, it can't be in top level.
    const { zGlobalPathsGet } = ( await import( "@zenflux/cli/src/core/global" ) );

    // Await for the worker to finish.
    return new Promise( async ( resolve ) => {
        if ( ! declarationWorkers.has( args.thread as number ) ) {
            console.verbose( () => `Declaration\t${ args.thread }\tStart\t${ util.inspect( tsConfig.options.configFilePath ) }` );

            const worker = new Worker( pathToFileURL( zGlobalPathsGet().cli ), {
                name: `zTSCreateDeclarationWorker-${ args.thread }`,
                argv: process.argv,
                workerData: {
                    zCliWorkPath: fileURLToPath( import.meta.url ),

                    args,

                    tsConfigPath: tsConfig.options.configFilePath,

                    action: "tsDeclaration",
                },
            } );

            declarationWorkers.set( args.thread as number, worker );
        }

        const worker = declarationWorkers.get( args.thread as number ) as Worker;

        worker.once( "message", ( [ action, result ] ) => {
            switch ( action ) {
                case "done":
                    resolve( result as boolean );
                    break;

                default:
                    throw new Error( `Unknown action: ${ action }` );
        } } );

        worker.postMessage( "run" );
    } );
}

if ( workerData?.zCliWorkPath === fileURLToPath( import.meta.url ) ) {
    switch ( workerData.action ) {
        case "tsDiagnostic":
            zTSDiagnosticInWorker();
            break;

        case "tsDeclaration":
            zTSDeclarationInWorker();
            break;

        default:
            throw new Error( `Unknown action: ${ workerData.action }` );
    }
}

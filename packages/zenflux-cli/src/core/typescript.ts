/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import fs from "node:fs";
import process from "node:process";
import path from "node:path";
import util from "node:util";

import ts from "typescript";

import { createResolvablePromise } from "@zenflux/typescript-vm/utils";

import { ConsoleThreadSend } from "@zenflux/cli/src/console/console-thread-send";
import { ConsoleThreadReceive } from "@zenflux/cli/src/console/console-thread-receive";

import { ensureInWorker } from "@zenflux/cli/src/modules/threading/utils";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import type { ConsoleThreadFormat } from "@zenflux/cli/src/console/console-thread-format";

import type { ThreadHost } from "@zenflux/cli/src/modules/threading/definitions";
import type { TZFormatType } from "@zenflux/cli/src/definitions/zenflux";
import type {
    TZCreateDeclarationWorkerOptions,
    TZPreDiagnosticsOptions,
    TZPreDiagnosticsWorkerOptions
} from "@zenflux/cli/src/definitions/typescript";

import type { Worker } from "@zenflux/cli/src/modules/threading/worker";

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

    function logDebug( message: string ) {
        ConsoleManager.$.debug( () => [ "typescript", zTSConfigGetPath.name, message ] );
    };

    function fileExists( filePath: string ) {
        logDebug( `${ util.inspect( filePath) } file exists check` );
        const exists = fs.existsSync( filePath );
        logDebug( `${ util.inspect( filePath) } ${ exists ? "found" : "not found" }` );
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
        ConsoleManager.$.error( "tsconfig.json not found" );
    }
}

/**
 * Function zTSConfigRead() - Read and parse TypeScript configuration from tsconfig.json file.
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

    ConsoleManager.$.debug(
        () => [
            "Ts-Config",
            zTSConfigRead.name,
            `Reading and parsing ${ util.inspect( tsConfigPath ) } of project ${ util.inspect( projectPath ) }`
        ]
    );

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

        ConsoleManager.$.error( error );

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
 */
export function zTSGetCompilerHost( tsConfig: ts.ParsedCommandLine, activeConsole = ConsoleManager.$ ) {
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
            activeConsole.verbose( () => [
                `${ zTSGetCompilerHost.name }::${ compilerHost.getSourceFile.name }`,
                `Skipping '${ fileName }', internal TypeScript file`
            ] );
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
export function zTSPreDiagnostics( tsConfig: ts.ParsedCommandLine, args: TZPreDiagnosticsOptions = {}, activeConsole = ConsoleManager.$ ) {
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
        activeConsole.verbose( () => [
            zTSPreDiagnostics.name,
            `Skipping validation for '${ tsConfig.options.configFilePath }', already validated`
        ] );
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

        activeConsole.error( error );

        if ( haltOnError || tsConfig.options.noEmitOnError ) {
            process.exit( 1 );
        }
    }

    return diagnostics.length <= 0;
}

export function zTSCreateDeclaration( tsConfig: ts.ParsedCommandLine, config: IZConfigInternal, activeConsole = ConsoleManager.$ ) {
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

        activeConsole.error( error );
    } else {
        activeConsole.verbose( () => [
            zTSCreateDeclaration.name,
            `Declaration created for '${ tsConfig.options.configFilePath }'`
        ] );

    }

    return result.diagnostics.length <= 0;
}

export function zTSDiagnosticInWorker( tsConfigFilePath: string, options: TZPreDiagnosticsWorkerOptions, host: ThreadHost ) {
    ensureInWorker();

    // Hook console logs to thread messages.
    ConsoleManager.setInstance( new ConsoleThreadSend( host ) );

    const tsConfig = zTSConfigRead( null, path.dirname( tsConfigFilePath ) );

    host.sendLog( "run", util.inspect( options.config.outputName ) );

    return zTSPreDiagnostics( tsConfig, options );
}

export function zTSDeclarationInWorker( tsConfigFilePath: string, config: IZConfigInternal, host: ThreadHost ) {
    ensureInWorker();

    // Hook console logs to thread messages.
    ConsoleManager.setInstance( new ConsoleThreadSend( host ) );

    const tsConfig = zTSConfigRead( null, path.dirname( tsConfigFilePath ) );

    host.sendLog( "run", util.inspect( config.outputName ) );

    return zTSCreateDeclaration( tsConfig );
}

export async function zTSCreateDiagnosticWorker(
    tsConfig: ts.ParsedCommandLine,
    options: TZPreDiagnosticsWorkerOptions,
    activeConsole: ConsoleThreadFormat
) {
    if ( ! diagnosticWorkers.has( options.id ) ) {
        const { Worker } = ( await import( "@zenflux/cli/src/modules/threading/worker" ) );

        // Create a new thread.
        const worker = new Worker(
            "Diagnostic",
            options.id,
            tsConfig.options.configFilePath as string,
            zTSDiagnosticInWorker, [
                tsConfig.options.configFilePath,
                options,
            ],
        );

        ConsoleThreadReceive.connect( worker, activeConsole );

        diagnosticWorkers.set( options.id, worker );
    }

    const thread = diagnosticWorkers.get( options.id as number );

    if ( ! thread ) {
        throw new Error( "Thread not found." );
    }

    if ( ! thread.isAlive() ) {
        diagnosticWorkers.delete( options.id as number );

        return zTSCreateDiagnosticWorker( tsConfig, options, activeConsole );
    }

    return thread.run();
}

export async function zTSCreateDeclarationWorker(
    tsConfig: ts.ParsedCommandLine,
    options: TZCreateDeclarationWorkerOptions,
    activeConsole: ConsoleThreadFormat,
) {
    if ( ! declarationWorkers.has( options.id ) ) {
        const { Worker } = ( await import( "@zenflux/cli/src/modules/threading/worker" ) );

        // Create a new thread.
        const worker = new Worker(
            "Declaration",
            options.id,
            tsConfig.options.configFilePath as string,
            zTSDeclarationInWorker, [
                tsConfig.options.configFilePath,
                options.config,
            ],
        );

        ConsoleThreadReceive.connect( worker, activeConsole );

        declarationWorkers.set( options.id, worker );
    }

    const thread = declarationWorkers.get( options.id as number );

    if ( ! thread ) {
        throw new Error( "Thread not found." );
    }

    if ( ! thread.isAlive() ) {
        declarationWorkers.delete( options.id as number );

        return zTSCreateDeclarationWorker( tsConfig, options, activeConsole );
    }

    return thread.run();
}

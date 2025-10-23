/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import fs from "node:fs";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import util from "node:util";
import os from "node:os";

import { zDeepMergeAll } from "@zenflux/utils/object";

import { zGetAbsoluteOrRelativePath } from "@zenflux/utils/path";

import { ensureInWorker } from "@zenflux/worker/utils";

import ts from "typescript";

import { zCreateResolvablePromise } from "@zenflux/utils/promise";

import { Package } from "@zenflux/cli/src/modules/npm/package";

import { zTSGetPackageByTSConfig } from "@zenflux/cli/src/utils/typescript";

import { ConsoleThreadSend } from "@zenflux/cli/src/console/console-thread-send";
import { ConsoleThreadReceive } from "@zenflux/cli/src/console/console-thread-receive";

import { zApiExporter } from "@zenflux/cli/src/core/api-extractor";

import {
    zWorkspaceGetPackages,
    zWorkspaceGetWorkspaceDependencies
} from "@zenflux/cli/src/core/workspace";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import type { WorkerServer } from "@zenflux/worker/worker-server";

import type { DThreadHostInterface } from "@zenflux/worker/definitions";

import type { ConsoleThreadFormat } from "@zenflux/cli/src/console/console-thread-format";

import type { TZFormatType } from "@zenflux/cli/src/definitions/zenflux";
import type {
    TZCreateDeclarationWorkerOptions,
    TZPreDiagnosticsOptions,
    TZPreDiagnosticsWorkerOptions
} from "@zenflux/cli/src/definitions/typescript";

import type { IZConfigInternal } from "@zenflux/cli/src/definitions/config";

// TODO: Avoid this, create threadPool with max threads = cpu cores.
const diagnosticWorkers = new Map<string, WorkerServer>(),
    diagnosticWorkersPreparing = new Map<string, ReturnType<typeof zCreateResolvablePromise>>,
    declarationWorkers = new Map<string, WorkerServer>();

const waitingTSConfigs = new Map<string, {
    promise: ReturnType<typeof zCreateResolvablePromise>,
    dependencies: Record<string, true>,
}>();

const pathsCache: { [ key: string ]: string } = {},
    configCache: { [ key: string ]: ts.ParsedCommandLine } = {},
    configValidationCache: { [ key: string ]: boolean } = {},
    cacheCompilerHost: { [ key: string ]: ts.CompilerHost } = {},
    cacheProgram: { [ key: string ]: ts.Program } = {};

export function zTSCustomizeDiagnostic( diagnostic: ts.Diagnostic ) {
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
        logDebug( `${ util.inspect( filePath ) } file exists check` );
        const exists = fs.existsSync( filePath );
        logDebug( `${ util.inspect( filePath ) } ${ exists ? "found" : "not found" }` );
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

export function zTSConfigReadInternal( tsConfigPath: string, projectPath: string ) {
    ConsoleManager.$.debug(
        () => [
            "Ts-Config",
            zTSConfigRead.name,
            `Reading and parsing ${ util.inspect( tsConfigPath ) } of project ${ util.inspect( projectPath ) }`
        ]
    );

    const cacheKey = tsConfigPath + "_" + projectPath;

    if ( configCache[ cacheKey ] ) {
        return configCache[ cacheKey ];
    }

    const data = ts.readConfigFile( tsConfigPath, ts.sys.readFile );

    if ( data.error ) {
        const error = new Error();

        error.cause = tsConfigPath;
        error.name = "\x1b[31mTypeScript 'tsconfig' configuration error\x1b[0m";
        error.message = "\n" + zTSCustomizeDiagnostic( data.error );

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
        error.message = "\n" + content.errors.map( error => zTSCustomizeDiagnostic( error ) )
            .join( "\n\n" );

        ConsoleManager.$.error( error );

        if ( content.options.noEmitOnError ) {
            process.exit( 1 );
        }
    }

    content.options.configFilePath = tsConfigPath;

    configCache[ cacheKey ] = content;

    return content;
}

/**
 * Function zTSConfigReadExtendsChain() - Should traverse, load and merge all tsconfig(s) that are in the `extends` chain.
 */
export function zTSConfigReadExtendsChain( tsConfig: ts.ParsedCommandLine, activeConsole = ConsoleManager.$ ) {
    const result: ts.ParsedCommandLine[] = [];

    activeConsole.debug( () => [
        "typescript",
        zTSConfigReadExtendsChain.name,
        `Reading extends chain for ${ tsConfig.options.configFilePath }`
    ] );

    if ( ! tsConfig.raw.extends ) {
        return result;
    }

    const chainProjectPath = path.dirname( tsConfig.options.configFilePath as string ),
        chainExtends = Array.isArray( tsConfig.raw.extends ) ? tsConfig.raw.extends : [ tsConfig.raw.extends ];

    chainExtends.forEach( ( extenderFilePath: string ) => {
        const extenderTsConfigPath = zGetAbsoluteOrRelativePath( extenderFilePath, chainProjectPath ),
            extenderTsConfig = zTSConfigReadInternal( extenderTsConfigPath, chainProjectPath );

        activeConsole.debug( () => [
            "typescript",
            zTSConfigReadExtendsChain.name,
            `Extends chain: \`${ extenderFilePath }\` -> ${ extenderTsConfig.options.configFilePath }`
        ] );

        result.push( extenderTsConfig );

        result.push( ... zTSConfigReadExtendsChain( extenderTsConfig, activeConsole ) );
    } );

    return result;
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

    const content = zTSConfigReadInternal( tsConfigPath, projectPath );

    configCache[ cacheKey ] = Object.assign( {}, content );

    return content;
}

/**
 * Function zTSGetCompilerHost() - Retrieves the compiler host for a given TypeScript configuration.
 *
 * Retrieves the compiler host for a given TypeScript configuration.
 */
export async function zTSGetCompilerHost( tsConfig: ts.ParsedCommandLine, activeConsole = ConsoleManager.$ ) {
    const currentConfigFilePath = tsConfig.options.configFilePath as string,
        currentProjectPath = path.dirname( currentConfigFilePath );

    const chain = zTSConfigReadExtendsChain( tsConfig, activeConsole ),
        mergedTsConfig = zDeepMergeAll<ts.ParsedCommandLine>( ... chain );

    if ( ! mergedTsConfig.options?.rootDir ) {
        const currentPackage = new Package( currentProjectPath );

        // If one of configs in the chain have `projectReferences` and they are part of this workspace, then try to add paths.
        const workspaces = await zWorkspaceGetPackages(),
            paths: ts.ParsedCommandLine["options"]["paths"] = tsConfig.options.paths ?? {};

        if ( mergedTsConfig.projectReferences ) {
            mergedTsConfig.projectReferences.forEach( projectReference => {
                const packageName = projectReference.originalPath!,
                    packageInfo = workspaces[ packageName ];

                if ( packageInfo ) {
                    paths[ packageName + "/*" ] = [ packageInfo.getPath() + "/*" ];

                    projectReference.path = packageInfo.getPath();
                }
            } );

            tsConfig.projectReferences = [ ... mergedTsConfig.projectReferences ];
        }

        // Add self to paths.
        paths[ currentPackage.json.name + "/*" ] = [ currentProjectPath + "/*" ];

        tsConfig.options.paths = paths;
    }

    const outPath = tsConfig.options.declarationDir || tsConfig.options.outDir;

    if ( ! outPath ) {
        throw new Error( `${ currentConfigFilePath }: 'declarationDir' or 'outDir' is required` );
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

    cacheCompilerHost[ currentConfigFilePath ] = compilerHost;

    return compilerHost;
}

/**
 * Function zTSPreDiagnostics() - Runs pre-diagnostics for specific TypeScript configuration.
 *
 * This function runs TypeScript's pre-emit diagnostics on the provided TypeScript configuration.
 *
 * This means it checks for errors in your TypeScript code before it gets compiled to JavaScript.
 *
 * Catching errors at this stage can save time during the development process.
 */
export async function zTSPreDiagnostics( tsConfig: ts.ParsedCommandLine, options: TZPreDiagnosticsOptions, activeConsole = ConsoleManager.$ ) {
    // ---
    const {
        useCache = true,
        haltOnError = false,
    } = options;

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

    const compilerHost = await zTSGetCompilerHost( {
        ... tsConfig,
        options: {
            // We need to create a temporary directory for the diagnostics to avoid conflicts with the main output directory.
            outDir: path.join( os.tmpdir(), zTSPreDiagnostics.name + "-" + Date.now() ),
            ... tsConfig.options,
        }
    } );

    const program = ts.createProgram( tsConfig.fileNames, Object.assign( {

    }, tsConfig.options, {
        composite: false,
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
        error.message = "\n" + diagnostics.map( error => zTSCustomizeDiagnostic( error ) ).join( "\n\n" );

        activeConsole.error( error );

        if ( haltOnError || tsConfig.options.noEmitOnError ) {
            process.exit( 1 );
        }
    }

    return diagnostics;
}

export async function zTSCreateDeclaration( tsConfig: ts.ParsedCommandLine, config: IZConfigInternal, activeConsole = ConsoleManager.$ ) {
    // Remove old declaration .d.ts files
    const declarationPath = tsConfig.options.declarationDir || tsConfig.options.outDir;

    if ( ! declarationPath ) {
        throw new Error( `${ tsConfig.options.configFilePath }: 'declarationDir' or 'outDir' is required` );
    }

    const compilerHost = await zTSGetCompilerHost( tsConfig );

    const program = ts.createProgram( tsConfig.fileNames, Object.assign( {}, tsConfig.options, {
        declaration: true,
        noEmit: false,
        emitDeclarationOnly: true,
        declarationDir: tsConfig.options.declarationDir || tsConfig.options.outDir,
    } as ts.CompilerOptions ), compilerHost, cacheProgram[ tsConfig.options.configFilePath as string ] );

    cacheProgram[ tsConfig.options.configFilePath as string ] = program;

    const result = program.emit();

    if ( result.diagnostics.length ) {
        const error = new Error();

        error.name = `\x1b[31mTypeScript declaration has ${ result.diagnostics.length } error(s)\x1b[0m config: ${ "file://" + tsConfig.options.configFilePath }`;
        error.message = "\n" + result.diagnostics.map( error => zTSCustomizeDiagnostic( error ) ).join( "\n\n" );

        activeConsole.error( error );
    } else {
        activeConsole.verbose( () => [
            zTSCreateDeclaration.name,
            `Declaration created for '${ tsConfig.options.configFilePath }'`
        ] );

        const projectPath = path.dirname( config.path );

        // Check if we need to rollup dts files.
        if ( config.inputDtsPath ) {
            const tsConfigExtractor = zTSConfigReadInternal(
                `${ projectPath }/tsconfig.api-extractor.json`,
                projectPath
            );

            const result = zApiExporter(
                projectPath,
                config,
                tsConfig,
                tsConfigExtractor,
                activeConsole
            );

            result?.succeeded && activeConsole.log( zApiExporter.name, "Writing - done",
                `'${ path.isAbsolute( config.outputDtsPath as string ) ? config.outputDtsPath : path.join( projectPath, config.outputDtsPath as string ) }'`
            );
        }
    }

    return result.diagnostics.length <= 0;
}

export function zTSDiagnosticInWorker( tsConfigFilePath: string, options: TZPreDiagnosticsWorkerOptions, host: DThreadHostInterface ) {
    ensureInWorker();

    // Hook console logs to thread messages.
    ConsoleManager.setInstance( new ConsoleThreadSend( host ) );

    const tsConfig = zTSConfigRead( null, path.dirname( tsConfigFilePath ) );

    host.sendLog( "run", util.inspect( options.config.outputName ) );

    return zTSPreDiagnostics( tsConfig, options );
}

export async function zTSDeclarationInWorker( tsConfigFilePath: string, config: IZConfigInternal, host: DThreadHostInterface ) {
    ensureInWorker();

    // Hook console logs to thread messages.
    ConsoleManager.setInstance( new ConsoleThreadSend( host ) );

    const tsConfig = zTSConfigRead( null, path.dirname( tsConfigFilePath ) );

    host.sendLog( "run", util.inspect( config.outputName ) );

    return zTSCreateDeclaration( tsConfig, config );
}

export async function zTSCreateDiagnosticWorker(
    tsConfig: ts.ParsedCommandLine,
    options: TZPreDiagnosticsWorkerOptions,
    activeConsole: ConsoleThreadFormat
) {
    if ( ! diagnosticWorkers.has( options.id ) ) {
        const preparePromise = zCreateResolvablePromise();

        diagnosticWorkersPreparing.set( options.id, preparePromise );

        preparePromise.await.then( () => diagnosticWorkersPreparing.delete( options.id ) );

        const { zCreateWorker } = ( await import( "@zenflux/worker" ) );

        const worker = await zCreateWorker( {
            name: "Diagnostic",
            id: options.id,
            display: tsConfig.options.configFilePath as string,
            workArgs: [ tsConfig.options.configFilePath, options ],
            workFunction: zTSDiagnosticInWorker,
            workFilePath: fileURLToPath( import.meta.url ),
        } );

        ConsoleThreadReceive.connect( worker, activeConsole );

        diagnosticWorkers.set( options.id, worker );

        preparePromise.resolve();
    }

    const thread = diagnosticWorkers.get( options.id );

    if ( ! thread ) {
        throw new Error( "Thread not found." );
    }

    if ( ! thread.isAlive() ) {
        diagnosticWorkers.delete( options.id );

        return zTSCreateDiagnosticWorker( tsConfig, options, activeConsole );
    }

    return new Promise( async ( resolve, reject ) => {
        // Main thread will wait for dependencies before starting the worker.
        await zTSWaitForDependencies( tsConfig, options.otherTSConfigs, activeConsole );

        const buildPromise = thread.run();

        buildPromise.catch( ( error ) => {
            activeConsole.error( "error", "from DI-" + options.id, "\n ->", error.stack ? error.stack : error );

            if ( options.haltOnError ) {
                throw error;
            }

            // Skip declaration worker if diagnostic worker errors.
            const declarationThread = declarationWorkers.get( options.id );

            if ( declarationThread ) {
                activeConsole.verbose( () => [
                    zTSCreateDiagnosticWorker.name,
                    `Skipping declaration worker ${ options.id }`
                ] );

                declarationThread.skipNextRun();//
            }
        } );

        buildPromise.then( resolve ).catch( reject );
    } );
}

export async function zTSCreateDeclarationWorker(
    tsConfig: ts.ParsedCommandLine,
    options: TZCreateDeclarationWorkerOptions,
    activeConsole: ConsoleThreadFormat,
) {
    if ( ! declarationWorkers.has( options.id ) ) {
        const { zCreateWorker } = ( await import( "@zenflux/worker" ) );

        const worker = await zCreateWorker( {
            name: "Declaration",
            id: options.id,
            display: tsConfig.options.configFilePath as string,
            workArgs: [ tsConfig.options.configFilePath, options.config ],
            workFunction: zTSDeclarationInWorker,
            workFilePath: fileURLToPath( import.meta.url ),
        } );

        ConsoleThreadReceive.connect( worker, activeConsole );

        declarationWorkers.set( options.id, worker );
    }

    const thread = declarationWorkers.get( options.id );

    if ( ! thread ) {
        throw new Error( "Thread not found." );
    }

    if ( ! thread.isAlive() ) {
        declarationWorkers.delete( options.id );

        return zTSCreateDeclarationWorker( tsConfig, options, activeConsole );
    }

    const diagnosticThreadId = options.id.replace( "DE", "DI" );

    const promise = new Promise( async ( resolve, reject ) => {
        // Main thread will wait for dependencies before starting the worker.
        await zTSWaitForDependencies( tsConfig, options.otherTSConfigs, activeConsole );

        const isDiagnosticPreparingPromise = diagnosticWorkersPreparing.get( diagnosticThreadId );

        if ( isDiagnosticPreparingPromise ) {
            activeConsole.verbose( () => [
                zTSCreateDeclarationWorker.name,
                `Waiting for diagnostic worker ${ diagnosticThreadId } to prepare`
            ] );

            await isDiagnosticPreparingPromise.await;

            activeConsole.verbose( () => [
                zTSCreateDeclarationWorker.name,
                `Done waiting for diagnostic worker ${ diagnosticThreadId } to prepare`
            ] );
        }

        // Get corresponding diagnostics worker.
        const diagnosticThread = diagnosticWorkers.get( diagnosticThreadId );

        if ( ! diagnosticThread ) {
            throw new Error( `Diagnostic worker ${ diagnosticThreadId } not found` );
        }

        activeConsole.verbose( () => [
            zTSCreateDeclarationWorker.name,
            `Waiting for diagnostic worker ${ diagnosticThreadId } to finish`
        ] );

        // Wait for diagnostics to finish before starting declaration worker.
        const shouldRun = await diagnosticThread?.waitForDone().catch( reject );

        activeConsole.verbose( () => [
            zTSCreateDeclarationWorker.name,
            `Done waiting for diagnostic worker ${ diagnosticThreadId }`
        ] );

        if ( ! shouldRun ) {
            return;
        }

        diagnosticThread.terminate();

        const buildPromise = thread.run();

        buildPromise.catch( ( error ) => {
            if ( error.message.includes( "Killed by diagnostic worker" ) ) {
                activeConsole.verbose( () => [
                    zTSCreateDeclarationWorker.name,
                    error.message
                ] );
            } else {
                activeConsole.error( "error", "from " + options.id, "\n ->", error.stack ? error.stack : error );
            }

            reject( error );
        } );

        buildPromise.then( resolve ).then( () =>{
            thread.terminate();
        } );
    } );

    promise.catch( () => {
    } ).finally( () => zTSResumeDependencies( tsConfig, activeConsole ) );

    return promise;
}

async function zTSWaitForDependencies(
    tsConfig: ts.ParsedCommandLine,
    otherTSConfigs: ts.ParsedCommandLine[],
    activeConsole = ConsoleManager.$
) {
    // If promise is already exist then await it.
    if ( waitingTSConfigs.has( tsConfig.options.configFilePath as string ) ) {
        const promise = waitingTSConfigs.get( tsConfig.options.configFilePath as string )?.promise;

        if ( promise?.isPending ) {
            return promise.await;
        }

        return;
    }

    const pkg = zTSGetPackageByTSConfig( tsConfig ),
        pkgDependencies = zWorkspaceGetWorkspaceDependencies( {
            [ pkg.json.name ]: pkg,
        } ),
        dependencies = pkgDependencies[ pkg.json.name ].dependencies;

    // If the package has dependencies
    if ( Object.keys( dependencies ).length ) {
        // If one of the dependencies is in other projects that are building at the same time.
        const availableDependencies: Record<string, true> = {};

        otherTSConfigs.forEach( ( c ) => {
            const pkg = zTSGetPackageByTSConfig( c );

            if ( dependencies[ pkg.json.name ] ) {
                availableDependencies[ pkg.json.name ] = true;
            }
        } );

        if ( Object.keys( availableDependencies ).length ) {
            activeConsole.verbose( () => [
                zTSWaitForDependencies.name,
                "Package:",
                util.inspect( pkg.json.name ),
                "Available dependencies:",
                util.inspect( Object.keys( availableDependencies ), { breakLength: Infinity } ),
            ] );

            const promise = zCreateResolvablePromise();

            // Insert current config to the waiting list.
            waitingTSConfigs.set( tsConfig.options.configFilePath as string, {
                promise,
                dependencies: availableDependencies
            } );

            await promise.await;

            activeConsole.verbose( () => [
                zTSWaitForDependencies.name,
                "Resume",
                "Package:",
                util.inspect( pkg.json.name ),
            ] );
        }
    }
}

async function zTSResumeDependencies(
    tsConfig: ts.ParsedCommandLine,
    activeConsole = ConsoleManager.$
) {
    if ( ! waitingTSConfigs.size ) {
        return;
    }

    const pkg = zTSGetPackageByTSConfig( tsConfig );

    // Loop through all waiting TSConfigs
    for ( const [ configFilePath, { promise, dependencies } ] of waitingTSConfigs ) {
        // If current resumed TSConfig is in the dependencies list then remove it from the dependencies list.
        if ( dependencies[ pkg.json.name ] ) {
            activeConsole.verbose( () => [
                zTSResumeDependencies.name,
                "Package:",
                util.inspect( zTSGetPackageByTSConfig( tsConfig ).json.name ),
                "Removing dependency:",
                util.inspect( pkg.json.name ),
            ] );

            delete dependencies[ pkg.json.name ];
        }

        // If no left dependencies then resolve the promise.
        if ( ! Object.keys( dependencies ).length ) {
            activeConsole.verbose( () => [
                zTSResumeDependencies.name,
                "Package:",
                util.inspect( pkg.json.name ),
                "Resuming",
            ] );

            // Remove the TSConfig from the waiting list.
            waitingTSConfigs.delete( configFilePath );

            promise.resolve();
        }
    }
}

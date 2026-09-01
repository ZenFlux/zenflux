/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 *
 * TypeScript 7 (native) diagnostics backend, opt-in via `useBetaTS7`.
 *
 * TypeScript 7 dropped the `ts.*` programmatic compiler API that `core/typescript.ts` is built on,
 * `ts.createProgram()` / `ts.getPreEmitDiagnostics()` and friends simply do not exist there.
 *
 * Instead it ships an out of process API under `typescript/unstable/sync`, which talks to the native
 * `tsgo` server over an RPC channel. This module wraps that API so `zTSPreDiagnostics()` can be served by
 * either backend without its callers knowing which one ran.
 *
 * It is `beta` because the API is published under `unstable/` and because TypeScript 7 turns a number of
 * TypeScript 5 deprecations into hard errors, opting in can surface new diagnostics on unchanged code.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import util from "node:util";

import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import type ts from "typescript";

import type {
    TZTS7Api,
    TZTS7Diagnostic,
    TZTS7ProjectConfig,
    TZPreDiagnosticsOptions
} from "@zenflux/cli/src/definitions/typescript";

import type { IZConfigInternal } from "@zenflux/cli/src/definitions/config";

/**
 * Environment switch, equivalent to passing `--useBetaTS7`.
 *
 * Useful in CI, where it can be set once instead of threaded through every command line.
 *
 * Note this is read, never written. Worker threads receive the resolved flag through their work args
 * (`TZPreDiagnosticsWorkerOptions`), writing it here would turn a per package opt-in into a global one.
 */
export const Z_TS7_ENV_FLAG = "Z_USE_BETA_TS7";

/**
 * Packages that may provide the TypeScript 7 API, in resolution order.
 *
 * `typescript7` is the recommended alias install, it lets a project keep TypeScript 5 for the rest of the
 * toolchain (rollup, api-extractor, eslint) while adding TypeScript 7 next to it:
 *
 *    npm pkg set devDependencies.typescript7="npm:typescript@^7.0.2"
 */
const TS7_PACKAGE_CANDIDATES = [
    "typescript7",
    "typescript",
    "@typescript/native-preview",
];

const TS7_API_SUBPATH = "./unstable/sync";

const requireModule = createRequire( import.meta.url );

let apiModulePromise: Promise<TZTS7Api | undefined> | undefined;

/**
 * The native server is expensive to spawn, so a single instance is shared.
 *
 * Parked on `globalThis` rather than in module scope, the CLI runs under `@zenflux/typescript-vm`, whose
 * loader can hand out more than one instance of the same module, which would defeat a module level
 * singleton and leave orphan server processes behind.
 */
const Z_TS7_API_GLOBAL = Symbol.for( "zenflux.ts7.api" );

/**
 * Function zTS7IsEnabled() - Resolves whether the TypeScript 7 diagnostics backend was opted into.
 *
 * Precedence, highest first:
 *  -. `--no-useBetaTS7` on the command line, or `Z_USE_BETA_TS7=0`, forces the TypeScript 5 backend.
 *  -. `--useBetaTS7` on the command line.
 *  -. `Z_USE_BETA_TS7` in the environment, convenient for CI.
 *  -. `useBetaTS7` in the zenflux config, this is how a single package can opt in on its own.
 */
export function zTS7IsEnabled( config?: IZConfigInternal ) {
    const env = process.env[ Z_TS7_ENV_FLAG ];

    if ( process.argv.includes( "--no-useBetaTS7" ) || "0" === env || "false" === env ) {
        return false;
    }

    if ( process.argv.includes( "--useBetaTS7" ) ) {
        return true;
    }

    if ( env && "0" !== env && "false" !== env ) {
        return true;
    }

    return true === config?.useBetaTS7;
}

/**
 * Function zTS7ImportApi() - Loads the resolved API module.
 *
 * The CLI runs under `@zenflux/typescript-vm`, whose loader owns `import()` and is meant for the
 * project's own TypeScript sources, handing it a prebuilt package from `node_modules` either fails to
 * resolve or never settles.
 *
 * `require()` sidesteps the VM loader entirely, and since Node 22 it handles ESM too, which is what the
 * TypeScript 7 API ships. The dynamic `import()` forms are kept as fallbacks for runtimes where
 * `require()` of an ES module is unavailable.
 */
async function zTS7ImportApi( apiPath: string, packageName: string ) {
    const errors: string[] = [];

    try {
        return requireModule( apiPath );
    } catch( error: any ) {
        errors.push( `require(${ apiPath }): ${ error.message }` );
    }

    for ( const specifier of [ pathToFileURL( apiPath ).href, packageName + "/unstable/sync" ] ) {
        try {
            return await import( specifier );
        } catch( error: any ) {
            errors.push( `import(${ specifier }): ${ error.message }` );
        }
    }

    throw new Error(
        "Unable to load the TypeScript 7 API, tried:\n" + errors.map( i => "  - " + i ).join( "\n" )
    );
}

/**
 * Function zTS7ResolveApiModule() - Locates and loads the TypeScript 7 `unstable/sync` API.
 *
 * Resolution is done by hand rather than by a bare `import()` so that a TypeScript 5 install sitting under
 * the `typescript` specifier is skipped instead of throwing, and so the failure message can name the
 * package that was actually found.
 */
export async function zTS7ResolveApiModule( activeConsole = ConsoleManager.$ ): Promise<TZTS7Api | undefined> {
    if ( apiModulePromise ) {
        return apiModulePromise;
    }

    return apiModulePromise = ( async() => {
        const candidates = process.env.Z_TS7_PACKAGE
            ? [ process.env.Z_TS7_PACKAGE ]
            : TS7_PACKAGE_CANDIDATES;

        const attempts: string[] = [];

        for ( const candidate of candidates ) {
            let packageJsonPath: string;

            try {
                packageJsonPath = requireModule.resolve( candidate + "/package.json" );
            } catch {
                attempts.push( `${ candidate }: not installed` );
                continue;
            }

            const packageJson = JSON.parse( fs.readFileSync( packageJsonPath, "utf-8" ) ),
                subpath = packageJson.exports?.[ TS7_API_SUBPATH ];

            if ( ! subpath ) {
                attempts.push( `${ candidate }@${ packageJson.version }: no '${ TS7_API_SUBPATH }' export, TypeScript 7 is required` );
                continue;
            }

            const apiPath = path.resolve( path.dirname( packageJsonPath ), subpath );

            activeConsole.verbose( () => [
                "typescript-ts7",
                zTS7ResolveApiModule.name,
                `Using ${ util.inspect( candidate ) }@${ packageJson.version } from ${ util.inspect( apiPath ) }`
            ] );

            const api = await zTS7ImportApi( apiPath, candidate );

            // A module namespace object is frozen, hand back a plain record instead of mutating it.
            return {
                API: api.API,
                zVersion: packageJson.version as string,
            } as TZTS7Api;
        }

        activeConsole.warn(
            "typescript-ts7",
            "resolve",
            "'--useBetaTS7' was requested but no TypeScript 7 install was found, falling back to TypeScript 5.\n" +
            attempts.map( i => "  - " + i ).join( "\n" ) + "\n" +
            "  Install it next to TypeScript 5 with:\n" +
            "    npm pkg set devDependencies.typescript7=\"npm:typescript@^7.0.2\" && npm install"
        );

        return undefined;
    } )();
}

/**
 * Function zTS7GetApi() - Returns a process wide TypeScript 7 API instance.
 *
 * Each instance spawns a native server process, so it is shared across every config handled by this
 * process, that is what makes `typecheck` over a whole workspace cheap.
 */
function zTS7GetApi( activeConsole = ConsoleManager.$ ) {
    const store = globalThis as any;

    // The promise is cached, not its result, concurrent callers must not each spawn a server.
    if ( store[ Z_TS7_API_GLOBAL ] ) {
        return store[ Z_TS7_API_GLOBAL ] as Promise<any>;
    }

    return store[ Z_TS7_API_GLOBAL ] = ( async() => {
        const api = await zTS7ResolveApiModule( activeConsole );

        if ( ! api ) {
            return;
        }

        const instance = new api.API( { cwd: process.cwd() } );

        process.once( "exit", zTS7CloseApi );
        process.once( "SIGINT", zTS7CloseApi );

        return instance;
    } )();
}

/**
 * Function zTS7CloseApi() - Shuts the native server down.
 */
export function zTS7CloseApi() {
    const store = globalThis as any,
        pending = store[ Z_TS7_API_GLOBAL ] as Promise<any> | undefined;

    if ( ! pending ) {
        return;
    }

    store[ Z_TS7_API_GLOBAL ] = undefined;

    pending.then( instance => instance?.close() ).catch( () => {
        // The server may already be gone, nothing to do about it.
    } );
}

/**
 * Function zTS7CreateProjectConfig() - Produces the config file to hand to the TypeScript 7 API.
 *
 * The TypeScript 5 backend injects workspace `paths` straight into the in memory `CompilerOptions` it
 * hands to `ts.createProgram()`. The TypeScript 7 API takes a config *file* instead, so the same mappings
 * have to be materialized on disk.
 *
 * The generated file lives next to the original and only adds `paths`, which keeps every relative
 * `extends` / `include` / `files` entry resolving exactly as it did before.
 */
export function zTS7CreateProjectConfig(
    tsConfig: ts.ParsedCommandLine,
    paths: ts.ParsedCommandLine[ "options" ][ "paths" ] | undefined,
    activeConsole = ConsoleManager.$
): TZTS7ProjectConfig {
    const configFilePath = tsConfig.options.configFilePath as string;

    // `zTSResolveWorkspacePaths()` bails out when the project declares `rootDir`, nothing to materialize.
    if ( ! paths || ! Object.keys( paths ).length ) {
        return { fileName: configFilePath, dispose: () => undefined };
    }

    /**
     * A random token rather than a counter, a multi config package runs its configs concurrently and they
     * all resolve to the same `tsconfig.json`, so a shared name would let the first `dispose()` delete the
     * file the others are still reading.
     */
    const projectPath = path.dirname( configFilePath ),
        fileName = path.join( projectPath, `.tsconfig.z-ts7.${ crypto.randomUUID() }.json` );

    fs.writeFileSync( fileName, JSON.stringify( {
        extends: "./" + path.basename( configFilePath ),
        compilerOptions: { paths },
    }, null, 4 ) );

    activeConsole.verbose( () => [
        "typescript-ts7",
        zTS7CreateProjectConfig.name,
        `Generated ${ util.inspect( fileName ) } with ${ Object.keys( paths ).length } path mapping(s)`
    ] );

    return {
        fileName,
        dispose: () => {
            try {
                fs.rmSync( fileName, { force: true } );
            } catch {
                // Best effort, a leftover temp config is harmless.
            }
        },
    };
}

/**
 * Function zTS7CustomizeDiagnostic() - TypeScript 7 counterpart of `zTSCustomizeDiagnostic()`.
 *
 * Keeps the output identical between the two backends, quoted identifiers are inspected, absolute file
 * paths become `file://` links, and the originating file is appended when the message does not name one.
 */
export function zTS7CustomizeDiagnostic( diagnostic: TZTS7Diagnostic ) {
    let isIntroduceFile = false;

    const chain = [ diagnostic, ... ( diagnostic.messageChain ?? [] ) ],
        str = chain.map( i => i.text ).join( "\n" );

    const customized = str.replace( /'([^']*)'/g, function( _, match ) {
        const pathSegments = match.split( "/" );

        if ( match.startsWith( "/" ) && pathSegments[ pathSegments.length - 1 ].includes( "." ) ) {
            // Some IDE's support path links
            isIntroduceFile = true;
            return util.inspect( "file://" + match );
        } else {
            return util.inspect( match );
        }
    } );

    if ( ! isIntroduceFile && diagnostic.fileName ) {
        let filename = diagnostic.fileName;

        if ( diagnostic.line !== undefined && diagnostic.character !== undefined ) {
            filename += `:${ diagnostic.line }:${ diagnostic.character }`;
        }

        return customized + " caused by: file://" + filename;
    }

    return customized;
}

/**
 * Function zTS7ResolvePosition() - Turns a character offset into a 1 based line / column pair.
 *
 * TypeScript 7 diagnostics carry `pos` / `end` offsets rather than a `SourceFile` handle, so the mapping
 * is done here against the file on disk. Line starts are memoized per run, a single failing file usually
 * produces many diagnostics.
 */
function zTS7ResolvePosition( fileName: string, pos: number, lineStartsCache: Map<string, number[]> ) {
    let lineStarts = lineStartsCache.get( fileName );

    if ( ! lineStarts ) {
        let content: string;

        try {
            content = fs.readFileSync( fileName, "utf-8" );
        } catch {
            return {};
        }

        lineStarts = [ 0 ];

        for ( let i = 0; i < content.length; i++ ) {
            if ( "\n" === content[ i ] ) {
                lineStarts.push( i + 1 );
            }
        }

        lineStartsCache.set( fileName, lineStarts );
    }

    // Binary search for the last line start that is at or before `pos`.
    let low = 0,
        high = lineStarts.length - 1;

    while ( low < high ) {
        const mid = Math.ceil( ( low + high ) / 2 );

        if ( lineStarts[ mid ] <= pos ) {
            low = mid;
        } else {
            high = mid - 1;
        }
    }

    return {
        line: low + 1,
        character: pos - lineStarts[ low ] + 1,
    };
}

/**
 * Function zTS7PreDiagnostics() - TypeScript 7 counterpart of `zTSPreDiagnostics()`.
 *
 * Mirrors what `ts.getPreEmitDiagnostics()` aggregates: config file parsing, program wide, syntactic,
 * global and semantic diagnostics. Declaration diagnostics are deliberately left out, the TypeScript 5
 * backend disables `declaration` for its diagnostic program too.
 *
 * Returns plain serializable objects, unlike `ts.Diagnostic` these survive the `JSON.stringify()` the
 * worker transport performs on a work function's return value.
 */
export async function zTS7PreDiagnostics(
    tsConfig: ts.ParsedCommandLine,
    options: TZPreDiagnosticsOptions,
    paths: ts.ParsedCommandLine[ "options" ][ "paths" ] | undefined,
    activeConsole = ConsoleManager.$
): Promise<TZTS7Diagnostic[] | undefined> {
    const { haltOnError = false } = options;

    const api = await zTS7GetApi( activeConsole );

    if ( ! api ) {
        return;
    }

    const configFilePath = tsConfig.options.configFilePath as string,
        projectConfig = zTS7CreateProjectConfig( tsConfig, paths, activeConsole );

    let raw: TZTS7Diagnostic[];

    try {
        const snapshot = api.updateSnapshot( { openProjects: [ projectConfig.fileName ] } ),
            project = snapshot.getProject( projectConfig.fileName );

        if ( ! project ) {
            throw new Error( `TypeScript 7 could not open project ${ util.inspect( projectConfig.fileName ) }` );
        }

        const program = project.program;

        raw = [
            ... program.getConfigFileParsingDiagnostics(),
            ... program.getProgramDiagnostics(),
            ... program.getSyntacticDiagnostics(),
            ... program.getGlobalDiagnostics(),
            ... program.getSemanticDiagnostics(),
        ];

        snapshot.dispose();
    } finally {
        projectConfig.dispose();
    }

    const lineStartsCache = new Map<string, number[]>();

    // `DiagnosticCategory.Error` is `1`, same as TypeScript 5.
    const diagnostics = raw
        .filter( i => 1 === i.category )
        .map( i => ( {
            ... i,
            // The generated temp config is an implementation detail, report against the real one.
            fileName: i.fileName === projectConfig.fileName ? configFilePath : i.fileName,
            ... ( i.fileName ? zTS7ResolvePosition( i.fileName, i.pos, lineStartsCache ) : {} ),
        } ) );

    if ( diagnostics.length ) {
        const error = new Error();

        error.name = `\x1b[31mTypeScript validation has ${ diagnostics.length } error(s)\x1b[0m config: ${ "file://" + configFilePath }`;
        error.message = "\n" + diagnostics.map( i => zTS7CustomizeDiagnostic( i ) ).join( "\n\n" );

        activeConsole.error( error );

        if ( haltOnError || tsConfig.options.noEmitOnError ) {
            zTS7CloseApi();
            process.exit( 1 );
        }
    }

    return diagnostics;
}

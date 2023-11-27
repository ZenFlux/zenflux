/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import fs from "node:fs";
import process from "node:process";
import path from "node:path";
import util from "node:util";

import ts from "typescript";

import { console } from "@zenflux/cli/src/modules/console";

import type { TZFormatType } from "@zenflux/cli/src/definitions/zenflux";

const pathsCache: { [ key: string ]: string } = {},
    configCache: { [ key: string ]: ts.ParsedCommandLine } = {},
    configValidationCache: { [ key: string ]: boolean } = {};

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
        return customized + " caused by: file://" + diagnostic.file?.fileName;
    }

    return customized;
}

/**
 * Function zTSConfigGetPath() - This function returns the path to the TypeScript configuration file based on the specified format.
 * It checks for different TypeScript configuration files depending on the environment and format.
 */
export function zTSConfigGetPath( format: TZFormatType | null, targetPath: string, showErrors = true ) {
    const cacheKey = targetPath + format ? "_" + format : "";

    if ( pathsCache[ cacheKey ] ) {
        return pathsCache[ cacheKey ];
    }

    const targetExist = ( path: string ) => {
        console.verbose( () => `${ zTSConfigGetPath.name }() -> Checking if '${ path }' file exists` );

        const result = fs.existsSync( path );

        console.verbose( () => `${ zTSConfigGetPath.name }() -> '${ path }' ${ result ? "found" : "not found" }` );

        return result;
    };

    const getPath = ( targetPath: string ) => {
        if ( "development" === process.env.NODE_ENV ) {
            const tsConfigDevFormatPath = path.join( targetPath, `tsconfig.${ format }.dev.json` ),
                tsConfigDevPath = path.join( targetPath, "tsconfig.dev.json" );

            if ( targetExist( tsConfigDevFormatPath ) ) {
                return tsConfigDevFormatPath;
            } else if ( targetExist( tsConfigDevPath ) ) {
                return tsConfigDevPath;
            }
        }

        const tsConfigFormatPath = path.join( targetPath, `tsconfig.${ format }.json` );

        if ( targetExist( tsConfigFormatPath ) ) {
            return tsConfigFormatPath;
        }

        const tsConfigPath = path.join( targetPath, "tsconfig.json" );

        if ( targetExist( tsConfigPath ) ) {
            return tsConfigPath;
        }
    };

    const tsConfigPath = getPath( targetPath );

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

    configCache[ cacheKey ] = content;

    content.options.rootDir = content.options.rootDir || projectPath;
    content.options.configFilePath = tsConfigPath;

    return content;
}

/**
 * Function zTSPreDiagnostics() - Runs pre-diagnostics for specific TypeScript configuration.
 */
export function zTSPreDiagnostics( tsConfig: ts.ParsedCommandLine, useCache = true ) {
    /**
     * Validation should run only once per tsconfig.json file, validation and declaration generation
     * should be based on main `tsconfig.json` file, not on `tsconfig.es.json` or `tsconfig.es.dev.json`, etc.
     */
    if ( useCache && configValidationCache[ tsConfig.options.configFilePath as string ] ) {
        console.verbose( () => `${ zTSPreDiagnostics.name }() -> Skipping validation for '${ tsConfig.options.configFilePath }', already validated` );
        return;
    }

    const program = ts.createProgram( tsConfig.fileNames, Object.assign( tsConfig.options, {
        options: {
            noEmit: true,
            declaration: false,
        }
    } as ts.ParsedCommandLine ) );

    const diagnostics = ts.getPreEmitDiagnostics( program );

    configValidationCache[ tsConfig.options.configFilePath as string ] = true;

    if ( diagnostics.length ) {
        const error = new Error();

        error.name = `\x1b[31mTypeScript validation has ${ diagnostics.length } error(s)\x1b[0m`;
        error.message = "\n" + diagnostics.map( error => zCustomizeDiagnostic( error ) ).join( "\n\n" );

        console.error( error );

        if ( tsConfig.options.noEmitOnError ) {
            process.exit( 1 );
        }
    }
}

/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import fs from "node:fs";
import process from "node:process";
import path from "node:path";

import ts from "typescript";

import { console } from "@zenflux/cli/src/modules/console";

import type { TZFormatType } from "@zenflux/cli/src/definitions/zenflux";

const pathsCache: { [ key: string ]: string } = {},
    configCache: { [ key: string ]: ts.ParsedCommandLine } = {};

/**
 * This function returns the path to the TypeScript configuration file based on the specified format.
 * It checks for different TypeScript configuration files depending on the environment and format.
 */
export function zTSConfigGetPath( format: TZFormatType, targetPath: string, showErrors = true ) {
    if ( pathsCache[ targetPath ] ) {
        return pathsCache[ targetPath ];
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
        return pathsCache[ targetPath ] = tsConfigPath;
    }

    if ( showErrors ) {
        console.error( "tsconfig.json not found" );
    }
}

export function zTSConfigRead( format: TZFormatType, projectPath: string ) {
    if ( configCache[ projectPath ] ) {
        return configCache[ projectPath ];
    }

    const tsConfigPath = zTSConfigGetPath( format, projectPath, false );

    if ( ! tsConfigPath ) {
        throw new Error( "tsconfig.json not found" );
    }

    const data = ts.readConfigFile( tsConfigPath, ts.sys.readFile );

    if ( data.error ) {
        const error = new Error();

        error.cause = tsConfigPath;
        error.name = "TypeScript Configuration Error";
        error.message = ts.flattenDiagnosticMessageText( data.error.messageText, "\n" );

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
        error.name = "TypeScript Configuration Parsing Error";
        error.message = content.errors.map(
            error => ts.flattenDiagnosticMessageText( error.messageText, "\n" )
        ).join( "\n" );

        throw error;

    }

    configCache[ tsConfigPath ] = content;

    content.options.configFilePath = tsConfigPath;

    return content;
}

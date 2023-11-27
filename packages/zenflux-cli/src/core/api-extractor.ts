/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import process from "node:process";
import util from "node:util";

import { Extractor, ExtractorConfig } from "@microsoft/api-extractor";

import console from "@zenflux/cli/src/modules/console";

export function zApiExporter( projectPath: string, inputPath: string, outputPath: string ) {
    console.verbose( () => `${ zApiExporter.name }() -> ${ util.inspect( {
        projectPath,
        inputPath,
        outputPath,
    } ) }` );

    const extractorConfig: ExtractorConfig = ExtractorConfig.prepare( {
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
    } );

    // Invoke API Extractor
    return Extractor.invoke( extractorConfig, {
        localBuild: true,
        showDiagnostics: process.env.NODE_ENV === "development",

        messageCallback( message ) {
            if ( process.env.NODE_ENV === "development" ) {
                console.log( message.text );
                return;
            }

            switch ( message.logLevel ) {
                case "error":
                    console.error( message.text );
                    break;
                case "warning":
                    console.warn( message.text );
                    break;
                case "verbose":
                    console.verbose( () => `${ zApiExporter.name }() -> ${ message.text }` );
                    break;
            }
        }
    } );
}

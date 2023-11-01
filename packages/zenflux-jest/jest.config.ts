import { Config } from "@jest/types";

import fs from "fs";
import path from "path";

const config: Config.InitialOptions = {
    rootDir: path.resolve( __dirname, "../.." ),

    projects: getValidProjects(),

    verbose: true,
};

function getValidProjects() {
    const rootDir = path.resolve( __dirname, ".." ); // Assuming jest.config.ts is in the root directory
    const projectFiles = fs.readdirSync( rootDir );

    return projectFiles
        .filter( ( file ) => {
            const fullPath = path.join( rootDir, file );
            return (
                fs.statSync( fullPath ).isDirectory() &&
                file !== "zenflux-jest" && // Exclude the "zenflux-jest" folder
                fs.existsSync( path.join( fullPath, "jest.config.ts" ) )
            );
        } )
        .map( ( projectDir ) => `<rootDir>/packages/${ projectDir }/jest.config.ts` );
}

export default config;

import util from "node:util";
import process from "node:process";
import path from "node:path";
import fs from "node:fs";
import child_process from "node:child_process";

import { CommandConfigBase } from "@zenflux/cli/src/base/command-config-base";
import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import type { IZConfigInternal } from "@zenflux/cli/src/definitions/config";

export default class Lint extends CommandConfigBase {

    public async runImpl() {
        const startTime = Date.now();
        const configs = this.getConfigs();

        if ( ! configs.length ) {
            ConsoleManager.$.log( "Lint", "config", "no available configs found" );
            return;
        }

        const isMultiplePackages = configs.length > 1;
        let passed = 0;
        let failed = 0;

        if ( isMultiplePackages ) {
            ConsoleManager.$.log( "Lint", "start", `linting ${ util.inspect( configs.length ) } packages in parallel` );

            const results = await Promise.all( configs.map( async ( config ) => this.runLintForConfig( config ) ) );

            results.forEach( ( result ) => {
                if ( result ) {
                    passed++;
                } else {
                    failed++;
                }
            } );
        } else {
            ConsoleManager.$.log( "Lint", "start", "linting single package" );

            const result = await this.runLintForConfig( configs[ 0 ] );

            if ( result ) {
                passed++;
            } else {
                failed++;
            }
        }

        const totalTime = Date.now() - startTime;
        ConsoleManager.$.log( "Lint", "done",
            `Passed: ${ util.inspect( passed ) }, Failed: \x1b[31m${ failed }\x1b[0m, Took ${ util.inspect( totalTime ) }ms`
        );

        if ( failed > 0 ) {
            process.exit( 1 );
        }
    }

    private hasLocalESLintConfig( projectPath: string ): boolean {
        const candidates = [
            "eslint.config.js",
            ".eslintrc",
            ".eslintrc.js",
            ".eslintrc.json",
            ".eslintrc.yaml",
            ".eslintrc.yml",
        ];

        for ( const candidate of candidates ) {
            if ( fs.existsSync( path.join( projectPath, candidate ) ) ) {
                return true;
            }
        }

        return false;
    }

    private getRunner(): { cmd: string; args: string[] } {
        const isWithinBun = typeof ( globalThis as { Bun?: unknown } ).Bun !== "undefined";

        if ( isWithinBun ) {
            return { cmd: "eslint", args: [] };
        }

        let bunAvailable = false;
        try {
            child_process.execSync( "bun --version", { stdio: "ignore" } );
            bunAvailable = true;
        } catch {}

        if ( bunAvailable ) {
            return { cmd: "bunx", args: [ "--bun", "eslint" ] };
        }

        return { cmd: "eslint", args: [] };
    }

    private collectESLintArgs(): string[] {
        const args: string[] = [];

        if ( process.argv.includes( "--fix" ) ) {
            args.push( "--fix" );
        }

        const maxWarningsIdx = process.argv.indexOf( "--max-warnings" );
        if ( maxWarningsIdx > -1 && process.argv[ maxWarningsIdx + 1 ] ) {
            args.push( "--max-warnings", process.argv[ maxWarningsIdx + 1 ] );
        }

        const extIdx = process.argv.indexOf( "--ext" );
        if ( extIdx > -1 && process.argv[ extIdx + 1 ] ) {
            args.push( "--ext", process.argv[ extIdx + 1 ] );
        }

        const formatIdx = process.argv.indexOf( "--format" );
        if ( formatIdx > -1 && process.argv[ formatIdx + 1 ] ) {
            args.push( "--format", process.argv[ formatIdx + 1 ] );
        }

        return args;
    }

    private async runLintForConfig( config: IZConfigInternal ): Promise<boolean> {
        const projectPath = path.dirname( config.path );
        const runner = this.getRunner();
        const args = this.collectESLintArgs();

        const hasLocal = this.hasLocalESLintConfig( projectPath );
        const isWithinBun = typeof ( globalThis as { Bun?: unknown } ).Bun !== "undefined";

        const cwd = isWithinBun ? process.cwd() : ( hasLocal ? projectPath : process.cwd() );
        const target = projectPath;

        const fullArgs = [ ...runner.args, target, ...args ];

        try {
            const res = child_process.spawnSync( runner.cmd, fullArgs, {
                stdio: "inherit",
                cwd,
                env: { ...process.env },
            } );

            return res.status === 0;
        } catch ( error ) {
            ConsoleManager.$.error( "Lint", "error", `Failed to lint ${ util.inspect( config.outputName ) }:`, error );
            return false;
        }
    }

    public showHelp( name: string ) {
        super.showHelp( name );

        ConsoleManager.$.log( util.inspect( {
            "--fix": {
                description: "Apply automatic fixes where possible",
            },
            "--max-warnings": {
                description: "Fail if number of warnings is greater than this",
                examples: [ "--max-warnings 0" ]
            },
            "--ext": {
                description: "Specify file extensions",
                examples: [ "--ext .ts,.tsx" ]
            },
            "--format": {
                description: "Specify the formatter for ESLint output",
                examples: [ "--format stylish" ]
            }
        } ) );

        ConsoleManager.$.log( "Examples:" );
        ConsoleManager.$.log( "  " + name + "                    # Lint all packages in workspace" );
        ConsoleManager.$.log( "  " + name + " --workspace \"react-*\"  # Lint packages matching pattern" );
        ConsoleManager.$.log( "  " + name + " --workspace zenflux-cli # Lint specific package" );
        ConsoleManager.$.log( "  " + name + " --fix --max-warnings 0  # Fix and fail on warnings" );
    }
}



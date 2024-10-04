/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import path from "node:path";
import process from "node:process";

import util from "node:util";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import { CommandConfigBase } from "@zenflux/cli/src/base/command-config-base";

import { rollupConsole, tsDeclarationConsole, tsDiagnosticConsole } from "@zenflux/cli/src/console/console-build";

import { zRollupGetConfig } from "@zenflux/cli/src/core/rollup";

import { zTSConfigRead, zTSCreateDeclarationWorker, zTSCreateDiagnosticWorker } from "@zenflux/cli/src/core/typescript";

import { Z_CONFIG_DEFAULTS } from "@zenflux/cli/src/definitions/config";

import type { RollupOptions } from "rollup";
import type { ConsoleThreadFormat } from "@zenflux/cli/src/console/console-thread-format";
import type { IZConfigInternal } from "@zenflux/cli/src/definitions/config";

export abstract class CommandBuildBase extends CommandConfigBase {
    private rollupConfig: {
        [ key: string ]: RollupOptions[]
    } = {};

    public constructor( protected args: string[], protected options: any = {} ) {
        super( args, options );

        // TODO: Avoid using `process.env.NODE_ENV` use CommandBase instead
        if ( args.includes( "--dev" ) ) {
            process.env.NODE_ENV = "development";
        }
    }

    protected async initialize() {
        // Ensure that original console instance is saved.
        ConsoleManager.getInstance();

        // Set global console instance as rollupConsole.
        ConsoleManager.setInstance( this.getRollupConsole() );

        return super.initialize();
    }

    public showHelp( name: string ) {
        super.showHelp( name );

        // Describe what the `--dev` option does for the command
        ConsoleManager.$.log( util.inspect( {
            "--dev": {
                description: "Run in development mode",
                behaviors: [
                    "Shows all api-exporter diagnostics",
                    "No minification",
                    "Loading different tsconfig file: tsconfig.{format}.dev.json",
                    "Sets process.env.NODE_ENV to 'development'"
                ]
            },
            "--no-diagnostic": {
                description: "Disable typescript diagnostics",
                behaviors: [
                    "No typescript diagnostics"
                ]
            },
            "--no-declaration": {
                description: "Disable typescript declaration",
                behaviors: [
                    "No declaration file generation",
                    "No api-exporter will be used"
                ]
            },
        } ) );
    }

    public async loadConfigs() {
        const promise = super.loadConfigs();

        await promise;

        await Promise.all( this.getConfigs().map( async config => {
            this.getRollupConsole().verbose( () => [
                this.constructor.name,
                this.loadConfigs.name,
                `Start building rollup config for: ${ util.inspect( config.outputName ) } config path: ${ util.inspect( config.path ) }`
            ] );

            this.rollupConfig[ config.path + "-" + config.outputName ] = await this.getConfigForEachFormat( config );
        } ) );

        return promise;
    }

    protected getRollupConsole(): ConsoleThreadFormat {
        return rollupConsole;
    }

    protected getTSDiagnosticsConsole(): ConsoleThreadFormat {
        return tsDiagnosticConsole;
    }

    protected getTSDeclarationConsole(): ConsoleThreadFormat {
        return tsDeclarationConsole;
    }

    protected getTotalDiagnosticMessage( passed: number, failed: number, startTimestamp: number ) {
        return [
            `Passed: ${ util.inspect( passed ) }, Failed: \x1b[31m${ failed }\x1b[0m`,
            `Toke ${ util.inspect( Date.now() - startTimestamp ) }ms`
        ];
    }

    protected async handleTSDiagnostics( config: IZConfigInternal, options = {
        useCache: false,
        haltOnError: process.argv.includes( "--haltOnDiagnosticError" ),
    } ) {
        if ( process.argv.includes( "--no-diagnostic" ) ) {
            return;
        }

        const tsDiagnosticConsole = this.getTSDiagnosticsConsole(),
            id = this.getIdByConfig( config ),
            otherConfigs = this.getConfigs().filter( ( c ) => c !== config );

        // It should be aware about all other dependencies that are proceeding at this time.
        const otherTSConfigs = otherConfigs.map( ( c ) => zTSConfigRead( null, path.dirname( c.path ) ) );

        tsDiagnosticConsole.log( "send", "to DS-" + id, util.inspect( config.outputName ) );

        const promise = zTSCreateDiagnosticWorker( zTSConfigRead( null, path.dirname( config.path ) ), {
            id,
            otherTSConfigs,
            config,
            ... options
        }, tsDiagnosticConsole );

        promise.catch( () => {} ).then( () => {
            tsDiagnosticConsole.log( "recv", "from DS-" + id, util.inspect( config.outputName ) );
        } );

        return promise;
    }

    protected async handleTSDeclaration( config: IZConfigInternal ) {
        if ( process.argv.includes( "--no-declaration" ) ) {
            return;
        }

        const tsDeclarationConsole = this.getTSDeclarationConsole(),
            id = this.getIdByConfig( config ),
            otherConfigs = this.getConfigs().filter( ( c ) => c !== config ),
            otherTSConfigs = otherConfigs.map( ( c ) => zTSConfigRead( null, path.dirname( c.path ) ) );

        tsDeclarationConsole.log( "send", "to DE-" + id, util.inspect( config.outputName ) );

        const result = zTSCreateDeclarationWorker( zTSConfigRead( null, path.dirname( config.path ) ), {
            id,
            config,
            otherTSConfigs
        }, tsDeclarationConsole );

        result.catch( () => {} ).then( () => {
            tsDeclarationConsole.log( "recv", "from DE-" + id, util.inspect( config.outputName ) );
        } );

        return result;
    }

    protected async onBuiltAll() {
        const configs = this.getConfigs(),
            startTimestamp = Date.now(),
            promises: any[] = [];

        let passed = 0,
            failed = 0;

        // TODO: Add cache + optimization.
        configs.forEach( config => this.handleTSDiagnostics( config ).catch( () => {
            // Do nothing.
        }) );

        configs.forEach( ( config ) => {
            const promise = this.handleTSDeclaration( config )
                .then( () => passed++ )
                .catch( () => failed++ );

            promises.push( promise );
        } );

        if ( ! process.argv.includes( "--no-declaration" ) ) {
            return Promise.all( promises ).finally( () => {
                this.getTSDeclarationConsole().log(
                    "Total",
                    ... this.getTotalDiagnosticMessage( passed, failed, startTimestamp )
                );
            } );
        }
    }

    protected getRollupConfig( config: IZConfigInternal ) {
        // TODO: Use helper function if its used in more than one place
        return this.rollupConfig[ config.path + "-" + config.outputName ];
    }

    protected getIdByConfig( config: IZConfigInternal ) {
        return this.getConfigs().indexOf( config );
    }

    protected getUniqueConfigs( configs: IZConfigInternal[] ) {
        return configs.filter( ( config, index, self ) => {
            // Should filter duplicate config.paths.
            return index === self.findIndex( ( c ) => {
                return c.path === config.path;
            } );
        } );
    }

    private async getConfigForEachFormat( config: IZConfigInternal ) {
        return Promise.all( config.format.map( format => zRollupGetConfig( {
            ... Z_CONFIG_DEFAULTS,
            ... config,
            format
        }, path.dirname( config.path ) ) ) );
    }
}

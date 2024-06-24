/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import process from "node:process";
import path from "node:path";
import util from "node:util";

import { zFindRootPackageJsonPath } from "@zenflux/utils/src/workspace";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import { zGlobalInitPaths } from "@zenflux/cli/src/core/global";
import { zWorkspaceGetRootPackageName } from "@zenflux/cli/src/core/workspace";

export abstract class CommandBase {
    protected initializePromise: Promise<void> | undefined;

    declare protected paths: ReturnType<typeof zGlobalInitPaths>;

    protected initPathsArgs = {
        cwd: process.cwd(),
        workspaceName: zWorkspaceGetRootPackageName( { silent: true } ),
        workspacePath: path.dirname( zFindRootPackageJsonPath( { silent: true } ) ),
    } as Parameters<typeof zGlobalInitPaths>[ 0 ];

    public constructor( protected args: string[], protected options: any = {} ) {
        options.name = options.name ?? this.constructor.name;

        if ( args.includes( "--help" ) ) {
            this.showHelp( options.name );
            return;
        }

        this.initializePromise = this.initialize?.() ?? Promise.resolve();

        this.initializePromise.then( () => {
            // Allow to override paths in the child class.
            this.paths = zGlobalInitPaths( this.initPathsArgs );
        } );

    }

    public showHelp( name = this.options.name, optionsText = "options" ): void {
        ConsoleManager.$.log( `Usage: ${ util.inspect( name ) } ${ optionsText }:` );
    };

    public async run( shouldRunImpl = true ): Promise<boolean|void> {
        if ( this.args.includes( "--help" ) ) {
            return false;
        }

        await this.initializePromise;

        shouldRunImpl && await this.runImpl();

        return true;
    }

    protected async initialize?(): Promise<void>;

    protected abstract runImpl(): Promise<void>;
}

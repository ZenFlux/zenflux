/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import process from "node:process";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import { zConsoleCreateLogBox, zConsoleLogsRender } from "@zenflux/cli/src/modules/console";

import { zDebounce } from "@zenflux/cli/src/utils/timers";

const LogWidgetRollup = zConsoleCreateLogBox( "Rollup Build Process" ),
    logWidgetTypescript = zConsoleCreateLogBox( "TypeScript Diagnostic & Declaration" ),
    logWidgetVerbose = process.argv.includes( "--verbose" ) ? zConsoleCreateLogBox( "Verbose" ) : null;

const stdout = process.stdout,
    stderr = process.stderr,
    logWidgetVerboseBuffer: string[] = [];

abstract class BaseCustomConsole extends ConsoleManager.module() {
    public constructor() {
        super( {
            stdout,
            stderr
        } );
    }

    protected output( method: any, args: any[] ) {
        this.outputFormat( args );
    }

    public verbose( context: any ): any {
        if ( ! logWidgetVerbose ) {
            return;
        }

        let args;

        if ( context instanceof Function ) {
            args = context();
        }

        args = Array.isArray( args ) ? args : [ args ];

        // TODO Find a better way to determine if main thread.
        if ( isNaN( args[ 0 ] ) ) {
            // Set first arg as "M" to indicate main thread.
            args.unshift( "M" );
        }

        const id = args[ 0 ],
            realArgs = args.slice( 1 );

        const log = `{bold}Thread{/bold}{tab}{blue-fg}${ id }{/}{tab}${ realArgs.join( " " ) }`;

        logWidgetVerboseBuffer.push( log );

        // Use debounce to prevent too many logs.
        if ( logWidgetVerboseBuffer.length > 50 ) {
            logWidgetVerbose.log( logWidgetVerboseBuffer.join( "\n" ) );
            logWidgetVerboseBuffer.length = 0;
        }

        zDebounce( "verbose-", () => {
            if ( ! logWidgetVerboseBuffer.length ) {
                return;
            }

            logWidgetVerbose.log( logWidgetVerboseBuffer.join( "\n" ) );
            logWidgetVerboseBuffer.length = 0;
        }, 300 );
    }

    protected abstract getCustomLogger(): ReturnType<typeof zConsoleCreateLogBox>;

    protected getBaseFormat( args: any[] ): string {
        const id = args[ 0 ],
            name = args[ 1 ],
            action = args[ 2 ],
            argsLeft = args.slice( 3 );

        return `{bold}Thread{/}{tab}{blue-fg}${ id }{/}{tab}{red-fg}${ name }{/}{tab}{yellow-fg}${ action }{/}{tab}${ argsLeft.join( " " ) }`;
    }

    protected outputFormat( args: any[] ) {
        this.getCustomLogger().log( this.getBaseFormat( args ) );
    }
};

abstract class BaseTypescriptConsole extends BaseCustomConsole {
    protected abstract getName(): string;

    protected getCustomLogger() {
        return logWidgetTypescript;
    }

    protected getBaseFormat( args: any[] ): string {
        // TODO Find a better way to determine if main thread.
        if ( isNaN( args[ 0 ] ) ) {
            // Set first arg as "M" to indicate main thread.
            args.unshift( "M" );
        }

        const id = args[ 0 ],
            action = args[ 1 ],
            realArgs = args.slice( 2 );

        return `{bold}Thread{/}{tab}{blue-fg}${ id }{/}{tab}{red-fg}${ this.getName() }{/}{tab}{yellow-fg}${ action }{/}{tab}${ realArgs.join( " " ) }`;
    }

    public verbose( context: any ): any {
        if ( ! process.argv.includes( "--verbose" ) ) {
            return;
        }

        let args;

        if ( context instanceof Function ) {
            args = context();
        }

        args = Array.isArray( args ) ? args : [ args ];

        const id = args[ 0 ],
            realArgs = args.slice( 1 );

        logWidgetTypescript.log( this.getBaseFormat( [ id, "Verbose", ... realArgs ] ) );
    }

    public error( ... args: any[] ) {
        args.splice( 1, 0, "Error" );

        this.outputFormat( args );
    }
}

class RollupConsole extends BaseCustomConsole {
    protected getCustomLogger() {
        return LogWidgetRollup;
    }
}

class TsDiagnosticConsole extends BaseTypescriptConsole {
    protected getName() {
        return "Diagnostics";
    }
};

class TsDeclarationConsole extends BaseTypescriptConsole {
    protected getName() {
        return "Declaration";
    }
}

export const rollupConsole = new RollupConsole();
export const tsDiagnosticConsole = new TsDiagnosticConsole();
export const tsDeclarationConsole = new TsDeclarationConsole();

zConsoleLogsRender();

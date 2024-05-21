/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import util from "node:util";

import { ConsoleThreadFormat } from "@zenflux/cli/src/console/console-thread-format";

import type { TConsoleLoggerMethod } from "@zenflux/cli/src/modules/console/console";

abstract class ConsoleBuildBase extends ConsoleThreadFormat {
    public getThreadId() {
        return "M";
    }

    public getPrefix(): string {
        return `Thread ${ this.getThreadCode() }-${ this.getThreadId().toString().padEnd( 5 ) }${ this.getName() }`.padEnd( 30 );
    }

    public getFormatExtended( method: TConsoleLoggerMethod, args: any[] ): string {
        const prefix = args[ 0 ],
            action = args[ 1 ],
            argsLeft = args.slice( 3 );

        let context = args[ 2 ];

        if ( method === this.verbose || method === this.debug ) {
            context += "()";
        } else {
            context = context.charAt( 0 ).toUpperCase() + context.slice( 1 );
        }

        return `${ prefix.charAt( 0 ).toUpperCase() + prefix.slice( 1 ) }`.padEnd( 30 ) +
            `${ util.inspect( action.charAt( 0 ).toUpperCase() + action.slice( 1 ) ) }`.padEnd( 30 ) +
            `-> ${ method.name.charAt( 0 ).toUpperCase() + method.name.slice( 1 ) } ->`.padEnd( 25 ) +
            `${ context } -> ` +
            argsLeft.join( " " );
    }

    public getFormat( method: TConsoleLoggerMethod, args: any[] ): string {
        const prefix = args[ 0 ],
            action = args[ 1 ];

        const argsLeft = args.slice( 2 );

        if ( argsLeft.length ) {
            // Upper case first arg in `argsLeft`
            argsLeft[ 0 ] = argsLeft[ 0 ].charAt( 0 ).toUpperCase() + argsLeft[ 0 ].slice( 1 );

            return `${ prefix.charAt( 0 ).toUpperCase() + prefix.slice( 1 ) }`.padEnd( 30 ) +
                `${ util.inspect( action.charAt( 0 ).toUpperCase() + action.slice( 1 ) ) }`.padEnd( 30 ) +
                argsLeft.join( " " );
        }

        return args.join( "\t" );
    }

    public output( method: TConsoleLoggerMethod, args: any[] ) {
       super.output( method, args, this.prepareFormat.bind( this ) );
    }
}

abstract class TypescriptConsoleBase extends ConsoleBuildBase {
    public getName() {
        return "Typescript";
    }

    public abstract getSubName(): string;

    public getArgs( method: TConsoleLoggerMethod, args: any[] ): any[] {
        args = super.getArgs( method, args );

        // Push sub name to args
        args.unshift( this.getSubName() );

        return args;
    }
}

class RollupConsole extends ConsoleBuildBase {
    public getThreadCode() {
        return "RO";
    }

    public getName(): string {
        return "Rollup";
    }
};

class TsDiagnosticConsole extends TypescriptConsoleBase {
    public getSubName() {
        return "Diagnostics";
    }

    public getThreadCode() {
        return "DI";
    }
};

class TsDeclarationConsole extends TypescriptConsoleBase {
    public getSubName() {
        return "Declaration";
    }

    public getThreadCode() {
        return "DE";
    }
}

export const rollupConsole = new RollupConsole();
export const tsDiagnosticConsole = new TsDiagnosticConsole();
export const tsDeclarationConsole = new TsDeclarationConsole();

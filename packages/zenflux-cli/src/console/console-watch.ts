/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { ConsoleThreadFormat } from "@zenflux/cli/src/console/console-thread-format";

import { zConsoleCreateLogBox, zConsoleCreateStickyBox, zConsoleRender } from "@zenflux/cli/src/modules/console";

import { zWorkerGetCount } from "@zenflux/cli/src/modules/threading/worker";

import { zUppercaseAt } from "@zenflux/cli/src/utils/common";
import { zDebounce } from "@zenflux/cli/src/utils/timers";

import type { TConsoleLoggerMethod } from "@zenflux/cli/src/modules/console/console";

const LogWidgetRollup = zConsoleCreateLogBox( "Rollup Build" ),
    logWidgetTypescript = zConsoleCreateLogBox( "TypeScript Diagnostic & Declaration" ),
    logWidgetDebug = ConsoleThreadFormat.isFlagEnabled( "debug" ) ? zConsoleCreateLogBox( "Debug" ) : null,
    logThreadsCountBox = zConsoleCreateStickyBox( "Threads Count", "top" );

const logWidgetDebugBuffer: string[] = [];

const LOG_MAX_BUFFER_SIZE = 100,
    LOG_DEBUG_DEBOUNCE_DELAY = 500;

interface OutputStrategy {
    output( method: TConsoleLoggerMethod, args: any[] ): void;
}

class SimpleOutputStrategy implements OutputStrategy {
    private $: ConsoleWatchBase;

    public constructor( base: ConsoleWatchBase ) {
        this.$ = base;
    }

    public output( method: TConsoleLoggerMethod, args: any[] ) {
        this.$.getLogWidget().log( args.join( " " ) );
    }
}

/**
 * `DebugOutputStrategy` is a strategy for outputting log messages.
 * It has a special handling for debug messages: they are buffered and logged in a batch.
 * This is done to prevent too many logs appearing at once.
 * The buffer is flushed either when it reaches a certain size (LOG_MAX_BUFFER_SIZE)
 * or after a certain delay (LOG_DEBUG_DEBOUNCE_DELAY), whichever comes first.
 * This strategy is used when the debug flag is enabled.
 */
class DebugOutputStrategy implements OutputStrategy {
    private $: ConsoleWatchBase;

    public constructor( base: ConsoleWatchBase ) {
        this.$ = base;
    }

    public output( method: TConsoleLoggerMethod, args: any[] ) {
        if ( method.name === this.$.debug.name ) {

            logWidgetDebugBuffer.push( args.join( " " ) );

            return this.addDebouncedLog();
        }

        this.$.getLogWidget().log( args.join( " " ) );
    }

    private addDebouncedLog() {
        // Use debounce to prevent too many logs.
        if ( logWidgetDebugBuffer.length > LOG_MAX_BUFFER_SIZE ) {
            this.createLogAndClearBuffer();
        }

        zDebounce( `console-${ this.$.getName() }-debug-buffer`, () => {
            if ( logWidgetDebugBuffer.length ) {
                this.createLogAndClearBuffer();
            }
        }, LOG_DEBUG_DEBOUNCE_DELAY );
    }

    private createLogAndClearBuffer() {
        logWidgetDebug!.log( logWidgetDebugBuffer.join( "\n" ) );
        logWidgetDebugBuffer.length = 0;
    }
}

abstract class ConsoleWatchBase extends ConsoleThreadFormat {
    private outputStrategy: OutputStrategy;

    public abstract getLogWidget(): ReturnType<typeof zConsoleCreateLogBox>;

    public getThreadId() {
        return "M";
    }

    public getPrefix(): string {
        return `Thread {blue-fg}${ this.getThreadCode() }-${ this.getThreadId().toString() }{/}{tab}`;
    }

    protected initialize() {
        this.outputStrategy = ConsoleThreadFormat.isFlagEnabled( "debug" ) ?
            new DebugOutputStrategy( this ) :
            new SimpleOutputStrategy( this );

        super.initialize();
    }

    public getFormat( method: TConsoleLoggerMethod, args: any[] ): string {
        const prefix = args[ 0 ],
            name = args[ 1 ],
            action = args[ 2 ],
            argsLeft = args.slice( 3 );

        return prefix +
            `{red-fg}${ zUppercaseAt( name ) }{/}{tab}` +
            `{yellow-fg}${ zUppercaseAt( action ) }{/}{tab}` +
            argsLeft.join( " " );
    }

    public getFormatExtended( method: TConsoleLoggerMethod, args: any[] ): string {
        const prefix = args[ 0 ],
            action = args[ 1 ],
            argsLeft = args.slice( 3 );

        let context = args[ 2 ];

        if ( method === this.verbose || method === this.debug ) {
            context += "()";
        } else {
            context = zUppercaseAt( context );
        }

        return prefix +
            `{red-fg}${ zUppercaseAt( action ) }{/}{tab}` +
            `-> ${ method.name.charAt( 0 ).toUpperCase() + method.name.slice( 1 ) } ->{tab}` +
            `{yellow-fg}${ context }{/}{tab}` +
            argsLeft.join( " " );
    }

    public output( method: TConsoleLoggerMethod, args: any[], prepareFormat = this.prepareFormat.bind( this ) ) {
        args = prepareFormat( args, method );

        this.outputStrategy.output( method, args );
    }
}

class RollupConsole extends ConsoleWatchBase {
    public getName() {
        return "Rollup";
    }

    public getThreadCode() {
        return "RO";
    }

    public getLogWidget() {
        return LogWidgetRollup;
    }
}

abstract class TypescriptConsoleBase extends ConsoleWatchBase {
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

    public getLogWidget(): ReturnType<typeof zConsoleCreateLogBox> {
        return logWidgetTypescript;
    }
}

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

zConsoleRender();

// Interval that prints the threads count.
setInterval( () => {
    logThreadsCountBox.setContent( ` ${ zWorkerGetCount() }` );
    logThreadsCountBox.render();
}, 1000 );

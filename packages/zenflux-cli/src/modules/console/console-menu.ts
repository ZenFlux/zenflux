/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import process from "process";

import os from "os";
import readline from "readline";

// TODO Use OR for interfaces.
export interface IConsoleMenuItem {
    title?: string;
    separator?: boolean;
    selected?: boolean;
    disabled?: boolean;
}

export type TConsoleMenuSelectedItem = IConsoleMenuItem | undefined;
export type TConsoleMenuKey = { str: string, name: string; ctrl: boolean };

export class ConsoleMenu<TReturn = TConsoleMenuSelectedItem> {
    public static readonly DEFAULT_SELECT_CURSOR = "\x1b[1m⟶  \x1b[0m";

    private scrollOffset: number;

    private bindHandleKeyPress = this.handleKeyPress.bind( this );

    private resolve: ( selection: TReturn ) => void;

    private customKeyHandlers: Array<( key: TConsoleMenuKey ) => boolean> = [];

    protected selected: {
        index: number;
        item: TConsoleMenuSelectedItem;
    } = {
        index: -1,
        item: undefined,
    };

    public constructor( protected readonly items: IConsoleMenuItem[] ) {
        this.selected = this.findInitialSelection();

        this.scrollOffset = 0;
    }

    protected initialize() {
        readline.emitKeypressEvents( process.stdin );

        process.stdin.setRawMode( true );
        process.stdin.on( "keypress", this.bindHandleKeyPress );

        // Hides cursor
        process.stdout.write( "\u001B[?25l" );

        process.stdin.resume();

        this.printMenu();
    }

    private handleKeyPress( str: string, key: { name: string; ctrl: boolean } ) {
        const efficientKey = { str, ... key };

        if ( this.customKeyHandlers.some( ( handler ) => handler( efficientKey ) ) ) {
            return this.updateSelected( this.selected.index );
        }

        const selectedOption = this.getSelection( efficientKey );

        if ( selectedOption || key.name === "escape" || ( key.name === "c" && key.ctrl ) ) {
            return this.cleanup( selectedOption );
        }

        this.handleNavigation( efficientKey );
    }

    private handleNavigationKeyPress( { name }: TConsoleMenuKey ) {
        const selectedIndex = this.selected.index;

        if ( name === "up" && selectedIndex > 0 ) {
            return this.findPreviousValidIndex( selectedIndex );
        } else if ( name === "down" && selectedIndex < this.items.length - 1 ) {
            return this.findNextValidIndex( selectedIndex );
        }

        return null;
    }

    private handleNavigation( key: TConsoleMenuKey ) {
        const newIndex = this.handleNavigationKeyPress( key );

        if ( newIndex !== null ) {
            this.updateSelected( newIndex );
        }
    }

    private updateSelected( selectedIndex: number ) {
        this.resetCursor();

        this.selected = {
            index: selectedIndex,
            item: this.items[ selectedIndex ],
        };

        if ( selectedIndex < this.scrollOffset ) {
            this.scrollOffset = selectedIndex;
        }

        this.printMenu();
    }

    private printMenu() {
        for ( let i = this.scrollOffset ; i < this.calculateScrollEnd() ; i++ ) {
            this.printMenuItem( this.items[ i ] );
        }

        this.moveCursor( this.calculateCursorPosition() );
    }

    private printMenuItem( item: typeof this.items[ number ] ) {
        if ( item.disabled ) {
            process.stdout.write( `   ${ item.title }` );
        } else if ( ! item.separator ) {
            process.stdout.write( this.getItemDisplay( item ) );
        }

        process.stdout.write( os.EOL );
    }

    private calculateScrollEnd(): number {
        return this.scrollOffset ? Math.min( this.items.length, this.scrollOffset ) : this.items.length;
    }

    private calculateCursorPosition(): number {
        return -( this.calculateScrollEnd() - this.scrollOffset ) + this.selected.index - this.scrollOffset;
    }

    private moveCursor( position: number ) {
        readline.moveCursor( process.stdout, 0, position );
    }

    private resetCursor() {
        this.moveCursor( -this.selected.index + this.scrollOffset );
    }

    private findInitialSelection() {
        let initialSelectedIndex = this.items.findIndex( ( item ) => item.selected );

        if ( initialSelectedIndex === -1 ) {
            initialSelectedIndex = this.findNextValidIndex( -1 ) ?? 0;
        }

        return {
            index: initialSelectedIndex,
            item: this.items[ initialSelectedIndex ] ?? undefined,
        };
    }

    private findNextValidIndex( startIndex: number ) {
        return this.findValidIndex( startIndex, 1 );
    }

    private findPreviousValidIndex( startIndex: number ) {
        return this.findValidIndex( startIndex, -1 );
    }

    private findValidIndex( startIndex: number, step: number ) {
        for ( let i = startIndex + step ; i >= 0 && i < this.items.length ; i += step ) {
            if ( ! this.items[ i ].separator && ! this.items[ i ].disabled ) {
                return i;
            }
        }

        return null;
    }

    protected addCustomKeyHandler( handler: ( key: TConsoleMenuKey ) => boolean ) {
        this.customKeyHandlers.push( handler );
    }

    protected cleanup( selection: TReturn ) {
        process.stdin.removeListener( "keypress", this.bindHandleKeyPress );
        process.stdin.setRawMode( false );

        this.resetCursor();

        readline.clearScreenDown( process.stdout );
        process.stdin.pause();

        this.resolve( selection );
    }

    protected getItemDisplay( item: typeof this.items[ number ] ) {
        return this.selected.item === item ?
            `${ ConsoleMenu.DEFAULT_SELECT_CURSOR }${ item.title }` :
            `   ${ item.title }`;
    }

    protected getSelection( { name }: TConsoleMenuKey ): TReturn {
        if ( name === "return" ) {
            return this.items[ this.selected.index ] as TReturn;
        }

        return undefined as TReturn;
    }

    public start() {
        this.initialize();

        return new Promise<ReturnType<typeof this.getSelection>>( ( resolve ) => {
            this.resolve = resolve;
        } );
    }
}

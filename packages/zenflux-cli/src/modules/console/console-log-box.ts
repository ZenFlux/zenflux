/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import process from "node:process";

import blessed from "blessed";

const DEFAULT_TAB_WIDTH = 4;

let screen: ReturnType<typeof blessed.screen>,
    container: ReturnType<typeof blessed.box>,
    allLogs: ReturnType<typeof blessed.log>[] = [],
    allStickyBoxes: ReturnType<typeof blessed.box>[] = [];

let autoScrollTimeout: NodeJS.Timeout,
    resizeTimeout: NodeJS.Timeout;

// Assuming 'allLogs' is an array of strings where each string is a log entry
const maxColWidths: number[][] = [],
    realLogLines: string[][] = [];

// TODO To copy text hold FN or press shift depending on the terminal emulator

// Fix issue with resize for terminal emulators like jetbrains uses
function zConsoleHandleResize() {
    container.width = screen.width;
    container.height = screen.height;

    let children = screen.children.slice( 0 );
    children.forEach( ( child: any ) => {
        screen.remove( child );
    } );

    // Append all the elements back
    children.forEach( ( child: any ) => {
        screen.append( child );
    } );

    screen.render();
}

function zConsoleOnResize() {
    clearTimeout( resizeTimeout );

    resizeTimeout = setTimeout( zConsoleHandleResize, 800 );
}

function zConsoleNormalizeLogBox( log: ReturnType<typeof blessed.log> ) {
    const logIndex = allLogs.indexOf( log );

    if ( ! maxColWidths[ logIndex ] ) {
        maxColWidths[ logIndex ] = [];
    }

    if ( ! realLogLines[ logIndex ] ) {
        realLogLines[ logIndex ] = [];
    }

    const content = log.getContent();

    if ( ! content ) {
        return;
    }

    let lines = content.split( "\n" );

    if ( ! lines.length ) {
        return;
    }

    // Calculate max column widths and real log lines in a separate pass
    lines.forEach( ( line: string, position: number ) => {
        if ( ! realLogLines[ logIndex ][ position ] ) {
            realLogLines[ logIndex ][ position ] = line;
        }

        // Split the log into columns
        let cols = realLogLines[ logIndex ][ position ].split( "{tab}" );

        if ( cols.length <= 1 ) {
            return;
        }

        // Update the maximum width for each column
        cols.forEach( ( col: string, i: number ) => {
            if ( col.includes( "{colspan}" ) ) {
                return;
            }

            let colWidth = col.length;

            // If this is a new column, add it to 'maxColWidths'
            if ( maxColWidths[ logIndex ].length <= i ) {
                maxColWidths[ logIndex ].push( colWidth );
            }
            // Otherwise, update the maximum width if necessary
            else if ( colWidth > maxColWidths[ logIndex ][ i ] ) {
                maxColWidths[ logIndex ][ i ] = colWidth;
            }
        } );
    } );

    // Format the log entries
    const newContent = lines.map( ( line: string, position: number ) => {
        // Split the log into columns
        let cols = realLogLines[ logIndex ][ position ].split( "{tab}" );

        if ( cols.length <= 1 ) {
            return line;
        }

        // Adjust the padding for each column
        let paddedCols = cols.map( ( col, i ) => {
            return col.padEnd( maxColWidths[ logIndex ][ i ] + DEFAULT_TAB_WIDTH );
        } );

        // Replace {colspan} with empty string
        paddedCols = paddedCols.map( ( col ) => {
            return col.replace( "{colspan}", "" );
        } );

        // Join the columns back together and print the result
        return paddedCols.join( "" );
    } );

    log.content = newContent.join( "\n" );
}

function zConsoleEnsureScreen() {
    if ( ! screen ) {
        screen = blessed.screen( {
            smartCSR: true,
            fullUnicode: true,
            dockBorders: true,
            ignoreDockContrast: true,
            resizeTimeout: 800,
        } );

        container = blessed.box( {
            left: 0,
            top: 0,
            width: screen.width,
            height: screen.height,
        } );

        screen.on( "resize", zConsoleOnResize );

        // Quit on Escape, q, or Control-C.
        screen.key( [ "escape", "q", "C-c" ], function () {
            return process.exit( 0 );
        } );

        screen.on( "prerender", () => allLogs.forEach( zConsoleNormalizeLogBox ) );
    }
}

export function zConsoleCreateStickyBox( label: string, position: "top" | "bottom" ) {
    zConsoleEnsureScreen();

    const options: any = {};

    if ( position === "top" ) {
        options.top = 0;
    } else if ( position === "bottom" ) {
        options.bottom = 1;
    }

    const box = blessed.box( {
        ... options,
        label,
        width: "shrink",
        height: "shrink",
        right: 0,
        border: {
            type: "line",
        },
    } );

    allStickyBoxes.push( box );

    return box;
}

function zConsoleCreateLogBox( label: string ) {
    zConsoleEnsureScreen();

    const box = blessed.box( {
        // mouse: false,

        label,

        // top: `${boxTopPercent}%`,
        left: "0%",

        // height: `${boxHeightPercent}%`,
        width: "100%",

        border: {
            type: "line",
        },
    } );

    const log = blessed.log( {
        left: "0%",
        width: `100%-${ 2 }`,
        height: `100%-${ 2 }`,
        tags: true,
        style: {
            fg: "white",
        },
        scrollable: true,
        alwaysScroll: false,
        scrollOnInput: false,
        scrollbar: {
            ch: " ",
            style: {
                inverse: true,
            }
        },
        mouse: true,
    } );

    log.on( "element mouseover", () => {
        // Change box label color to red
        box.style.border.fg = "green";
        screen.render();
    } );

    log.on( "element mouseout", () => {
        // Change box label color to white
        box.style.border.fg = "white";
        screen.render();
    } );

    box.append( log );

    allLogs.push( log );

    return log;
}

function zConsoleRender( logs = allLogs, options = {
    autoScrollPauseInterval: 1000,
} ) {
    zConsoleEnsureScreen();

    function zConsoleEnableAutoScroll( log: ReturnType<typeof blessed.log> ) {
        clearTimeout( autoScrollTimeout );
        autoScrollTimeout = setTimeout( () => {
            // @ts-ignore - Internal property
            log._userScrolled = false;
        }, options.autoScrollPauseInterval );
    }

    function zConsoleHandleWheelEvent( log: ReturnType<typeof blessed.log>, add: boolean ) {
        return function () {
            // @ts-ignore - Internal property
            log._userScrolled = true;

            const scroll = log.getScroll(),
                amount = add ? 1 : -1,
                newScroll = scroll + amount;

            if ( newScroll >= 0 && newScroll <= log.getScrollHeight() - Number( log.height ) ) {
                log.setScroll( newScroll );
            }

            screen.render();

            zConsoleEnableAutoScroll( log );
        };
    }

    logs.forEach( ( log ) => {
        log.on( "wheelup", zConsoleHandleWheelEvent( log, false ) );
        log.on( "wheeldown", zConsoleHandleWheelEvent( log, true ) );

        // Change log height and top position to fit the screen
        const box = log.parent as ReturnType<typeof blessed.box>;

        box.height = `${ 100 / logs.length }%`;
        box.top = `${ ( 100 / logs.length ) * logs.indexOf( log ) }%`;

        container.append( log.parent );
    } );

    allStickyBoxes.forEach( ( box ) => {
        container.append( box );
    } );

    screen.append( container );

    setTimeout( () => {
        // Render the screen.
        screen.render();
    }, 2000 );
}

export {
    zConsoleCreateLogBox,
    zConsoleRender,
};

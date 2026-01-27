export interface FileNode {
    name: string;
    type: "file" | "folder";
    children?: FileNode[];
    expanded?: boolean;
}

interface ParsedLine {
    depth: number;
    name: string;
    lineIndex: number;
}

/**
 * Parses a text-based file structure into a tree structure.
 * Automatically detects folders based on whether they have children.
 * Supports formats like:
 * - ├── src
 * - │ ├── app.tsx
 * - └── package.json
 */
export function parseFileStructure( text: string ): FileNode[] {
    const lines = text.split( "\n" ).filter( ( line ) => line.trim() );

    // First pass: parse all lines with their depth
    const parsedLines: ParsedLine[] = [];

    for ( let i = 0; i < lines.length; i++ ) {
        const line = lines[ i ];
        const depth = getDepth( line );
        const name = extractName( line );

        if ( name ) {
            parsedLines.push( { depth, name, lineIndex: i } );
        }
    }

    // Second pass: determine which items are folders (have children)
    const folderIndices = new Set<number>();

    for ( let i = 0; i < parsedLines.length - 1; i++ ) {
        const current = parsedLines[ i ];
        const next = parsedLines[ i + 1 ];

        // If next item is deeper, current is a folder
        if ( next.depth > current.depth ) {
            folderIndices.add( i );
        }
    }

    // Also mark items ending with / as folders
    for ( let i = 0; i < parsedLines.length; i++ ) {
        if ( parsedLines[ i ].name.endsWith( "/" ) ) {
            folderIndices.add( i );
        }
    }

    // Third pass: build the tree
    const root: FileNode[] = [];
    const stack: { node: FileNode; depth: number }[] = [];

    for ( let i = 0; i < parsedLines.length; i++ ) {
        const { depth, name } = parsedLines[ i ];
        const isFolder = folderIndices.has( i );

        const node: FileNode = {
            name: cleanName( name ),
            type: isFolder ? "folder" : "file",
            children: isFolder ? [] : undefined,
            expanded: isFolder ? true : undefined,
        };

        // Find parent at appropriate depth
        while ( stack.length > 0 && stack[ stack.length - 1 ].depth >= depth ) {
            stack.pop();
        }

        if ( stack.length === 0 ) {
            root.push( node );
        } else {
            const parent = stack[ stack.length - 1 ].node;
            if ( parent.children ) {
                parent.children.push( node );
            }
        }

        if ( isFolder ) {
            stack.push( { node, depth } );
        }
    }

    return root;
}

function getDepth( line: string ): number {
    // Count the visual indentation level based on tree characters
    let depth = 0;
    let i = 0;

    while ( i < line.length ) {
        if ( line[ i ] === "│" || line[ i ] === " " ) {
            i++;
            // Skip spaces after │
            while ( i < line.length && line[ i ] === " " ) {
                i++;
            }
            if ( line[ i ] === "├" || line[ i ] === "└" || line[ i ] === "│" ) {
                depth++;
            }
        } else if ( line[ i ] === "├" || line[ i ] === "└" ) {
            break;
        } else {
            i++;
        }
    }

    return depth;
}

function extractName( line: string ): string {
    // Remove tree drawing characters and extract the file/folder name
    return line
        .replace( /^[\s│├└─\s]+/, "" )
        .trim();
}

function cleanName( name: string ): string {
    return name.replace( /\/$/, "" ).trim();
}

export function getFileExtension( name: string ): string {
    const match = name.match( /\.([a-z0-9]+)$/i );
    return match ? match[ 1 ].toLowerCase() : "";
}

export function getFileIconColor( extension: string ): string {
    const colors: Record<string, string> = {
        ts: "#3178c6",
        tsx: "#3178c6",
        js: "#f7df1e",
        jsx: "#f7df1e",
        json: "#cbcb41",
        css: "#563d7c",
        scss: "#bf4080",
        md: "#083fa1",
        html: "#e34c26",
        svg: "#ffb13b",
        png: "#a4cf30",
        jpg: "#a4cf30",
        jpeg: "#a4cf30",
        gif: "#a4cf30",
    };

    return colors[ extension ] || "#6e7681";
}

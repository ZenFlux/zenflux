import React from "react";

import "./file-tree.scss";

import { cn } from "@zenflux/app-create-files-structure-image/src/lib/utils";
import { getFileExtension, getFileIconColor } from "@zenflux/app-create-files-structure-image/src/lib/file-structure-parser";

import type { FileNode } from "@zenflux/app-create-files-structure-image/src/lib/file-structure-parser";

interface FileTreeProps {
    nodes: FileNode[];
    className?: string;
    defaultExpandLevel?: number;
}

export function FileTree( { nodes, className, defaultExpandLevel = 10 }: FileTreeProps ) {
    return (
        <div className={ cn( "file-tree", className ) }>
            { nodes.map( ( node, index ) => (
                <FileTreeNode
                    key={ `${ node.name }-${ index }` }
                    node={ node }
                    depth={ 0 }
                    defaultExpandLevel={ defaultExpandLevel }
                />
            ) ) }
        </div>
    );
}

interface FileTreeNodeProps {
    node: FileNode;
    depth: number;
    defaultExpandLevel: number;
}

function FileTreeNode( { node, depth, defaultExpandLevel }: FileTreeNodeProps ) {
    const isFolder = node.type === "folder";
    const shouldExpand = depth < defaultExpandLevel;
    const [ expanded, setExpanded ] = React.useState( shouldExpand );

    const extension = isFolder ? "" : getFileExtension( node.name );
    const iconColor = isFolder ? undefined : getFileIconColor( extension );

    const handleClick = () => {
        if ( isFolder ) {
            setExpanded( ! expanded );
        }
    };

    return (
        <div className="file-tree-node">
            <div
                className={ cn( "file-tree-item", isFolder && "is-folder" ) }
                style={ { paddingLeft: `${ depth * 16 + 4 }px` } }
                onClick={ handleClick }
            >
                { isFolder ? (
                    <FolderIcon expanded={ expanded } />
                ) : (
                    <FileIcon extension={ extension } color={ iconColor } />
                ) }
                <span className={ cn( "file-tree-name", isFolder && "folder-name" ) }>
                    { node.name }
                </span>
            </div>
            { isFolder && expanded && node.children && (
                <div className="file-tree-children">
                    { node.children.map( ( child, index ) => (
                        <FileTreeNode
                            key={ `${ child.name }-${ index }` }
                            node={ child }
                            depth={ depth + 1 }
                            defaultExpandLevel={ defaultExpandLevel }
                        />
                    ) ) }
                </div>
            ) }
        </div>
    );
}

function FolderIcon( { expanded }: { expanded?: boolean } ) {
    return (
        <span className="file-tree-icon folder-icon">
            <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                { expanded ? (
                    <>
                        <path
                            d="M1.5 3.5C1.5 2.67157 2.17157 2 3 2H6.17157C6.43679 2 6.69114 2.10536 6.87868 2.29289L8 3.41421L9.12132 2.29289C9.30886 2.10536 9.56321 2 9.82843 2H13C13.8284 2 14.5 2.67157 14.5 3.5V4H1.5V3.5Z"
                            fill="#8da4ef"
                        />
                        <path
                            d="M1.5 5H14.5V12.5C14.5 13.3284 13.8284 14 13 14H3C2.17157 14 1.5 13.3284 1.5 12.5V5Z"
                            fill="#8da4ef"
                        />
                    </>
                ) : (
                    <path
                        d="M1.5 3.5C1.5 2.67157 2.17157 2 3 2H6.17157C6.43679 2 6.69114 2.10536 6.87868 2.29289L8.70711 4.12132C8.89464 4.30886 9.149 4.41421 9.41421 4.41421H13C13.8284 4.41421 14.5 5.08579 14.5 5.91421V12.5C14.5 13.3284 13.8284 14 13 14H3C2.17157 14 1.5 13.3284 1.5 12.5V3.5Z"
                        fill="#8da4ef"
                    />
                ) }
            </svg>
            <ChevronIcon expanded={ expanded } />
        </span>
    );
}

function ChevronIcon( { expanded }: { expanded?: boolean } ) {
    return (
        <svg
            className={ cn( "chevron-icon", expanded && "expanded" ) }
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M3 2L7 5L3 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

function FileIcon( { extension, color }: { extension: string; color?: string } ) {
    const isTypeScript = [ "ts", "tsx" ].includes( extension );

    return (
        <span className="file-tree-icon file-icon">
            <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M3 1.5C2.44772 1.5 2 1.94772 2 2.5V13.5C2 14.0523 2.44772 14.5 3 14.5H13C13.5523 14.5 14 14.0523 14 13.5V5.5L10 1.5H3Z"
                    fill={ color || "#6e7681" }
                    fillOpacity="0.2"
                    stroke={ color || "#6e7681" }
                    strokeWidth="1"
                />
                <path
                    d="M10 1.5V5.5H14"
                    stroke={ color || "#6e7681" }
                    strokeWidth="1"
                />
            </svg>
            { isTypeScript && (
                <span className="file-badge" style={ { backgroundColor: color } }>
                    TS
                </span>
            ) }
        </span>
    );
}

import React from "react";

import { toPng, toJpeg, toSvg } from "html-to-image";

import { useCommand, useCommandHook, useCommandState } from "@zenflux/react-commander/hooks";

import { withCommands } from "@zenflux/react-commander/with-commands";

import { CommandBase } from "@zenflux/react-commander/command-base";

import { FileTree } from "@zenflux/app-create-files-structure-image/src/components/file-tree";
import { parseFileStructure } from "@zenflux/app-create-files-structure-image/src/lib/file-structure-parser";

import "@zenflux/app-create-files-structure-image/src/app.scss";

import type { FileNode } from "@zenflux/app-create-files-structure-image/src/lib/file-structure-parser";

const DEFAULT_STRUCTURE = `├── src
│ ├── app.tsx
│ ├── components
│ │ ├── app-layout.tsx
│ │ ├── resizable-panel.tsx
│ │ └── sidebar.tsx
│ ├── features
│ │ ├── auth
│ │ │ ├── api.ts
│ │ │ ├── auth-provider.tsx
│ │ │ ├── commands
│ │ │ │ └── auth-commands.ts
│ │ │ ├── components
│ │ │ │ ├── login-page.tsx
│ │ │ │ ├── protected-route.tsx
│ │ │ │ └── server-selection-page.tsx
│ │ │ ├── index.ts
│ │ │ └── types.ts
│ │ ├── dashboard
│ │ │ ├── commands
│ │ │ ├── components
│ │ │ │ └── stat-card.tsx
│ │ │ ├── query
│ │ │ │ ├── global-stats-query.ts
│ │ │ │ └── guild-stats-query.ts
│ │ │ └── types.ts
│ │ ├── flow-editor
│ │ │ ├── commands
│ │ │ │ └── flow-editor-commands.ts
│ │ │ ├── components
│ │ │ │ ├── entity-list.tsx
│ │ │ │ ├── flow-details-panel.tsx
│ │ │ │ ├── flow-nodes
│ │ │ │ │ ├── component-node.tsx
│ │ │ │ │ ├── flow-node.tsx
│ │ │ │ │ ├── index.ts
│ │ │ │ │ ├── modal-node.tsx
│ │ │ │ │ ├── module-node.tsx
│ │ │ │ │ └── state-node.tsx
│ │ │ │ ├── flow-viewer.tsx
│ │ │ │ └── module-selector.tsx
│ │ │ ├── flow-editor.tsx
│ │ │ ├── lib
│ │ │ │ ├── component-helpers.ts
│ │ │ │ ├── constants.ts
│ │ │ │ ├── edge-builders.ts
│ │ │ │ ├── flow-helpers.ts
│ │ │ │ ├── graph-builder.ts
│ │ │ │ ├── layout.ts
│ │ │ │ └── node-builders.ts
│ │ │ └── query
│ │ │     └── modules-query.ts
│ │ └── management
│ │     ├── commands
│ │     │ ├── index.ts
│ │     │ └── management-commands.ts
│ │     ├── components
│ │     │ ├── create-scaling-form.tsx
│ │     │ ├── dynamic-channel-card.tsx
│ │     │ ├── dynamic-config-form.tsx
│ │     │ ├── dynamic-details-panel.tsx
│ │     │ ├── master-channel-list.tsx
│ │     │ ├── scaling-channel-card.tsx
│ │     │ ├── scaling-config-form.tsx
│ │     │ └── scaling-details-panel.tsx
│ │     ├── index.ts
│ │     ├── query
│ │     │ ├── guild-management-query.ts
│ │     │ └── scaling-master-query.ts
│ │     └── types.ts
│ ├── index.css
│ ├── lib
│ │ ├── api-client.ts
│ │ ├── config.ts
│ │ └── query-client.ts
│ ├── main.tsx
│ ├── pages
│ │ ├── dashboard-page.tsx
│ │ ├── interface-editor-page.tsx
│ │ └── management-page.tsx
│ ├── types
│ │ └── xyflow-css.d.ts
│ └── vite-env.d.ts
├── tsconfig.app.json
├── tsconfig.eslint.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts`;

interface AppState {
    structure: string;
    parsedNodes: FileNode[];
    isExporting: boolean;
    exportFormat: "png" | "jpeg" | "svg";
}

export function App() {
    const treeRef = React.useRef<HTMLDivElement>( null );
    const [ expandLevel, setExpandLevel ] = React.useState( 10 );

    const [ getState, setState ] = useCommandState<AppState>( "App" );
    const state = getState();

    const exportCommand = useCommand( "App/Export" );

    useCommandHook( "App/UpdateStructure", ( _result, args ) => {
        const newStructure = args?.structure as string || "";
        const parsed = parseFileStructure( newStructure );

        setState( {
            ... getState(),
            structure: newStructure,
            parsedNodes: parsed,
        } );
    } );

    useCommandHook( "App/Export", async( _result, args ) => {
        const format = ( args?.format as AppState[ "exportFormat" ] ) || "png";

        if ( ! treeRef.current ) return;

        setState( { ... getState(), isExporting: true } );

        try {
            let dataUrl: string;
            const options = {
                backgroundColor: "#ffffff",
                pixelRatio: 2,
                style: {
                    padding: "16px",
                },
            };

            switch ( format ) {
                case "jpeg":
                    dataUrl = await toJpeg( treeRef.current, { ... options, quality: 0.95 } );
                    break;
                case "svg":
                    dataUrl = await toSvg( treeRef.current, options );
                    break;
                default:
                    dataUrl = await toPng( treeRef.current, options );
            }

            // Download the image
            const link = document.createElement( "a" );
            link.download = `file-structure.${ format }`;
            link.href = dataUrl;
            link.click();
        } catch( error ) {
            console.error( "Export failed:", error );
        } finally {
            setState( { ... getState(), isExporting: false } );
        }
    } );

    const handleTextChange = ( e: React.ChangeEvent<HTMLTextAreaElement> ) => {
        const newStructure = e.target.value;
        const parsed = parseFileStructure( newStructure );

        setState( {
            ... state,
            structure: newStructure,
            parsedNodes: parsed,
        } );
    };

    const handleExport = ( format: AppState[ "exportFormat" ] ) => {
        exportCommand?.run( { format } );
    };

    const handleExpandLevelChange = ( e: React.ChangeEvent<HTMLInputElement> ) => {
        const level = parseInt( e.target.value, 10 );
        setExpandLevel( level );
    };

    return (
        <div className="app">
            <header className="header">
                <h1>File Structure Image Generator</h1>
                <div className="actions">
                    <button
                        className="btn btn-secondary"
                        onClick={ () => handleExport( "png" ) }
                        disabled={ state.isExporting }
                    >
                        Export PNG
                    </button>
                    <button
                        className="btn btn-secondary"
                        onClick={ () => handleExport( "jpeg" ) }
                        disabled={ state.isExporting }
                    >
                        Export JPEG
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={ () => handleExport( "svg" ) }
                        disabled={ state.isExporting }
                    >
                        Export SVG
                    </button>
                </div>
            </header>

            <main className="main-content">
                <div className="editor-panel">
                    <span className="panel-header">Input Structure (tree format)</span>
                    <textarea
                        value={ state.structure }
                        onChange={ handleTextChange }
                        placeholder="Paste your file structure here..."
                        spellCheck={ false }
                    />
                </div>

                <div className="preview-panel">
                    <div className="panel-header-row">
                        <span className="panel-header">Preview</span>
                        <div className="expand-level-control">
                            <label htmlFor="expand-level">Expand Level:</label>
                            <input
                                id="expand-level"
                                type="range"
                                min="0"
                                max="10"
                                value={ expandLevel }
                                onChange={ handleExpandLevelChange }
                            />
                            <span className="expand-level-value">
                                { expandLevel === 10 ? "All" : expandLevel }
                            </span>
                        </div>
                    </div>
                    <div className="file-tree-container" ref={ treeRef }>
                        { state.parsedNodes.length > 0 ? (
                            <FileTree
                                key={ expandLevel }
                                nodes={ state.parsedNodes }
                                defaultExpandLevel={ expandLevel }
                            />
                        ) : (
                            <div className="text-muted-foreground text-sm p-4">
                                Enter a file structure on the left to see the preview
                            </div>
                        ) }
                    </div>
                </div>
            </main>
        </div>
    );
}

const initialNodes = parseFileStructure( DEFAULT_STRUCTURE );

const $$ = withCommands<{}, AppState>( "App", App, {
    structure: DEFAULT_STRUCTURE,
    parsedNodes: initialNodes,
    isExporting: false,
    exportFormat: "png",
}, [
    class UpdateStructure extends CommandBase {
        public static getName() {
            return "App/UpdateStructure";
        }
    },
    class Export extends CommandBase {
        public static getName() {
            return "App/Export";
        }
    },
] );

export default $$;

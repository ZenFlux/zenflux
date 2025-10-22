/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import * as util from "util";

import fs from "fs";
import path from "path";

import { ConsoleMenu } from "@zenflux/cli/src/modules/console";

import { ConsoleManager } from "@zenflux/cli/src/managers/console-manager";

import { CommandBase } from "@zenflux/cli/src/base/command-base";

import { Package } from "@zenflux/cli/src/modules/npm/package";

const TEMPLATE_VAR_REGEX = /\$\$\{([^}]+)\}\$\$/g;

interface TemplateVariable {
    name: string;
    example: string;
}

export default class Generate extends CommandBase {
    public async runImpl(): Promise<void> {
        const workspacePackage = new Package( this.paths.workspace );
        const templatesPath = path.join( this.paths.workspace, "templates" );

        // Check if templates directory exists
        if ( ! fs.existsSync( templatesPath ) ) {
            return ConsoleManager.$.log( "No templates directory found at: " + templatesPath );
        }

        // Get available templates
        const templates = fs.readdirSync( templatesPath, { withFileTypes: true } )
            .filter( dirent => dirent.isDirectory() )
            .map( dirent => dirent.name );

        if ( ! templates.length ) {
            return ConsoleManager.$.log( "No templates found in: " + templatesPath );
        }

        // Select template
        ConsoleManager.$.log( "Available templates:" );
        const templateMenu = new ConsoleMenu( templates.map( t => ( { title: t } ) ) );
        const selectedTemplate = await templateMenu.start();

        if ( ! selectedTemplate ) {
            return ConsoleManager.$.log( "No template selected" );
        }

        const templateName = templates[ selectedTemplate.index ];
        const templatePath = path.join( templatesPath, templateName );

        // Read template variables
        const templateVarsPath = path.join( templatePath, "zenflux.template-vars.txt" );
        const templateVariables = await this.readTemplateVariables( templateVarsPath );

        if ( ! templateVariables.length ) {
            return ConsoleManager.$.log( "No template variables found in: " + templateVarsPath );
        }

        // Prompt for variable values
        const variableValues = await this.promptForVariables( templateVariables );

        // Get workspaces from root package.json
        const workspaces = await this.getWorkspaces( workspacePackage );

        if ( ! workspaces.length ) {
            return ConsoleManager.$.log( "No workspaces found in package.json" );
        }

        // Select target workspace
        ConsoleManager.$.log( "Select target workspace:" );
        const workspaceMenu = new ConsoleMenu( workspaces.map( w => ( { title: w } ) ) );
        const selectedWorkspace = await workspaceMenu.start();

        if ( ! selectedWorkspace ) {
            return ConsoleManager.$.log( "No workspace selected" );
        }

        const targetWorkspace = workspaces[ selectedWorkspace.index ];

        // Get project name from user
        const projectName = await ConsoleManager.$.prompt( "Enter project name (will be used as directory name):" );

        if ( ! projectName.trim() ) {
            return ConsoleManager.$.log( "Project name is required" );
        }

        // Calculate target path
        const targetPath = path.join(
            this.paths.workspace,
            targetWorkspace.replace( "/*", "" ),
            projectName
        );

        // Check if target directory already exists
        if ( fs.existsSync( targetPath ) ) {
            const overwrite = await ConsoleManager.$.confirm( `Directory ${ util.inspect( targetPath ) } already exists. Overwrite?` );

            if ( ! overwrite ) {
                return ConsoleManager.$.log( "Generation cancelled" );
            }

            // Remove existing directory
            fs.rmSync( targetPath, { recursive: true, force: true } );
        }

        // Generate project from template
        await this.generateFromTemplate( templatePath, targetPath, variableValues );

        ConsoleManager.$.log( `Project generated successfully at: ${ util.inspect( targetPath ) }` );
    }

    private async readTemplateVariables( filePath: string ): Promise<TemplateVariable[]> {
        if ( ! fs.existsSync( filePath ) ) {
            return [];
        }

        const content = fs.readFileSync( filePath, "utf-8" );
        const lines = content.split( "\n" ).filter( line => line.trim() );

        return lines.map( line => {
            const [ definition, example ] = line.split( ",eg:" ).map( s => s.trim() );
            const name = definition.replace( /\$\$\{|\}\$\$/g, "" );

            return { name, example: example || "" };
        } );
    }

    private async promptForVariables( variables: TemplateVariable[] ): Promise<Record<string, string>> {
        const result: Record<string, string> = {};

        ConsoleManager.$.log( "Enter values for template variables:" );

        for ( const variable of variables ) {
            const exampleText = variable.example ? ` (e.g., ${ variable.example })` : "";
            const value = await ConsoleManager.$.prompt( `  - ${ variable.name }${ exampleText }:` );

            if ( ! value.trim() ) {
                throw new Error( `Value for ${ util.inspect( variable.name ) } is required` );
            }

            result[ variable.name ] = value;
        }

        return result;
    }

    private async getWorkspaces( workspacePackage: Package ): Promise<string[]> {
        const packageJson = workspacePackage.json;
        return packageJson.workspaces || [];
    }

    private async generateFromTemplate(
        templatePath: string,
        targetPath: string,
        variables: Record<string, string>
    ): Promise<void> {
        // Create target directory
        fs.mkdirSync( targetPath, { recursive: true } );

        // Copy all files from template to target
        this.copyDirectory( templatePath, targetPath, variables );
    }

    private copyDirectory( source: string, target: string, variables: Record<string, string> ): void {
        const entries = fs.readdirSync( source, { withFileTypes: true } );

        for ( const entry of entries ) {
            const sourcePath = path.join( source, entry.name );
            const targetPath = path.join( target, entry.name );

            // Skip template-vars file
            if ( entry.name === "zenflux.template-vars.txt" ) {
                continue;
            }

            if ( entry.isDirectory() ) {
                fs.mkdirSync( targetPath, { recursive: true } );
                this.copyDirectory( sourcePath, targetPath, variables );
            } else {
                this.copyFile( sourcePath, targetPath, variables );
            }
        }
    }

    private copyFile( source: string, target: string, variables: Record<string, string> ): void {
        let content = fs.readFileSync( source, "utf-8" );

        // Replace template variables
        content = content.replace( TEMPLATE_VAR_REGEX, ( match, varName ) => {
            const value = variables[ varName ];

            if ( value === undefined ) {
                ConsoleManager.$.log( `Warning: Variable ${ util.inspect( varName ) } not found in provided values` );
                return match;
            }

            return value;
        } );

        fs.writeFileSync( target, content, "utf-8" );
    }
}

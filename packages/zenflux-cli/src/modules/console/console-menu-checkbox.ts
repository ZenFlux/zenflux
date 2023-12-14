/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { ConsoleMenu } from "@zenflux/cli/src/modules/console/console-menu";

import type { IConsoleMenuItem, TConsoleMenuKey } from "@zenflux/cli/src/modules/console/console-menu";

interface MenuItemCheckbox extends IConsoleMenuItem {
    checked?: boolean;
}

export class ConsoleMenuCheckbox extends ConsoleMenu<MenuItemCheckbox[] | undefined> {
    protected checked: typeof this.items = [];

    public constructor( protected readonly items: MenuItemCheckbox[], protected readonly options: {
        headMessage?: string;
        helpMessage?: string;
    } = {} ) {
        super( items );

        // Set selected items as checked
        this.checked = items.filter( ( item ) => item.checked );

        if ( undefined === options.helpMessage ) {
            options.helpMessage = "Press <space> to toggle selection, <enter> to confirm.";
        }

        if ( options.headMessage ) {
            this.items.unshift( { separator: true } );
            this.items.unshift( { title: options.headMessage, disabled: true } );
        }

        this.items.push( { separator: true } );
        this.items.push( { title: options.helpMessage, disabled: true } );

        this.addCustomKeyHandler( ( key ) => {
            if ( key.name === "space" ) {
                this.toggleChecked( this.selected );
                return true;
            }

            return false;
        } );
    }

    private toggleChecked( selected: typeof this.selected ) {
        const item = selected.item as typeof this.items[ number ];

        if ( this.checked.includes( item ) ) {
            this.checked.splice( this.checked.indexOf( item ), 1 );
        } else {
            this.checked.push( item );
        }
    }

    protected getItemDisplay( item: typeof this.items[ number ] ) {
        const checked = this.checked.includes( item ) ? "[✓]" : "[ ]";

        return this.selected.item === item ?
            `${ ConsoleMenuCheckbox.DEFAULT_SELECT_CURSOR }${ checked } ${ item.title }` :
            `   ${ checked } ${ item.title }`;
    }

    protected getSelection( key: TConsoleMenuKey ) {
        if ( super.getSelection( key ) ) {
            return this.checked;
        }
    }
}

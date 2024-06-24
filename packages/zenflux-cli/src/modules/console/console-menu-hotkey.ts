/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import { ConsoleMenu } from "@zenflux/cli/src/modules/console/console-menu";

import type { IConsoleMenuItem, TConsoleMenuKey } from "@zenflux/cli/src/modules/console/console-menu";

interface MenuItemHotKey extends IConsoleMenuItem {
    hotkey?: string;
}

export class ConsoleMenuHotkey extends ConsoleMenu {
    public constructor( protected readonly items: MenuItemHotKey[] ) {
        super( items );
    }

    protected getSelection( key: TConsoleMenuKey ) {
        const indexOf = key.str ?
            this.items.findIndex( ( item ) => item.hotkey === key.str ) : -1;

        if ( indexOf === -1 ) {
            return super.getSelection( key );
        }

        return { index: indexOf, item: this.items[ indexOf ] };
    }

    protected getItemDisplay( item: MenuItemHotKey ): string {
        const label = `${ item.hotkey }: ${ item.title }`;

        return this.selected.item === item ?
            `${ ConsoleMenuHotkey.DEFAULT_SELECT_CURSOR }${ label }` :
            `   ${ label }`;
    }
}

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
        return ( key.str && this.items.find( ( item ) => item.hotkey === key.str ) )
            || super.getSelection( key );
    }

    protected getItemDisplay( item: MenuItemHotKey ): string {
        const label = `${ item.hotkey }: ${ item.title }`;

        return this.selected.item === item ?
            `${ ConsoleMenuHotkey.DEFAULT_SELECT_CURSOR }${ label }` :
            `   ${ label }`;
    }
}

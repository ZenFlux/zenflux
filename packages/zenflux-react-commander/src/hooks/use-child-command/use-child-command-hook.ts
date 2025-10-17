/* eslint-disable no-restricted-imports, @zenflux/no-relative-imports */
import React from "react";

import { useCommanderChildrenComponents } from "../use-commander-children-components";
import commandsManager from "../../commands-manager";

import type { useComponent } from "../use-component/use-component";
import type { DCommandArgs } from "../../definitions";

export function useChildCommandHook(
    childComponentName: string,
    commandName: string,
    handler: ( result?: unknown, args?: DCommandArgs ) => void,
    opts?: { filter?: (ctx: ReturnType<typeof useComponent>) => boolean; ignoreDuplicate?: boolean }
) {
    const children = useCommanderChildrenComponents(childComponentName);

    React.useEffect(() => {
        const disposers: Array<() => void> = [];

        const alive = children.filter(cmd => {
            const u = cmd.getInternalContext().componentNameUnique;
            return commandsManager.isContextRegistered(u);
        });

        alive.forEach((cmd) => {
            if (opts?.filter && !opts.filter(cmd)) return;
            const u = cmd.getInternalContext().componentNameUnique;
            if (!commandsManager.isContextRegistered(u)) return;
            cmd.hook(commandName, handler);
            disposers.push(() => {
                if (commandsManager.isContextRegistered(u)) cmd.unhook(commandName);
            });
        });

        return () => {
            disposers.forEach(d => d());
        };
    }, [children.map(c => c.getId()).join("|"), commandName, handler]);
}


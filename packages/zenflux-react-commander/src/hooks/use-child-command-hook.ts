import React from "react";

import { useCommanderChildrenComponents } from "@zenflux/react-commander/hooks";

import type { useComponent } from "@zenflux/react-commander/hooks";

import type { DCommandArgs } from "@zenflux/react-commander/definitions";

export function useChildCommandHook(
    childComponentName: string,
    commandName: string,
    handler: ( result?: unknown, args?: DCommandArgs ) => void,
    opts?: { filter?: (ctx: ReturnType<typeof useComponent>) => boolean; ignoreDuplicate?: boolean }
) {
    const children = useCommanderChildrenComponents(childComponentName);

    React.useEffect(() => {
        const disposers: Array<() => void> = [];

        children.forEach((cmd) => {
            if (opts?.filter && !opts.filter(cmd)) return;
            cmd.hook(commandName, handler);
            disposers.push(() => cmd.unhook(commandName));
        });

        return () => {
            disposers.forEach(d => d());
        };
    }, [children.map(c => c.getId()).join("|"), commandName, handler]);
}


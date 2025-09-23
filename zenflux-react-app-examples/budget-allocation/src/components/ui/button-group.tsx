import * as React from "react";

import { cn } from "@zenflux/app-budget-allocation/src/lib/utils";

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {}

// Simple shadcn-style ButtonGroup container that composes our Button components
// Applies contiguous rounding and border collapse similar to NextUI's ButtonGroup
export function ButtonGroup({ className, children, ...props }: ButtonGroupProps) {
    return (
        <div
            role="group"
            className={ cn(
                // container – no own border/background; children own it
                "inline-flex h-10 bg-transparent rounded-none",
                // child buttons visuals (match production)
                "[&>*]:h-full [&>*]:px-5 [&>*]:text-[#707EA7] [&>*]:bg-[rgba(178,187,213,0.36)]",
                "[&>*]:border-[2px] [&>*]:border-[rgba(178,187,213,0.5)]",
                // square between buttons – overlap borders to avoid double-width seam
                "[&>*:not(:first-child)]:-ms-[2px]",
                // end radii 6px
                "[&>*:first-child]:rounded-l-[6px] [&>*:last-child]:rounded-r-[6px] [&>*]:rounded-none",
                // active state
                "[&>*[data-active=true]]:text-[#2A3558] [&>*[data-active=true]]:bg-gradient-to-b [&>*[data-active=true]]:from-[#FAFAFC] [&>*[data-active=true]]:to-white",
                className,
            ) }
            { ...props }
        >
            { children }
        </div>
    );
}

export default ButtonGroup;



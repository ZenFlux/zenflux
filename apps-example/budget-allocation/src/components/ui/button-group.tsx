import * as React from "react";
import { cva  } from "class-variance-authority";

import { cn } from "@zenflux/app-budget-allocation/src/lib/utils";

import type { VariantProps } from "class-variance-authority";

const buttonGroupVariants = cva(
    "inline-flex items-center justify-center rounded-md",
    {
        variants: {
            variant: {
                default: "bg-muted p-1 text-muted-foreground",
                flat: "bg-transparent rounded-none",
            },
            size: {
                default: "h-10",
                sm: "h-9",
                lg: "h-11",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonGroupProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof buttonGroupVariants> {
    children: React.ReactNode;
}

export function ButtonGroup({ className, children, variant, size, ...props }: ButtonGroupProps) {
    return (
        <div
            role="group"
            className={ cn(
                buttonGroupVariants({ variant, size }),
                variant === "flat" && [
                    "h-10 bg-transparent rounded-none",
                    "[&>*]:h-full [&>*]:px-5 [&>*]:text-[#707EA7] [&>*]:bg-[rgba(178,187,213,0.36)]",
                    "[&>*]:border-[2px] [&>*]:border-[rgba(178,187,213,0.5)]",
                    "[&>*:not([data-active=true])]:hover:bg-[rgba(178,187,213,0.5)]",
                    "[&>*:not(:first-child)]:-ms-[2px]",
                    "[&>*:first-child]:rounded-l-[6px] [&>*:last-child]:rounded-r-[6px] [&>*]:rounded-none",
                    "[&>*[data-active=true]]:text-[#2A3558] [&>*[data-active=true]]:bg-gradient-to-b [&>*[data-active=true]]:from-[#FAFAFC] [&>*[data-active=true]]:to-white",
                    "[&>*:disabled]:text-[#2A3558] [&>*:disabled]:opacity-100"
                ],
                className,
            ) }
            { ...props }
        >
            { children }
        </div>
    );
}

export default ButtonGroup;


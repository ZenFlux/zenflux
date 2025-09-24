import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@zenflux/app-budget-allocation/src/lib/utils";

const inputVariants = cva(
    // Base shadcn input styles
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    {
        variants: {
            width: {
                full: "w-full",
                auto: "w-auto",
            },
            size: {
                default: "h-10 px-3 py-2",
                sm: "h-9 px-2 py-1",
                lg: "h-11 px-4 py-3",
                breakdown: "h-10 px-3 py-2 text-sm",
            },
            variant: {
                // Standard shadcn variants
                default: "border-input bg-background text-foreground",
                // Production-specific variants
                transparent: "bg-transparent border-0 ring-0 ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                flat:
                    "bg-[rgb(244,246,251)] disabled:bg-[#F5F6FA] border border-[2px] border-[rgba(178,187,213,0.5)] text-[#2A3558] placeholder:text-[#99A4C2] ring-0 ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none",
                bordered:
                    "bg-white border border-input text-foreground placeholder:text-muted-foreground ring-0 ring-offset-0",
                breakdown:
                    "bg-transparent border-0 text-sm leading-[21px] placeholder:text-[#99A4C2] ring-0 ring-offset-0 focus-visible:ring-0 focus-visible:outline-none",
            },
            radius: {
                none: "rounded-none",
                sm: "rounded-sm",
                md: "rounded-md",
                lg: "rounded-lg",
                full: "rounded-full",
                breakdown: "rounded-none",
            },
        },
        defaultVariants: {
            width: "full",
            size: "default",
            variant: "default",
            radius: "md",
        },
    }
);

export interface InputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
        Omit<VariantProps<typeof inputVariants>, "size"> {
    uiSize?: NonNullable<VariantProps<typeof inputVariants>["size"]>
    /**
     * Optional wrapper class name. If provided (or when withWrapper is true),
     * the input is wrapped in a div that mimics the legacy `.input-wrapper` and `.trigger` styles.
     */
    wrapper?: string;
    wrapperClassName?: string;
    /** When true, render an outer wrapper with production-like border/height and disabled bg */
    withWrapper?: boolean;
    width?: NonNullable<VariantProps<typeof inputVariants>["width"]>;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = "text", uiSize, variant, radius, width, wrapper, wrapperClassName, withWrapper, disabled, ...props }, ref) => {
        const inputElement = (
            <input
                type={ type }
                className={ cn(inputVariants({ size: uiSize, variant, radius, width }), className) }
                ref={ ref }
                disabled={ disabled }
                { ...props }
            />
        );

        const shouldWrap = withWrapper || !!wrapper || !!wrapperClassName;
        if (!shouldWrap) return inputElement;

        const wrapperClasses = cn(
            // legacy `.input-wrapper` + `.trigger` combined
            "my-1 min-h-0 h-10 pt-0 pb-0 border-solid border-[2px] border-[#B2BBD57F]",
            disabled && "bg-[#F5F6FA]",
            wrapper,
            wrapperClassName,
        );

        return <div className={ wrapperClasses }>{ inputElement }</div>;
    }
);
Input.displayName = "Input";

export { Input };


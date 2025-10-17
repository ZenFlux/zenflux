import * as React from "react";

import { cva  } from "class-variance-authority";

import { cn } from "@zenflux/app-budget-allocation/src/lib/utils";

import type { VariantProps } from "class-variance-authority";

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

            },
            radius: {
                none: "rounded-none",
                sm: "rounded-sm",
                md: "rounded-md",
                lg: "rounded-lg",
                full: "rounded-full",
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

type InputPropsBase = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & VariantProps<typeof inputVariants> & {
    withWrapper?: boolean;
};

type InputPropsWithWrapper = InputPropsBase & {
    withWrapper: true;
    wrapper?: string;
    wrapperClassName?: string;
};

type InputPropsWithoutWrapper = InputPropsBase & {
    withWrapper: false;
    wrapper?: never;
    wrapperClassName?: never;
};

export type InputProps = InputPropsWithWrapper | InputPropsWithoutWrapper;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type = "text", size, variant, radius, width, wrapper, wrapperClassName, withWrapper, disabled, ...props }, ref) => {
        const inputElement = (
            <input
                type={ type }
                className={ cn(inputVariants({ size, variant, radius, width }), className) }
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


import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@zenflux/app-budget-allocation/src/lib/utils";

const inputVariants = cva(
    // Base reset and accessibility
    "flex text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none disabled:cursor-not-allowed",
    {
        variants: {
            width: {
                full: "w-full",
                auto: "w-auto",
            },
            size: {
                default: "h-[36px] leading-[20px] px-3",
                sm: "h-8 leading-[18px] px-2",
                lg: "h-11 leading-[22px] px-4",
            },
            variant: {
                // Transparent, borderless – useful for inline currency inputs
                transparent: "bg-transparent border-0 ring-0 ring-offset-0",
                // Flat, subtle background and soft border – closer to production baseline
                flat:
                    "bg-[rgb(244,246,251)] disabled:bg-[#F5F6FA] border border-[2px] border-[rgba(178,187,213,0.5)] rounded-[4px] text-[#2A3558] placeholder:text-[#99A4C2] ring-0 ring-offset-0 focus-visible:ring-0 focus-visible:outline-none",
                // Standard bordered input
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
            variant: "flat",
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


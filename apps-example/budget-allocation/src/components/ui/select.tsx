import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { cva  } from "class-variance-authority";

import { cn } from "@zenflux/app-budget-allocation/src/lib/utils";

import type { VariantProps } from "class-variance-authority";

const selectVariants = cva(
    // Base shadcn select styles
    "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "border-input bg-background text-foreground",
                flat: "border-[2px] border-[rgba(178,187,213,0.5)] bg-white text-sm rounded-none",
            },
            size: {
                default: "h-10 px-3 py-2",
                sm: "h-9 px-2 py-1",
                lg: "h-11 px-4 py-3",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

type ClassNames = {
    base?: string;
    trigger?: string;
};

interface SelectProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root>, VariantProps<typeof selectVariants> {
    classNames?: ClassNames;
    selectedKeys?: readonly string[] | any[];
    onChange?: (e: { target: { value: string } }) => void;
}

export function Select(props: React.PropsWithChildren<SelectProps>) {
    const { classNames, selectedKeys, onChange, children, variant, size, ...rest } = props as any;
    const value = Array.isArray(selectedKeys) && selectedKeys.length ? String(selectedKeys[0]) : undefined;

    return (
        <SelectPrimitive.Root value={ value } onValueChange={ (val) => onChange?.({ target: { value: val } }) } { ...rest }>
            <div className={ cn("inline-flex flex-col", classNames?.base) }>
                <SelectPrimitive.Trigger className={ cn(
                    selectVariants({ variant, size }),
                    classNames?.trigger
                ) }>
                    <SelectPrimitive.Value />
                    <SelectPrimitive.Icon>
                        <ChevronDown className="h-4 w-4 opacity-60" />
                    </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>
                <SelectPrimitive.Portal>
                    <SelectPrimitive.Content position="popper" sideOffset={4} align="start" className="bg-white border border-slate-200 rounded-md shadow-sm min-w-[var(--radix-select-trigger-width)] w-[var(--radix-select-trigger-width)]">
                        <SelectPrimitive.Viewport>
                            { children }
                        </SelectPrimitive.Viewport>
                    </SelectPrimitive.Content>
                </SelectPrimitive.Portal>
            </div>
        </SelectPrimitive.Root>
    );
}

export function SelectItem({ className, children, value, ...props }: React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>) {
    return (
        <SelectPrimitive.Item
            className={ cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-slate-100",
                className
            ) }
            value={ value as any }
            { ...props }
        >
            <SelectPrimitive.ItemText>{ children }</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
    );
}


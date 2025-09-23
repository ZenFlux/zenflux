import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { cn } from "@zenflux/app-budget-allocation/src/lib/utils";

type ClassNames = {
    base?: string;
    trigger?: string;
};

interface SelectProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> {
    classNames?: ClassNames;
    selectedKeys?: readonly string[] | any[];
    onChange?: (e: { target: { value: string } }) => void;
}

export function Select(props: React.PropsWithChildren<SelectProps>) {
    const { classNames, selectedKeys, onChange, children, ...rest } = props as any;
    const value = Array.isArray(selectedKeys) && selectedKeys.length ? String(selectedKeys[0]) : undefined;

    return (
        <SelectPrimitive.Root value={ value } onValueChange={ (val) => onChange?.({ target: { value: val } }) } { ...rest }>
            <div className={ cn("inline-flex flex-col", classNames?.base) }>
                <SelectPrimitive.Trigger className={ cn(
                    "h-10 px-3 inline-flex items-center justify-between rounded-none border-[2px] border-[rgba(178,187,213,0.5)] bg-white text-sm",
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


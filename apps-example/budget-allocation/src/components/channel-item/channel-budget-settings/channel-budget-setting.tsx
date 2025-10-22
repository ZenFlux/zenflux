import React from "react";

import { Info } from "@zenflux/react-ui/src/symbols";

import { cn } from "@zenflux/app-budget-allocation/src/lib/utils";

interface ChannelBudgetSettingProps extends React.HTMLAttributes<HTMLDivElement> {
    label: string;
    width?: string;
    className?: string;
    infoClassName?: string;
    infoLabelClassName?: string;
    children: React.ReactNode;
}

export function ChannelBudgetSetting( props: ChannelBudgetSettingProps ) {
    const { label, width = "w-fit", className, infoClassName, infoLabelClassName, children, ...rest } = props;

    return (
        <div className={ cn( width, "flex flex-col gap-2", className ) } { ...rest }>
            <Info
                className={ infoClassName }
                labelClassName={ infoLabelClassName || "font-sans text-[#232c4d] text-base font-light" }
            >
                { label }
            </Info>
            { children }
        </div>
    );
}


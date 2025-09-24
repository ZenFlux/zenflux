import React from "react";

import { useCommanderCommand } from "@zenflux/react-commander/use-commands";

import { Info } from "@zenflux/react-ui/src/symbols";

import { Input } from "@zenflux/app-budget-allocation/src/components/ui/input";
import { cn } from "@zenflux/app-budget-allocation/src/lib/utils";

import { UpdateSource } from "@zenflux/app-budget-allocation/src/components/channel/channel-types";

import {
    getChannelBudgetFrequencyLabel
} from "@zenflux/app-budget-allocation/src/components/channel/channel-budget-settings/channel-budget-frequency";

import type {
    ChannelBudgetBaselineProps
} from "@zenflux/app-budget-allocation/src/components/channel/channel-budget-settings/channel-budget-types";

import type { InputProps } from "@zenflux/app-budget-allocation/src/components/ui/input";

const DEFAULT_PROPS = {
    type: "text",
    variant: "flat",
    radius: "none",
    withWrapper: false,
} as const;

export function ChannelBudgetBaseline( props: ChannelBudgetBaselineProps ) {
    const { frequency, allocation, baseline } = props;

    const command = useCommanderCommand( "App/ChannelItem/SetBaseline" );

    const inputProps: InputProps = {
        ... DEFAULT_PROPS,
        disabled: allocation === "manual",
        value: ( baseline || 0 ).toString(),
        onChange: ( e ) => command.run( {
            value: e.target.value,
            source: UpdateSource.FROM_BUDGET_SETTINGS
        } )
    };

    const frequencyLabel = inputProps.disabled ? "Manual" :
        getChannelBudgetFrequencyLabel( frequency );

    return (
        <div className="channel-budget-baseline" data-disabled={ inputProps.disabled }>
            <Info>Baseline [{ frequencyLabel }] Budget</Info>
            <div className={cn(
                "trigger my-1 min-h-0 h-10 pt-0 pb-0 border-solid border-[2px] border-[#B2BBD57F] rounded-none",
                inputProps.disabled ? "bg-[#F5F6FA]" : "bg-white"
            )}>
                <Input
                    aria-labelledby="baseline"
                    { ... inputProps }
                    className="w-full h-full bg-transparent border-0 outline-none text-[#2A3558] placeholder:text-[#99A4C2] px-3 py-0 text-sm"
                />
            </div>
        </div>
    );
}

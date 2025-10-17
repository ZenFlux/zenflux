import React from "react";

interface HeaderProps {
    end: React.ReactNode | null;
}

export default function Header( props: HeaderProps ) {
    const { end } = props;

    return (
        <header className="flex flex-col gap-50 bg-white pt-[50px] pb-[50px]">
            <div className="h-[60px]">
                <p className="fs-1 leading-[36px]">Build your budget plan</p>
            </div>

            <div className="flex flex-col gap-10">
                <div className="flex flex-col gap-[15px]">
                    <p className="fs-2 leading-[27px]">Setup channels</p>
                    <p className="font-[Tahoma,system-ui] text-[#b7b7b7]">Setup your added channels by adding baseline budgets out of
                            your total budget. See the forecast impact with the help of tips and insights.
                    </p>
                </div>
                <div className="flex justify-end">
                    { end }
                </div>
            </div>

        </header>
    );
}

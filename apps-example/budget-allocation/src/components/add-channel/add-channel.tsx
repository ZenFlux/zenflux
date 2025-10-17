import { Button } from "@zenflux/app-budget-allocation/src/ui-command-able/button/button";

import type { DCommandFunctionComponent } from "@zenflux/react-commander/definitions";

export const AddChannel: DCommandFunctionComponent<{}> = () => {

    return (
        <Button emoji="+" label="Add Channel" onClickCommand="App/AddChannel" />
    );
};


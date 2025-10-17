import { Button } from "@zenflux/app-budget-allocation/src/ui-command-able/button/button";

import type { DCommandFunctionComponent } from "@zenflux/react-commander/definitions";

export const Reset: DCommandFunctionComponent<{}> = () => (<Button emoji="⟳" label="Reset Demo" onClickCommand="App/ChannelsList/Reset" />);

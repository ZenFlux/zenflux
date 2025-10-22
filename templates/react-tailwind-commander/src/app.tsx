import "@zenflux/app-budget-allocation/src/app.scss";

import { withCommands } from "@zenflux/react-commander/with-commands";

import { CommandBase } from "@zenflux/react-commander/command-base";

interface AppState {
    isLoading: boolean;
}

export function App() {
    return (
        <div>Hello</div>
    );
}

const $$ = withCommands<{}, AppState>( "App", App, {
    isLoading: false,
}, [
    class HelloWorld extends CommandBase {
        public static getName() {
            return "App/HelloWorld";
        }
    }
] );

export default $$;


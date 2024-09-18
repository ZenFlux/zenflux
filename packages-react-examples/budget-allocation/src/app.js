"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var tabs_1 = require("@nextui-org/tabs");
var system_1 = require("@nextui-org/system");
var button_1 = require("@nextui-org/button");
var src_1 = require("@zenflux/react-api/src");
var commands_manager_1 = require("@zenflux/react-commander/commands-manager");
var use_commands_1 = require("@zenflux/react-commander/use-commands");
var layout_1 = require("@zenflux/app-budget-allocation/src/ui-layout/layout");
var api_channels_module_1 = require("@zenflux/app-budget-allocation/src/api/api-channels-module");
var add_channel_1 = require("@zenflux/app-budget-allocation/src/components/add-channel/add-channel");
require("@zenflux/app-budget-allocation/src/app.scss");
// eslint-disable-next-line import/order
require("@zenflux/app-budget-allocation/src/api/api-fake-data");
var BudgetAllocation = react_1.default.lazy(function () { return Promise.resolve().then(function () { return require("@zenflux/app-budget-allocation/src/budget-allocation"); }); }), BudgetOverview = react_1.default.lazy(function () { return Promise.resolve().then(function () { return require("@zenflux/app-budget-allocation/src/budget-overview"); }); });
src_1.API.register(api_channels_module_1.APIChannelsModule);
function LazyLoader(props) {
    var ContentComponent = props.ContentComponent;
    return (<react_1.default.Suspense fallback={<div className="loading">Loading <span className="dots">◌</span></div>}>
            <ContentComponent />
        </react_1.default.Suspense>);
}
;
function App() {
    var layoutProps = {
        header: {
            end: <add_channel_1.default />,
        }
    };
    var _a = react_1.default.useState(location.hash.replace("#", "")), selectedTab = _a[0], setSelectedTab = _a[1];
    (0, react_1.useEffect)(function () {
        var addChannel = (0, use_commands_1.useAnyComponentCommands)("App/AddChannel")[0], addChannelId = {
            commandName: "App/AddChannel",
            componentName: "App/AddChannel",
            componentNameUnique: addChannel.componentNameUnique,
        };
        if (location.hash === "#allocation/add-channel") {
            location.hash = "#allocation";
            setSelectedTab("allocation");
            setTimeout(function () {
                commands_manager_1.default.run(addChannelId, {});
            }, 1000);
        }
        else if (location.hash === "#overview") {
            commands_manager_1.default.hook(addChannelId, function () {
                commands_manager_1.default.unhookWithinComponent(addChannelId.componentNameUnique);
                location.hash = "#allocation/add-channel";
                setSelectedTab("allocation");
            });
        }
        else {
            commands_manager_1.default.unhookWithinComponent(addChannelId.componentNameUnique);
        }
    }, [location.hash]);
    var items = [
        { id: "allocation", title: "Budget Allocation", content: <LazyLoader ContentComponent={BudgetAllocation}/> },
        { id: "overview", title: "Budget Overview", content: <LazyLoader ContentComponent={BudgetOverview}/> },
    ];
    var tabsProps = {
        items: items,
        classNames: {
            base: "tabs",
            tabList: "list",
            tab: "tab",
            cursor: "cursor",
        },
        selectedKey: selectedTab,
        onSelectionChange: function (id) {
            if (!location.hash.includes(id.toString())) {
                setSelectedTab(id.toString());
                location.hash = id.toString();
            }
        }
    };
    return (<system_1.NextUIProvider>
            <button_1.Button onClick={function () {
            // Do not let the rescue callback to run
            window.onbeforeunload = null;
            localStorage.clear();
            location.reload();
        }} className="absolute top-0 right-0 border-none" variant="bordered" disableAnimation={true} radius={"none"}>Reset Demo</button_1.Button>

            <layout_1.default {...layoutProps}>
                <tabs_1.Tabs {...tabsProps}> {tabsProps.items.map(function (tab) { return (<tabs_1.Tab key={tab.id} title={tab.title}>
                            {tab.content}
                        </tabs_1.Tab>); })}
                </tabs_1.Tabs>
            </layout_1.default>
        </system_1.NextUIProvider>);
}
exports.default = App;

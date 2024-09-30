"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
function Header(props) {
    var end = props.end;
    return (<div>
                <header className="bg-white">
                    <div className="row">
                        <p className="fs-1">Build your budget plan</p>
                        <p className="fs-2 mt-[16px]">Setup channels</p>
                    </div>
                    <div className="row mt-[8px]">
                        <div className={"grid grid-cols-".concat(props.end ? "2" : "1")}>
                            <div>
                                <p className="description">Setup your added channels by adding baseline budgets out of
                                    your total budget. See the forecast impact with the help of tips and insights.</p>
                            </div>
                            <div className="end">
                                {end}
                            </div>
                        </div>
                    </div>
                </header>
            </div>);
}
exports.default = Header;

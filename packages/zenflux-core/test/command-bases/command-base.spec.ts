import * as ZenCore from "../../src/exports";

import { __CommandBase__Public__ } from "../__mock__/bases/command-base--public";

import { ControllerAlreadySet } from "../../src/errors";

describe( "command-bases" , () => {
    describe( "CommandBase", () => {
        test( "initialize()", () => {
            // Arrange.
            const args: ZenCore.interfaces.ICommandArgsInterface = {
                    test: "test",
                },
                options = {
                    test: "test",
                };

            const CommandClass = class Command extends __CommandBase__Public__ {
                public static getName() {
                    return "ZenCore/Commands/Command/Test";
                }

                public getArgs() {
                    return this.args;
                }

                public getOptions() {
                    return this.options;
                }
            };

            const instance = new CommandClass( args, options );

            // Act.
            instance.initialize( args, options );

            // Assert.
            expect( instance.getArgs() ).toEqual( args );
            expect( instance.getOptions() ).toEqual( options );
        } );

        test( "apply()", () => {
            // Arrange.
            const CommandClass = class Command extends ZenCore.commandBases.CommandBase {
                public passed: boolean;

                public static getName() {
                    return "ZenCore/Commands/Command/Test";
                }

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                public apply( args: ZenCore.interfaces.ICommandArgsInterface = this.args, options: {} = this.options ) {
                    if ( args.passed ) {
                        this.passed = true;
                    }
                }
            };

            const instance = new CommandClass( { passed: true } );

            // Act.
            instance.run();

            // Assert.
            expect( instance.passed ).toBe( true );
        } );

        test( "setController():: Ensure controller cannot set twice", () => {
            // Arrange.
            const CommandClass = class Command extends ZenCore.commandBases.CommandBase {
                public static getName() {
                    return "ZenCore/Commands/Command/Test";
                }
            };

            class TestController extends ZenCore.bases.ControllerBase {
                public static getName() {
                    return "ZenCore/Controllers/Test";
                }
            }

            CommandClass.setController( new TestController() );

            // Act.
            const error = () => CommandClass.setController( new TestController() );

            // Assert.
            expect( error ).toThrowError( ControllerAlreadySet );
        } );
    } );
} );

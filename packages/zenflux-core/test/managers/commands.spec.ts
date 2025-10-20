import { describe, test, expect } from "@jest/globals";

import * as ZenCore from "@zenflux/core/src/exports";

describe( "managers", () => {
    describe( "Commands", () => {
        test( "getCommandInstance()", () => {
            // Arrange.
            const controller = ZenCore.managers.controllers.register( new class MyController extends ZenCore.bases.ControllerBase {
                    public static getName() {
                        return "Test/Controller";
                    }
                } ),
                MyCommand = class MyCommand extends ZenCore.commandBases.CommandPublic {
                    public static getName() {
                        return "Test/Controller/Test/Command";
                    }
                };

            // Register new controller.
            ZenCore.managers.commands.register( { MyCommand }, controller );

            // Act - Get command instance.
            const command = ZenCore.managers.commands.getCommandInstance( "Test/Controller/Test/Command" );

            // Assert.
            expect( command.getName() ).toBe( MyCommand.getName() );
        } );

        test( "run()", async () => {
            // Arrange
            let didTestCommandRun = false;

            // Register new controller.
            ZenCore.managers.controllers.register( new class MyController extends ZenCore.bases.ControllerBase {
                public static getName() {
                    return "Test/Controller";
                }

                protected getCommands() {
                    return {
                        "some-key": class MyCommand extends ZenCore.commandBases.CommandPublic {
                            public static getName() {
                                return "Test/Controller/Test/Command";
                            }

                            public apply() {
                                didTestCommandRun = true;
                            }
                        }
                    } as { [ key: string ]: typeof ZenCore.commandBases.CommandPublic };
                }
            } );

            // Act - Run command.
            await ZenCore.managers.commands.run( "Test/Controller/Test/Command" );

            // Assert - Check if command ran.
            expect( didTestCommandRun ).toBe( true );
        } );

        test( "register()", () => {
            // Arrange.
            const controller = ZenCore.managers.controllers.register( new class MyController extends ZenCore.bases.ControllerBase {
                    public static getName() {
                        return "Test/Controller";
                    }
                } ),
                MyCommand = class MyCommand extends ZenCore.commandBases.CommandPublic {
                    public static getName() {
                        return "Test/Controller/Test/Command";
                    }
                };

            // Act - Register new controller.
            ZenCore.managers.commands.register( { MyCommand }, controller );

            const command = ZenCore.managers.commands.getByName( MyCommand.getName() );

            // Assert.
            expect( command.getName() ).toBe( MyCommand.getName() );
        } );
    } );
} );

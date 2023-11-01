/**
 * Validate that the `ZenCore` get cleared on each test.
 * In other words - ensuring that `setup.ts` is working correctly.
 */
import * as ZenCore from "../src/exports";

describe( "ZenCore", () => {
    it( "Add something for next test", () => {
        // Arrange
        ZenCore.managers.controllers.register( new class MyController extends ZenCore.bases.ControllerBase {
            public static getName() {
                return "Test/Controller";
            }

            protected getCommands(): { [ p: string ]: any } {
                return {
                    "test": class extends ZenCore.commandBases.CommandPublic {}
                };
            }
        } );

        // Validate controller is registered.
        expect( ZenCore.managers.controllers.get( "Test/Controller" ) ).toBeDefined();
    } );

    it( "validate commands being refreshed each test", () => {
        // The prev test `add something` which is the assertion.

        // Assert - Commands is empty.
        expect( ZenCore.managers.commands.getAll() ).toEqual( {} );
    } );
} );

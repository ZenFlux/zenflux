import * as ZenCore from "../../src/exports";

describe("managers", () => {
    describe( "Controllers", () => {
        test( "get() & register()", () => {
            // Arrange.
            const controller = ZenCore.managers.controllers.register( new class MyController extends ZenCore.bases.ControllerBase {
                    public static getName() {
                        return "Test/Controller";
                    }
                } );

            // Act - Get controller.
            const result = ZenCore.managers.controllers.get( controller.getName() );

            // Assert.
            expect( result.getName() ).toBe( controller.getName() );
        } );
    } );
} );

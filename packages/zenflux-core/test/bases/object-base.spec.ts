// eslint-disable-next-line
import { __ObjectBase__Public__ } from "@zenflux/core/test/__mock__/bases/object-base--public";

describe( "bases", () => {
    describe( "ObjectBase", () => {
        test( "getName()", () => {
            // Arrange.
            const core = class extends __ObjectBase__Public__ {
                public getName() {
                    return "ZenCore/Test/GetName";
                }
            };

            // Act.
            const name = new core().getName();

            // Assert.
            expect( name ).toBe( "ZenCore/Test/GetName" );
        } );

        test( "getName():: should throw error when no 'getName' is defined", () => {
            expect( () => {
                new class core extends __ObjectBase__Public__ {}();
            } ).toThrow( "ForceMethod implementation: at: 'ObjectBase' method: 'getName'" );
        } );

        test( "getUniqueId()", () => {
            // TODO
        } );

        test( "getHierarchyNames()", () => {
            // TODO
        } );
    } );
} );

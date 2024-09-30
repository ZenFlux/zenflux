import { Http } from "@zenflux/core/src/clients/http";

import * as ZenCore from "@zenflux/core/src/exports";

describe( "clients", () => {
    describe( "Http", () => {
        const baseURL = "http://localhost",
            fetchOriginal = globalThis.fetch;

        let http: Http;

        beforeEach( () => {
            http = new Http( baseURL );
        } );

        afterAll( () => {
            globalThis.fetch = fetchOriginal;
        } );

        test( "fetch():: returns correct data", async () => {
            // Arrange.
            const mockResponse = { data: "mock data" },
                mockJsonPromise = Promise.resolve(mockResponse),
                mockFetchPromise = Promise.resolve({
                    text: () => Promise.resolve( JSON.stringify( mockResponse ) ),
                    ok: true,
                    json: () => mockJsonPromise,
                    headers: {
                        get: () => "application/json"
                    }
                });

            globalThis.fetch = jest.fn().mockImplementation(() => mockFetchPromise);

            // Act.
            const result = await http.fetch("/path", ZenCore.interfaces.E_HTTP_METHOD_TYPE.GET);

            // Assert.
            expect(result).toEqual(mockResponse);
        });

        test( "fetch():: with POST method sends correct data", async () => {
            // Arrange.
            const mockBody = { key: "value" },
                mockFetchPromise = Promise.resolve( {
                    text: () => Promise.resolve( JSON.stringify( {} ) ),
                    json: () => {},
                    ok: true,
                } );

            global.fetch = jest.fn().mockImplementation( () => mockFetchPromise );

            // Act.
            await http.fetch( "path", ZenCore.interfaces.E_HTTP_METHOD_TYPE.POST, mockBody );

            // Assert.
            expect( global.fetch ).toHaveBeenCalledWith(
                baseURL + "/path",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify( mockBody ),
                    credentials: "include",
                },
            );
        } );

        test( "fetch():: throws an error when fetch fails", async () => {
            // Arrange.
            const mockFetchPromise = Promise.resolve({
                ok: false,
                text: () => Promise.resolve( "failed" ),
            });

            global.fetch = jest.fn().mockImplementation(() => mockFetchPromise);

            // Act.
            const promise = http.fetch( "/path", ZenCore.interfaces.E_HTTP_METHOD_TYPE.GET );

            // Assert.
            await expect( promise ).rejects.toBeDefined();
        });

        test("fetch():: throws an error when the response is not valid JSON", async () => {
            // Arrange.
            const mockFetchPromise = Promise.resolve({
                text: () => Promise.resolve("not valid JSON"),
                ok: true,
                json: () => Promise.reject(new Error("Invalid JSON")),
                headers: {
                    get: () => "application/json",
                },
            });

            global.fetch = jest.fn().mockImplementation(() => mockFetchPromise);

            // Act.
            const promise = http.fetch("/path", ZenCore.interfaces.E_HTTP_METHOD_TYPE.GET);

            // Assert.
            await expect( promise ).rejects.toThrow( RegExp( "Unexpected token" ) );
        });
    } );
} );

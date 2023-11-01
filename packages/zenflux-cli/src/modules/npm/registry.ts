/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
export class Registry {
    private readonly endpoint: string;

    private readonly response: Promise<Response>;

    private responseStatus: {
        status: number,
        statusText: string,
    } | undefined = undefined;

    private data: any;

    public constructor( private readonly packageName: string, registryUrl: string ) {
        this.endpoint = `${ registryUrl }/${ packageName }`;
        this.response = fetch( this.endpoint );
    }

    public async await() {
        const response = await this.response;

        if ( response.ok ) {
            this.data = await response.json();
        }

        this.responseStatus = {
            status: response.status,
            statusText: response.statusText,
        };

        return this;
    }

    public isExists() {
        return this.responseStatus?.status === 200;
    }

    public getLastVersion() {
        return this.data[ "dist-tags" ][ "latest" ];
    }

    public isVersionUsed( version: string ) {
        return this.data[ "versions" ][ version ];
    }
}

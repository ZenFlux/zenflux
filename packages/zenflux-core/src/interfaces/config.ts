/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */

/**
 *
 */
export interface IAPIConfig {
    /**
     * @description API version, from `package.json`
     */
    version: string;

    /**
     * @description API base url for http requests.
     */
    baseURL?: string;

    /**
     * @description Request Init for fetch API.
     */
    requestInit?: RequestInit;
}

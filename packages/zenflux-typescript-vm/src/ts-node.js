import tsNodeModule from 'ts-node';

export default class TsNode {
    /**
     * @param {tsNodeModule.RegisterOptions} registerOptions
     */
    constructor( registerOptions ) {
        const service = tsNodeModule.register( registerOptions ),
            esmHooks = tsNodeModule.createEsmHooks( service );

        this.service = service;
        this.hooks = {
            esm: esmHooks,
        };
    }
}

export { TsNode };

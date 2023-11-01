/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
import os from "os";
import path from "path";

export const DEFAULT_NPM_RC_FILE = ".npmrc";

export const DEFAULT_NPM_REMOTE_REGISTRY_URL = "https://registry.npmjs.org/";

export const DEFAULT_NPM_RC_PATH = path.join( os.homedir(), DEFAULT_NPM_RC_FILE );

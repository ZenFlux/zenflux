/**
 * @author: Leonid Vinikov <leonidvinikov@gmail.com>
 */
export const DEFAULT_Z_CONFIG_FILE = "zenflux.config.ts";

export const DEFAULT_Z_ETC_FOLDER = ".z";

export const DEFAULT_Z_VERDACCIO_FOLDER = "verdaccio";
export const DEFAULT_Z_VERDACCIO_CONFIG_FILE = "config.yaml";
export const DEFAULT_Z_VERDACCIO_STORAGE_FOLDER = "storage";
export const DEFAULT_Z_VERDACCIO_HTPASSWD_FILE = "htpasswd";

export const DEFAULT_Z_REGISTRY_HOST = "localhost:4873";
export const DEFAULT_Z_REGISTRY_URL = `http://${ DEFAULT_Z_REGISTRY_HOST }`;

export const DEFAULT_Z_REGISTRY_USER = "zenflux";
export const DEFAULT_Z_REGISTRY_PASSWORD = "zenflux";

export type TZFormatType = "cjs" | "es" | "umd";

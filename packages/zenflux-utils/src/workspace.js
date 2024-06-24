/**
 * @author Leonid Vinikov <leonidvinikov@gmail.com>
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

/** @type {{ [packagePath: string]: string }} */
const zFindRootPackageJsonCache = {};

/**
 * Finds the path of the root package.json file in a workspace.
 * @param {Object} options - The options for finding the root package.json path.
 * @param {boolean} [options.silent=false] - If true, suppresses the error if root package.json is not found.
 * @param {boolean} [options.useCache=true] - If true, caches the result to improve performance.
 * @return {string} - The path of the root package.json file, or an empty string if not found (if silent is true).
 * @throws {Error} - Throws an error if root package.json is not found (if silent is false).
 */
export function zFindRootPackageJsonPath(options = {}) {
    const { silent = false, useCache = true } = options;

    let currentPath = process.env["npm_package_json"] ?
        path.dirname(process.env["npm_package_json"]) : process.cwd();

    if (useCache && zFindRootPackageJsonCache[currentPath]) {
        return zFindRootPackageJsonCache[currentPath];
    }

    do {
        const packageJsonPath = path.join(currentPath, "package.json");

        // Check if package.json exists & has workspaces key
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

            if (packageJson.workspaces) {

                if (useCache) {
                    zFindRootPackageJsonCache[currentPath] = packageJsonPath;
                }

                return packageJsonPath;
            }
        }

        currentPath = path.resolve(currentPath, "..");
    } while (currentPath !== "/");

    if (!silent) {
        throw new Error("Workspace root package.json not found");
    }

    return "";
}

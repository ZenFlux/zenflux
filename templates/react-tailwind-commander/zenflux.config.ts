import type { IZConfig } from "@zenflux/cli";

const config: IZConfig = {
    format: [ "es" ],
    extensions: [ ".ts", ".tsx" ],
    inputPath: "src/main.tsx",
    outputName: "$${@zenflux/project-name}$$",
    outputFileName: "$${project-name}$$",
};

export default config;

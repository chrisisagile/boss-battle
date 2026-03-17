import { Generator, getConfig } from "@tanstack/router-generator";

const root = process.cwd();
const config = getConfig({}, root);
const generator = new Generator({ root, config });

await generator.run();

console.log(`Generated route tree at ${config.generatedRouteTree}`);
